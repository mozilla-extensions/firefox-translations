/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {
  BergamotTranslatorAPI,
  ModelLoadedEventData,
  ModelWillLoadEventData,
  TranslationFinishedEventData,
  TranslationRequestQueuedEventData,
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
      requestId: undefined,
      initiationTimestamp: Date.now(),
      queued: false,
      modelLoadNecessary: undefined,
      modelLoading: false,
      modelLoaded: undefined,
      modelLoadWallTimeMs: undefined,
      translationFinished: false,
      translationWallTimeMs: undefined,
      errorOccurred: false,
    };

    try {
      const translationResults: TranslationResults = await BergamotTranslatorAPI.translate(
        texts,
        from,
        to,
        (
          translationRequestQueuedEventData: TranslationRequestQueuedEventData,
        ) => {
          translationRequestProgress.requestId =
            translationRequestQueuedEventData.requestId;
          translationRequestProgress.queued = true;
          translationRequestProgressCallback(
            Object.assign({}, translationRequestProgress),
          );
        },
        (_modelWillLoadEventData: ModelWillLoadEventData) => {
          translationRequestProgress.modelLoadNecessary = true;
          translationRequestProgress.modelLoading = true;
          translationRequestProgressCallback(
            Object.assign({}, translationRequestProgress),
          );
        },
        (modelLoadedEventData: ModelLoadedEventData) => {
          translationRequestProgress.modelLoading = false;
          translationRequestProgress.modelLoaded = true;
          translationRequestProgress.modelLoadWallTimeMs =
            modelLoadedEventData.loadModelResults.modelLoadWallTimeMs;
          translationRequestProgressCallback(
            Object.assign({}, translationRequestProgress),
          );
        },
        (translationFinishedEventData: TranslationFinishedEventData) => {
          translationRequestProgress.queued = false;
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
    } catch (error) {
      translationRequestProgress.queued = false;
      translationRequestProgress.translationFinished = false;
      translationRequestProgress.errorOccurred = true;
      translationRequestProgressCallback(
        Object.assign({}, translationRequestProgress),
      );
      throw error;
    }
  };
}
