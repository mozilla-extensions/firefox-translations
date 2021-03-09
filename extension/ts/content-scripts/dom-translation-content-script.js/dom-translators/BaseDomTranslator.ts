/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { TranslationDocument } from "../TranslationDocument";
import { BergamotRestApiTranslateRequestResult } from "../../../background-scripts/background.js/lib/BergamotApiClient";
import { TranslationItem } from "../TranslationItem";
import { MinimalDomTranslator } from "./MinimalDomTranslator";

export interface TranslationRequestData {
  markupsToTranslate: string[];
}

export interface TranslationResponseData {
  translatedMarkups: string[];
  qeAnnotatedTranslatedMarkups: string[];
}

export interface TranslationApiClient {
  sendTranslationRequest: (
    texts: string[],
    from: string,
    to: string,
  ) => Promise<BergamotRestApiTranslateRequestResult>;
}

type DomTranslatorRequestFactory = (
  translationRequestData: TranslationRequestData,
  sourceLanguage: string,
  targetLanguage: string,
) => DomTranslatorRequest;

export interface DomTranslatorRequest {
  fireRequest: (
    apiClient: TranslationApiClient,
  ) => Promise<TranslationResponseData>;
  characterCount: number;
}

export interface DomTranslationChunk {
  translationRequestData: TranslationRequestData;
  translationRoots: TranslationItem[];
  translationResponseData?: TranslationResponseData;
  isLastChunk: boolean;
  lastIndex: number;
}

type TranslationParseChunkResultFunction = (
  translationResponseData: TranslationResponseData,
  domTranslationChunk: DomTranslationChunk,
) => boolean;

interface TranslationApiLimits {
  MAX_REQUEST_DATA: number;
  MAX_REQUEST_CHUNKS: number;
  MAX_REQUESTS: number;
}

/**
 * Base class for DOM translators that splits the document into several chunks
 * respecting the data limits of the backing API.
 */
export class BaseDomTranslator extends MinimalDomTranslator {
  public translatedCharacterCount: number;
  public partialSuccess: boolean;
  private translationApiClient: TranslationApiClient;
  private parseChunkResult: TranslationParseChunkResultFunction;
  private translationApiLimits: TranslationApiLimits;
  private domTranslatorRequestFactory: DomTranslatorRequestFactory;

  /**
   * @param translationDocument  The TranslationDocument object that represents
   *                             the webpage to be translated
   * @param sourceLanguage       The source language of the document
   * @param targetLanguage       The target language for the translation
   * @param translationApiClient
   * @param parseChunkResult
   * @param translationApiLimits
   * @param domTranslatorRequestFactory
   */
  constructor(
    translationDocument: TranslationDocument,
    sourceLanguage: string,
    targetLanguage: string,
    translationApiClient: TranslationApiClient,
    parseChunkResult: TranslationParseChunkResultFunction,
    translationApiLimits: TranslationApiLimits,
    domTranslatorRequestFactory: DomTranslatorRequestFactory,
  ) {
    super(translationDocument, sourceLanguage, targetLanguage);
    this.translatedCharacterCount = 0;
    this.partialSuccess = false;
    this.translationApiClient = translationApiClient;
    this.parseChunkResult = parseChunkResult;
    this.translationApiLimits = translationApiLimits;
    this.domTranslatorRequestFactory = domTranslatorRequestFactory;
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
    const { MAX_REQUESTS } = this.translationApiLimits;

    // Split the document into various requests to be sent to the translation API
    for (let requestCount = 0; requestCount < MAX_REQUESTS; requestCount++) {
      // Determine the data for the next request.
      const domTranslationChunk = this.generateNextDomTranslationChunk(
        currentIndex,
      );

      // Break if there was nothing left to translate
      if (domTranslationChunk.translationRoots.length === 0) {
        break;
      }

      // Create a real request for the translation engine and add it to the pending requests list.
      const translationRequestData: TranslationRequestData =
        domTranslationChunk.translationRequestData;

      const domTranslatorRequest = this.domTranslatorRequestFactory(
        translationRequestData,
        this.sourceLanguage,
        this.targetLanguage,
      );

      // Fire all requests in parallel
      const chunkBeingProcessed = domTranslatorRequest
        .fireRequest(this.translationApiClient)
        .then((translationResponseData: TranslationResponseData) => {
          if (translationResponseData) {
            this.chunkCompleted(
              translationResponseData,
              domTranslationChunk,
              domTranslatorRequest,
            );
          }
        })
        .catch(err => {
          console.error("DomTranslator fireRequest error", err);
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
      `Fired off ${chunksBeingProcessed.length} requests to the translation backend`,
    );

    // Resolve promise when all requests have finished
    await Promise.all(chunksBeingProcessed);

    // If at least one chunk was successful, the
    // translation should be displayed, albeit incomplete.
    // Otherwise, the "Error" state will appear.
    if (!this.partialSuccess) {
      throw new Error(
        "DomTranslator ended up with no more pending chunks being processed and zero successful requests",
      );
    }
    return {
      characterCount: this.translatedCharacterCount,
    };
  }

  /**
   * Function called when a request sent to the translation engine completed successfully.
   * This function handles calling the function to parse the result and the
   * function to resolve the promise returned by the public `translate()`
   * method when there's no pending request left.
   */
  private chunkCompleted(
    translationResponseData: TranslationResponseData,
    domTranslationChunk: DomTranslationChunk,
    domTranslatorRequest: DomTranslatorRequest,
  ) {
    if (this.parseChunkResult(translationResponseData, domTranslationChunk)) {
      this.partialSuccess = true;
      // Count the number of characters successfully translated.
      this.translatedCharacterCount += domTranslatorRequest.characterCount;
      // Show translated chunks as they arrive
      console.info(
        "Part of the web page document translated. Showing translations that have completed so far...",
      );
      this.translationDocument.showTranslation();
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
    const { MAX_REQUEST_DATA, MAX_REQUEST_CHUNKS } = this.translationApiLimits;

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
        console.warn("We have reached the translation API limits", {
          newCurSize,
          newChunks,
          translationApiLimits: this.translationApiLimits,
        });
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
