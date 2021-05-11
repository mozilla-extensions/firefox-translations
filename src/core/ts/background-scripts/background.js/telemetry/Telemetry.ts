/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import Glean from "@mozilla/glean/webext";
import { custom } from "./generated/pings";
import { config } from "../../../config";
import {
  modelLoadTime,
  translationTime,
  wordsPerSecond,
  modelDownloadTime,
} from "./generated/performance";
import { fromLang, toLang, firefoxClientId } from "./generated/metadata";
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
import { nanoid } from "nanoid";

type TelemetryRecordingFunction = () => void;

/**
 * This class contains general telemetry initialization and helper code and synchronous telemetry-recording functions.
 *
 * Synchronous methods here is important, since it is the only way to guarantee that multiple Glean API calls are
 * executed sequentially and not interleaved with other asynchronous Telemetry recording.
 * For more information, see: https://github.com/mozilla-extensions/bergamot-browser-extension/pull/76#discussion_r602128568
 *
 * Glean.js guarantees zero exceptions, but our glue code or specific way of invoking Glean.js may result in exceptions.
 * For this reason we surround all code invoking Glean.js in try/catch blocks.
 *
 * Pings are grouped by from/to metadata combination and submitted every 5 seconds in order to avoid
 * sending one ping per application event.
 */
export class Telemetry {
  private initialized: boolean;
  private firefoxClientId: string;
  private queuedPingsByMetadataHash: {
    [metadataHash: string]: TelemetryRecordingFunction[];
  } = {};
  public initialize(uploadEnabled: boolean, $firefoxClientId: string) {
    const appId = config.telemetryAppId;
    this.setFirefoxClientId($firefoxClientId);
    try {
      Glean.initialize(appId, uploadEnabled, {
        debug: { logPings: config.telemetryDebugMode },
      });
      console.info(
        `Telemetry: initialization completed with application ID ${appId}.`,
      );

      // Submit queued pings every 5 seconds
      const periodInSeconds = 5;
      console.debug(
        `Setting up the "${this.periodicAlarmName}" periodic callback to fire every ${periodInSeconds} seconds`,
      );
      const alarmListener = async alarm => {
        if (alarm.name === this.periodicAlarmName) {
          console.debug(
            `The "${this.periodicAlarmName}" periodic callback fired`,
          );
          await this.submitQueuedPings();
        }
      };
      browser.alarms.onAlarm.addListener(alarmListener);
      browser.alarms.create(this.periodicAlarmName, {
        periodInMinutes: periodInSeconds / 60,
      });

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

  public recordCommonMetadata(from: string, to: string) {
    fromLang.set(from);
    toLang.set(to);
    firefoxClientId.set(this.firefoxClientId);
  }

  public onInfoBarDisplayed(tabId: number, from: string, to: string) {
    this.queuePing(
      () => {
        displayed.record();
        this.recordCommonMetadata(from, to);
      },
      { from, to },
    );
  }

  public onSelectTranslateFrom(tabId: number, newFrom: string, to: string) {
    this.queuePing(
      () => {
        changeLang.record();
        this.recordCommonMetadata(newFrom, to);
      },
      { from: newFrom, to },
    );
  }

  public onSelectTranslateTo(tabId: number, from: string, newTo: string) {
    this.queuePing(
      () => {
        changeLang.record();
        this.recordCommonMetadata(from, newTo);
      },
      { from, to: newTo },
    );
  }

  public onInfoBarClosed(tabId: number, from: string, to: string) {
    this.queuePing(
      () => {
        closed.record();
        this.recordCommonMetadata(from, to);
      },
      { from, to },
    );
  }

  public onNeverTranslateSelectedLanguage(
    tabId: number,
    from: string,
    to: string,
  ) {
    this.queuePing(
      () => {
        neverTranslateLang.record();
        this.recordCommonMetadata(from, to);
      },
      { from, to },
    );
  }

  public onNeverTranslateThisSite(tabId: number, from: string, to: string) {
    this.queuePing(
      () => {
        neverTranslateSite.record();
        this.recordCommonMetadata(from, to);
      },
      { from, to },
    );
  }

  public onShowOriginalButtonPressed(
    _tabId: number,
    _from: string,
    _to: string,
  ) {
    // TODO?
  }

  public onShowTranslatedButtonPressed(
    _tabId: number,
    _from: string,
    _to: string,
  ) {
    // TODO?
  }

  public onTranslateButtonPressed(tabId: number, from: string, to: string) {
    this.queuePing(
      () => {
        translate.record();
        this.recordCommonMetadata(from, to);
      },
      { from, to },
    );
  }

  public onNotNowButtonPressed(tabId: number, from: string, to: string) {
    this.queuePing(
      () => {
        notNow.record();
        this.recordCommonMetadata(from, to);
      },
      { from, to },
    );
  }

  /**
   * A translation attempt starts when a translation is requested in a
   * specific tab and ends when all translations in that tab has completed
   */
  public onTranslationFinished(
    from: string,
    to: string,
    modelLoadWallTimeMs: number,
    translationWallTimeMs: number,
    $wordsPerSecond: number,
    $modelDownloadTime: number,
  ) {
    this.queuePing(
      () => {
        modelLoadTime.set(String(modelLoadWallTimeMs));
        translationTime.set(String(translationWallTimeMs));
        wordsPerSecond.set(String(Math.round($wordsPerSecond)));
        modelDownloadTime.set(String(Math.round($modelDownloadTime)));
        this.recordCommonMetadata(from, to);
      },
      {
        from,
        to,
        modelLoadWallTimeMs,
        translationWallTimeMs,
        $wordsPerSecond,
        $modelDownloadTime,
        // Force this ping not to be grouped with other pings since there are no events nor counters which would
        // allows us to distinguish translation finished events with identical metadata from each other
        uuid: nanoid(),
      },
    );
  }

  public onTranslationStatusOffer(from: string, to: string) {
    this.queuePing(
      () => {
        langMismatch.add(1);
        this.recordCommonMetadata(from, to);
      },
      { from, to },
    );
  }

  public onTranslationStatusTranslationUnsupported(from: string, to: string) {
    this.queuePing(
      () => {
        notSupported.add(1);
        this.recordCommonMetadata(from, to);
      },
      { from, to },
    );
  }

  public onModelLoadErrorOccurred(from: string, to: string) {
    // TODO?
  }

  public onModelDownloadErrorOccurred(from: string, to: string) {
    this.queuePing(
      () => {
        modelDownload.add(1);
        this.recordCommonMetadata(from, to);
      },
      { from, to },
    );
  }

  public onTranslationErrorOccurred(from: string, to: string) {
    this.queuePing(
      () => {
        translation.add(1);
        this.recordCommonMetadata(from, to);
      },
      { from, to },
    );
  }

  public onOtherErrorOccurred(from: string, to: string) {
    // TODO?
  }

  /**
   * Submits all collected metrics in a custom ping.
   */
  public queuePing = (
    telemetryRecordingFunction: () => void,
    metadata: { [k: string]: any },
  ) => {
    if (!this.initialized) {
      console.warn(
        "Telemetry: ignoring ping that was submitted before Telemetry was initialized",
      );
      return;
    }
    const metadataHash = JSON.stringify({
      ...metadata,
      firefoxClientId: this.firefoxClientId,
    });
    if (!this.queuedPingsByMetadataHash[metadataHash]) {
      this.queuedPingsByMetadataHash[metadataHash] = [];
    }
    this.queuedPingsByMetadataHash[metadataHash].push(
      telemetryRecordingFunction,
    );
    console.info(`Telemetry: Queued a ping for metadata ${metadataHash}`);
  };

  private periodicAlarmName = `${browser.runtime.id}:periodicTelemetryDispatch`;
  public submitQueuedPings() {
    Object.keys(this.queuedPingsByMetadataHash).forEach(
      (metadataHash: string) => {
        const pings: TelemetryRecordingFunction[] = this
          .queuedPingsByMetadataHash[metadataHash];
        try {
          pings.forEach(telemetryRecordingFunction => {
            telemetryRecordingFunction();
          });
          custom.submit();
          console.info(
            `Telemetry: ${pings.length} pings for metadata ${metadataHash} have been dispatched to Glean.js`,
          );
        } catch (err) {
          console.error(`Telemetry dispatch error`, err);
        } finally {
          // We only attempt to dispatch pings once, regardless of errors encountered
          delete this.queuedPingsByMetadataHash[metadataHash];
        }
      },
    );
  }

  public async cleanup() {
    await browser.alarms.clear(this.periodicAlarmName);
    // Make sure to send buffered telemetry events
    this.submitQueuedPings();
  }
}

// Expose singleton instances
export const telemetry = new Telemetry();
