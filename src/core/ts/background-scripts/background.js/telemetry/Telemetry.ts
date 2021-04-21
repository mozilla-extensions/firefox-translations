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
 */
export class Telemetry {
  constructor() {
    const appId = config.telemetryAppId;
    Glean.initialize(appId, true, {
      debug: { logPings: config.telemetryDebugMode },
    });
    console.info(
      `Telemetry: initialization completed with application ID ${appId}.`,
    );
  }

  public onInfoBarDisplayed(tabId: number, from: string, to: string) {
    fromLang.set(from);
    toLang.set(to);
    displayed.record();
    this.submit();
  }

  public onSelectTranslateFrom(tabId: number, newFrom: string, to: string) {
    fromLang.set(newFrom);
    toLang.set(to);
    changeLang.record();
    this.submit();
  }

  public onSelectTranslateTo(tabId: number, from: string, newTo: string) {
    fromLang.set(from);
    toLang.set(newTo);
    changeLang.record();
    this.submit();
  }

  public onInfoBarClosed(tabId: number, from: string, to: string) {
    fromLang.set(from);
    toLang.set(to);
    closed.record();
    this.submit();
  }

  public onNeverTranslateSelectedLanguage(
    tabId: number,
    from: string,
    to: string,
  ) {
    fromLang.set(from);
    toLang.set(to);
    neverTranslateLang.record();
    this.submit();
  }

  public onNeverTranslateThisSite(tabId: number, from: string, to: string) {
    fromLang.set(from);
    toLang.set(to);
    neverTranslateSite.record();
    this.submit();
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
    fromLang.set(from);
    toLang.set(to);
    translate.record();
    this.submit();
  }

  public onNotNowButtonPressed(tabId: number, from: string, to: string) {
    fromLang.set(from);
    toLang.set(to);
    notNow.record();
    this.submit();
  }

  /**
   * A translation attempt starts when a translation is requested in a
   * specific tab and ends when all translations in that tab has completed
   */
  public onTranslationAttemptConcluded(
    from: string,
    to: string,
    modelLoadWallTimeMs: number,
    translationWallTimeMs: number,
    $wordsPerSecond: number,
  ) {
    fromLang.set(from);
    toLang.set(to);
    modelLoadTime.set(String(modelLoadWallTimeMs));
    translationTime.set(String(translationWallTimeMs));
    wordsPerSecond.set(String(Math.round($wordsPerSecond)));
    this.submit();
  }

  /**
   * Submits all collected metrics in a custom ping.
   * TODO: Always include the fx telemetry id uuid metric in pings
   */
  public submit = () => {
    try {
      custom.submit();
      console.info("Telemetry: the ping is submitted.");
    } catch (err) {
      // telemetry error shouldn't crash the app
      console.error(`Telemetry: Error. The ping was not submitted.`, err);
    }
  };
}

// Expose singleton instances
export const telemetry = new Telemetry();
