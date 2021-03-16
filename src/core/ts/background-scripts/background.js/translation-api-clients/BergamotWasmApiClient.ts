/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {
  BergamotTranslatorAPI,
  TranslationResults,
} from "../lib/BergamotTranslatorAPI";
import { TranslationApiClient } from "../../../content-scripts/dom-translation-content-script.js/dom-translators/BaseDomTranslator";
import {
  BergamotRestApiParagraph,
  BergamotRestApiSentence,
  BergamotRestApiTranslateRequestResult,
} from "./BergamotRestApiClient";

export class BergamotWasmApiClient implements TranslationApiClient {
  public sendTranslationRequest = async (
    texts: string | string[],
    from: string,
    to: string,
  ): Promise<BergamotRestApiTranslateRequestResult> => {
    if (typeof texts === "string") {
      texts = [texts];
    }
    const translatorApiResults: TranslationResults = await BergamotTranslatorAPI.translate(
      texts,
      from,
      to,
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
    return results;
  };
}
