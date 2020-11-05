/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

import {MAX_REQUEST_CHUNKS, MAX_REQUEST_DATA, MAX_REQUESTS} from "./bergamot.constants";
import {BergamotRequest} from "../shared-resources/BergamotRequest";

/**
 * Outbound translator for a webpage using Bergamot's Translation API.
 * Currently, it translates the textual content of the forms of an
 * html document whenever a submit event is dispatched on them.
 *
 * @param translationDocument  The TranslationDocument object that
 *                             represents the webpage.
 */
export class BergamotOutboundTranslator {

  private _translationDocument;
  private _pendingRequests;
  private _partialSuccess;
  private _translatedCharacterCount;
  private _formControlElements;
  private sourceLanguage;
  private targetLanguage;

  constructor(translationDocument) {
    this._translationDocument = translationDocument;
    this._pendingRequests = 0;
    this._partialSuccess = false;
    this._translatedCharacterCount = 0;
  }

  /**
   * Add listener for 'submit' events on all the forms of the document
   *
   */
  listenSubmitEvents() {
    let ownerDocument = this._translationDocument.getOwnerDocument();
    for (let form of ownerDocument.forms) {
      form.addEventListener('submit', this);
    }
  }

  /**
   * Handler function to process 'submit' events on the forms of the document
   *
   */
  handleEvent(event) {
    this._translate(event);

    // ToDo: Change this once outbound translation use case gets well defined.
    // This step is done in order to demonstrate through GUI that text entered
    // by the user in the form has been translated in target language. This is
    // just an initial integration of outbound translation in browser.
    // Stop any further actions on the SubmitEvent object
    event.preventDefault();
  }

  /**
   * Translates contents of document's form for which 'submit' event is received.
   *
   * @param  event   SubmitEvent object
   */
  _translate(event) {
    // ToDo: Change this once outbound translation use case gets well defined.
    // Can we move this to constructor function? Form control elements
    // of an HTML webpage should remain unchanged before or after translation?
    this._formControlElements = event.target.elements;

    let currentIndex = 0;

    // Let's split the content to be translated into various requests to be sent to
    // Bergamot's Translation API.
    for (let requestCount = 0; requestCount < MAX_REQUESTS; requestCount++) {
      // ToDo: Introduce a promise once outbound translation use case gets well defined.
      // Determine the data for the next request.
      let request = this._generateNextTranslationRequest(currentIndex);

      // Create a real request for the server and add it to the pending requests list.
      let bergamotRequest = new BergamotRequest(
        request.data,
        this.sourceLanguage,
        this.targetLanguage,
      );
      this._pendingRequests++;

      bergamotRequest
        .fireRequest(process.env.BERGAMOT_REST_API_OUTBOUND_URL)
        .then(this._chunkCompleted.bind(this), this._chunkFailed.bind(this));

      currentIndex = request.lastIndex;
      if (request.finished) {
        break;
      }
    }
  }

  /**
   * This function will generate data that is to be used for creating Nth
   * translation request based on the input params.
   *
   * @param startIndex  The index in the form control elements from where the
   *                    data should be generated.
   */
  _generateNextTranslationRequest(startIndex) {
    let currentDataSize = 0;
    let currentChunks = 0;
    let output = [];

    for (let i = startIndex; i < this._formControlElements.length; i++) {
      let formControlElement = this._formControlElements[i];
      let text = this._getFormControlElementValue(formControlElement);
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
      output.push([formControlElement, text]);
    }

    return {
      data: output,
      finished: true,
      lastIndex: 0,
    };
  }

  /**
   * Return the value of document's form control element.
   *
   * @param  formControlElement   An element respresenting Form Control
   */
  _getFormControlElementValue(formControlElement) {
    // ToDo: Change this once outbound translation use case gets well defined.
    // Values for only the <input> elements (of type "text") and <textarea>
    // elements are returned right now
    if (formControlElement.type.toUpperCase() == "TEXT" ||
        formControlElement.type.toUpperCase() == "TEXTAREA") {
      return formControlElement.value;
    }
  }

  /**
   * Function called when a request sent to the server completed successfully.
   * This function handles calling the function to parse the result.
   *
   * @param   request   The BergamotRequest sent to the server.
   */
  _chunkCompleted(bergamotRequest) {
    if (this._parseChunkResult(bergamotRequest)) {
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
   * not in an active state).
   *
   * @param   aError   [optional] The XHR object of the request that failed.
   */
  _chunkFailed(aError) {
    this._checkIfFinished();
  }

  /**
   * Function called when a request sent to the server has completed.
   */
  _checkIfFinished() {
    // Check if all pending requests have been translated.
    if (--this._pendingRequests == 0) {
      if (this._partialSuccess) {
        // ToDo: Return resolved Promise if at least one chunk was successful
      } else {
        // ToDo: Return rejected Promise otherwise
      }
    }
  }

  /**
   * This function parses the result returned by Bergamot's Http API for
   * the translated text in target language.
   *
   * @param   request      The request sent to the server.
   * @returns boolean      True if parsing of this chunk was successful.
   */
  _parseChunkResult(bergamotRequest) {
    let results;
    try {
      let response = bergamotRequest.networkRequest.response;
      results = JSON.parse(response);
    } catch (e) {
      return false;
    }
    let len = results.text.length;
    if (len != bergamotRequest.translationData.length) {
      // This should never happen, but if the service returns a different number
      // of items (from the number of items submitted), we can't use this chunk
      // because all items would be paired incorrectly.
      return false;
    }

    let error = false;
    for (let i = 0; i < len; i++) {
      try {
        // The 'text' field of results is a list of 'Paragraph'. Parse each
        // 'Paragraph' entry for the translated text.
        let translation = this._parseTranslatedTextFromParagraph(results.text[i]);
        let formControlElement = bergamotRequest.translationData[i][0];
        if (translation.includes("&")) {
          // If translation contains HTML entities, we convert it to plain text.
          // ToDo: Change this once outbound translation use case gets well defined.
          // ToDo: Add message-system logging later
          let doc = new DOMParser().parseFromString(translation, "text/html");
          translation = doc.body.firstChild.nodeValue;
        }

        // ToDo: Change this once outbound translation use case gets well defined.
        // This step is done in order to demonstrate through GUI that text entered
        // by the user in the form has been translated in target language. This is
        formControlElement.value = translation;
      } catch (e) {
        error = true;
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
    // ToDo: Add message-system logging later in this method
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
}
