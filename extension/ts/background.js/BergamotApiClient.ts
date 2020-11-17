import { config } from "../config";

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
  ): Promise<string> => {
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
