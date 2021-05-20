/* eslint-disable */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// AUTOGENERATED BY glean_parser. DO NOT EDIT. DO NOT COMMIT.

import StringMetricType from "@mozilla/glean/webext/private/metrics/string";
import QuantityMetricType from "@mozilla/glean/webext/private/metrics/quantity";
import TimespanMetricType from "@mozilla/glean/webext/private/metrics/timespan";
/**
 * Timing from "translation button pressed"
 * to "full page is translated".
 *
 * Generated from `performance.full_page_translated_time`.
 */
export const fullPageTranslatedTime = new TimespanMetricType(
  {
    category: "performance",
    name: "full_page_translated_time",
    sendInPings: ["custom"],
    lifetime: "ping",
    disabled: false,
  },
  "millisecond",
);

/**
 * Speed of the translation from "translation button
 * pressed" to "full page is translated".
 *
 * Generated from `performance.full_page_translated_wps`.
 */
export const fullPageTranslatedWps = new QuantityMetricType({
  category: "performance",
  name: "full_page_translated_wps",
  sendInPings: ["custom"],
  lifetime: "ping",
  disabled: false,
});

/**
 * Time spent on downloading a translation model for a language pair.
 *
 * Generated from `performance.model_download_time_num`.
 */
export const modelDownloadTimeNum = new TimespanMetricType(
  {
    category: "performance",
    name: "model_download_time_num",
    sendInPings: ["custom"],
    lifetime: "ping",
    disabled: false,
  },
  "millisecond",
);

/**
 * Time spent on loading a model into memory to start translation (ms).
 *
 * Generated from `performance.model_load_time_num`.
 */
export const modelLoadTimeNum = new TimespanMetricType(
  {
    category: "performance",
    name: "model_load_time_num",
    sendInPings: ["custom"],
    lifetime: "ping",
    disabled: false,
  },
  "millisecond",
);

/**
 * Time spent on translation by the translation engine.
 *
 * Generated from `performance.translation_engine_time`.
 */
export const translationEngineTime = new TimespanMetricType(
  {
    category: "performance",
    name: "translation_engine_time",
    sendInPings: ["custom"],
    lifetime: "ping",
    disabled: false,
  },
  "millisecond",
);

/**
 * Speed of translation as measured by the translation engine.
 *
 * Generated from `performance.translation_engine_wps`.
 */
export const translationEngineWps = new QuantityMetricType({
  category: "performance",
  name: "translation_engine_wps",
  sendInPings: ["custom"],
  lifetime: "ping",
  disabled: false,
});

/**
 * Quality estimation of translation.
 *
 * Generated from `performance.translation_quality`.
 */
export const translationQuality = new StringMetricType({
  category: "performance",
  name: "translation_quality",
  sendInPings: ["custom"],
  lifetime: "ping",
  disabled: false,
});
