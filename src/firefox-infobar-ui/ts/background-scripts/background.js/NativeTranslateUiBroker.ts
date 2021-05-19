/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { browser as crossBrowser, Events } from "webextension-polyfill-ts";
import Event = Events.Event;
import { LanguageSupport } from "../../../../core/ts/shared-resources/LanguageSupport";
import { TranslationStatus } from "../../../../core/ts/shared-resources/models/BaseTranslationState";
import { ExtensionState } from "../../../../core/ts/shared-resources/models/ExtensionState";
import { telemetry } from "../../../../core/ts/background-scripts/background.js/telemetry/Telemetry";
import { TabTranslationState } from "../../../../core/ts/shared-resources/models/TabTranslationState";
import { getSnapshot, SnapshotOutOf } from "mobx-keystone";
import { reaction } from "mobx";
import { DetectedLanguageResults } from "../../../../core/ts/background-scripts/background.js/lib/LanguageDetector";
import { translateAllFramesInTab } from "../../../../core/ts/background-scripts/background.js/lib/translateAllFramesInTab";

/* eslint-disable no-unused-vars, no-shadow */
// TODO: update typescript-eslint when support for this kind of declaration is supported
enum NativeTranslateUiStateInfobarState {
  STATE_OFFER = 0,
  STATE_TRANSLATING = 1,
  STATE_TRANSLATED = 2,
  STATE_ERROR = 3,
  STATE_UNAVAILABLE = 4,
}
/* eslint-enable no-unused-vars, no-shadow */

/**
 * The properties exposed to the infobar are:
 * - detectedLanguage, code of the language detected on the web page.
 * - infobarState, the state in which the infobar should be displayed
 * - translatedFrom, if already translated, source language code.
 * - translatedTo, if already translated, target language code.
 * - originalShown, boolean indicating if the original or translated
 *   version of the page is shown.
 */
interface NativeTranslateUiState {
  acceptedTargetLanguages: string[];
  detectedLanguageResults: DetectedLanguageResults;
  defaultTargetLanguage: string;
  infobarState: NativeTranslateUiStateInfobarState;
  translatedFrom: string;
  translatedTo: string;
  originalShown: boolean;
  // Additionally, since supported source and target languages are only supported in specific pairs, keep these dynamic:
  supportedSourceLanguages: string[];
  supportedTargetLanguages: string[];
  // Translation progress
  translationDurationMs: number;
  localizedTranslationProgressText: string;
}

type StandardInfobarInteractionEvent = Event<
  (tabId: number, from: string, to: string) => void
>;

type browserInterface = typeof crossBrowser;
interface BrowserWithExperimentAPIs extends browserInterface {
  experiments: {
    telemetryPreferences: {
      onUploadEnabledPrefChange: Event<() => void>;
      onCachedClientIDPrefChange: Event<() => void>;
      getUploadEnabledPref: () => Promise<boolean>;
      getCachedClientIDPref: () => Promise<string>;
    };
    translateUi: {
      start: () => Promise<void>;
      stop: () => Promise<void>;
      setUiState: (
        tabId: number,
        uiState: NativeTranslateUiState,
      ) => Promise<void>;
      onInfoBarDisplayed: StandardInfobarInteractionEvent;
      onSelectTranslateTo: Event<
        (tabId: number, from: string, newTo: string) => void
      >;
      onSelectTranslateFrom: Event<
        (tabId: number, newFrom: string, to: string) => void
      >;
      onInfoBarClosed: StandardInfobarInteractionEvent;
      onNeverTranslateSelectedLanguage: StandardInfobarInteractionEvent;
      onNeverTranslateThisSite: StandardInfobarInteractionEvent;
      onShowOriginalButtonPressed: StandardInfobarInteractionEvent;
      onShowTranslatedButtonPressed: StandardInfobarInteractionEvent;
      onTranslateButtonPressed: StandardInfobarInteractionEvent;
      onNotNowButtonPressed: StandardInfobarInteractionEvent;
    };
  };
}
const browserWithExperimentAPIs = (browser as any) as BrowserWithExperimentAPIs;

type TelemetryPreferencesEventRef =
  | "onUploadEnabledPrefChange"
  | "onCachedClientIDPrefChange";

type NativeTranslateUiEventRef =
  | "onInfoBarDisplayed"
  | "onSelectTranslateTo"
  | "onSelectTranslateFrom"
  | "onInfoBarClosed"
  | "onNeverTranslateSelectedLanguage"
  | "onNeverTranslateThisSite"
  | "onShowOriginalButtonPressed"
  | "onShowTranslatedButtonPressed"
  | "onTranslateButtonPressed"
  | "onNotNowButtonPressed";

export class NativeTranslateUiBroker {
  private extensionState: ExtensionState;
  private telemetryPreferencesEventsToObserve: TelemetryPreferencesEventRef[];
  private translateUiEventsToObserve: NativeTranslateUiEventRef[];

  constructor(extensionState) {
    this.extensionState = extensionState;
    this.telemetryPreferencesEventsToObserve = [
      "onUploadEnabledPrefChange",
      "onCachedClientIDPrefChange",
    ];
    this.translateUiEventsToObserve = [
      "onInfoBarDisplayed",
      "onSelectTranslateTo",
      "onSelectTranslateFrom",
      "onInfoBarClosed",
      "onNeverTranslateSelectedLanguage",
      "onNeverTranslateThisSite",
      "onShowOriginalButtonPressed",
      "onShowTranslatedButtonPressed",
      "onTranslateButtonPressed",
      "onNotNowButtonPressed",
    ];
  }

  async start() {
    // Current value of Telemetry preferences
    const uploadEnabled = await browserWithExperimentAPIs.experiments.telemetryPreferences.getUploadEnabledPref();
    const cachedClientID = await browserWithExperimentAPIs.experiments.telemetryPreferences.getCachedClientIDPref();

    // Initialize telemetry
    telemetry.initialize(uploadEnabled, cachedClientID);

    // Hook up experiment API events with listeners in this class
    this.telemetryPreferencesEventsToObserve.map(
      (eventRef: TelemetryPreferencesEventRef) => {
        browserWithExperimentAPIs.experiments.telemetryPreferences[
          eventRef
        ].addListener(this[eventRef].bind(this));
      },
    );
    this.translateUiEventsToObserve.map(
      (eventRef: NativeTranslateUiEventRef) => {
        browserWithExperimentAPIs.experiments.translateUi[eventRef].addListener(
          this[eventRef].bind(this),
        );
      },
    );
    await browserWithExperimentAPIs.experiments.translateUi.start();

    const { summarizeLanguageSupport } = new LanguageSupport();

    // Boils down extension state to the subset relevant for the native translate ui
    const nativeTranslateUiStateFromTabTranslationState = async (
      tts: SnapshotOutOf<TabTranslationState>,
    ): Promise<NativeTranslateUiState> => {
      const infobarState = nativeTranslateUiStateInfobarStateFromTranslationStatus(
        tts.translationStatus,
      );

      const detectedLanguageResults = tts.detectedLanguageResults;
      const {
        acceptedTargetLanguages,
        // defaultSourceLanguage,
        defaultTargetLanguage,
        supportedSourceLanguages,
        // supportedTargetLanguagesGivenDefaultSourceLanguage,
        allPossiblySupportedTargetLanguages,
      } = await summarizeLanguageSupport(detectedLanguageResults);

      const translationDurationMs =
        Date.now() - tts.translationInitiationTimestamp;

      // Localized translation progress text
      const {
        modelLoading,
        queuedTranslationEngineRequestCount,
        modelDownloading,
        modelDownloadProgress,
      } = tts;
      let localizedTranslationProgressText;
      if (modelDownloading) {
        const showDetailedProgress =
          modelDownloadProgress && modelDownloadProgress.bytesDownloaded > 0;
        const percentDownloaded = Math.round(
          (modelDownloadProgress.bytesDownloaded /
            modelDownloadProgress.bytesToDownload) *
            100,
        );
        const mbToDownload =
          Math.round(
            (modelDownloadProgress.bytesToDownload / 1024 / 1024) * 10,
          ) / 10;
        const localizedDetailedDownloadProgressText = browser.i18n.getMessage(
          "detailedDownloadProgress",
          [percentDownloaded, mbToDownload],
        );
        localizedTranslationProgressText = `(${browser.i18n.getMessage(
          "currentlyDownloadingLanguageModel",
        )}...${
          showDetailedProgress
            ? ` ${localizedDetailedDownloadProgressText}`
            : ``
        })`;
      } else if (modelLoading) {
        localizedTranslationProgressText = `(${browser.i18n.getMessage(
          "currentlyLoadingLanguageModel",
        )}...)`;
      } else if (queuedTranslationEngineRequestCount > 0) {
        // Using neutral plural form since there is no support for plural form in browser.i18n
        localizedTranslationProgressText = `(${browser.i18n.getMessage(
          "loadedLanguageModel",
        )}. ${browser.i18n.getMessage(
          "partsLeftToTranslate",
          queuedTranslationEngineRequestCount,
        )})`;
      } else {
        localizedTranslationProgressText = "";
      }

      return {
        acceptedTargetLanguages,
        detectedLanguageResults,
        // defaultSourceLanguage,
        defaultTargetLanguage,
        infobarState,
        translatedFrom: tts.translateFrom,
        translatedTo: tts.translateTo,
        originalShown: tts.showOriginal,
        // Additionally, since supported source and target languages are only supported in specific pairs, keep these dynamic:
        supportedSourceLanguages,
        supportedTargetLanguages: allPossiblySupportedTargetLanguages,
        // Translation progress
        translationDurationMs,
        localizedTranslationProgressText,
      };
    };
    const nativeTranslateUiStateInfobarStateFromTranslationStatus = (
      translationStatus: TranslationStatus,
    ): NativeTranslateUiStateInfobarState => {
      switch (translationStatus) {
        case TranslationStatus.UNKNOWN:
          return NativeTranslateUiStateInfobarState.STATE_UNAVAILABLE;
        case TranslationStatus.UNAVAILABLE:
          return NativeTranslateUiStateInfobarState.STATE_UNAVAILABLE;
        case TranslationStatus.DETECTING_LANGUAGE:
          return NativeTranslateUiStateInfobarState.STATE_UNAVAILABLE;
        case TranslationStatus.LANGUAGE_NOT_DETECTED:
          return NativeTranslateUiStateInfobarState.STATE_OFFER;
        case TranslationStatus.SOURCE_LANGUAGE_UNDERSTOOD:
          return NativeTranslateUiStateInfobarState.STATE_UNAVAILABLE;
        case TranslationStatus.TRANSLATION_UNSUPPORTED:
          return NativeTranslateUiStateInfobarState.STATE_UNAVAILABLE;
        case TranslationStatus.OFFER:
          return NativeTranslateUiStateInfobarState.STATE_OFFER;
        case TranslationStatus.DOWNLOADING_TRANSLATION_MODEL:
        case TranslationStatus.TRANSLATING:
          return NativeTranslateUiStateInfobarState.STATE_TRANSLATING;
        case TranslationStatus.TRANSLATED:
          return NativeTranslateUiStateInfobarState.STATE_TRANSLATED;
        case TranslationStatus.ERROR:
          return NativeTranslateUiStateInfobarState.STATE_ERROR;
      }
      throw Error(
        `No corresponding NativeTranslateUiStateInfobarState available for translationStatus "${translationStatus}"`,
      );
    };

    // React to tab translation state changes
    reaction(
      () => this.extensionState.tabTranslationStates,
      async (tabTranslationStates, _previousTabTranslationStates) => {
        tabTranslationStates.forEach(
          async (tts: TabTranslationState, tabId) => {
            const uiState = await nativeTranslateUiStateFromTabTranslationState(
              getSnapshot(tts),
            );
            browserWithExperimentAPIs.experiments.translateUi.setUiState(
              tabId,
              uiState,
            );
            // Send telemetry on some translation status changes
            const hasChanged = property => {
              const previousTabTranslationState = _previousTabTranslationStates.get(
                tabId,
              );
              return (
                !previousTabTranslationState ||
                tts[property] !== previousTabTranslationState[property]
              );
            };
            if (hasChanged("translationStatus")) {
              if (tts.translationStatus === TranslationStatus.OFFER) {
                telemetry.onTranslationStatusOffer(
                  tts.effectiveTranslateFrom,
                  tts.effectiveTranslateTo,
                );
              }
              if (
                tts.translationStatus ===
                TranslationStatus.TRANSLATION_UNSUPPORTED
              ) {
                telemetry.onTranslationStatusTranslationUnsupported(
                  tts.effectiveTranslateFrom,
                  tts.effectiveTranslateTo,
                );
              }
            }
            if (hasChanged("modelLoadErrorOccurred")) {
              if (tts.modelLoadErrorOccurred) {
                telemetry.onModelLoadErrorOccurred(
                  tts.effectiveTranslateFrom,
                  tts.effectiveTranslateTo,
                );
              }
            }
            if (hasChanged("modelDownloadErrorOccurred")) {
              if (tts.modelDownloadErrorOccurred) {
                telemetry.onModelDownloadErrorOccurred(
                  tts.effectiveTranslateFrom,
                  tts.effectiveTranslateTo,
                );
              }
            }
            if (hasChanged("translationErrorOccurred")) {
              if (tts.translationErrorOccurred) {
                telemetry.onTranslationErrorOccurred(
                  tts.effectiveTranslateFrom,
                  tts.effectiveTranslateTo,
                );
              }
            }
            if (hasChanged("otherErrorOccurred")) {
              if (tts.otherErrorOccurred) {
                telemetry.onOtherErrorOccurred(
                  tts.effectiveTranslateFrom,
                  tts.effectiveTranslateTo,
                );
              }
            }
          },
        );
        // TODO: check _previousTabTranslationStates for those that had something and now should be inactive
      },
    );
  }

  async onUploadEnabledPrefChange() {
    const uploadEnabled = await browserWithExperimentAPIs.experiments.telemetryPreferences.getUploadEnabledPref();
    // console.debug("onUploadEnabledPrefChange", { uploadEnabled });
    telemetry.uploadEnabledPreferenceUpdated(uploadEnabled);
  }

  async onCachedClientIDPrefChange() {
    const cachedClientID = await browserWithExperimentAPIs.experiments.telemetryPreferences.getCachedClientIDPref();
    // console.debug("onCachedClientIDPrefChange", { cachedClientID });
    telemetry.setFirefoxClientId(cachedClientID);
  }

  onInfoBarDisplayed(tabId: number, from: string, to: string) {
    console.debug("onInfoBarDisplayed", { tabId, from, to });
    telemetry.onInfoBarDisplayed(tabId, from, to);
  }

  onSelectTranslateFrom(tabId: number, newFrom: string, to: string) {
    console.debug("onSelectTranslateFrom", { tabId, newFrom, to });
    telemetry.onSelectTranslateFrom(tabId, newFrom, to);
  }

  onSelectTranslateTo(tabId: number, from: string, newTo: string) {
    console.debug("onSelectTranslateTo", { tabId, from, newTo });
    telemetry.onSelectTranslateFrom(tabId, from, newTo);
  }

  onInfoBarClosed(tabId: number, from: string, to: string) {
    console.debug("onInfoBarClosed", { tabId, from, to });
    telemetry.onInfoBarClosed(tabId, from, to);
  }

  onNeverTranslateSelectedLanguage(tabId: number, from: string, to: string) {
    console.debug("onNeverTranslateSelectedLanguage", { tabId, from, to });
    telemetry.onNeverTranslateSelectedLanguage(tabId, from, to);
  }

  onNeverTranslateThisSite(tabId: number, from: string, to: string) {
    console.debug("onNeverTranslateThisSite", { tabId, from, to });
    telemetry.onNeverTranslateThisSite(tabId, from, to);
  }

  onShowOriginalButtonPressed(tabId: number, from: string, to: string) {
    console.debug("onShowOriginalButtonPressed", { tabId, from, to });
    telemetry.onShowOriginalButtonPressed(tabId, from, to);
    this.extensionState.showOriginalInTab(tabId);
  }

  onShowTranslatedButtonPressed(tabId: number, from: string, to: string) {
    console.debug("onShowTranslatedButtonPressed", { tabId, from, to });
    telemetry.onShowTranslatedButtonPressed(tabId, from, to);
    this.extensionState.hideOriginalInTab(tabId);
  }

  onTranslateButtonPressed(tabId: number, from: string, to: string) {
    console.debug("onTranslateButtonPressed", { tabId, from, to });
    telemetry.onTranslateButtonPressed(tabId, from, to);
    translateAllFramesInTab(tabId, from, to, this.extensionState);
  }

  onNotNowButtonPressed(tabId: number, from: string, to: string) {
    console.debug("onNotNowButtonPressed", { tabId, from, to });
    telemetry.onNotNowButtonPressed(tabId, from, to);
  }

  async stop() {
    await browserWithExperimentAPIs.experiments.translateUi.stop();
    this.telemetryPreferencesEventsToObserve.map(eventRef => {
      browserWithExperimentAPIs.experiments.telemetryPreferences[
        eventRef
      ].removeListener(this[eventRef] as any);
    });
    this.translateUiEventsToObserve.map(eventRef => {
      browserWithExperimentAPIs.experiments.translateUi[
        eventRef
      ].removeListener(this[eventRef] as any);
    });
    await telemetry.cleanup();
  }
}
