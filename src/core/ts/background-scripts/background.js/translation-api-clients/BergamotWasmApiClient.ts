/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {
  BergamotTranslatorAPI,
  ModelLoadedEventData,
  TranslationFinishedEventData,
  TranslationResults,
} from "../lib/BergamotTranslatorAPI";
import {
  TranslationApiClient,
  TranslationRequestProgress,
  TranslationRequestProgressCallback,
} from "../../../content-scripts/dom-translation-content-script.js/dom-translators/BaseDomTranslator";

export class BergamotWasmApiClient implements TranslationApiClient {
  public sendTranslationRequest = async (
    texts: string | string[],
    from: string,
    to: string,
    translationRequestProgressCallback: TranslationRequestProgressCallback,
  ): Promise<TranslationResults> => {
    if (typeof texts === "string") {
      texts = [texts];
    }

    const translationRequestProgress: TranslationRequestProgress = {
      modelLoaded: undefined,
      modelLoadWallTimeMs: undefined,
      translationFinished: false,
      translationWallTimeMs: undefined,
    };

    const translationResults = await BergamotTranslatorAPI.translate(
      texts,
      from,
      to,
      (modelLoadedEventData: ModelLoadedEventData) => {
        translationRequestProgress.modelLoaded = true;
        translationRequestProgress.modelLoadWallTimeMs =
          modelLoadedEventData.loadModelResults.modelLoadWallTimeMs;
        translationRequestProgressCallback(
          Object.assign({}, translationRequestProgress),
        );
      },
      (translationFinishedEventData: TranslationFinishedEventData) => {
        translationRequestProgress.translationFinished = true;
        translationRequestProgress.translationWallTimeMs =
          translationFinishedEventData.translationWallTimeMs;
        translationRequestProgressCallback(
          Object.assign({}, translationRequestProgress),
        );
      },
    );
    console.log({ translationResults });
    return translationResults;
  };
}
