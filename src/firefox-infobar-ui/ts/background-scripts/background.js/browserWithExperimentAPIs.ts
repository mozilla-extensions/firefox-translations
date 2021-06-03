import { browser as crossBrowser, Events } from "webextension-polyfill-ts";
import Event = Events.Event;
import { TranslationRelevantFxTelemetryMetrics } from "../../../../core/ts/background-scripts/background.js/telemetry/Telemetry";
import { NativeTranslateUiState } from "./NativeTranslateUiBroker";

type StandardInfobarInteractionEvent = Event<
  (tabId: number, from: string, to: string) => void
>;

type browserInterface = typeof crossBrowser;
interface BrowserWithExperimentAPIs extends browserInterface {
  experiments: {
    telemetryEnvironment: {
      getTranslationRelevantFxTelemetryMetrics: () => Promise<
        TranslationRelevantFxTelemetryMetrics
      >;
    };
    telemetryPreferences: {
      onUploadEnabledPrefChange: Event<() => void>;
      onCachedClientIDPrefChange: Event<() => void>;
      getUploadEnabledPref: () => Promise<boolean>;
      getCachedClientIDPref: () => Promise<string>;
    };
    extensionPreferences: {
      getTelemetryInactivityThresholdInSecondsOverridePref: () => Promise<
        number
      >;
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
export const browserWithExperimentAPIs = (browser as any) as BrowserWithExperimentAPIs;
