/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {
  ModelInstanceData,
  onSnapshot,
  SnapshotOutOfModel,
} from "mobx-keystone";
import { browser as crossBrowser, Events } from "webextension-polyfill-ts";
import Event = Events.Event;
import { LanguageSupport } from "../../../../core/ts/shared-resources/LanguageSupport";
import { TranslationStatus } from "../../../../core/ts/shared-resources/models/BaseTranslationState";
import { ExtensionState } from "../../../../core/ts/shared-resources/models/ExtensionState";
import { Telemetry } from "../../../../core/ts/background-scripts/background.js/telemetry/Telemetry";
import {
  translate,
  changeLang,
  closed,
  // displayed,
  // neverTranslateLang,
  neverTranslateSite,
  // notNow,
} from "../../../../core/ts/background-scripts/background.js/telemetry/generated/infobar";
import { DocumentTranslationState } from "../../../../core/ts/shared-resources/models/DocumentTranslationState";

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
      onSelectTranslateTo: Event<(tabId: number) => void>;
      onSelectTranslateFrom: Event<(tabId: number) => void>;
      onInfoBarClosed: Event<(tabId: number) => void>;
      onNeverTranslateThisSite: Event<(tabId: number) => void>;
      onTranslateButtonPressed: Event<
        (tabId: number, from: string, to: string) => void
      >;
      onShowOriginalButtonPressed: Event<(tabId: number) => void>;
      onShowTranslatedButtonPressed: Event<(tabId: number) => void>;
    };
  };
}
const browserWithExperimentAPIs = (browser as any) as BrowserWithExperimentAPIs;

type NativeTranslateUiEventRef =
  | "onSelectTranslateTo"
  | "onSelectTranslateFrom"
  | "onInfoBarClosed"
  | "onNeverTranslateThisSite"
  | "onTranslateButtonPressed"
  | "onShowOriginalButtonPressed"
  | "onShowTranslatedButtonPressed";

export class NativeTranslateUiBroker {
  private extensionState: ExtensionState;
  private eventsToObserve: NativeTranslateUiEventRef[];

  constructor(extensionState) {
    this.extensionState = extensionState;
    this.eventsToObserve = [
      "onSelectTranslateTo",
      "onSelectTranslateFrom",
      "onInfoBarClosed",
      "onNeverTranslateThisSite",
      "onTranslateButtonPressed",
      "onShowOriginalButtonPressed",
      "onShowTranslatedButtonPressed",
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
    const nativeTranslateUiStateFromDocumentTranslationState = async (
      dts: SnapshotOutOfModel<DocumentTranslationState>,
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

    // React to document translation state changes
    onSnapshot(
      this.extensionState.$.documentTranslationStates,
      async (documentTranslationStates, _previousDocumentTranslationStates) => {
        const tabTopFrameStates = Object.keys(documentTranslationStates)
          .map(
            (tabAndFrameId: string) => documentTranslationStates[tabAndFrameId],
          )
          .filter(
            (dts: ModelInstanceData<DocumentTranslationState>) =>
              dts.frameId === 0,
          );
        for (const dts of tabTopFrameStates) {
          const { tabId } = dts;
          const uiState = await nativeTranslateUiStateFromDocumentTranslationState(
            dts,
          );
          browserWithExperimentAPIs.experiments.translateUi.setUiState(
            tabId,
            uiState,
          );
        }
        // TODO: check _previousDocumentTranslationStates for those that had something and now should be inactive
      },
    );
  }

  getFrameDocumentTranslationStatesByTabId(tabId) {
    const { extensionState } = this;
    const documentTranslationStates = extensionState.documentTranslationStates;
    const currentFrameDocumentTranslationStates = [];
    documentTranslationStates.forEach(
      (documentTranslationState: DocumentTranslationState) => {
        if (documentTranslationState.tabId === tabId) {
          currentFrameDocumentTranslationStates.push(documentTranslationState);
        }
      },
    );
    return currentFrameDocumentTranslationStates;
  }

  onSelectTranslateFrom(tabId) {
    console.debug("onSelectTranslateFrom", { tabId });
    Telemetry.global.record(() => changeLang.record(), "onSelectTranslateFrom");
    Telemetry.global.submit();
  }

  onSelectTranslateTo(tabId) {
    console.debug("onSelectTranslateTo", { tabId });
    Telemetry.global.submit();
  }

  onInfoBarClosed(tabId) {
    console.debug("onInfoBarClosed", { tabId });
    Telemetry.global.record(() => closed.record(), "onInfoBarClosed");
    Telemetry.global.submit();
  }

  onNeverTranslateThisSite(tabId) {
    console.debug("onNeverTranslateThisSite", { tabId });
    Telemetry.global.record(
      () => neverTranslateSite.record(),
      "onNeverTranslateThisSite",
    );
  }

  onTranslateButtonPressed(tabId, from, to) {
    console.debug("onTranslateButtonPressed", { tabId, from, to });
    Telemetry.global.record(
      () => translate.record(),
      "onTranslateButtonPressed",
    );

    this.getFrameDocumentTranslationStatesByTabId(tabId).forEach(
      (dts: DocumentTranslationState) => {
        this.extensionState.patchDocumentTranslationStateByFrameInfo(dts, [
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

  onShowOriginalButtonPressed(tabId) {
    console.debug("onShowOriginalButtonPressed", { tabId });
    this.getFrameDocumentTranslationStatesByTabId(tabId).forEach(
      (dts: DocumentTranslationState) => {
        this.extensionState.patchDocumentTranslationStateByFrameInfo(dts, [
          {
            op: "replace",
            path: ["showOriginal"],
            value: true,
          },
        ]);
      },
    );
  }

  onShowTranslatedButtonPressed(tabId) {
    console.debug("onShowTranslatedButtonPressed", { tabId });
    this.getFrameDocumentTranslationStatesByTabId(tabId).forEach(
      (dts: DocumentTranslationState) => {
        this.extensionState.patchDocumentTranslationStateByFrameInfo(dts, [
          {
            op: "replace",
            path: ["showOriginal"],
            value: false,
          },
        ]);
      },
    );
  }

  async stop() {
    Telemetry.global.submit();

    await browserWithExperimentAPIs.experiments.translateUi.stop();
    this.eventsToObserve.map(eventRef => {
      browserWithExperimentAPIs.experiments.translateUi[
        eventRef
      ].removeListener(this[eventRef] as any);
    });
  }
}
