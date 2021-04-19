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

        // Sum some state attributes
        const wordCount = documentTranslationStates
          .map(dts => dts.wordCount)
          .reduce((a, b) => a + b, 0);
        const wordCountVisible = documentTranslationStates
          .map(dts => dts.wordCountVisible)
          .reduce((a, b) => a + b, 0);
        const wordCountVisibleInViewport = documentTranslationStates
          .map(dts => dts.wordCountVisibleInViewport)
          .reduce((a, b) => a + b, 0);
        const totalModelLoadWallTimeMs = documentTranslationStates
          .map(dts => dts.totalModelLoadWallTimeMs)
          .reduce((a, b) => a + b, 0);
        const totalTranslationWallTimeMs = documentTranslationStates
          .map(dts => dts.totalTranslationWallTimeMs)
          .reduce((a, b) => a + b, 0);
        const totalTranslationEngineRequestCount = documentTranslationStates
          .map(dts => dts.totalTranslationEngineRequestCount)
          .reduce((a, b) => a + b, 0);

        // Special merging of translation status
        const anyTabHasTranslationStatus = (
          translationStatus: TranslationStatus,
        ) =>
          documentTranslationStates.find(
            dts => dts.translationStatus === translationStatus,
          );
        const tabTranslationStatus = (): TranslationStatus => {
          if (
            anyTabHasTranslationStatus(TranslationStatus.DETECTING_LANGUAGE)
          ) {
            return TranslationStatus.DETECTING_LANGUAGE;
          }
          if (
            anyTabHasTranslationStatus(
              TranslationStatus.DOWNLOADING_TRANSLATION_MODEL,
            )
          ) {
            return TranslationStatus.DOWNLOADING_TRANSLATION_MODEL;
          }
          if (anyTabHasTranslationStatus(TranslationStatus.TRANSLATING)) {
            return TranslationStatus.TRANSLATING;
          }
          if (anyTabHasTranslationStatus(TranslationStatus.ERROR)) {
            return TranslationStatus.ERROR;
          }
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
          totalModelLoadWallTimeMs,
          totalTranslationWallTimeMs,
          totalTranslationEngineRequestCount,
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
