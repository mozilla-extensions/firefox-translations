/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

var EXPORTED_SYMBOLS = ["BergamotTranslator"];

const { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
const { PromiseUtils } = ChromeUtils.import(
  "resource://gre/modules/PromiseUtils.jsm"
);
const { httpRequest } = ChromeUtils.import("resource://gre/modules/Http.jsm");
const { XPCOMUtils } = ChromeUtils.import(
  "resource://gre/modules/XPCOMUtils.jsm"
);
XPCOMUtils.defineLazyGlobalGetters(this, ["DOMParser"]);

// The maximum amount of net data allowed per request on Bergamot's API.
const MAX_REQUEST_DATA = 5000; // XXX This is the Bing value

// The maximum number of chunks allowed to be translated in a single
// request.
const MAX_REQUEST_CHUNKS = 128; // TODO: Determine the real value for this

// Self-imposed limit of 1920 requests. This means that a page that would need
// to be broken in more than 1920 requests won't be fully translated.
// The maximum amount of data that we will translate for a single page
// is MAX_REQUESTS * MAX_REQUEST_DATA.
const MAX_REQUESTS = 15;

//const URL = "http://demo.statmt.org/api/bergamot/v1";
const URL_INBOUND = "http://localhost:8787/api/bergamot/v1";
const URL_OUTBOUND = "http://localhost:8788/api/bergamot/v1";

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
var BergamotTranslator = function(
  translationDocument,
  sourceLanguage,
  targetLanguage
) {
  this.translationDocument = translationDocument;
  this.sourceLanguage = sourceLanguage;
  this.targetLanguage = targetLanguage;
  this._pendingRequests = 0;
  this._partialSuccess = false;
  this._translatedCharacterCount = 0;
  this._initBergamotOutboundTranslator();
};

this.BergamotTranslator.prototype = {
  /**
   * Instantiate BergamotOutboundTranslator object and add listener for all "submit"
   * events on the document.
   */
  _initBergamotOutboundTranslator() {
    this._outboundTranslator = new BergamotOutboundTranslator(this.translationDocument);
    this._outboundTranslator.listenSubmitEvents();
  },

  /**
   * Performs the translation, splitting the document into several chunks
   * respecting the data limits of the API.
   *
   * @returns {Promise}          A promise that will resolve when the translation
   *                             task is finished.
   */
  async translate() {
    let currentIndex = 0;
    this._onFinishedDeferred = PromiseUtils.defer();

    // Let's split the document into various requests to be sent to
    // Bergamot's Translation API.
    for (let requestCount = 0; requestCount < MAX_REQUESTS; requestCount++) {
      // Generating the text for each request can be expensive, so
      // let's take the opportunity of the chunkification process to
      // allow for the event loop to attend other pending events
      // before we continue.
      await new Promise(resolve => Services.tm.dispatchToMainThread(resolve));

      // Determine the data for the next request.
      let request = this._generateNextTranslationRequest(currentIndex);

      // Create a real request to the server, and put it on the
      // pending requests list.
      let bergamotRequest = new BergamotRequest(
        request.data,
        this.sourceLanguage,
        this.targetLanguage
      );
      this._pendingRequests++;
      bergamotRequest
        .fireRequest(URL_INBOUND)
        .then(this._chunkCompleted.bind(this), this._chunkFailed.bind(this));

      currentIndex = request.lastIndex;
      if (request.finished) {
        break;
      }
    }

    return this._onFinishedDeferred.promise;
  },

  /**
   * Function called when a request sent to the server completed successfully.
   * This function handles calling the function to parse the result and the
   * function to resolve the promise returned by the public `translate()`
   * method when there's no pending request left.
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
  },

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
  },

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
  },

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
        // 'Paragraph' entry and generate QE annotated HTML of the translated text
        let translation = this._generateQEAnnotatedHTMLFromParagraph(results.text[i]);
        let root = bergamotRequest.translationData[i][0];
        if (root.isSimpleRoot && translation.includes("&")) {
          // If translation contains HTML entities, we need to convert them.
          // It is because simple roots expect a plain text result.
          // ToDo: Add message-system logging later
          let doc = new DOMParser().parseFromString(translation, "text/html");
          translation = doc.body.firstChild.nodeValue;
        }

        // No root (TranslationItem) is simple anymore because now each root will store
        // DOM node (having QE annotations) in it's "translation" property. This needs
        // to be done because translated text with QE annotations have to be shown inplace
        // (i.e. on the same webpage replacing the original text) for the demo. Therefore,
        // setting isSimpleRoot to false. Once this use case changes, it can be reverted back.
        root.isSimpleRoot = false;
        root.parseResult(translation);
      } catch (e) {
        error = true;
      }
    }

    return !error;
  },

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
      qeAnnotatedParagraphHTML += this._generateQEAnnotatedHTML(translation, sentenceScore);
    }

    // Wrap the result with identifier "QE-ANNOTATED" to make it easy to switch
    // b/w "original" and "translation" in TranslationDocument.swapTextForItem() method
    return `<div><span id=QE-ANNOTATED>${qeAnnotatedParagraphHTML}</span></div>`
  },

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
    let color = "";
    if (score >= -0.20) {
      color = "green";
    }
    else if (score >= -0.50 && score < -0.20) {
      color = "black";
    }
    else if (score >= -0.80 && score < -0.50) {
      color = "mediumvioletred";
    }
    else {
      color = "red";
    }
    return (`<span style="color:${color}">${translation}</span>`);
  },

  /**
   * This function will determine what is the data to be used for
   * the Nth request we are generating, based on the input params.
   *
   * @param startIndex What is the index, in the roots list, that the
   *                   chunk should start.
   */
  _generateNextTranslationRequest(startIndex) {
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
  },
};

/**
 * Represents a request (for 1 chunk) sent off to Bergamot's service.
 *
 * @params translationData  The data to be used for this translation,
 *                          generated by the generateNextTranslationRequest...
 *                          function.
 * @param sourceLanguage    The source language of the document.
 * @param targetLanguage    The target language for the translation.
 *
 */
function BergamotRequest(translationData, sourceLanguage, targetLanguage) {
  this.translationData = translationData;
  this.sourceLanguage = sourceLanguage;
  this.targetLanguage = targetLanguage;
  this.characterCount = 0;
}

BergamotRequest.prototype = {
  /**
   * Initiates the request
   */
  fireRequest(url) {
    // Prepare the headers
    let headers = [
      ["Content-Type", "application/json"],
    ]

    // Prepare the post data
    let postData = {
      "text"  : [],
      "options" : {"returnSentenceScore" : true}
    };

    // Prepare the content of the post
    for (let [, text] of this.translationData) {
      // The next line is a hack to delay dealing with the problem of
      //               <b>Do not</b> touch.
      // being translated to something like
      //           <b>Ne</b> touche <b>pas</b>.
      // The server can only deal with pure text. The client has no
      // knowledge of semantics. So it can not remove the tags and
      // replace them as it doesn't know how to insert them in to
      // the translated result. So as a hack we just remove the
      // tags and hope the formatting is not too bad.
      text = text.replace(/<[^>]*>?/gm, ' ');
      postData["text"].push(text);
      this.characterCount += text.length;
    }

    // Convert the post to a string
    postData = JSON.stringify(postData);

    // Set up request options.
    return new Promise((resolve, reject) => {
      let options = {
        onLoad: (responseText, xhr) => {
          resolve(this);
        },
        onError(e, responseText, xhr) {
          reject(xhr);
        },
        postData,
        headers,
      };

      // Fire the request.
      this.networkRequest = httpRequest(url, options);
    });
  },
};

/**
 * Outbound translator for a webpage using Bergamot's Translation API.
 * Currently, it translates the textual content of the forms of an
 * html document whenever a submit event is dispatched on them.
 *
 * @param translationDocument  The TranslationDocument object that
 *                             represents the webpage.
 */
function BergamotOutboundTranslator(translationDocument) {
  this._translationDocument = translationDocument;
  this._pendingRequests = 0;
  this._partialSuccess = false;
  this._translatedCharacterCount = 0;
}

BergamotOutboundTranslator.prototype = {
  /**
   * Add listener for 'submit' events on all the forms of the document
   *
   */
  listenSubmitEvents() {
    let ownerDocument = this._translationDocument.getOwnerDocument();
    for (let form of ownerDocument.forms) {
      form.addEventListener('submit', this);
    }
  },

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
  },

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
        .fireRequest(URL_OUTBOUND)
        .then(this._chunkCompleted.bind(this), this._chunkFailed.bind(this));

      currentIndex = request.lastIndex;
      if (request.finished) {
        break;
      }
    }
  },

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
  },

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
  },

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
  },

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
  },

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
  },

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
  },

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
  },
};
