/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import Glean from "@mozilla/glean/webext";
import { custom } from "./generated/pings";
import { toLang, fromLang } from "./generated/metadata";

export class Telemetry {
  private static _instance = null;

  constructor() {
    Glean.initialize("bergamot-extension", true, { debug: { logPings: true } });
  }

  public static global() {
    if (Telemetry._instance == null) {
      Telemetry._instance = new Telemetry();
    }
    return Telemetry._instance;
  }

  public setUploadEnabled(val: boolean) {
    Glean.setUploadEnabled(val);
  }

  public record = (
    metric_func: Function,
    lang_from: string,
    lang_to: string,
  ) => {
    try {
      toLang.set(lang_to);
      fromLang.set(lang_from);

      metric_func();

      custom.submit();
    } catch (err) {
      // telemetry error shouldn't crash the app
      console.error(`Telemetry error: a metric was not sent`, err);
    }
  };
}
