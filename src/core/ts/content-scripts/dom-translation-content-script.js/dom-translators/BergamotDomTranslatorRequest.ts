/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {
  DomTranslatorRequest,
  TranslationApiClient,
  TranslationRequestData,
  TranslationResponseData,
} from "./BaseDomTranslator";
import {
  BergamotRestApiParagraph,
  BergamotRestApiTranslateRequestResult,
} from "../../../background-scripts/background.js/lib/BergamotApiClient";
import { detag, DetaggedString, project } from "./detagAndProject";

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
    results: BergamotRestApiTranslateRequestResult,
    detaggedStrings: DetaggedString[],
  ): TranslationResponseData & { translatedPlainTextStrings: string[] } {
    const len = results.text.length;
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
    const qeAnnotatedTranslatedMarkups = [];

    // The 'text' field of results is a list of 'Paragraph'. Parse each 'Paragraph' entry
    results.text.forEach((paragraph: BergamotRestApiParagraph, index) => {
      const detaggedString = detaggedStrings[index];
      const translationObjects = getBestTranslationObjectsOfEachSentenceInBergamotRestApiParagraph(
        paragraph,
      );

      // TODO: Currently the rest server doesn't retain the leading/trailing
      // whitespace information of sentences. It is a bug on rest server side.
      // Once it is fixed there, we need to stop appending whitespaces.
      const separator = " ";

      // Join sentence translations
      let translatedPlainTextString = translationObjects
        .map(({ translation }) => translation)
        .join(separator);

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

      // Generate QE Annotated HTML for each sentence
      const qeAnnotatedSentenceHTMLs = translationObjects.map(
        ({ translation, sentenceScore }) =>
          generateQEAnnotatedHTML(translation, sentenceScore),
      );
      const qeAnnotatedTranslatedMarkup = qeAnnotatedSentenceHTMLs.join(
        separator,
      );

      qeAnnotatedTranslatedMarkups.push(qeAnnotatedTranslatedMarkup);
    });

    return {
      translatedMarkups,
      translatedPlainTextStrings,
      qeAnnotatedTranslatedMarkups,
    };
  }
}

/**
 * This function parses 'Paragraph' entity of the response for the
 * the best translations and returns them
 */
function getBestTranslationObjectsOfEachSentenceInBergamotRestApiParagraph(
  paragraph: BergamotRestApiParagraph,
) {
  const bestTranslations = [];
  paragraph[0].forEach(sentenceTranslationList => {
    // Depending on the request, there might be multiple 'best translations'.
    // We are fetching the best one (present in 'translation' field).
    const bestTranslation = sentenceTranslationList.nBest[0];
    bestTranslations.push(bestTranslation);
  });
  return bestTranslations;
}

/**
 * This function generates the Quality Estimation annotated HTML of a string
 * based on its score.
 *
 * @param   translation    input string
 * @param   score          score of the input string
 * @returns string         QE annotated HTML of input string
 */
function generateQEAnnotatedHTML(translation, score) {
  // Color choices and thresholds below are chosen based on intuitiveness.
  // They will be changed according to the UI design of Translator once it
  // is fixed.
  let color: string;
  if (score >= -0.2) {
    color = "green";
  } else if (score >= -0.5 && score < -0.2) {
    color = "black";
  } else if (score >= -0.8 && score < -0.5) {
    color = "mediumvioletred";
  } else {
    color = "red";
  }
  return `<span data-translation-qe-score="${score}" style="color:${color}"> ${translation}</span>`;
}
