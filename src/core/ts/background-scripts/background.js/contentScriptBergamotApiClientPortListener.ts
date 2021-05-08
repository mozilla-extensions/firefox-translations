/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { BergamotWasmApiClient } from "./translation-api-clients/BergamotWasmApiClient";
import { BergamotRestApiClient } from "./translation-api-clients/BergamotRestApiClient";
import { Runtime } from "webextension-polyfill-ts";
import Port = Runtime.Port;
import { TranslationResults } from "./lib/BergamotTranslatorAPI";
import { config } from "../../config";
import { TranslationRequestProgress } from "../../content-scripts/dom-translation-content-script.js/dom-translators/BaseDomTranslator";

// Currently it is possible build variants of the extension that uses the REST API - eg for performance testing / research
const bergamotApiClient = config.useBergamotRestApi
  ? new BergamotRestApiClient()
  : new BergamotWasmApiClient();

export interface TranslationRequestUpdate {
  requestId: string;
  results?: TranslationResults;
  translationRequestProgress?: TranslationRequestProgress;
  error?: string;
}

export const contentScriptBergamotApiClientPortListener = (port: Port) => {
  if (port.name !== "port-from-content-script-bergamot-api-client") {
    return;
  }
  port.onMessage.addListener(async function(m: {
    texts: [];
    from: string;
    to: string;
    requestId: string;
  }) {
    // console.debug("Message from content-script-bergamot-api-client:", {m});
    const { texts, from, to, requestId } = m;
    try {
      const results: TranslationResults = await bergamotApiClient.sendTranslationRequest(
        texts,
        from,
        to,
        (translationRequestProgress: TranslationRequestProgress) => {
          const translationRequestUpdate: TranslationRequestUpdate = {
            translationRequestProgress,
            requestId,
          };
          port.postMessage({
            translationRequestUpdate,
          });
        },
      );
      // console.log({ results });
      const translationRequestUpdate: TranslationRequestUpdate = {
        results,
        requestId,
      };
      port.postMessage({
        translationRequestUpdate,
      });
    } catch (err) {
      if (err.message === "Attempt to postMessage on disconnected port") {
        console.warn(
          "Attempt to postMessage on disconnected port, but it is ok",
          err,
        );
      } else {
        console.info(
          `Caught exception/error in content script bergamot api client port listener:`,
          err,
        );
        // Make possibly unserializable errors serializable by only sending name, message and stack
        let communicatedError;
        if (err instanceof Error) {
          const { name, message, stack } = err;
          communicatedError = { name, message, stack };
        } else {
          communicatedError = err;
        }
        const translationRequestUpdate: TranslationRequestUpdate = {
          error: communicatedError,
          requestId,
        };
        port.postMessage({
          translationRequestUpdate,
        });
      }
    }
  });
};
