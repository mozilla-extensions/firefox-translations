/* eslint-disable */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// AUTOGENERATED BY glean_parser. DO NOT EDIT. DO NOT COMMIT.

import StringMetricType from "@mozilla/glean/webext/private/metrics/string";
/**
 * Translation source language.
 *
 * Generated from `metadata.from_lang`.
 */
export const fromLang = new StringMetricType({
  category: "metadata",
  name: "from_lang",
  sendInPings: ["custom"],
  lifetime: "ping",
  disabled: false,
});

/**
 * Translation target language.
 *
 * Generated from `metadata.to_lang`.
 */
export const toLang = new StringMetricType({
  category: "metadata",
  name: "to_lang",
  sendInPings: ["custom"],
  lifetime: "ping",
  disabled: false,
});

/**
 * Firefox Telemetry client id.
 *
 * Generated from `metadata.firefox_telemetry_client_id`.
 */
export const firefoxTelemetryClientId = new StringMetricType({
  category: "metadata",
  name: "firefox_telemetry_client_id",
  sendInPings: ["custom"],
  lifetime: "ping",
  disabled: false,
});
