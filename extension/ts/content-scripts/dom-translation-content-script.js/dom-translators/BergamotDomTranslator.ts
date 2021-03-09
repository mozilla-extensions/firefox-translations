/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ContentScriptBergamotApiClient } from "../../../shared-resources/ContentScriptBergamotApiClient";
import {
  generateMarkupToTranslateForItem,
  TranslationDocument,
} from "../TranslationDocument";
import { TranslationItem } from "../TranslationItem";
import {
  BaseDomTranslator,
  DomTranslationChunk,
  TranslationRequestData,
  TranslationResponseData,
} from "./BaseDomTranslator";
import { BergamotDomTranslatorRequest } from "./BergamotDomTranslatorRequest";

// The maximum amount of net data allowed per request on Bergamot's API.
export const MAX_REQUEST_DATA = 500000;

// The maximum number of texts allowed to be translated in a single request.
export const MAX_REQUEST_TEXTS = 100;

// Self-imposed limit of requests. This means that a page that would need
// to be broken in more than this amount of requests won't be fully translated.
export const MAX_REQUESTS = 15;

/**
 * Translates a webpage using Bergamot's Translation backend.
 */
export class BergamotDomTranslator extends BaseDomTranslator {
  /**
   * @param translationDocument  The TranslationDocument object that represents
   *                             the webpage to be translated
   * @param sourceLanguage       The source language of the document
   * @param targetLanguage       The target language for the translation
   */
  constructor(
    translationDocument: TranslationDocument,
    sourceLanguage: string,
    targetLanguage: string,
  ) {
    super(
      translationDocument,
      sourceLanguage,
      targetLanguage,
      new ContentScriptBergamotApiClient(),
      parseChunkResult,
      { MAX_REQUEST_DATA, MAX_REQUEST_TEXTS, MAX_REQUESTS },
      (
        translationRequestData: TranslationRequestData,
        sourceLanguage: string,
        targetLanguage: string,
      ) =>
        new BergamotDomTranslatorRequest(
          translationRequestData,
          sourceLanguage,
          targetLanguage,
        ),
    );
  }
}

/**
 * This function parses the result returned by Bergamot's Translation API for
 * the translated text in the target language.
 *
 * @returns boolean      True if parsing of this chunk was successful.
 */
function parseChunkResult(
  translationResponseData: TranslationResponseData,
  domTranslationChunk: DomTranslationChunk,
) {
  const len = translationResponseData.translatedMarkups.length;
  if (len === 0) {
    throw new Error("Translation response data has no translated strings");
  }
  if (len !== domTranslationChunk.translationRoots.length) {
    // This should never happen, but if the service returns a different number
    // of items (from the number of items submitted), we can't use this chunk
    // because all items would be paired incorrectly.
    throw new Error(
      "Translation response data has a different number of items (from the number of items submitted)",
    );
  }

  console.info(
    `Parsing translation chunk result with ${len} translation entries`,
  );

  let errorOccurred = false;
  domTranslationChunk.translationRoots.forEach(
    (translationRoot: TranslationItem, index) => {
      try {
        const translationRoot: TranslationItem =
          domTranslationChunk.translationRoots[index];
        let translatedMarkup = translationResponseData.translatedMarkups[index];
        let qeAnnotatedTranslatedMarkup =
          translationResponseData.qeAnnotatedTranslatedMarkups[index];

        qeAnnotatedTranslatedMarkup = generateMarkupToTranslateForItem(
          translationRoot,
          qeAnnotatedTranslatedMarkup,
        );

        translationRoot.parseTranslationResult(translatedMarkup);
        translationRoot.parseQeAnnotatedTranslationResult(
          qeAnnotatedTranslatedMarkup,
        );
      } catch (e) {
        errorOccurred = true;
        console.error("Translation error: ", e);
      }
    },
  );

  console.info(
    `Parsed translation chunk result with ${len} translation entries`,
    { errorOccurred },
  );

  return !errorOccurred;
}
