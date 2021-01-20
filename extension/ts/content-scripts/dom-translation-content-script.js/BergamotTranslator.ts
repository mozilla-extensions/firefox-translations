/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

import {
  MAX_REQUEST_CHUNKS,
  MAX_REQUEST_DATA,
  MAX_REQUESTS,
} from "./bergamot.constants";
import { BergamotRequest } from "./BergamotRequest";
import { TranslationRequest } from "../../shared-resources/bergamot.types";
import { ContentScriptBergamotApiClient } from "../../shared-resources/ContentScriptBergamotApiClient";

/**
 * Translates a webpage using Bergamot's Translation API.
 *
 * @param translationDocument  The TranslationDocument object that represents
 *                             the webpage to be translated
 * @param sourceLanguage       The source language of the document
 * @param targetLanguage       The target language for the translation
 *
 * @returns {Promise}          A promise that will resolve when the translation
 *                             task is finished.
 */
export class BergamotTranslator {
  private readonly translationDocument;
  private readonly sourceLanguage;
  private readonly targetLanguage;
  private _pendingRequests;
  private _partialSuccess;
  private _translatedCharacterCount;
  private _outboundTranslator;
  private _onFinishedDeferred;
  private bergamotApiClient: ContentScriptBergamotApiClient;

  constructor(translationDocument, sourceLanguage, targetLanguage) {
    this.translationDocument = translationDocument;
    this.sourceLanguage = sourceLanguage;
    this.targetLanguage = targetLanguage;
    this._pendingRequests = 0;
    this._partialSuccess = false;
    this._translatedCharacterCount = 0;
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

    return new Promise((resolve, reject) => {
      // Deferred pattern
      this._onFinishedDeferred = { resolve, reject };

      // Let's split the document into various requests to be sent to
      // Bergamot's Translation API.
      for (let requestCount = 0; requestCount < MAX_REQUESTS; requestCount++) {
        // Determine the data for the next request.
        let request = this._generateNextTranslationRequest(currentIndex);

        // Create a real request for the server and add it to the pending requests list.
        let bergamotRequest = new BergamotRequest(
          request.data,
          this.sourceLanguage,
          this.targetLanguage,
        );
        this._pendingRequests++;

        // TODO: Restore ability to specify that this is inbound translation (process.env.BERGAMOT_REST_API_INBOUND_URL)
        bergamotRequest
          .fireRequest(this.bergamotApiClient)
          .then(results => {
            this._chunkCompleted(results, bergamotRequest);
          })
          .catch(err => {
            console.error("fireRequest error", err);
            // TODO: Restore error handling (this._chunkFailed.bind(this))
          });

        currentIndex = request.lastIndex;
        if (request.finished) {
          break;
        }
      }
    });
  }

  /**
   * Function called when a request sent to the server completed successfully.
   * This function handles calling the function to parse the result and the
   * function to resolve the promise returned by the public `translate()`
   * method when there's no pending request left.
   *
   * @param   bergamotRequest   The BergamotRequest sent to the server.
   */
  _chunkCompleted(results, bergamotRequest: BergamotRequest) {
    if (this._parseChunkResult(results, bergamotRequest)) {
      this._partialSuccess = true;
      // Count the number of characters successfully translated.
      this._translatedCharacterCount += bergamotRequest.characterCount;
    }

    this._checkIfFinished();
  }

  /**
   * Function called when a request sent to the server has failed.
   * This function handles deciding if the error is transient or means the
   * service is unavailable (zero balance on the key or request credentials are
   * not in an active state) and calling the function to resolve the promise
   * returned by the public `translate()` method when there's no pending.
   * request left.
   *
   * @param   aError   [optional] The XHR object of the request that failed.
   */
  _chunkFailed(aError) {
    this._checkIfFinished();
  }

  /**
   * Function called when a request sent to the server has completed.
   * This function handles resolving the promise
   * returned by the public `translate()` method when all chunks are completed.
   */
  _checkIfFinished() {
    // Check if all pending requests have been
    // completed and then resolves the promise.
    // If at least one chunk was successful, the
    // promise will be resolved positively which will
    // display the "Success" state for the infobar. Otherwise,
    // the "Error" state will appear.
    if (--this._pendingRequests == 0) {
      if (this._partialSuccess) {
        this._onFinishedDeferred.resolve({
          characterCount: this._translatedCharacterCount,
        });
      } else {
        this._onFinishedDeferred.reject("failure");
      }
    }
  }

  /**
   * This function parses the result returned by Bergamot's Http API for
   * the translated text in target language.
   *
   * @param   bergamotRequest      The request sent to the server.
   * @returns boolean      True if parsing of this chunk was successful.
   */
  _parseChunkResult(results, bergamotRequest: BergamotRequest) {
    let len = results.text.length;
    if (len != bergamotRequest.translationData.length) {
      // This should never happen, but if the service returns a different number
      // of items (from the number of items submitted), we can't use this chunk
      // because all items would be paired incorrectly.
      return false;
    }

    const showQualityEstimation = false;

    let error = false;
    for (let i = 0; i < len; i++) {
      try {
        // The 'text' field of results is a list of 'Paragraph'. Parse each 'Paragraph' entry
        let translation = this[
          showQualityEstimation
            ? "_generateQEAnnotatedHTMLFromParagraph"
            : "_parseTranslatedTextFromParagraph"
        ](results.text[i]);

        let root = bergamotRequest.translationData[i][0];
        if (root.isSimpleRoot && translation.includes("&")) {
          // If translation contains HTML entities, we need to convert them.
          // It is because simple roots expect a plain text result.
          let doc = new DOMParser().parseFromString(translation, "text/html");
          translation = doc.body.firstChild.nodeValue;
        }

        if (showQualityEstimation) {
          // No root (TranslationItem) is simple anymore because now each root will store
          // DOM node (having QE annotations) in it's "translation" property. This needs
          // to be done because translated text with QE annotations have to be shown inplace
          // (i.e. on the same webpage replacing the original text) for the demo. Therefore,
          // setting isSimpleRoot to false. Once this use case changes, it can be reverted back.
          root.isSimpleRoot = false;
        }

        // Show original rather than an empty or obviously invalid translation
        if (["", "*", "* ()".includes(translation)]) {
          translation = root.original[0];
        }

        root.parseResult(translation);
      } catch (e) {
        error = true;
        console.error("Translation error: ", e);
      }
    }

    return !error;
  }

  /**
   * This function parses 'Paragraph' entity of the response for the
   * the translated text and returns it. The API response format
   * can be referred here: https://github.com/browsermt/mts
   *
   * @param   paragraph    paragraph entry in the response of server.
   *
   * @returns string       translated text in target language
   */
  _parseTranslatedTextFromParagraph(paragraph) {
    // Each 'Paragraph' contains a list of 'Sentence translation' list.
    // There should be only 1 such list.
    let sentenceTranslationList = paragraph[0];

    let result = "";

    // 'Sentence translation' list contains 'Sentence translation' objects
    // where each object contains all the information related to translation
    // of each sentence in source language.
    for (let index = 0; index < sentenceTranslationList.length; index++) {
      let sentenceTranslation = sentenceTranslationList[index];
      let nBestTranslations = sentenceTranslation.nBest;

      // Depending on the request, there might be multiple 'best translations'.
      // We are fetching the best one (present in 'translation' field).
      let translation = nBestTranslations[0].translation;

      // ToDo: Currently the rest server doesn't retain the leading/trailing
      // whitespace information of sentences. It is a bug on rest server side.
      // Once it is fixed there, we need to stop appending whitespaces.
      if (index != 0) {
        translation = " " + translation;
      }
      result += translation;
    }
    return result;
  }

  /**
   * This function parses 'Paragraph' entity of the response and returns
   * QE Annotated HTML of the translated text. The API response format
   * can be referred here: https://github.com/browsermt/mts
   *
   * @param   paragraph    paragraph entry in the response of server.
   * @returns string       QE Annotated HTML of the translated text
   *                       in target language
   */
  _generateQEAnnotatedHTMLFromParagraph(paragraph) {
    // ToDo: Add message-system logging later in this method
    // Each 'Paragraph' contains a list of 'Sentence translation' list.
    // There should be only 1 such list.
    let sentenceTranslationList = paragraph[0];

    let qeAnnotatedParagraphHTML = "";

    // 'Sentence translation' list contains 'Sentence translation' objects
    // where each object contains all the information related to translation
    // of each sentence in source language.
    for (let index = 0; index < sentenceTranslationList.length; index++) {
      let sentenceTranslation = sentenceTranslationList[index];
      let nBestTranslations = sentenceTranslation.nBest;

      // Depending on the request, there might be multiple 'best translations'.
      // We are fetching the best one (present in 'translation' field).
      let translation = nBestTranslations[0].translation;

      // Currently, sentence scores are used as quality estimates
      let sentenceScore = nBestTranslations[0].sentenceScore;

      // ToDo: Currently the rest server doesn't retain the leading/trailing
      // whitespace information of sentences. It is a bug on rest server side.
      // Once it is fixed there, we need to stop appending whitespaces.
      if (index != 0) {
        translation = " " + translation;
      }

      // Generate QE Annotated HTML for each sentence and append it to the result
      qeAnnotatedParagraphHTML += this._generateQEAnnotatedHTML(
        translation,
        sentenceScore,
      );
    }

    // Wrap the result with identifier "QE-ANNOTATED" to make it easy to switch
    // b/w "original" and "translation" in TranslationDocument.swapTextForItem() method
    return `<div><span id=QE-ANNOTATED>${qeAnnotatedParagraphHTML}</span></div>`;
  }

  /**
   * This function generates the Quality Estimation annotated HTML of a string
   * based on its score.
   *
   * @param   translation    input string
   * @param   score          score of the input string
   * @returns string         QE annotated HTML of input string
   */
  _generateQEAnnotatedHTML(translation, score) {
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
    return `<span style="color:${color}">${translation}</span>`;
  }

  /**
   * This function will determine what is the data to be used for
   * the Nth request we are generating, based on the input params.
   *
   * @param startIndex What is the index, in the roots list, that the
   *                   chunk should start.
   */
  _generateNextTranslationRequest(startIndex: number): TranslationRequest {
    let currentDataSize = 0;
    let currentChunks = 0;
    let output = [];
    let rootsList = this.translationDocument.roots;

    for (let i = startIndex; i < rootsList.length; i++) {
      let root = rootsList[i];
      let text = this.translationDocument.generateTextForItem(root);
      if (!text) {
        continue;
      }

      let newCurSize = currentDataSize + text.length;
      let newChunks = currentChunks + 1;

      if (newCurSize > MAX_REQUEST_DATA || newChunks > MAX_REQUEST_CHUNKS) {
        // If we've reached the API limits, let's stop accumulating data
        // for this request and return. We return information useful for
        // the caller to pass back on the next call, so that the function
        // can keep working from where it stopped.
        return {
          data: output,
          finished: false,
          lastIndex: i,
        };
      }

      currentDataSize = newCurSize;
      currentChunks = newChunks;
      output.push([root, text]);
    }

    return {
      data: output,
      finished: true,
      lastIndex: 0,
    };
  }
}
