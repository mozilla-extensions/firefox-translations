/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import Glean from "@mozilla/glean/webext";
import { custom } from "./generated/pings";
import { config } from "../../../config";

/*
    Telemetry.global.record(() => fromLang.set(from), "fromLang");
    Telemetry.global.record(() => toLang.set(to), "toLang");

    // todo: replace to timespan when it is supported
    Telemetry.global.record(
      () => modelLoadTime.set(String(loadModelEnd - loadModelStart)),
      "loadModelTime",
    );

    // todo: replace to timespan when it is supported
    Telemetry.global.record(
      () => translationTime.set(String(timeSpentMs)),
      "translateTime",
    );

    // todo: replace to quantity when it is supported
    Telemetry.global.record(
      () => wordsPerSecond.set(String(speed)),
      "translateSpeed",
    );

    Telemetry.global.submit();
 */

export class Telemetry {
  private static _instance = null;
  private _metricsToSubmit;

  constructor() {
    const appId = config.telemetryAppId;
    Glean.initialize(appId, true, {
      debug: { logPings: config.telemetryDebugMode },
    });
    this._metricsToSubmit = 0;
    console.info(
      `Telemetry: initialization completed with application ID ${appId}.`,
    );
  }

  /**
   * Provides access to Telemetry singleton.
   */
  public static get global(): Telemetry {
    if (Telemetry._instance === null) {
      Telemetry._instance = new Telemetry();
    }
    return Telemetry._instance;
  }

  /**
   * Enables uploading Glean metrics to telemetry server.
   * @param val bool
   */
  public setUploadEnabled(val: boolean) {
    Glean.setUploadEnabled(val);
  }

  /**
   * Collects a telemetry metric or event.
   * @param metricFunc The function which calls one of the generated metrics or events.
   * @param name Optional. The name of the metrics to show in console for debug purposes
   */
  public record = (metricFunc: Function, name?: string) => {
    try {
      metricFunc();
      this._metricsToSubmit += 1;
      console.debug(
        `Telemetry: metric recorded, name: ${name}, total not submitted: ${this._metricsToSubmit}`,
      );
    } catch (err) {
      // telemetry error shouldn't crash the app
      console.error(`Telemetry: Error. a metric was not recorded.`, err);
    }
  };

  /**
   * Submits all collected metrics in a custom ping.
   */
  public submit = () => {
    try {
      if (this._metricsToSubmit > 0) {
        custom.submit();
        this._metricsToSubmit = 0;
        console.info("Telemetry: the ping is submitted.");
      } else {
        console.warn(
          "Telemetry: there were no metrics recorded, the ping is not submitted.",
        );
      }
    } catch (err) {
      // telemetry error shouldn't crash the app
      console.error(`Telemetry: Error. The ping was not submitted.`, err);
    }
  };
}
