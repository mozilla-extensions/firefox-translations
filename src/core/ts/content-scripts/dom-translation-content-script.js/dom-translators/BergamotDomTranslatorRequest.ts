/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {
  DomTranslatorRequest,
  TranslationApiClient,
  TranslationRequestData,
  TranslationResponseData,
} from "./BaseDomTranslator";
import { detag, DetaggedString, project } from "./detagAndProject";
import { TranslationResults } from "../../../background-scripts/background.js/lib/BergamotTranslatorAPI";

/**
 * Represents a request (for 1 chunk) sent off to Bergamot's translation backend.
 *
 * @params translationRequestData  The data to be used for this translation.
 * @param sourceLanguage           The source language of the document.
 * @param targetLanguage           The target language for the translation.
 * @param characterCount           A counter for tracking the amount of characters translated.
 *
 */
export class BergamotDomTranslatorRequest implements DomTranslatorRequest {
  public translationRequestData: TranslationRequestData;
  private sourceLanguage: string;
  private targetLanguage: string;
  public characterCount: number;

  constructor(
    translationRequestData: TranslationRequestData,
    sourceLanguage: string,
    targetLanguage: string,
  ) {
    this.translationRequestData = translationRequestData;
    this.sourceLanguage = sourceLanguage;
    this.targetLanguage = targetLanguage;
    this.translationRequestData.markupsToTranslate.forEach(text => {
      this.characterCount += text.length;
    });
  }

  /**
   * Initiates the request
   */
  async fireRequest(
    bergamotApiClient: TranslationApiClient,
  ): Promise<
    TranslationResponseData & {
      translatedPlainTextStrings: string[];
      plainStringsToTranslate: string[];
    }
  > {
    // The server can only deal with pure text, so we detag the strings to
    // translate and later project the tags back into the result
    const detaggedStrings: DetaggedString[] = this.translationRequestData.markupsToTranslate.map(
      detag,
    );

    const plainStringsToTranslate = detaggedStrings.map(
      detaggedString => detaggedString.plainString,
    );

    const results = await bergamotApiClient.sendTranslationRequest(
      plainStringsToTranslate,
      this.sourceLanguage,
      this.targetLanguage,
    );

    return {
      ...this.parseResults(results, detaggedStrings),
      plainStringsToTranslate,
    };
  }

  parseResults(
    results: TranslationResults,
    detaggedStrings: DetaggedString[],
  ): TranslationResponseData & { translatedPlainTextStrings: string[] } {
    const len = results.translatedTexts.length;
    if (len !== this.translationRequestData.markupsToTranslate.length) {
      // This should never happen, but if the service returns a different number
      // of items (from the number of items submitted), we can't use this chunk
      // because all items would be paired incorrectly.
      throw new Error(
        "Translation backend returned a different number of results (from the number of strings to translate)",
      );
    }

    const translatedMarkups = [];
    const translatedPlainTextStrings = [];
    const qeAnnotatedTranslatedMarkups = results.qeAnnotatedTranslatedTexts;

    // The 'text' field of results is a list of 'Paragraph'. Parse each 'Paragraph' entry
    results.translatedTexts.forEach(
      (translatedPlainTextString: string, index) => {
        const detaggedString = detaggedStrings[index];

        // Work around issue with doubled periods returned at the end of the translated string
        const originalEndedWithASinglePeriod = /([^\.])\.(\s+)?$/gm.exec(
          detaggedString.plainString,
        );
        const translationEndsWithTwoPeriods = /([^\.])\.\.(\s+)?$/gm.exec(
          translatedPlainTextString,
        );
        if (originalEndedWithASinglePeriod && translationEndsWithTwoPeriods) {
          translatedPlainTextString = translatedPlainTextString.replace(
            /([^\.])\.\.(\s+)?$/gm,
            "$1.$2",
          );
        }

        let translatedMarkup;

        // Use original rather than an empty or obviously invalid translation
        // TODO: Address this upstream
        if (["", "*", "* ()"].includes(translatedPlainTextString)) {
          translatedMarkup = this.translationRequestData.markupsToTranslate[
            index
          ];
        } else {
          // Project original tags/markup onto translated plain text string
          // TODO: Use alignment info returned from the translation engine when it becomes available
          translatedMarkup = project(detaggedString, translatedPlainTextString);
        }

        translatedMarkups.push(translatedMarkup);
        translatedPlainTextStrings.push(translatedPlainTextString);
      },
    );

    return {
      translatedMarkups,
      translatedPlainTextStrings,
      qeAnnotatedTranslatedMarkups,
    };
  }
}
