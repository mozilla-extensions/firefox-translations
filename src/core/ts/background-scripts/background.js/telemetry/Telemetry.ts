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
  closed,
  changeLang,
  neverTranslateSite,
  translate,
  // displayed,
  // neverTranslateLang,
  // notNow,
} from "./generated/infobar";
import { nanoid } from "nanoid";

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

  public onSelectTranslateFrom(tabId: number) {
    changeLang.record();
    this.submit();
  }

  public onSelectTranslateTo(tabId: number) {
    changeLang.record();
    this.submit();
  }

  public onInfoBarClosed(tabId: number) {
    closed.record();
    this.submit();
  }

  public onNeverTranslateThisSite(tabId: number) {
    neverTranslateSite.record();
    this.submit();
  }

  public onTranslateButtonPressed(tabId: number, from: string, to: string) {
    fromLang.set(from);
    toLang.set(to);
    translate.record();
    this.submit();
  }

  public onShowOriginalButtonPressed(tabId: number) {
    // TODO?
  }

  public onShowTranslatedButtonPressed(tabId: number) {
    // TODO?
  }

  /**
   * A translation attempt starts when a translation is requested in a
   * specific tab and ends when all translations in that tab has completed
   */
  public async onTranslationAttemptConcluded(
    from: string,
    to: string,
    $modelLoadTime: number,
    $translationTime: number,
    $wordsPerSecond: number,
    beforeSubmit: () => Promise<void> = undefined,
  ) {
    fromLang.set(from);
    toLang.set(to);
    modelLoadTime.set(String($modelLoadTime));
    translationTime.set(String($translationTime));
    wordsPerSecond.set(String($wordsPerSecond));
    if (beforeSubmit) {
      await beforeSubmit();
    }
    this.submit();
  }

  /**
   * Submits all collected metrics in a custom ping.
   */
  public submit = () => {
    try {
      // TODO: Always include the fx telemetry id string metric in pings
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
