/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { config } from "../../../config";
import { TranslationApiClient } from "../../../content-scripts/dom-translation-content-script.js/dom-translators/BaseDomTranslator";
import { TranslationResults } from "../lib/BergamotTranslatorAPI";

const MS_IN_A_MINUTE = 60 * 1000;

// https://stackoverflow.com/a/57888548/682317
const fetchWithTimeout = (url, ms, options: any = {}): Promise<Response> => {
  const controller = new AbortController();
  const promise = fetch(url, { signal: controller.signal, ...options });
  const timeout = setTimeout(() => controller.abort(), ms);
  return promise.finally(() => clearTimeout(timeout));
};

interface BergamotRestApiTranslationRequestPayload {
  options?: {
    inputFormat?: "sentence" | "paragraph" | "wrappedText";
    nBest?: number;
    returnWordAlignment?: boolean;
    returnSentenceScore?: boolean;
    returnSoftAlignment?: boolean;
    returnQualityEstimate?: boolean;
    returnWordScores?: boolean;
    returnTokenization?: boolean;
    returnOriginal?: boolean;
  };
  text: string | string[]; // Also possible but not recommended: <object>
}

/**
 * The API response format can be referred here: https://github.com/browsermt/mts
 */
interface BergamotRestApiTranslateRequestResult {
  text: BergamotRestApiParagraph[];
}

// Each 'Paragraph' contains a list of 'Sentence translation' list.
// There should be only 1 such list.
interface BergamotRestApiParagraph {
  0: BergamotRestApiSentence[];
}

// 'Sentence translation' list contains 'Sentence translation' objects
// where each object contains all the information related to translation
// of each sentence in source language.
interface BergamotRestApiSentence {
  nBest: {
    translation: string;
    sentenceScore?: string;
  }[];
}

export class BergamotRestApiClient implements TranslationApiClient {
  /**
   * Timeout after which we consider a ping submission failed.
   */
  private requestTimeoutMs: number = 1.5 * MS_IN_A_MINUTE;

  constructor(requestTimeoutMs: number = null) {
    if (requestTimeoutMs) {
      this.requestTimeoutMs = requestTimeoutMs;
    }
  }

  /**
   * See https://github.com/browsermt/mts/wiki/BergamotAPI
   */
  private composeSubmitRequestPath = () => {
    return `/api/bergamot/v1`;
  };

  private composeUrl = () => {
    return `${config.bergamotRestApiUrl}${this.composeSubmitRequestPath()}`;
  };

  public sendTranslationRequest = async (
    texts: string[],
    _from: string,
    _to: string,
  ): Promise<TranslationResults> => {
    const payload: BergamotRestApiTranslationRequestPayload = {
      text: texts,
      options: {
        // "inputFormat": "wrappedText",
        // "returnWordAlignment": true,
        returnSentenceScore: true,
        // "returnSoftAlignment": true,
        // "returnQualityEstimate": true,
        // "returnWordScores": true,
        // "returnTokenization": true,
        // "returnOriginal": true,
      },
    };

    const dataResponse = await fetchWithTimeout(
      this.composeUrl(),
      this.requestTimeoutMs,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json; charset=UTF-8",
        },
        body: JSON.stringify(payload),
      },
    ).catch(async error => {
      return Promise.reject(error);
    });

    if (!dataResponse.ok) {
      throw new Error("Data response failed");
    }
    const parsedResponse: BergamotRestApiTranslateRequestResult = await dataResponse.json();
    // console.log({ parsedResponse });

    const originalTexts = texts;
    const translatedTexts = [];
    const qeAnnotatedTranslatedTexts = [];

    parsedResponse.text.map((paragraph: BergamotRestApiParagraph) => {
      const translationObjects = getBestTranslationObjectsOfEachSentenceInBergamotRestApiParagraph(
        paragraph,
      );

      // TODO: Currently the rest server doesn't retain the leading/trailing
      // whitespace information of sentences. It is a bug on rest server side.
      // Once it is fixed there, we need to stop appending whitespaces.
      const separator = " ";

      // Join sentence translations
      const translatedPlainTextString = translationObjects
        .map(({ translation }) => translation)
        .join(separator);

      translatedTexts.push(translatedPlainTextString);

      // Generate QE Annotated HTML for each sentence
      const qeAnnotatedSentenceHTMLs = translationObjects.map(
        ({ translation, sentenceScore }) =>
          generateQEAnnotatedHTML(translation, sentenceScore),
      );
      const qeAnnotatedTranslatedMarkup = qeAnnotatedSentenceHTMLs.join(
        separator,
      );
      qeAnnotatedTranslatedTexts.push(qeAnnotatedTranslatedMarkup);
    });

    return {
      originalTexts,
      translatedTexts,
      qeAnnotatedTranslatedTexts,
    };
  };
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
