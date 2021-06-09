/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { FrameInfo } from "../types/bergamot.types";
import { TranslationStatus } from "../models/BaseTranslationState";
import { ExtensionState } from "../models/ExtensionState";
import {
  DerivedTranslationDocumentData,
  FrameTranslationProgress,
  TranslationRequestProgress,
} from "../../content-scripts/dom-translation-content-script.js/dom-translators/BaseDomTranslator";
import { ModelDownloadProgress } from "../../background-scripts/background.js/lib/BergamotTranslatorAPI";
import { DetectedLanguageResults } from "../../background-scripts/background.js/lib/LanguageDetector";
import { Patch } from "mobx-keystone";

/**
 * Helper class to communicate updated document translation states.
 *
 * State patching code is wrapped in setTimeout to prevent
 * automatic (by mobx) batching of updates which leads to much less frequent
 * state updates communicated to subscribers. No state updates during a translation
 * session is not useful since we want to communicate the translation progress)
 */
export class DocumentTranslationStateCommunicator {
  private frameInfo: FrameInfo;
  private extensionState: ExtensionState;
  constructor(frameInfo: FrameInfo, extensionState: ExtensionState) {
    this.frameInfo = frameInfo;
    this.extensionState = extensionState;
  }

  patchDocumentTranslationState(patches: Patch[]) {
    setTimeout(() => {
      this.extensionState.patchDocumentTranslationStateByFrameInfo(
        this.frameInfo,
        patches,
      );
    }, 0);
  }

  broadcastUpdatedAttributeValue(attribute: string, value: any) {
    this.patchDocumentTranslationState([
      {
        op: "replace",
        path: [attribute],
        value,
      },
    ]);
  }

  broadcastUpdatedTranslationStatus(translationStatus: TranslationStatus) {
    this.broadcastUpdatedAttributeValue("translationStatus", translationStatus);
  }

  broadcastTranslationAttemptConcluded(
    translationError: boolean,
    derivedTranslationDocumentData: DerivedTranslationDocumentData,
  ) {
    const {
      wordCount,
      wordCountVisible,
      wordCountVisibleInViewport,
    } = derivedTranslationDocumentData;
    this.patchDocumentTranslationState([
      {
        op: "replace",
        path: ["translationStatus"],
        value: translationError
          ? TranslationStatus.ERROR
          : TranslationStatus.TRANSLATED,
      },
      {
        op: "replace",
        path: ["wordCount"],
        value: wordCount,
      },
      {
        op: "replace",
        path: ["wordCountVisible"],
        value: wordCountVisible,
      },
      {
        op: "replace",
        path: ["wordCountVisibleInViewport"],
        value: wordCountVisibleInViewport,
      },
    ]);
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
    const modelDownloadNecessary = !!translationRequestProgressEntries.filter(
      (trp: TranslationRequestProgress) => trp.modelDownloadNecessary,
    ).length;
    const modelDownloading = !!translationRequestProgressEntries.filter(
      (trp: TranslationRequestProgress) => trp.modelDownloading,
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

    // Merge model download progress
    const emptyDownloadProgress: ModelDownloadProgress = {
      bytesDownloaded: 0,
      bytesToDownload: 0,
      startTs: undefined,
      durationMs: 0,
      endTs: undefined,
    };
    const modelDownloadProgress = translationRequestProgressEntries
      .map((trp: TranslationRequestProgress) => trp.modelDownloadProgress)
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

    this.patchDocumentTranslationState([
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
        path: ["modelDownloadNecessary"],
        value: modelDownloadNecessary,
      },
      {
        op: "replace",
        path: ["modelDownloading"],
        value: modelDownloading,
      },
      {
        op: "replace",
        path: ["modelDownloadProgress"],
        value: modelDownloadProgress,
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
    ]);
  }

  clear() {
    setTimeout(() => {
      this.extensionState.deleteDocumentTranslationStateByFrameInfo(
        this.frameInfo,
      );
    }, 0);
  }

  updatedDetectedLanguageResults(
    detectedLanguageResults: DetectedLanguageResults,
  ) {
    this.broadcastUpdatedAttributeValue(
      "detectedLanguageResults",
      detectedLanguageResults,
    );
  }
}
