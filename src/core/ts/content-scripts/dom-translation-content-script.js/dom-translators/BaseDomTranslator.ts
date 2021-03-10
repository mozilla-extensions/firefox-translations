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
}

type TranslationParseChunkResultFunction = (
  translationResponseData: TranslationResponseData,
  domTranslationChunk: DomTranslationChunk,
) => boolean;

interface TranslationApiLimits {
  MAX_REQUEST_DATA: number;
  MAX_REQUEST_TEXTS: number;
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
  private translationRootsPickedUpForTranslation: TranslationItem[];

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
    const chunksBeingProcessed = [];
    const { MAX_REQUESTS } = this.translationApiLimits;

    const { translationRoots } = this.translationDocument;
    const {
      translationRootsVisible,
      translationRootsVisibleInViewport,
    } = await this.translationDocument.determineVisibilityOfTranslationRoots();
    this.translationRootsPickedUpForTranslation = [];

    // Split the document into various requests to be sent to the translation API
    for (
      let currentRequestOrdinal = 0;
      currentRequestOrdinal < MAX_REQUESTS;
      currentRequestOrdinal++
    ) {
      // Determine the data for the next request.
      const domTranslationChunk = this.generateNextDomTranslationChunk(
        translationRoots,
        translationRootsVisible,
        translationRootsVisibleInViewport,
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

      // Fire off the requests in parallel to existing requests
      const chunkBeingProcessed = domTranslatorRequest
        .fireRequest(this.translationApiClient)
        .then((translationResponseData: TranslationResponseData) => {
          if (translationResponseData) {
            this.chunkCompleted(
              translationResponseData,
              domTranslationChunk,
              domTranslatorRequest,
            );
          } else {
            throw new Error(
              "The return translationResonseData was false/empty",
            );
          }
        })
        .catch(err => {
          console.error("DomTranslator fireRequest error", err);
        });
      chunksBeingProcessed.push(chunkBeingProcessed);
      console.info(
        `Fired off request with ${domTranslationChunk.translationRoots.length} translation roots to the translation backend`,
        { domTranslationChunk },
      );

      if (domTranslationChunk.isLastChunk) {
        break;
      }
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
   */
  private generateNextDomTranslationChunk(
    translationRoots: TranslationItem[],
    translationRootsVisible: TranslationItem[],
    translationRootsVisibleInViewport: TranslationItem[],
  ): DomTranslationChunk {
    let currentDataSize = 0;
    let currentChunks = 0;
    const translationRequestData: TranslationRequestData = {
      markupsToTranslate: [],
    };
    const chunkTranslationRoots = [];
    const { MAX_REQUEST_DATA, MAX_REQUEST_TEXTS } = this.translationApiLimits;

    let translationRootsToConsider;

    // Don't consider translation roots that are already picked up for translation
    const notYetPickedUp = ($translationRoots: TranslationItem[]) =>
      $translationRoots.filter(
        value => !this.translationRootsPickedUpForTranslation.includes(value),
      );

    // Prioritize the translation roots visible in viewport
    translationRootsToConsider = notYetPickedUp(
      translationRootsVisibleInViewport,
    );

    // Then prioritize the translation roots that are visible
    if (translationRootsToConsider.length === 0) {
      translationRootsToConsider = notYetPickedUp(translationRootsVisible);
    }

    // Then prioritize the remaining translation roots
    if (translationRootsToConsider.length === 0) {
      translationRootsToConsider = notYetPickedUp(translationRoots);
    }

    for (let i = 0; i < translationRootsToConsider.length; i++) {
      const translationRoot = translationRootsToConsider[i];
      const markupToTranslate = this.translationDocument.generateMarkupToTranslate(
        translationRoot,
      );

      const newCurSize = currentDataSize + markupToTranslate.length;
      const newChunks = currentChunks + 1;

      if (newCurSize > MAX_REQUEST_DATA || newChunks > MAX_REQUEST_TEXTS) {
        // If we've reached the API limits, let's stop accumulating data
        // for this request and return. We return information useful for
        // the caller to pass back on the next call, so that the function
        // can keep working from where it stopped.
        console.info(
          "We have reached the specified translation API limits and will process remaining translation roots in a separate request",
          {
            newCurSize,
            newChunks,
            translationApiLimits: this.translationApiLimits,
          },
        );
        return {
          translationRequestData,
          translationRoots: chunkTranslationRoots,
          isLastChunk: false,
        };
      }

      currentDataSize = newCurSize;
      currentChunks = newChunks;
      chunkTranslationRoots.push(translationRoot);
      this.translationRootsPickedUpForTranslation.push(translationRoot);
      translationRequestData.markupsToTranslate.push(markupToTranslate);
    }

    const remainingTranslationRoots = notYetPickedUp(translationRoots);
    const isLastChunk = remainingTranslationRoots.length === 0;

    return {
      translationRequestData,
      translationRoots: chunkTranslationRoots,
      isLastChunk,
    };
  }
}
