/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { browser, Runtime } from "webextension-polyfill-ts";
import Port = Runtime.Port;
import { nanoid } from "nanoid";
import { captureExceptionWithExtras } from "./ErrorReporting";
import { TranslationResults } from "../background-scripts/background.js/lib/BergamotTranslatorAPI";
import { TranslationRequestUpdate } from "../background-scripts/background.js/contentScriptBergamotApiClientPortListener";
import { TranslationRequestProgressCallback } from "../content-scripts/dom-translation-content-script.js/dom-translators/BaseDomTranslator";

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
    translationRequestProgressCallback: TranslationRequestProgressCallback,
  ): Promise<TranslationResults> {
    return new Promise((resolve, reject) => {
      const requestId = nanoid();
      const resultsMessageListener = async (m: {
        translationRequestUpdate?: TranslationRequestUpdate;
      }) => {
        if (m.translationRequestUpdate) {
          const { translationRequestUpdate } = m;
          if (translationRequestUpdate.requestId !== requestId) {
            return;
          }
          // console.debug("ContentScriptBergamotApiClient received translationRequestUpdate", { translationRequestUpdate });
          const {
            results,
            translationRequestProgress,
          } = translationRequestUpdate;
          if (translationRequestProgress) {
            translationRequestProgressCallback(translationRequestProgress);
            return;
          }
          if (results) {
            this.backgroundContextPort.onMessage.removeListener(
              resultsMessageListener,
            );
            resolve(translationRequestUpdate.results);
            return;
          }
        }
        captureExceptionWithExtras(new Error("Unexpected message structure"), {
          m,
        });
        console.error("Unexpected message structure", { m });
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
