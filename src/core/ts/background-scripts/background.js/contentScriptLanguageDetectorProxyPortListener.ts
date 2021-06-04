/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { LanguageDetector } from "./lib/LanguageDetector";
import { Runtime } from "webextension-polyfill-ts";
import Port = Runtime.Port;
import { browserWithExperimentAPIs } from "../../../../firefox-infobar-ui/ts/background-scripts/background.js/browserWithExperimentAPIs";

export const contentScriptLanguageDetectorProxyPortListener = (port: Port) => {
  if (port.name !== "port-from-content-script-language-detector-proxy") {
    return;
  }
  port.onMessage.addListener(async function(m: {
    str: string;
    requestId: string;
  }) {
    // console.debug("Message from content-script-language-detector-proxy:", { m });
    const { str, requestId } = m;
    // Either use the Firefox experimental web extension API or the bundled WASM-based language detection
    let results;
    if (process.env.UI === "firefox-infobar-ui") {
      results = await browserWithExperimentAPIs.experiments.languageDetector.detectLanguage(
        str,
      );
    } else {
      results = await LanguageDetector.detectLanguage({ text: str });
    }
    // console.debug({ results });
    try {
      port.postMessage({
        languageDetectorResults: {
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
