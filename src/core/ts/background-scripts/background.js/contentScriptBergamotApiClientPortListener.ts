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
          console.log("TODO", { translationRequestProgress });
        },
      );
      // console.log({ results });
      port.postMessage({
        translationRequestResults: {
          results,
          requestId,
        },
      });
    } catch (err) {
      if (err.message === "Attempt to postMessage on disconnected port") {
        console.warn(
          "Attempt to postMessage on disconnected port, but it is ok",
          err,
        );
      } else {
        throw err;
      }
    }
  });
};
