/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { FrameInfo } from "../types/bergamot.types";
import { TranslationStatus } from "../models/BaseTranslationState";
import { ExtensionState } from "../models/ExtensionState";
import {
  FrameTranslationProgress,
  TranslationRequestProgress,
} from "../../content-scripts/dom-translation-content-script.js/dom-translators/BaseDomTranslator";

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

  /**
   * This method was chosen as the place to sum up the progress of individual translation
   * requests into the similar translation progress attributes present at the frame level
   * in document translation state objects (totalTranslationWallTimeMs, totalTranslationEngineRequestCount etc).
   *
   * Another natural place to do this conversion would be as computed properties in the mobx models
   * but it proved problematic to maintain/patch/sync map attributes (such as progressOfIndividualTranslationRequests)
   * in document translation state objects, so reduction to simpler attributes is done here instead.
   *
   * @param frameTranslationProgress
   */
  broadcastUpdatedFrameTranslationProgress(
    frameTranslationProgress: FrameTranslationProgress,
  ) {
    const {
      progressOfIndividualTranslationRequests,
    } = frameTranslationProgress;

    const translationRequestProgressEntries = Array.from(
      progressOfIndividualTranslationRequests,
    ).map(
      ([, translationRequestProgress]: [string, TranslationRequestProgress]) =>
        translationRequestProgress,
    );

    const translationInitiationTimestamps = translationRequestProgressEntries.map(
      (trp: TranslationRequestProgress) => trp.initiationTimestamp,
    );
    const translationInitiationTimestamp = Math.min(
      ...translationInitiationTimestamps,
    );
    const totalModelLoadWallTimeMs = translationRequestProgressEntries
      .map((trp: TranslationRequestProgress) => trp.modelLoadWallTimeMs || 0)
      .reduce((a, b) => a + b, 0);
    const totalTranslationWallTimeMs = translationRequestProgressEntries
      .map((trp: TranslationRequestProgress) => trp.translationWallTimeMs || 0)
      .reduce((a, b) => a + b, 0);
    const totalTranslationEngineRequestCount =
      translationRequestProgressEntries.length;
    const queuedTranslationEngineRequestCount = translationRequestProgressEntries.filter(
      (trp: TranslationRequestProgress) => trp.queued,
    ).length;

    // Merge translation-progress-related booleans
    const modelLoadNecessary = !!translationRequestProgressEntries.filter(
      (trp: TranslationRequestProgress) => trp.modelLoadNecessary,
    ).length;
    const modelLoading = modelLoadNecessary
      ? !!translationRequestProgressEntries.find(
          (trp: TranslationRequestProgress) => trp.modelLoading,
        )
      : undefined;
    const modelLoaded = modelLoadNecessary
      ? !!translationRequestProgressEntries
          .filter((trp: TranslationRequestProgress) => trp.modelLoadNecessary)
          .find((trp: TranslationRequestProgress) => trp.modelLoaded)
      : undefined;
    const translationFinished =
      translationRequestProgressEntries.filter(
        (trp: TranslationRequestProgress) => !trp.translationFinished,
      ).length === 0;

    setTimeout(() => {
      this.extensionState.patchDocumentTranslationStateByFrameInfo(
        this.frameInfo,
        [
          {
            op: "replace",
            path: ["translationInitiationTimestamp"],
            value: translationInitiationTimestamp,
          },
          {
            op: "replace",
            path: ["totalModelLoadWallTimeMs"],
            value: totalModelLoadWallTimeMs,
          },
          {
            op: "replace",
            path: ["totalTranslationWallTimeMs"],
            value: totalTranslationWallTimeMs,
          },
          {
            op: "replace",
            path: ["totalTranslationEngineRequestCount"],
            value: totalTranslationEngineRequestCount,
          },
          {
            op: "replace",
            path: ["queuedTranslationEngineRequestCount"],
            value: queuedTranslationEngineRequestCount,
          },
          {
            op: "replace",
            path: ["modelLoadNecessary"],
            value: modelLoadNecessary,
          },
          {
            op: "replace",
            path: ["modelLoading"],
            value: modelLoading,
          },
          {
            op: "replace",
            path: ["modelLoaded"],
            value: modelLoaded,
          },
          {
            op: "replace",
            path: ["translationFinished"],
            value: translationFinished,
          },
        ],
      );
    }, 0);
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
