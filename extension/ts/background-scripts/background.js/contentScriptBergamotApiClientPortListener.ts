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
    requestId: string;
  }) {
    // console.debug("Message from content-script-bergamot-api-client:", {m});
    const { texts, requestId } = m;
    /*
    const results: BergamotRestApiTranslateRequestResult = await bergamotApiClient.sendTranslationRequest(
      texts,
    );
     */
    const translatorApiResults: TranslationResults = await BergamotTranslatorAPI.translate(
      texts,
      "_",
      "_",
    );
    const paragraphs: BergamotRestApiParagraph[] = translatorApiResults.translatedTexts.map(
      text => {
        const sentenceList: BergamotRestApiSentence[] = [
          { nBest: [{ translation: text }] },
        ];
        return {
          0: sentenceList,
        };
      },
    );
    const results: BergamotRestApiTranslateRequestResult = {
      text: paragraphs,
    };
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
