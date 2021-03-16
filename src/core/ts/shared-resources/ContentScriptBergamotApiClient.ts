/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { browser, Runtime } from "webextension-polyfill-ts";
import Port = Runtime.Port;
import { nanoid } from "nanoid";
import { captureExceptionWithExtras } from "./ErrorReporting";
import { TranslationResults } from "../background-scripts/background.js/lib/BergamotTranslatorAPI";

export class ContentScriptBergamotApiClient {
  private backgroundContextPort: Port;
  constructor() {
    // console.debug("ContentScriptBergamotApiClient: Connecting to the background script");
    this.backgroundContextPort = browser.runtime.connect(browser.runtime.id, {
      name: "port-from-content-script-bergamot-api-client",
    });
  }
  async sendTranslationRequest(
    texts: string[],
    from: string,
    to: string,
  ): Promise<TranslationResults> {
    return new Promise((resolve, reject) => {
      const requestId = nanoid();
      const resultsMessageListener = async (m: {
        translationRequestResults?: {
          requestId: string;
          results: TranslationResults;
        };
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
          return;
        }
        captureExceptionWithExtras(new Error("Unexpected message"), { m });
        console.error("Unexpected message", { m });
        reject({ m });
      };
      this.backgroundContextPort.onMessage.addListener(resultsMessageListener);
      // console.debug("ContentScriptBergamotApiClient: Sending translation request", {texts});
      this.backgroundContextPort.postMessage({
        texts,
        from,
        to,
        requestId,
      });
    });
  }
}
