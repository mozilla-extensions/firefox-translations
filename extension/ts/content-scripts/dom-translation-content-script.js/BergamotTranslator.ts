/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

import { BergamotTranslationRequest } from "./BergamotTranslationRequest";
import { ContentScriptBergamotApiClient } from "../../shared-resources/ContentScriptBergamotApiClient";
import {
  generateTranslationHtmlForItem,
  TranslationDocument,
} from "./TranslationDocument";
import { TranslationItem } from "./TranslationItem";
import {
  BergamotRestApiParagraph,
  BergamotRestApiTranslateRequestResult,
} from "../../background-scripts/background.js/lib/BergamotApiClient";

export type TranslationRequestData = [TranslationItem, string][];
export interface TranslationRequest {
  data: TranslationRequestData;
  finished: boolean;
  lastIndex: number;
}

// The maximum amount of net data allowed per request on Bergamot's API.
export const MAX_REQUEST_DATA = 5000; // XXX This is the Bing value

// The maximum number of chunks allowed to be translated in a single
// request.
export const MAX_REQUEST_CHUNKS = 128; // TODO: Determine the real value for this

// Self-imposed limit of 1920 requests. This means that a page that would need
// to be broken in more than 1920 requests won't be fully translated.
// The maximum amount of data that we will translate for a single page
// is MAX_REQUESTS * MAX_REQUEST_DATA.
export const MAX_REQUESTS = 15;

/**
 * Translates a webpage using Bergamot's Translation backend.
 */
export class BergamotTranslator {
  private readonly translationDocument: TranslationDocument;
  private readonly sourceLanguage: string;
  private readonly targetLanguage: string;
  private pendingRequests: number;
  private partialSuccess: boolean;
  private translatedCharacterCount: number;
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
    this.translationDocument = translationDocument;
    this.sourceLanguage = sourceLanguage;
    this.targetLanguage = targetLanguage;
    this.pendingRequests = 0;
    this.partialSuccess = false;
    this.translatedCharacterCount = 0;
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

    // Let's split the document into various requests to be sent to
    // Bergamot's Translation API.
    for (let requestCount = 0; requestCount < MAX_REQUESTS; requestCount++) {
      // Determine the data for the next request.
      let requestChunk = this.generateNextTranslationRequestChunk(currentIndex);

      // Create a real request for the server and add it to the pending requests list.
      const translationData: TranslationRequestData = preprocessBergamotTranslationRequestData(
        requestChunk.data,
      );
      let bergamotRequest = new BergamotTranslationRequest(
        translationData,
        this.sourceLanguage,
        this.targetLanguage,
      );
      this.pendingRequests++;

      const results = await bergamotRequest
        .fireRequest(this.bergamotApiClient)
        .catch(err => {
          console.error("BergamotTranslator fireRequest error", err);
          this.checkIfFinished();
        });

      this.chunkCompleted(results, bergamotRequest);
      if (this.checkIfFinished()) {
        return {
          characterCount: this.translatedCharacterCount,
        };
      }

      currentIndex = requestChunk.lastIndex;
      if (requestChunk.finished) {
        break;
      }
    }

    throw new Error(
      "BergamotTranslator ended up processing all translation requests without detecting that the translation finished",
    );
  }

  /**
   * Function called when a request sent to the server completed successfully.
   * This function handles calling the function to parse the result and the
   * function to resolve the promise returned by the public `translate()`
   * method when there's no pending request left.
   */
  private chunkCompleted(results, bergamotRequest: BergamotTranslationRequest) {
    if (parseChunkResult(results, bergamotRequest)) {
      this.partialSuccess = true;
      // Count the number of characters successfully translated.
      this.translatedCharacterCount += bergamotRequest.characterCount;
    }
  }

  /**
   * Function called when a request sent to the server has completed.
   */
  private checkIfFinished() {
    // Check if all pending requests have been
    // completed and then resolves the promise.
    // If at least one chunk was successful, the
    // promise will be resolved positively which will
    // display the "Success" state for the infobar. Otherwise,
    // the "Error" state will appear.
    if (--this.pendingRequests === 0) {
      if (this.partialSuccess) {
        return true;
      } else {
        throw new Error(
          "BergamotTranslator ended up with no more pending requests and zero successful requests",
        );
      }
    }
    return false;
  }

  /**
   * This function will determine what is the data to be used for
   * the Nth request we are generating, based on the input params.
   *
   * @param startIndex What is the index, in the translation roots list, that the
   *                   chunk should start.
   */
  private generateNextTranslationRequestChunk(
    startIndex: number,
  ): TranslationRequest {
    let currentDataSize = 0;
    let currentChunks = 0;
    let output = [];
    let translationRootsList = this.translationDocument.translationRoots;

    for (let i = startIndex; i < translationRootsList.length; i++) {
      let translationRoot = translationRootsList[i];
      let text = this.translationDocument.generateTextForItem(translationRoot);
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
      output.push([translationRoot, text]);
    }

    return {
      data: output,
      finished: true,
      lastIndex: 0,
    };
  }
}

function preprocessBergamotTranslationRequestData(
  translationRequestData: TranslationRequestData,
): TranslationRequestData {
  return translationRequestData.map(([translationRoot, text]) => {
    // The next line is a hack to delay dealing with the problem of
    //               <b>Do not</b> touch.
    // being translated to something like
    //           <b>Ne</b> touche <b>pas</b>.
    // The server can only deal with pure text. The client has no
    // knowledge of semantics. So it can not remove the tags and
    // replace them as it doesn't know how to insert them in to
    // the translated result. So as a hack we just remove the
    // tags and hope the formatting is not too bad.
    text = text.replace(/<[^>]*>?/gm, " ");
    return [translationRoot, text];
  });
}

/**
 * This function parses the result returned by Bergamot's Http API for
 * the translated text in target language.
 *
 * @returns boolean      True if parsing of this chunk was successful.
 */
function parseChunkResult(
  results: BergamotRestApiTranslateRequestResult,
  bergamotRequest: BergamotTranslationRequest,
) {
  let len = results.text.length;
  if (len !== bergamotRequest.translationRequestData.length) {
    // This should never happen, but if the service returns a different number
    // of items (from the number of items submitted), we can't use this chunk
    // because all items would be paired incorrectly.
    return false;
  }

  let error = false;
  for (let i = 0; i < len; i++) {
    try {
      const translationRoot: TranslationItem =
        bergamotRequest.translationRequestData[i][0];
      // The 'text' field of results is a list of 'Paragraph'. Parse each 'Paragraph' entry
      const paragraph = results.text[i];
      const {
        translation,
        qeAnnotatedTranslation,
      } = preprocessBergamotTranslationResult(paragraph, translationRoot);
      translationRoot.parseTranslationResult(translation);
      translationRoot.parseQeAnnotatedTranslationResult(qeAnnotatedTranslation);
    } catch (e) {
      error = true;
      console.error("Translation error: ", e);
    }
  }

  return !error;
}

function preprocessBergamotTranslationResult(
  paragraph: BergamotRestApiParagraph,
  translationRoot: TranslationItem,
) {
  const translationObjects = getBestTranslationObjectsOfEachSentenceInBergamotRestApiParagraph(
    paragraph,
  );

  // TODO: Currently the rest server doesn't retain the leading/trailing
  // whitespace information of sentences. It is a bug on rest server side.
  // Once it is fixed there, we need to stop appending whitespaces.
  const separator = " ";

  // Join sentence translations
  let translationContent = translationObjects
    .map(({ translation }) => translation)
    .join(separator);

  // If translation contains HTML entities, we need to convert them.
  // It is because simple roots expect a plain text result.
  if (
    translationRoot.isSimleTranslationRoot &&
    translationContent.match(/&([a-z0-9]+|#[0-9]{1,6}|#x[0-9a-f]{1,6});/gi)
  ) {
    let doc = new DOMParser().parseFromString(translationContent, "text/html");
    translationContent = doc.body.firstChild.nodeValue;
  }

  // Show original rather than an empty or obviously invalid translation
  if (["", "*", "* ()"].includes(translationContent)) {
    translationContent = translationRoot.original[0];
  }

  // Generate QE Annotated HTML for each sentence
  const qeAnnotatedSentenceHTMLs = translationObjects.map(
    ({ translation, sentenceScore }) =>
      generateQEAnnotatedHTML(translation, sentenceScore),
  );
  const qeAnnotatedTranslationContent = qeAnnotatedSentenceHTMLs.join(
    separator,
  );

  let translation = translationContent;
  if (!translationRoot.isSimleTranslationRoot) {
    // Translations of non-simple translation roots are expected to be return in the format of
    // <div id="n1">Hello <b id="n2">World</b> of Mozilla.</div>
    translation = generateTranslationHtmlForItem(
      translationRoot,
      translationContent,
    );
  }

  const qeAnnotatedTranslation = generateTranslationHtmlForItem(
    translationRoot,
    qeAnnotatedTranslationContent,
  );

  return { translation, qeAnnotatedTranslation };
}

/**
 * This function parses 'Paragraph' entity of the response for the
 * the best translations and returns them
 */
function getBestTranslationObjectsOfEachSentenceInBergamotRestApiParagraph(
  paragraph: BergamotRestApiParagraph,
) {
  let bestTranslations = [];
  paragraph[0].forEach(sentenceTranslationList => {
    // Depending on the request, there might be multiple 'best translations'.
    // We are fetching the best one (present in 'translation' field).
    const bestTranslation = sentenceTranslationList.nBest[0];
    bestTranslations = [...bestTranslations, bestTranslation];
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
