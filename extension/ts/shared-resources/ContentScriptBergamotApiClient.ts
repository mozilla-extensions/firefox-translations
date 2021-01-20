import { browser, Runtime } from "webextension-polyfill-ts";
import Port = Runtime.Port;
import { nanoid } from "nanoid";
import { captureExceptionWithExtras } from "./ErrorReporting";

export class ContentScriptBergamotApiClient {
  private backgroundContextPort: Port;
  constructor() {
    // console.debug("ContentScriptBergamotApiClient: Connecting to the background script");
    this.backgroundContextPort = browser.runtime.connect(browser.runtime.id, {
      name: "port-from-content-script-bergamot-api-client",
    });
  }
  async sendTranslationRequest(texts: string[]): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const requestId = nanoid();
      const resultsMessageListener = async (m: {
        translationRequestResults?: any;
      }) => {
        if (m.translationRequestResults) {
          const { translationRequestResults } = m;
          if (translationRequestResults.requestId !== requestId) {
            return;
          }
          // console.debug("ContentScriptBergamotApiClient received translationRequestResults", {translationRequestResults});
          this.backgroundContextPort.onMessage.removeListener(
            resultsMessageListener,
          );
          resolve(translationRequestResults.results);
          return null;
        }
        captureExceptionWithExtras(new Error("Unexpected message"), { m });
        console.error("Unexpected message", { m });
        reject({ m });
      };
      this.backgroundContextPort.onMessage.addListener(resultsMessageListener);
      // console.debug("ContentScriptBergamotApiClient: Sending translation request", {texts});
      this.backgroundContextPort.postMessage({
        texts,
        requestId,
      });
    });
  }
  parseNbestTranslationsFromResponse(parsedResponse) {
    return parsedResponse.text.map(translation =>
      translation[0] ? translation[0][0].nBest[0].translation : "",
    );
  }
}
