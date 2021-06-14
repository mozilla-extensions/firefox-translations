/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {
  applyPatches,
  getSnapshot,
  Model,
  model,
  modelAction,
  ModelPropsCreationData,
  Patch,
  prop_mapObject,
} from "mobx-keystone";
import { DocumentTranslationState } from "./DocumentTranslationState";
import { FragmentTranslationState } from "./FragmentTranslationState";
import { TranslateOwnTextTranslationState } from "./TranslateOwnTextTranslationState";
import { FrameInfo } from "../types/bergamot.types";
import { computed } from "mobx";
import { TabTranslationState } from "./TabTranslationState";
import { TranslationStatus } from "./BaseTranslationState";
import { ModelDownloadProgress } from "../../background-scripts/background.js/lib/BergamotTranslatorAPI";

export const documentTranslationStateMapKey = (frameInfo: FrameInfo) =>
  `${frameInfo.tabId}-${frameInfo.frameId}`;

export const translateOwnTextTranslationStateMapKey = (
  totts: TranslateOwnTextTranslationState,
) => `${totts.tabId}`;

@model("bergamotTranslate/ExtensionState")
export class ExtensionState extends Model({
  documentTranslationStates: prop_mapObject(
    () => new Map<string, DocumentTranslationState>(),
  ),
  fragmentTranslationStates: prop_mapObject(
    () => new Map<string, FragmentTranslationState>(),
  ),
  translateOwnTextTranslationStates: prop_mapObject(
    () => new Map<string, TranslateOwnTextTranslationState>(),
  ),
}) {
  @modelAction
  setDocumentTranslationState(
    documentTranslationState: DocumentTranslationState,
  ) {
    this.documentTranslationStates.set(
      documentTranslationStateMapKey(documentTranslationState),
      documentTranslationState,
    );
  }
  @modelAction
  patchDocumentTranslationStateByFrameInfo(
    frameInfo: FrameInfo,
    patches: Patch[],
  ) {
    const key = documentTranslationStateMapKey(frameInfo);
    const dts = this.documentTranslationStates.get(key);
    applyPatches(dts, patches);
    this.documentTranslationStates.set(key, dts);
  }
  @modelAction
  deleteDocumentTranslationStateByFrameInfo(frameInfo: FrameInfo) {
    this.documentTranslationStates.delete(
      documentTranslationStateMapKey(frameInfo),
    );
  }
  @modelAction
  setTranslateOwnTextTranslationState(
    translateOwnTextTranslationState: TranslateOwnTextTranslationState,
  ) {
    this.translateOwnTextTranslationStates.set(
      translateOwnTextTranslationStateMapKey(translateOwnTextTranslationState),
      translateOwnTextTranslationState,
    );
  }
  @modelAction
  deleteTranslateOwnTextTranslationState(
    translateOwnTextTranslationState: TranslateOwnTextTranslationState,
  ) {
    this.translateOwnTextTranslationStates.delete(
      translateOwnTextTranslationStateMapKey(translateOwnTextTranslationState),
    );
  }

  @computed
  /**
   * Groups document translation states by tab id
   */
  get documentTranslationStatesByTabId() {
    const map = new Map<number, DocumentTranslationState[]>();
    this.documentTranslationStates.forEach(
      (documentTranslationState: DocumentTranslationState) => {
        if (map.has(documentTranslationState.tabId)) {
          map.set(documentTranslationState.tabId, [
            ...map.get(documentTranslationState.tabId),
            documentTranslationState,
          ]);
        } else {
          map.set(documentTranslationState.tabId, [documentTranslationState]);
        }
      },
    );
    return map;
  }

  @computed
  /**
   * Merged tab-grouped document translation states into single tab translation states
   * that incorporates the states of all child frames' document translation states
   */
  get tabTranslationStates(): Map<number, TabTranslationState> {
    const map = new Map<number, TabTranslationState>();
    this.documentTranslationStatesByTabId.forEach(
      (documentTranslationStates: DocumentTranslationState[], tabId) => {
        const tabTopFrameState = documentTranslationStates.find(
          (dts: DocumentTranslationState) => dts.frameId === 0,
        );

        // If the top frame state is unavailable (may happen during the early stages of a
        // document translation state model instance), return an equally uninformative tab translation state
        if (!tabTopFrameState) {
          const tabTranslationState = new TabTranslationState({
            tabId,
            ...getSnapshot(documentTranslationStates[0]),
          });
          map.set(tabId, tabTranslationState);
          return;
        }

        // Use top frame state attributes to represent most of the tab state if available
        const {
          isVisible,
          displayQualityEstimation,
          translationRequested,
          cancellationRequested,
          detectedLanguageResults,
          translateFrom,
          translateTo,
          windowId,
          showOriginal,
          url,
        } = getSnapshot(tabTopFrameState);

        // For most translation-related attributes, we are only interested in the frames that existed when
        // the translation was requested, or else we will not get attributes that represent the state of the
        // web page at that time
        const translationRelevantDocumentTranslationStates = documentTranslationStates.filter(
          dts =>
            dts.translationRequested ||
            dts.translationStatus === TranslationStatus.TRANSLATING ||
            dts.translationFinished,
        );

        const isNotUndefined = val => val !== undefined;

        // Sum some state attributes
        const wordCount = translationRelevantDocumentTranslationStates
          .map(dts => dts.wordCount)
          .filter(isNotUndefined)
          .reduce((a, b) => a + b, 0);
        const wordCountVisible = translationRelevantDocumentTranslationStates
          .map(dts => dts.wordCountVisible)
          .filter(isNotUndefined)
          .reduce((a, b) => a + b, 0);
        const wordCountVisibleInViewport = translationRelevantDocumentTranslationStates
          .map(dts => dts.wordCountVisibleInViewport)
          .filter(isNotUndefined)
          .reduce((a, b) => a + b, 0);
        const totalModelLoadWallTimeMs = translationRelevantDocumentTranslationStates
          .map(dts => dts.totalModelLoadWallTimeMs)
          .filter(isNotUndefined)
          .reduce((a, b) => a + b, 0);
        const totalTranslationWallTimeMs = translationRelevantDocumentTranslationStates
          .map(dts => dts.totalTranslationWallTimeMs)
          .filter(isNotUndefined)
          .reduce((a, b) => a + b, 0);
        const totalTranslationEngineRequestCount = translationRelevantDocumentTranslationStates
          .map(dts => dts.totalTranslationEngineRequestCount)
          .filter(isNotUndefined)
          .reduce((a, b) => a + b, 0);
        const queuedTranslationEngineRequestCount = translationRelevantDocumentTranslationStates
          .map(dts => dts.queuedTranslationEngineRequestCount)
          .filter(isNotUndefined)
          .reduce((a, b) => a + b, 0);

        // Merge translation-progress-related booleans as per src/core/ts/shared-resources/state-management/DocumentTranslationStateCommunicator.ts
        const translationInitiationTimestamps = translationRelevantDocumentTranslationStates
          .map(
            (dts: DocumentTranslationState) =>
              dts.translationInitiationTimestamp,
          )
          .filter(isNotUndefined);
        const translationInitiationTimestamp = Math.min(
          ...translationInitiationTimestamps,
        );
        const modelLoadNecessary = !!translationRelevantDocumentTranslationStates.filter(
          (dts: DocumentTranslationState) => dts.modelLoadNecessary,
        ).length;
        const modelDownloadNecessary = !!translationRelevantDocumentTranslationStates.filter(
          (dts: DocumentTranslationState) => dts.modelDownloadNecessary,
        ).length;
        const modelDownloading = !!translationRelevantDocumentTranslationStates.filter(
          (dts: DocumentTranslationState) => dts.modelDownloading,
        ).length;
        const modelLoading = modelLoadNecessary
          ? !!translationRelevantDocumentTranslationStates.find(
              (dts: DocumentTranslationState) => dts.modelLoading,
            )
          : undefined;
        const modelLoaded = modelLoadNecessary
          ? !!translationRelevantDocumentTranslationStates.find(
              (dts: DocumentTranslationState) => !dts.modelLoaded,
            )
          : undefined;
        const translationFinished =
          translationRelevantDocumentTranslationStates.filter(
            (dts: DocumentTranslationState) => !dts.translationFinished,
          ).length === 0;

        // Merge model download progress as per src/core/ts/shared-resources/state-management/DocumentTranslationStateCommunicator.ts
        const emptyDownloadProgress: ModelDownloadProgress = {
          bytesDownloaded: 0,
          bytesToDownload: 0,
          startTs: undefined,
          durationMs: 0,
          endTs: undefined,
        };
        const modelDownloadProgress = translationRelevantDocumentTranslationStates
          .map((dts: DocumentTranslationState) =>
            getSnapshot(dts.modelDownloadProgress),
          )
          .filter((mdp: ModelDownloadProgress | undefined) => mdp)
          .reduce((a: ModelDownloadProgress, b: ModelDownloadProgress) => {
            const startTs =
              a.startTs && a.startTs <= b.startTs ? a.startTs : b.startTs;
            const endTs = a.endTs && a.endTs >= b.endTs ? a.endTs : b.endTs;
            return {
              bytesDownloaded: a.bytesDownloaded + b.bytesDownloaded,
              bytesToDownload: a.bytesToDownload + b.bytesToDownload,
              startTs,
              durationMs: endTs ? endTs - startTs : Date.now() - startTs,
              endTs,
            };
          }, emptyDownloadProgress);

        // Merge errorOccurred attributes
        const modelLoadErrorOccurred = !!translationRelevantDocumentTranslationStates.filter(
          (dts: DocumentTranslationState) => dts.modelLoadErrorOccurred,
        ).length;
        const modelDownloadErrorOccurred = !!translationRelevantDocumentTranslationStates.filter(
          (dts: DocumentTranslationState) => dts.modelDownloadErrorOccurred,
        ).length;
        const translationErrorOccurred = !!translationRelevantDocumentTranslationStates.filter(
          (dts: DocumentTranslationState) => dts.translationErrorOccurred,
        ).length;
        const otherErrorOccurred = !!translationRelevantDocumentTranslationStates.filter(
          (dts: DocumentTranslationState) => dts.otherErrorOccurred,
        ).length;

        // Special merging of translation status
        const anyFrameHasTranslationStatus = (
          translationStatus: TranslationStatus,
        ) =>
          documentTranslationStates.find(
            dts => dts.translationStatus === translationStatus,
          );
        const anyFrameThatExistedWhenTranslationWasRequestedHasTranslationStatus = (
          translationStatus: TranslationStatus,
        ) =>
          translationRelevantDocumentTranslationStates.find(
            dts => dts.translationStatus === translationStatus,
          );

        const tabTranslationStatus = (): TranslationStatus => {
          // Since we only use some attributes from the top frame, we should only consider
          // top frame when considering the related statuses
          if (
            [
              TranslationStatus.DETECTING_LANGUAGE,
              TranslationStatus.OFFER,
            ].includes(tabTopFrameState.translationStatus)
          ) {
            return tabTopFrameState.translationStatus;
          }
          // Translation is ongoing - only consider frames that were available when
          // the translation was requested, or else new frames injected in the document
          // will cause unexpected status changes
          if (
            anyFrameThatExistedWhenTranslationWasRequestedHasTranslationStatus(
              TranslationStatus.TRANSLATING,
            )
          ) {
            return TranslationStatus.TRANSLATING;
          }
          // An error in any frame makes gets promoted to tab-level
          if (anyFrameHasTranslationStatus(TranslationStatus.ERROR)) {
            return TranslationStatus.ERROR;
          }
          // Fallback on top frame status as the canonical status
          return tabTopFrameState.translationStatus;
        };
        const translationStatus = tabTranslationStatus();

        const tabTranslationStateData: ModelPropsCreationData<TabTranslationState> = {
          isVisible,
          displayQualityEstimation,
          translationRequested,
          cancellationRequested,
          detectedLanguageResults,
          translateFrom,
          translateTo,
          translationStatus,
          tabId,
          windowId,
          showOriginal,
          url,
          wordCount,
          wordCountVisible,
          wordCountVisibleInViewport,
          translationInitiationTimestamp,
          totalModelLoadWallTimeMs,
          totalTranslationWallTimeMs,
          totalTranslationEngineRequestCount,
          queuedTranslationEngineRequestCount,
          modelLoadNecessary,
          modelDownloadNecessary,
          modelDownloading,
          modelDownloadProgress,
          modelLoading,
          modelLoaded,
          translationFinished,
          modelLoadErrorOccurred,
          modelDownloadErrorOccurred,
          translationErrorOccurred,
          otherErrorOccurred,
        };

        const tabTranslationState = new TabTranslationState(
          tabTranslationStateData,
        );

        map.set(tabId, tabTranslationState);
      },
    );
    return map;
  }

  private tabSpecificDocumentTranslationStates(tabId) {
    const result = [];
    this.documentTranslationStates.forEach(
      (documentTranslationState: DocumentTranslationState) => {
        if (documentTranslationState.tabId === tabId) {
          result.push(documentTranslationState);
        }
      },
    );
    return result;
  }

  public requestTranslationOfAllFramesInTab(tabId, from, to) {
    // Request translation of all frames in a specific tab
    this.tabSpecificDocumentTranslationStates(tabId).forEach(
      (dts: DocumentTranslationState) => {
        this.patchDocumentTranslationStateByFrameInfo(dts, [
          {
            op: "replace",
            path: ["translateFrom"],
            value: from,
          },
          {
            op: "replace",
            path: ["translateTo"],
            value: to,
          },
          {
            op: "replace",
            path: ["translationRequested"],
            value: true,
          },
          {
            op: "replace",
            path: ["translationStatus"],
            value: TranslationStatus.TRANSLATING,
          },
        ]);
      },
    );
  }

  public showOriginalInTab(tabId: number) {
    this.tabSpecificDocumentTranslationStates(tabId).forEach(
      (dts: DocumentTranslationState) => {
        this.patchDocumentTranslationStateByFrameInfo(dts, [
          {
            op: "replace",
            path: ["showOriginal"],
            value: true,
          },
        ]);
      },
    );
  }

  public hideOriginalInTab(tabId: number) {
    this.tabSpecificDocumentTranslationStates(tabId).forEach(
      (dts: DocumentTranslationState) => {
        this.patchDocumentTranslationStateByFrameInfo(dts, [
          {
            op: "replace",
            path: ["showOriginal"],
            value: false,
          },
        ]);
      },
    );
  }
}
