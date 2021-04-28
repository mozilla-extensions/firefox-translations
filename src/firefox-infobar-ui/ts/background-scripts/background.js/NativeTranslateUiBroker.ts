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
import { getSnapshot } from "mobx-keystone";
import { reaction, when } from "mobx";
import { DetectedLanguageResults } from "../../../../core/ts/background-scripts/background.js/lib/LanguageDetector";

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
  modelLoading: boolean;
  queuedTranslationEngineRequestCount: number;
}

type StandardInfobarInteractionEvent = Event<
  (tabId: number, from: string, to: string) => void
>;

type browserInterface = typeof crossBrowser;
interface BrowserWithExperimentAPIs extends browserInterface {
  experiments: {
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
  private eventsToObserve: NativeTranslateUiEventRef[];

  constructor(extensionState) {
    this.extensionState = extensionState;
    this.eventsToObserve = [
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
    this.eventsToObserve.map((eventRef: NativeTranslateUiEventRef) => {
      browserWithExperimentAPIs.experiments.translateUi[eventRef].addListener(
        this[eventRef].bind(this),
      );
    });
    await browserWithExperimentAPIs.experiments.translateUi.start();

    const { summarizeLanguageSupport } = new LanguageSupport();

    // Boils down extension state to the subset relevant for the native translate ui
    const nativeTranslateUiStateFromTabTranslationState = async (
      tts: TabTranslationState,
    ): Promise<NativeTranslateUiState> => {
      const infobarState = nativeTranslateUiStateInfobarStateFromTranslationStatus(
        tts.translationStatus,
      );

      const detectedLanguageResults = getSnapshot(tts.detectedLanguageResults);
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
        modelLoading: tts.modelLoading,
        queuedTranslationEngineRequestCount:
          tts.queuedTranslationEngineRequestCount,
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
              tts,
            );
            browserWithExperimentAPIs.experiments.translateUi.setUiState(
              tabId,
              uiState,
            );
          },
        );
        // TODO: check _previousTabTranslationStates for those that had something and now should be inactive
      },
    );
  }

  async translateAllFramesInTab(tabId: number, from: string, to: string) {
    // Start timing
    const start = performance.now();
    // Request translation of all frames in a specific tab
    this.extensionState.requestTranslationOfAllFramesInTab(tabId, from, to);
    // Wait for translation in all frames in tab to complete
    await when(() => {
      const { tabTranslationStates } = this.extensionState;
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
    const translationWallTimeMs = end - start;

    const { tabTranslationStates } = this.extensionState;
    const currentTabTranslationState = getSnapshot(
      tabTranslationStates.get(tabId),
    );

    const {
      totalModelLoadWallTimeMs,
      totalTranslationEngineRequestCount,
      totalTranslationWallTimeMs,
      wordCount,
      translationStatus,
    } = currentTabTranslationState;

    if (translationStatus === TranslationStatus.TRANSLATED) {
      // Record "translation attempt concluded" telemetry
      const perceivedSeconds = translationWallTimeMs / 1000;
      const perceivedWordsPerSecond = Math.round(wordCount / perceivedSeconds);
      const translationEngineWordsPerSecond = Math.round(
        wordCount / (totalTranslationWallTimeMs / 1000),
      );
      console.info(
        `Translation of all text in tab with id ${tabId} (${wordCount} words) took ${perceivedSeconds} secs (perceived as ${perceivedWordsPerSecond} words per second) across ${totalTranslationEngineRequestCount} translation engine requests (which took ${totalTranslationWallTimeMs /
          1000} seconds, operating at ${translationEngineWordsPerSecond} words per second). Model loading took ${totalModelLoadWallTimeMs /
          1000} seconds.`,
      );
      telemetry.onTranslationFinished(
        from,
        to,
        totalModelLoadWallTimeMs,
        totalTranslationWallTimeMs,
        translationEngineWordsPerSecond,
      );
    } else {
      // TODO: Record error telemetry
    }
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
    this.translateAllFramesInTab(tabId, from, to);
  }

  onNotNowButtonPressed(tabId: number, from: string, to: string) {
    console.debug("onNotNowButtonPressed", { tabId, from, to });
    telemetry.onNotNowButtonPressed(tabId, from, to);
  }

  async stop() {
    await browserWithExperimentAPIs.experiments.translateUi.stop();
    this.eventsToObserve.map(eventRef => {
      browserWithExperimentAPIs.experiments.translateUi[
        eventRef
      ].removeListener(this[eventRef] as any);
    });
  }
}
