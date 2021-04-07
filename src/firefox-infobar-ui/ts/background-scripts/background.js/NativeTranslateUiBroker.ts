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
import { SnapshotOutOfModel } from "mobx-keystone";
import { reaction, when } from "mobx";

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
  detectedLanguage: string;
  defaultTargetLanguage: string;
  infobarState: NativeTranslateUiStateInfobarState;
  translatedFrom: string;
  translatedTo: string;
  originalShown: boolean;
  // Additionally, since supported source and target languages are only supported in specific pairs, keep these dynamic:
  supportedSourceLanguages: string[];
  supportedTargetLanguages: string[];
}

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
      onInfoBarDisplayed: Event<(tabId: number) => void>;
      onSelectTranslateTo: Event<(tabId: number) => void>;
      onSelectTranslateFrom: Event<(tabId: number) => void>;
      onInfoBarClosed: Event<(tabId: number) => void>;
      onNeverTranslateSelectedLanguage: Event<(tabId: number) => void>;
      onNeverTranslateThisSite: Event<(tabId: number) => void>;
      onShowOriginalButtonPressed: Event<(tabId: number) => void>;
      onShowTranslatedButtonPressed: Event<(tabId: number) => void>;
      onTranslateButtonPressed: Event<
        (tabId: number, from: string, to: string) => void
      >;
      onNotNowButtonPressed: Event<(tabId: number) => void>;
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
      dts: SnapshotOutOfModel<TabTranslationState>,
    ): Promise<NativeTranslateUiState> => {
      const infobarState = nativeTranslateUiStateInfobarStateFromTranslationStatus(
        dts.translationStatus,
      );

      const detectedLanguage = dts.detectedLanguageResults?.language;
      const {
        acceptedTargetLanguages,
        // defaultSourceLanguage,
        defaultTargetLanguage,
        supportedSourceLanguages,
        // supportedTargetLanguagesGivenDefaultSourceLanguage,
        allPossiblySupportedTargetLanguages,
      } = await summarizeLanguageSupport(detectedLanguage);

      return {
        acceptedTargetLanguages,
        detectedLanguage,
        // defaultSourceLanguage,
        defaultTargetLanguage,
        infobarState,
        translatedFrom: dts.translateFrom,
        translatedTo: dts.translateTo,
        originalShown: dts.showOriginal,
        // Additionally, since supported source and target languages are only supported in specific pairs, keep these dynamic:
        supportedSourceLanguages,
        supportedTargetLanguages: allPossiblySupportedTargetLanguages,
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
          return NativeTranslateUiStateInfobarState.STATE_TRANSLATING;
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
        tabTranslationStates.forEach(async (tts, tabId) => {
          const uiState = await nativeTranslateUiStateFromTabTranslationState(
            tts,
          );
          browserWithExperimentAPIs.experiments.translateUi.setUiState(
            tabId,
            uiState,
          );
        });
        // TODO: check _previousTabTranslationStates for those that had something and now should be inactive
      },
    );
  }

  async translateAllFramesInTab(tabId: number, from: string, to: string) {
    // Request translation of all frames in a specific tab
    this.extensionState.requestTranslationOfAllFramesInTab(tabId, from, to);
    // Wait for translation in all frames in tab to complete
    await when(() => {
      const { tabTranslationStates } = this.extensionState;
      const currentTabTranslationState = tabTranslationStates.get(tabId);
      return [TranslationStatus.TRANSLATED, TranslationStatus.ERROR].includes(
        currentTabTranslationState.translationStatus,
      );
    });
    // Record translation attempt concluded telemetry
    const modelLoadTimeMs = -1;
    const translationTimeMs = -1;
    const wordsPerSecond = -1;
    telemetry.onTranslationAttemptConcluded(
      from,
      to,
      modelLoadTimeMs,
      translationTimeMs,
      wordsPerSecond,
    );
  }

  onInfoBarDisplayed(tabId: number) {
    console.debug("onInfoBarDisplayed", { tabId });
    telemetry.onInfoBarDisplayed(tabId);
  }

  onSelectTranslateFrom(tabId: number) {
    console.debug("onSelectTranslateFrom", { tabId });
    telemetry.onSelectTranslateFrom(tabId);
  }

  onSelectTranslateTo(tabId: number) {
    console.debug("onSelectTranslateTo", { tabId });
    telemetry.onSelectTranslateFrom(tabId);
  }

  onInfoBarClosed(tabId: number) {
    console.debug("onInfoBarClosed", { tabId });
    telemetry.onInfoBarClosed(tabId);
  }

  onNeverTranslateSelectedLanguage(tabId: number) {
    console.debug("onNeverTranslateSelectedLanguage", { tabId });
    telemetry.onNeverTranslateSelectedLanguage(tabId);
  }

  onNeverTranslateThisSite(tabId: number) {
    console.debug("onNeverTranslateThisSite", { tabId });
    telemetry.onNeverTranslateThisSite(tabId);
  }

  onShowOriginalButtonPressed(tabId: number) {
    console.debug("onShowOriginalButtonPressed", { tabId });
    telemetry.onShowOriginalButtonPressed(tabId);
    this.extensionState.showOriginalInTab(tabId);
  }

  onShowTranslatedButtonPressed(tabId: number) {
    console.debug("onShowTranslatedButtonPressed", { tabId });
    telemetry.onShowTranslatedButtonPressed(tabId);
    this.extensionState.hideOriginalInTab(tabId);
  }

  onTranslateButtonPressed(tabId: number, from: string, to: string) {
    console.debug("onTranslateButtonPressed", { tabId, from, to });
    telemetry.onTranslateButtonPressed(tabId, from, to);
    this.translateAllFramesInTab(tabId, from, to);
  }

  onNotNowButtonPressed(tabId: number) {
    console.debug("onNotNowButtonPressed", { tabId });
    telemetry.onNotNowButtonPressed(tabId);
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
