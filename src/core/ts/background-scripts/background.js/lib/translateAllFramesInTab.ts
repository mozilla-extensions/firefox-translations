import { when } from "mobx";
import { TranslationStatus } from "../../../shared-resources/models/BaseTranslationState";
import { getSnapshot } from "mobx-keystone";
import { telemetry } from "../telemetry/Telemetry";
import { ExtensionState } from "../../../shared-resources/models/ExtensionState";

export const translateAllFramesInTab = async (
  tabId: number,
  from: string,
  to: string,
  extensionState: ExtensionState,
) => {
  // Start timing
  const start = performance.now();
  // Request translation of all frames in a specific tab
  extensionState.requestTranslationOfAllFramesInTab(tabId, from, to);
  // Wait for translation in all frames in tab to complete
  await when(() => {
    const { tabTranslationStates } = extensionState;
    const currentTabTranslationState = tabTranslationStates.get(tabId);
    return (
      currentTabTranslationState &&
      [TranslationStatus.TRANSLATED, TranslationStatus.ERROR].includes(
        currentTabTranslationState.translationStatus,
      )
    );
  });
  // End timing
  const end = performance.now();
  const timeToFullPageTranslatedMs = end - start;

  const { tabTranslationStates } = extensionState;
  const currentTabTranslationState = getSnapshot(
    tabTranslationStates.get(tabId),
  );

  const {
    totalModelLoadWallTimeMs,
    totalTranslationEngineRequestCount,
    totalTranslationWallTimeMs,
    wordCount,
    wordCountVisible,
    wordCountVisibleInViewport,
    translationStatus,
    modelDownloadProgress,
  } = currentTabTranslationState;

  if (translationStatus === TranslationStatus.TRANSLATED) {
    // Record "translation attempt concluded" telemetry
    const timeToFullPageTranslatedSeconds = timeToFullPageTranslatedMs / 1000;
    const timeToFullPageTranslatedWordsPerSecond = Math.round(
      wordCount / timeToFullPageTranslatedSeconds,
    );
    const translationEngineTimeMs = totalTranslationWallTimeMs;
    const translationEngineWordsPerSecond = Math.round(
      wordCount / (translationEngineTimeMs / 1000),
    );
    const modelDownloadTimeMs = modelDownloadProgress.durationMs || 0;
    const modelLoadTimeMs = totalModelLoadWallTimeMs;
    const unaccountedTranslationTimeMs =
      timeToFullPageTranslatedMs -
      modelDownloadTimeMs -
      modelLoadTimeMs -
      translationEngineTimeMs;
    console.info(
      `Translation of the full page in tab with id ${tabId} (${wordCount} words) took ${timeToFullPageTranslatedSeconds} secs (perceived as ${timeToFullPageTranslatedWordsPerSecond} words per second) across ${totalTranslationEngineRequestCount} translation engine requests (which took ${totalTranslationWallTimeMs /
        1000} seconds, operating at ${translationEngineWordsPerSecond} words per second). Model loading took ${modelLoadTimeMs /
        1000} seconds, after spending ${modelDownloadTimeMs / 1000} seconds ${
        modelDownloadProgress.bytesToDownload === 0
          ? "hydrating"
          : "downloading and persisting"
      } model files. The remaining ${unaccountedTranslationTimeMs /
        1000} seconds where spent elsewhere.`,
    );
    telemetry.onTranslationFinished(
      tabId,
      from,
      to,
      timeToFullPageTranslatedMs,
      timeToFullPageTranslatedWordsPerSecond,
      modelDownloadTimeMs,
      modelLoadTimeMs,
      translationEngineTimeMs,
      translationEngineWordsPerSecond,
      wordCount,
      wordCountVisible,
      wordCountVisibleInViewport,
    );
  } else {
    // TODO: Record error telemetry
  }
};
