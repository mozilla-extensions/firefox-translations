/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { FrameInfo } from "../types/bergamot.types";
import { TranslationStatus } from "../models/BaseTranslationState";
import { ExtensionState } from "../models/ExtensionState";
import { FrameTranslationProgress } from "../../content-scripts/dom-translation-content-script.js/dom-translators/BaseDomTranslator";
import { mapToObject } from "mobx-keystone";

/**
 * Helper class to communicate updated document translation states.
 *
 * Method implementations are wrapped in setTimeout to prevent
 * automatic (by mobx) batching of updates - we want status indicators
 * to get the updated translation status immediately.
 */
export class DocumentTranslationStateCommunicator {
  private frameInfo: FrameInfo;
  private extensionState: ExtensionState;
  constructor(frameInfo: FrameInfo, extensionState: ExtensionState) {
    this.frameInfo = frameInfo;
    this.extensionState = extensionState;
  }

  broadcastUpdatedTranslationStatus(translationStatus: TranslationStatus) {
    setTimeout(() => {
      this.extensionState.patchDocumentTranslationStateByFrameInfo(
        this.frameInfo,
        [
          {
            op: "replace",
            path: ["translationStatus"],
            value: translationStatus,
          },
        ],
      );
    }, 0);
  }

  broadcastUpdatedFrameTranslationProgress(
    frameTranslationProgress: FrameTranslationProgress,
  ) {
    const {
      progressOfIndividualTranslationRequests,
    } = frameTranslationProgress;

    const serialized = mapToObject(progressOfIndividualTranslationRequests);
    console.log("broadcastUpdatedFrameTranslationProgress", {
      progressOfIndividualTranslationRequests,
      serialized,
    });
    setTimeout(() => {
      this.extensionState.patchDocumentTranslationStateByFrameInfo(
        this.frameInfo,
        [
          {
            op: "replace",
            path: ["progressOfIndividualTranslationRequests"],
            value: serialized,
          },
        ],
      );
    }, 0);
    /*
    // TODO: Evaluate value of calculating and setting the following attributes to the state directly instead of relying on computed properties
    wordCount: prop<number>(),
    wordCountVisible: prop<number>(),
    wordCountVisibleInViewport: prop<number>(),
    translatedWordCount: prop<number>(),
    translatedWordCountVisible: prop<number>(),
    translatedWordCountVisibleInViewport: prop<number>(),
    totalModelLoadWallTimeMs: prop<number>(),
    totalTranslationWallTimeMs: prop<number>(),
    totalTranslationEngineRequestCount: prop<number>(),
     */
  }

  clear() {
    setTimeout(() => {
      this.extensionState.deleteDocumentTranslationStateByFrameInfo(
        this.frameInfo,
      );
    }, 0);
  }

  updatedDetectedLanguageResults(detectedLanguageResults) {
    setTimeout(() => {
      this.extensionState.patchDocumentTranslationStateByFrameInfo(
        this.frameInfo,
        [
          {
            op: "add",
            path: ["detectedLanguageResults"],
            value: detectedLanguageResults,
          },
        ],
      );
    }, 0);
  }
}
