/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {
  BergamotApiClient,
  BergamotRestApiParagraph,
  BergamotRestApiSentence,
  BergamotRestApiTranslateRequestResult,
} from "./lib/BergamotApiClient";
import { Runtime } from "webextension-polyfill-ts";
import Port = Runtime.Port;
import {
  BergamotTranslatorAPI,
  TranslationResults,
} from "./lib/BergamotTranslatorAPI";
const bergamotApiClient = new BergamotApiClient();

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
    const results: BergamotRestApiTranslateRequestResult = await bergamotApiClient.sendTranslationRequest(
      texts,
      from,
      to,
    );
    // console.log({ results });
    try {
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
