import {
  ModelInstanceData,
  onSnapshot,
  SnapshotOutOfModel,
} from "mobx-keystone";
import { DocumentTranslationState } from "../../../shared-resources/models/DocumentTranslationState";
import {
  browser as crossBrowser,
  browser,
  Events,
} from "webextension-polyfill-ts";
import { ExtensionState } from "../../../shared-resources/models/ExtensionState";
import { TranslationStatus } from "../../../shared-resources/models/BaseTranslationState";
import { config } from "../../../config";
import Event = Events.Event;

enum NativeTranslateUiStateInfobarState {
  STATE_OFFER = 0,
  STATE_TRANSLATING = 1,
  STATE_TRANSLATED = 2,
  STATE_ERROR = 3,
  STATE_UNAVAILABLE = 4,
}

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
  detectedLanguage: string;
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

    // Boils down extension state to the subset relevant for the native translate ui
    const nativeTranslateUiStateFromDocumentTranslationState = (
      dts: SnapshotOutOfModel<DocumentTranslationState>,
    ): NativeTranslateUiState => {
      const infobarState = nativeTranslateUiStateInfobarStateFromTranslationStatus(
        dts.translationStatus,
      );
      return {
        detectedLanguage: dts.detectedLanguageResults
          ? dts.detectedLanguageResults.language
          : undefined,
        infobarState,
        translatedFrom: dts.translateFrom,
        translatedTo: dts.translateTo,
        originalShown: dts.showOriginal,
        // Additionally, since supported source and target languages are only supported in specific pairs, keep these dynamic:
        supportedSourceLanguages: [
          ...new Set(config.supportedLanguagePairs.map(lp => lp[0])),
        ],
        supportedTargetLanguages: [
          ...new Set(config.supportedLanguagePairs.map(lp => lp[1])),
        ],
      };
    };
    const nativeTranslateUiStateInfobarStateFromTranslationStatus = (
      translationStatus: TranslationStatus,
    ): NativeTranslateUiStateInfobarState => {
      switch (translationStatus) {
        case TranslationStatus.UNAVAILABLE:
          return NativeTranslateUiStateInfobarState.STATE_UNAVAILABLE;
        case TranslationStatus.DETECTING_LANGUAGE:
          return NativeTranslateUiStateInfobarState.STATE_UNAVAILABLE;
        case TranslationStatus.LANGUAGE_NOT_DETECTED:
          return NativeTranslateUiStateInfobarState.STATE_OFFER;
        case TranslationStatus.SOURCE_LANGUAGE_UNDERSTOOD:
          return NativeTranslateUiStateInfobarState.STATE_UNAVAILABLE;
        case TranslationStatus.DETECTED_LANGUAGE_UNSUPPORTED:
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
    };

    // React to document translation state changes
    onSnapshot(
      this.extensionState.$.documentTranslationStates,
      async (documentTranslationStates, previousDocumentTranslationStates) => {
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
          const uiState = nativeTranslateUiStateFromDocumentTranslationState(
            dts,
          );
          browserWithExperimentAPIs.experiments.translateUi.setUiState(
            tabId,
            uiState,
          );
        }
        // TODO: check previousDocumentTranslationStates for those that had something and now should be inactive
      },
    );
  }

  onSelectTranslateTo(foo) {
    console.log("onSelectTranslateTo", { foo });
  }

  onSelectTranslateFrom(foo) {
    console.log("onSelectTranslateFrom", { foo });
  }

  onInfoBarClosed(foo) {
    console.log("onInfoBarClosed", { foo });
  }

  onNeverTranslateThisSite(foo) {
    console.log("onNeverTranslateThisSite", { foo });
  }

  onTranslateButtonPressed(tabId, from, to) {
    console.log("onTranslateButtonPressed", { tabId, from, to });

    const { extensionState } = this;

    // Extract the document translation states that relate to the currently opened tab
    const documentTranslationStates = extensionState.documentTranslationStates;
    const currentFrameDocumentTranslationStates = [];
    documentTranslationStates.forEach(
      (documentTranslationState: DocumentTranslationState) => {
        if (documentTranslationState.tabId === tabId) {
          currentFrameDocumentTranslationStates.push(documentTranslationState);
        }
      },
    );

    currentFrameDocumentTranslationStates.forEach(
      (dts: DocumentTranslationState) => {
        extensionState.patchDocumentTranslationStateByFrameInfo(dts, [
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

  onShowOriginalButtonPressed(foo) {
    console.log("onShowOriginalButtonPressed", { foo });
  }

  onShowTranslatedButtonPressed(foo) {
    console.log("onShowTranslatedButtonPressed", { foo });
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
