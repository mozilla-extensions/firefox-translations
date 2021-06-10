/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import Glean from "@mozilla/glean/webext";
import { custom } from "./generated/pings";
import { config } from "../../../config";
import {
  fullPageTranslatedTime,
  fullPageTranslatedWps,
  modelDownloadTimeNum,
  modelLoadTimeNum,
  translationEngineTime,
  translationEngineWps,
  wordCount,
  wordCountVisibleInViewport,
} from "./generated/performance";
import {
  fromLang,
  toLang,
  firefoxClientId,
  extensionVersion,
  extensionBuildId,
  bergamotTranslatorVersion,
  systemMemory,
  cpuCount,
  cpuCoresCount,
  cpuVendor,
  cpuFamily,
  cpuModel,
  cpuStepping,
  cpuL2Cache,
  cpuL3Cache,
  cpuSpeed,
  cpuExtensions,
} from "./generated/metadata";
import {
  displayed,
  changeLang,
  closed,
  neverTranslateSite,
  translate,
  neverTranslateLang,
  notNow,
} from "./generated/infobar";
import { langMismatch, notSupported } from "./generated/service";
import { modelDownload, translation } from "./generated/errors";
import { browser as crossBrowser } from "webextension-polyfill-ts";
import { BERGAMOT_VERSION_FULL } from "../../../web-worker-scripts/translation-worker.js/bergamot-translator-version";

type TelemetryRecordingFunction = () => void;

export interface TranslationRelevantFxTelemetryMetrics {
  systemMemoryMb: number;
  systemCpuCount: number;
  systemCpuCores: number;
  systemCpuVendor: string;
  systemCpuFamily: number;
  systemCpuModel: number;
  systemCpuStepping: number;
  systemCpuL2cacheKB: number;
  systemCpuL3cacheKB: number;
  systemCpuSpeedMhz: number;
  systemCpuExtensions: string[];
}

/**
 * This class contains general telemetry initialization and helper code and synchronous telemetry-recording functions.
 *
 * Synchronous methods here is important, since it is the only way to guarantee that multiple Glean API calls are
 * executed sequentially and not interleaved with other asynchronous Telemetry recording.
 * For more information, see: https://github.com/mozilla-extensions/firefox-translations/pull/76#discussion_r602128568
 *
 * Glean.js guarantees zero exceptions, but our glue code or specific way of invoking Glean.js may result in exceptions.
 * For this reason we surround all code invoking Glean.js in try/catch blocks.
 *
 * Pings are grouped by tab id and submitted on specific triggers (see below), or after 1 minute of inactivity.
 *
 * The "1 minute" period can be overridden to facilitate testing by setting
 * the telemetryInactivityThresholdInSecondsOverride string argument at initialization.
 *
 * Submit triggers:
 * 1. Regular translation: infobar displayed -> translated pressed -> translation finished or error -> submit
 * 2. Switch language: infobar displayed -> switch source or target lang -> submit (further actions will be submitted in translation scenario)
 * 3. Reject: infobar displayed -> press never, not now or close -> submit
 * 4. No action: infobar displayed -> no action -> submit on timer after a period of inactivity.
 * 5. Language pair unsupported -> submit
 */
export class Telemetry {
  private initialized: boolean;
  private firefoxClientId: string;
  private telemetryInactivityThresholdInSeconds: number;
  private translationRelevantFxTelemetryMetrics: TranslationRelevantFxTelemetryMetrics;
  private extensionVersion: string;
  private queuedRecordingsByTabId: {
    [tabId: string]: TelemetryRecordingFunction[];
  } = {};
  private inactivityDispatchTimersByTabId: {
    [tabId: string]: number;
  } = {};
  public initialize(
    uploadEnabled: boolean,
    $firefoxClientId: string,
    telemetryInactivityThresholdInSecondsOverride: number,
  ) {
    const appId = config.telemetryAppId;
    this.setFirefoxClientId($firefoxClientId);
    const manifest = crossBrowser.runtime.getManifest();
    this.extensionVersion = manifest.version;
    try {
      Glean.initialize(appId, uploadEnabled, {
        debug: { logPings: config.telemetryDebugMode },
      });
      this.telemetryInactivityThresholdInSeconds = telemetryInactivityThresholdInSecondsOverride
        ? telemetryInactivityThresholdInSecondsOverride
        : 60;
      console.info(
        `Telemetry: initialization completed with application ID ${appId}. Inactivity threshold is set to ${this.telemetryInactivityThresholdInSeconds} seconds.`,
      );
      this.initialized = true;
    } catch (err) {
      console.error(`Telemetry initialization error`, err);
    }
  }

  public uploadEnabledPreferenceUpdated(uploadEnabled: boolean) {
    console.log(
      "Telemetry: communicating updated uploadEnabled preference to Glean.js",
      { uploadEnabled },
    );
    Glean.setUploadEnabled(uploadEnabled);
  }

  public setFirefoxClientId($firefoxClientId: string) {
    this.firefoxClientId = $firefoxClientId;
  }

  public setTranslationRelevantFxTelemetryMetrics(
    translationRelevantFxTelemetryMetrics: TranslationRelevantFxTelemetryMetrics,
  ) {
    this.translationRelevantFxTelemetryMetrics = translationRelevantFxTelemetryMetrics;
  }

  public recordCommonMetadata(from: string, to: string) {
    fromLang.set(from);
    toLang.set(to);
    firefoxClientId.set(this.firefoxClientId);
    extensionVersion.set(this.extensionVersion);
    extensionBuildId.set(config.extensionBuildId.substring(0, 100));
    bergamotTranslatorVersion.set(BERGAMOT_VERSION_FULL);
    if (this.translationRelevantFxTelemetryMetrics) {
      const {
        systemMemoryMb,
        systemCpuCount,
        systemCpuCores,
        systemCpuVendor,
        systemCpuFamily,
        systemCpuModel,
        systemCpuStepping,
        systemCpuL2cacheKB,
        systemCpuL3cacheKB,
        systemCpuSpeedMhz,
        systemCpuExtensions,
      } = this.translationRelevantFxTelemetryMetrics;
      systemMemory.set(systemMemoryMb);
      cpuCount.set(systemCpuCount);
      cpuCoresCount.set(systemCpuCores);
      cpuVendor.set(systemCpuVendor);
      cpuFamily.set(systemCpuFamily);
      cpuModel.set(systemCpuModel);
      cpuStepping.set(systemCpuStepping);
      cpuL2Cache.set(systemCpuL2cacheKB);
      cpuL3Cache.set(systemCpuL3cacheKB);
      cpuSpeed.set(systemCpuSpeedMhz);
      cpuExtensions.set(systemCpuExtensions.join(","));
    }
  }

  public onInfoBarDisplayed(tabId: number, from: string, to: string) {
    this.queueRecording(() => {
      displayed.record();
      this.recordCommonMetadata(from, to);
    }, tabId);
    this.updateInactivityTimerForAllTabs();
  }

  public onSelectTranslateFrom(tabId: number, newFrom: string, to: string) {
    this.queueRecording(() => {
      changeLang.record();
      this.recordCommonMetadata(newFrom, to);
    }, tabId);
    this.submitQueuedRecordings(tabId);
  }

  public onSelectTranslateTo(tabId: number, from: string, newTo: string) {
    this.queueRecording(() => {
      changeLang.record();
      this.recordCommonMetadata(from, newTo);
    }, tabId);
    this.submitQueuedRecordings(tabId);
  }

  public onInfoBarClosed(tabId: number, from: string, to: string) {
    this.queueRecording(() => {
      closed.record();
      this.recordCommonMetadata(from, to);
    }, tabId);
    this.submitQueuedRecordings(tabId);
  }

  public onNeverTranslateSelectedLanguage(
    tabId: number,
    from: string,
    to: string,
  ) {
    this.queueRecording(() => {
      neverTranslateLang.record();
      this.recordCommonMetadata(from, to);
    }, tabId);
    this.updateInactivityTimerForAllTabs();
  }

  public onNeverTranslateThisSite(tabId: number, from: string, to: string) {
    this.queueRecording(() => {
      neverTranslateSite.record();
      this.recordCommonMetadata(from, to);
    }, tabId);
    this.updateInactivityTimerForAllTabs();
  }

  public onShowOriginalButtonPressed(
    tabId: number,
    _from: string,
    _to: string,
  ) {
    this.updateInactivityTimerForAllTabs();
    // TODO?
  }

  public onShowTranslatedButtonPressed(
    tabId: number,
    _from: string,
    _to: string,
  ) {
    this.updateInactivityTimerForAllTabs();
    // TODO?
  }

  public onTranslateButtonPressed(tabId: number, from: string, to: string) {
    this.queueRecording(() => {
      translate.record();
      this.recordCommonMetadata(from, to);
    }, tabId);
    this.updateInactivityTimerForAllTabs();
  }

  public onNotNowButtonPressed(tabId: number, from: string, to: string) {
    this.queueRecording(() => {
      notNow.record();
      this.recordCommonMetadata(from, to);
    }, tabId);
    this.updateInactivityTimerForAllTabs();
  }

  /**
   * A translation attempt starts when a translation is requested in a
   * specific tab and ends when all translations in that tab has completed
   */
  public onTranslationFinished(
    tabId: number,
    from: string,
    to: string,
    timeToFullPageTranslatedMs: number,
    timeToFullPageTranslatedWordsPerSecond: number,
    modelDownloadTimeMs: number,
    modelLoadTimeMs: number,
    translationEngineTimeMs: number,
    translationEngineWordsPerSecond: number,
    $wordCount: number,
    $wordCountVisibleInViewport: number,
  ) {
    this.queueRecording(() => {
      fullPageTranslatedTime.setRawNanos(timeToFullPageTranslatedMs * 1000000);
      fullPageTranslatedWps.set(timeToFullPageTranslatedWordsPerSecond);
      modelDownloadTimeNum.setRawNanos(modelDownloadTimeMs * 1000000);
      modelLoadTimeNum.setRawNanos(modelLoadTimeMs * 1000000);
      translationEngineTime.setRawNanos(translationEngineTimeMs * 1000000);
      translationEngineWps.set(translationEngineWordsPerSecond);
      wordCount.set($wordCount);
      wordCountVisibleInViewport.set($wordCountVisibleInViewport);
      this.recordCommonMetadata(from, to);
    }, tabId);
    this.submitQueuedRecordings(tabId);
  }

  public onTranslationStatusOffer(tabId: number, from: string, to: string) {
    this.queueRecording(() => {
      langMismatch.add(1);
      this.recordCommonMetadata(from, to);
    }, tabId);
    this.updateInactivityTimerForAllTabs();
  }

  public onTranslationStatusTranslationUnsupported(
    tabId: number,
    from: string,
    to: string,
  ) {
    this.queueRecording(() => {
      notSupported.add(1);
      this.recordCommonMetadata(from, to);
    }, tabId);
    this.submitQueuedRecordings(tabId);
  }

  public onModelLoadErrorOccurred(tabId: number, from: string, to: string) {
    this.submitQueuedRecordings(tabId);
    // TODO?
  }

  public onModelDownloadErrorOccurred(tabId: number, from: string, to: string) {
    this.queueRecording(() => {
      modelDownload.add(1);
      this.recordCommonMetadata(from, to);
    }, tabId);
    this.submitQueuedRecordings(tabId);
  }

  public onTranslationErrorOccurred(tabId: number, from: string, to: string) {
    this.queueRecording(() => {
      translation.add(1);
      this.recordCommonMetadata(from, to);
    }, tabId);
    this.submitQueuedRecordings(tabId);
  }

  public onOtherErrorOccurred(tabId: number, from: string, to: string) {
    this.submitQueuedRecordings(tabId);
    // TODO?
  }

  /**
   * Submits all collected metrics in a custom ping.
   */
  public queueRecording = (
    telemetryRecordingFunction: () => void,
    tabId: number,
  ) => {
    if (!this.initialized) {
      console.warn(
        "Telemetry: ignoring ping that was submitted before Telemetry was initialized",
      );
      return;
    }
    const tabIdString = String(tabId);
    if (!this.queuedRecordingsByTabId[tabIdString]) {
      this.queuedRecordingsByTabId[tabIdString] = [];
    }
    this.queuedRecordingsByTabId[tabIdString].push(telemetryRecordingFunction);
    console.info(`Telemetry: Queued a recording in tab ${tabId}`);
  };

  public updateInactivityTimerForTab = (tabId: number | string) => {
    const tabIdString = String(tabId);
    this.clearInactivityTimerForTab(tabId);
    // Submit queued recordings after a period of inactivity
    this.inactivityDispatchTimersByTabId[tabIdString] = <number>(
      (<unknown>setTimeout(() => {
        this.submitQueuedRecordings(tabIdString);
      }, this.telemetryInactivityThresholdInSeconds * 1000))
    );
    // console.debug(`Telemetry: Inactivity timer ${this.inactivityDispatchTimersByTabId[tabIdString]} for tab ${tabId} set to fire in ${this.telemetryInactivityThresholdInSeconds} seconds.`, new Error())
  };

  public updateInactivityTimerForAllTabs = () => {
    Object.keys(this.queuedRecordingsByTabId).forEach((tabId: string) => {
      this.updateInactivityTimerForTab(tabId);
    });
  };

  public clearInactivityTimerForTab = (tabId: number | string) => {
    const tabIdString = String(tabId);
    if (this.inactivityDispatchTimersByTabId[tabIdString]) {
      // console.debug(`Telemetry: Inactivity timer ${this.inactivityDispatchTimersByTabId[tabIdString]} for tab ${tabId} cleared.`)
      clearTimeout(this.inactivityDispatchTimersByTabId[tabIdString]);
      delete this.inactivityDispatchTimersByTabId[tabIdString];
    }
  };

  public submitQueuedRecordings(tabId: number | string) {
    const tabIdString = String(tabId);
    const recordings: TelemetryRecordingFunction[] = this
      .queuedRecordingsByTabId[tabIdString];
    if (recordings.length === 0) {
      // console.debug(`Telemetry: Submit of 0 recordings from tab ${tabId} requested. Ignoring.`)
      return;
    }
    delete this.queuedRecordingsByTabId[tabIdString];
    this.queuedRecordingsByTabId[tabIdString] = [];
    this.clearInactivityTimerForTab(tabId);
    try {
      recordings.forEach(telemetryRecordingFunction => {
        telemetryRecordingFunction();
      });
      custom.submit();
      console.info(
        `Telemetry: A ping based on ${recordings.length} recordings for tab ${tabId} have been dispatched to Glean.js`,
      );
    } catch (err) {
      console.error(`Telemetry dispatch error`, err);
    }
  }

  public async cleanup() {
    // Cancel ongoing timers
    Object.keys(this.inactivityDispatchTimersByTabId).forEach(
      (tabId: string) => {
        this.clearInactivityTimerForTab(tabId);
      },
    );
    // Make sure to send buffered telemetry events
    Object.keys(this.queuedRecordingsByTabId).forEach((tabId: string) => {
      this.submitQueuedRecordings(tabId);
    });
  }
}

// Expose singleton instances
export const telemetry = new Telemetry();
