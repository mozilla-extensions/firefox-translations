/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { BergamotDomTranslatorRequest } from "./BergamotDomTranslatorRequest";
import { ContentScriptBergamotApiClient } from "../../../shared-resources/ContentScriptBergamotApiClient";
import {
  generateMarkupToTranslateForItem,
  TranslationDocument,
} from "../TranslationDocument";
import { TranslationItem } from "../TranslationItem";
import {
  BaseDomTranslator,
  TranslationRequestData,
  TranslationResponseData,
} from "./BaseDomTranslator";

interface DomTranslationChunk {
  translationRequestData: TranslationRequestData;
  translationRoots: TranslationItem[];
  translationResponseData?: TranslationResponseData;
  isLastChunk: boolean;
  lastIndex: number;
}

// The maximum amount of net data allowed per request on Bergamot's API.
export const MAX_REQUEST_DATA = 500000;

// The maximum number of chunks allowed to be translated in a single
// request.
export const MAX_REQUEST_CHUNKS = 12800;

// Self-imposed limit of 1920 requests. This means that a page that would need
// to be broken in more than 1920 requests won't be fully translated.
// The maximum amount of data that we will translate for a single page
// is MAX_REQUESTS * MAX_REQUEST_DATA.
export const MAX_REQUESTS = 15;

/**
 * Translates a webpage using Bergamot's Translation backend.
 */
export class BergamotDomTranslator extends BaseDomTranslator {
  public partialSuccess: boolean;
  private bergamotApiClient: ContentScriptBergamotApiClient;

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
    super(translationDocument, sourceLanguage, targetLanguage);
    this.partialSuccess = false;
    this.bergamotApiClient = new ContentScriptBergamotApiClient();
  }

  /**
   * Performs the translation, splitting the document into several chunks
   * respecting the data limits of the API.
   *
   * @returns {Promise}          A promise that will resolve when the translation
   *                             task is finished.
   */
  async translate(): Promise<{
    characterCount: number;
  }> {
    let currentIndex = 0;
    const chunksBeingProcessed = [];

    // Let's split the document into various requests to be sent to
    // Bergamot's Translation API.
    for (let requestCount = 0; requestCount < MAX_REQUESTS; requestCount++) {
      // Determine the data for the next request.
      const domTranslationChunk = this.generateNextDomTranslationChunk(
        currentIndex,
      );

      // Break if there was nothing left to translate
      if (domTranslationChunk.translationRoots.length === 0) {
        break;
      }

      // Create a real request for the server and add it to the pending requests list.
      const translationRequestData: TranslationRequestData =
        domTranslationChunk.translationRequestData;

      let bergamotDomTranslatorRequest = new BergamotDomTranslatorRequest(
        translationRequestData,
        this.sourceLanguage,
        this.targetLanguage,
      );

      // Fire all requests in parallel
      const chunkBeingProcessed = bergamotDomTranslatorRequest
        .fireRequest(this.bergamotApiClient)
        .then((translationResponseData: TranslationResponseData) => {
          if (translationResponseData) {
            this.chunkCompleted(
              translationResponseData,
              domTranslationChunk,
              bergamotDomTranslatorRequest,
            );
          }
        })
        .catch(err => {
          console.error("BergamotDomTranslator fireRequest error", err);
        });
      chunksBeingProcessed.push(chunkBeingProcessed);

      if (domTranslationChunk.isLastChunk) {
        break;
      }

      currentIndex = domTranslationChunk.lastIndex;
    }

    // Return early with a noop if there is nothing to translate
    if (chunksBeingProcessed.length === 0) {
      console.info("Found nothing to translate");
      return { characterCount: 0 };
    }

    console.info(
      `Fired off ${chunksBeingProcessed.length} requests to the bergamot translation backend`,
    );

    // Resolve promise when all requests have finished
    await Promise.all(chunksBeingProcessed);

    // If at least one chunk was successful, the
    // translation should be displayed, albeit incomplete.
    // Otherwise, the "Error" state will appear.
    if (!this.partialSuccess) {
      throw new Error(
        "BergamotDomTranslator ended up with no more pending chunks being processed and zero successful requests",
      );
    }
    return {
      characterCount: this.translatedCharacterCount,
    };
  }

  /**
   * Function called when a request sent to the server completed successfully.
   * This function handles calling the function to parse the result and the
   * function to resolve the promise returned by the public `translate()`
   * method when there's no pending request left.
   */
  private chunkCompleted(
    translationResponseData: TranslationResponseData,
    domTranslationChunk: DomTranslationChunk,
    bergamotDomTranslatorRequest: BergamotDomTranslatorRequest,
  ) {
    if (parseChunkResult(translationResponseData, domTranslationChunk)) {
      this.partialSuccess = true;
      // Count the number of characters successfully translated.
      this.translatedCharacterCount +=
        bergamotDomTranslatorRequest.characterCount;
    }
  }

  /**
   * This function will determine what is the data to be used for
   * the Nth request we are generating, based on the input params.
   *
   * @param startIndex What is the index, in the translation roots list, that the
   *                   chunk should start.
   */
  private generateNextDomTranslationChunk(
    startIndex: number,
  ): DomTranslationChunk {
    let currentDataSize = 0;
    let currentChunks = 0;
    let translationRequestData: TranslationRequestData = {
      markupsToTranslate: [],
    };
    const { translationRoots } = this.translationDocument;
    const chunkTranslationRoots = [];

    for (let index = startIndex; index < translationRoots.length; index++) {
      const translationRoot = translationRoots[index];
      const markupToTranslate = this.translationDocument.generateMarkupToTranslate(
        translationRoot,
      );

      const newCurSize = currentDataSize + markupToTranslate.length;
      const newChunks = currentChunks + 1;

      if (newCurSize > MAX_REQUEST_DATA || newChunks > MAX_REQUEST_CHUNKS) {
        // If we've reached the API limits, let's stop accumulating data
        // for this request and return. We return information useful for
        // the caller to pass back on the next call, so that the function
        // can keep working from where it stopped.
        return {
          translationRequestData,
          translationRoots: chunkTranslationRoots,
          isLastChunk: false,
          lastIndex: index,
        };
      }

      currentDataSize = newCurSize;
      currentChunks = newChunks;
      chunkTranslationRoots.push(translationRoot);
      translationRequestData.markupsToTranslate.push(markupToTranslate);
    }

    return {
      translationRequestData,
      translationRoots: chunkTranslationRoots,
      isLastChunk: true,
      lastIndex: 0,
    };
  }
}

/**
 * This function parses the result returned by Bergamot's Http API for
 * the translated text in target language.
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
