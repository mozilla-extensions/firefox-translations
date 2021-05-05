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

/**
 * This class contains general telemetry initialization and helper code and synchronous telemetry-recording functions.
 *
 * Synchronous methods here is important, since it is the only way to guarantee that multiple Glean API calls are
 * executed sequentially and not interleaved with other asynchronous Telemetry recording.
 * For more information, see: https://github.com/mozilla-extensions/bergamot-browser-extension/pull/76#discussion_r602128568
 *
 * Glean.js guarantees zero exceptions, but our glue code or specific way of invoking Glean.js may result in exceptions.
 * For this reason we surround all code invoking Glean.js in try/catch blocks.
 */
export class Telemetry {
  private initialized: boolean;
  private firefoxClientId: string;
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

  public onInfoBarDisplayed(tabId: number, from: string, to: string) {
    this.submit(() => {
      fromLang.set(from);
      toLang.set(to);
      displayed.record();
      // Always include the fx telemetry id uuid metric in pings
      firefoxClientId.set(this.firefoxClientId);
    });
  }

  public onSelectTranslateFrom(tabId: number, newFrom: string, to: string) {
    this.submit(() => {
      fromLang.set(newFrom);
      toLang.set(to);
      changeLang.record();
      // Always include the fx telemetry id uuid metric in pings
      firefoxClientId.set(this.firefoxClientId);
    });
  }

  public onSelectTranslateTo(tabId: number, from: string, newTo: string) {
    this.submit(() => {
      fromLang.set(from);
      toLang.set(newTo);
      changeLang.record();
      // Always include the fx telemetry id uuid metric in pings
      firefoxClientId.set(this.firefoxClientId);
    });
  }

  public onInfoBarClosed(tabId: number, from: string, to: string) {
    this.submit(() => {
      fromLang.set(from);
      toLang.set(to);
      closed.record();
      // Always include the fx telemetry id uuid metric in pings
      firefoxClientId.set(this.firefoxClientId);
    });
  }

  public onNeverTranslateSelectedLanguage(
    tabId: number,
    from: string,
    to: string,
  ) {
    this.submit(() => {
      fromLang.set(from);
      toLang.set(to);
      neverTranslateLang.record();
      // Always include the fx telemetry id uuid metric in pings
      firefoxClientId.set(this.firefoxClientId);
    });
  }

  public onNeverTranslateThisSite(tabId: number, from: string, to: string) {
    this.submit(() => {
      fromLang.set(from);
      toLang.set(to);
      neverTranslateSite.record();
      // Always include the fx telemetry id uuid metric in pings
      firefoxClientId.set(this.firefoxClientId);
    });
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
    this.submit(() => {
      fromLang.set(from);
      toLang.set(to);
      translate.record();
      // Always include the fx telemetry id uuid metric in pings
      firefoxClientId.set(this.firefoxClientId);
    });
  }

  public onNotNowButtonPressed(tabId: number, from: string, to: string) {
    this.submit(() => {
      fromLang.set(from);
      toLang.set(to);
      notNow.record();
      // Always include the fx telemetry id uuid metric in pings
      firefoxClientId.set(this.firefoxClientId);
    });
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
    this.submit(() => {
      fromLang.set(from);
      toLang.set(to);
      modelLoadTime.set(String(modelLoadWallTimeMs));
      translationTime.set(String(translationWallTimeMs));
      wordsPerSecond.set(String(Math.round($wordsPerSecond)));
      modelDownloadTime.set(String(Math.round($modelDownloadTime)));
      // Always include the fx telemetry id uuid metric in pings
      firefoxClientId.set(this.firefoxClientId);
    });
  }

  public onTranslationStatusOffer(from: string, to: string) {
    this.submit(() => {
      fromLang.set(from);
      toLang.set(to);
      langMismatch.add(1);
      // Always include the fx telemetry id uuid metric in pings
      firefoxClientId.set(this.firefoxClientId);
    });
  }

  public onTranslationStatusTranslationUnsupported(from: string, to: string) {
    this.submit(() => {
      fromLang.set(from);
      toLang.set(to);
      notSupported.add(1);
      // Always include the fx telemetry id uuid metric in pings
      firefoxClientId.set(this.firefoxClientId);
    });
  }

  /**
   * Submits all collected metrics in a custom ping.
   */
  public submit = (
    telemetryRecordingFunction: false | (() => void) = false,
  ) => {
    if (!this.initialized) {
      console.warn(
        "Telemetry: ignoring ping that was submitted before Telemetry was initialized",
      );
      return;
    }
    try {
      if (telemetryRecordingFunction) {
        telemetryRecordingFunction();
      }
      custom.submit();
      console.info("Telemetry: the ping has been dispatched to Glean.js");
    } catch (err) {
      console.error(`Telemetry dispatch error`, err);
    }
  };
}

// Expose singleton instances
export const telemetry = new Telemetry();
