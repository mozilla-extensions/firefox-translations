import { BergamotApiClient } from "./lib/BergamotApiClient";
import { Runtime } from "webextension-polyfill-ts";
import Port = Runtime.Port;
const bergamotApiClient = new BergamotApiClient();

export const contentScriptBergamotApiClientPortListener = (port: Port) => {
  if (port.name !== "port-from-content-script-bergamot-api-client") {
    return;
  }
  port.onMessage.addListener(async function(m: {
    texts: [];
    requestId: string;
  }) {
    // console.debug("Message from content-script-bergamot-api-client:", {m});
    const { texts, requestId } = m;
    const results = await bergamotApiClient.sendTranslationRequest(texts);
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
