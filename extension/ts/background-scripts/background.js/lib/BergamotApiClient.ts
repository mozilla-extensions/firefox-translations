/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { config } from "../../../config";

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
export interface BergamotRestApiTranslateRequestResult {
  text: BergamotRestApiParagraph[];
}

// Each 'Paragraph' contains a list of 'Sentence translation' list.
// There should be only 1 such list.
export interface BergamotRestApiParagraph {
  0: BergamotRestApiSentence[];
}

// 'Sentence translation' list contains 'Sentence translation' objects
// where each object contains all the information related to translation
// of each sentence in source language.
export interface BergamotRestApiSentence {
  nBest: {
    translation: string;
    sentenceScore?: string;
  }[];
}

export class BergamotApiClient {
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
    texts: string | string[],
  ): Promise<BergamotRestApiTranslateRequestResult> => {
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
    const parsedResponse = await dataResponse.json();
    // console.log({ parsedResponse });
    return parsedResponse;
  };
}
