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
} from "./generated/performance";
import { fromLang, toLang } from "./generated/metadata";
import {
  displayed,
  changeLang,
  closed,
  neverTranslateSite,
  translate,
  neverTranslateLang,
  notNow,
} from "./generated/infobar";

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
  constructor() {
    const appId = config.telemetryAppId;
    try {
      Glean.initialize(appId, true, {
        debug: { logPings: config.telemetryDebugMode },
      });
      console.info(
        `Telemetry: initialization completed with application ID ${appId}.`,
      );
    } catch (err) {
      console.error(`Telemetry initialization error`, err);
    }
  }

  public onInfoBarDisplayed(tabId: number, from: string, to: string) {
    this.submit(() => {
      fromLang.set(from);
      toLang.set(to);
      displayed.record();
    });
  }

  public onSelectTranslateFrom(tabId: number, newFrom: string, to: string) {
    this.submit(() => {
      fromLang.set(newFrom);
      toLang.set(to);
      changeLang.record();
    });
  }

  public onSelectTranslateTo(tabId: number, from: string, newTo: string) {
    this.submit(() => {
      fromLang.set(from);
      toLang.set(newTo);
      changeLang.record();
    });
  }

  public onInfoBarClosed(tabId: number, from: string, to: string) {
    this.submit(() => {
      fromLang.set(from);
      toLang.set(to);
      closed.record();
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
    });
  }

  public onNeverTranslateThisSite(tabId: number, from: string, to: string) {
    this.submit(() => {
      fromLang.set(from);
      toLang.set(to);
      neverTranslateSite.record();
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
    });
  }

  public onNotNowButtonPressed(tabId: number, from: string, to: string) {
    this.submit(() => {
      fromLang.set(from);
      toLang.set(to);
      notNow.record();
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
  ) {
    this.submit(() => {
      fromLang.set(from);
      toLang.set(to);
      modelLoadTime.set(String(modelLoadWallTimeMs));
      translationTime.set(String(translationWallTimeMs));
      wordsPerSecond.set(String(Math.round($wordsPerSecond)));
    });
  }

  /**
   * Submits all collected metrics in a custom ping.
   * TODO: Always include the fx telemetry id uuid metric in pings
   */
  public submit = (
    telemetryRecordingFunction: false | (() => void) = false,
  ) => {
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
