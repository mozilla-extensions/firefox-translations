/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import Glean from "@mozilla/glean/dist/webext";
import errors from "./generated/errors";
import infobar from "./generated/infobar";
import metadata from "./generated/metadata";
import performance from "./generated/performance";
import service from "./generated/service";
import test from "./generated/test";
// @ts-ignore
import { custom } from "./generated/pings";
// @ts-ignore
import { toLang, fromLang } from "./generated/metadata";

const generatedGleanModules = {
  errors,
  infobar,
  metadata,
  performance,
  service,
  test,
};

type MetricsCategory =
  | "errors"
  | "infobar"
  | "metadata"
  | "performance"
  | "service"
  | "test";

type GleanCustomPingSubmitResults = undefined;

export class Telemetry {
  constructor() {
    Glean.initialize("bergamot-extension", true, { debug: { logPings: true } });
  }

  private _set_meta = (lang_from: string, lang_to: string) => {
    toLang.set(lang_to);
    fromLang.set(lang_from);
  };

  private glean_call = (
    category: MetricsCategory,
    name: string,
    method: string,
    value: any = null,
  ) => {
    const gleanModule = generatedGleanModules[category];
    try {
      if (value !== null) {
        gleanModule[name][method](value);
      } else {
        gleanModule[name][method]();
      }
    } catch (err) {
      console.error(
        `Telemetry error: ${category}_${name} was not sent`,
        { category, name, method, gleanModule },
        err,
      );
      throw err;
    }
  };

  public timing = (
    category: MetricsCategory,
    name: string,
    value: string,
    lang_from: string,
    lang_to: string,
  ): GleanCustomPingSubmitResults => {
    this._set_meta(lang_from, lang_to);
    // todo: switch to timespan metric type when it is supported
    this.glean_call(category, name, "record", { timespan: String(value) });
    return custom.submit();
  };

  public event = (
    category: MetricsCategory,
    name: string,
    lang_from: string,
    lang_to: string,
  ): GleanCustomPingSubmitResults => {
    this._set_meta(lang_from, lang_to);
    this.glean_call(category, name, "record");
    return custom.submit();
  };

  public quantity = (
    category: MetricsCategory,
    name: string,
    value: BigInteger,
    lang_from: string,
    lang_to: string,
  ): GleanCustomPingSubmitResults => {
    this._set_meta(lang_from, lang_to);
    // todo: switch to quantity metric type when it is supported
    this.glean_call(category, name, "record", { quantity: String(value) });
    return custom.submit();
  };

  public increment = (
    category: MetricsCategory,
    name: string,
    lang_from: string,
    lang_to: string,
  ): GleanCustomPingSubmitResults => {
    this._set_meta(lang_from, lang_to);
    this.glean_call(category, name, "add");
    return custom.submit();
  };
}
