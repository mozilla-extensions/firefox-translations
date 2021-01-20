import { LanguageDetector } from "./lib/LanguageDetector";
import { Runtime } from "webextension-polyfill-ts";
import Port = Runtime.Port;

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
    const results = await LanguageDetector.detectLanguage({ text: str });
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
