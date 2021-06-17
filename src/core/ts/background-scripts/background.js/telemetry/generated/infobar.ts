/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// AUTOGENERATED BY glean_parser. DO NOT EDIT. DO NOT COMMIT.

import EventMetricType from "@mozilla/glean/webext/private/metrics/event";
/**
 * The translation infobar was automatically displayed in a browser.
 *
 * Generated from `infobar.displayed`.
 */
export const displayed = new EventMetricType(
  {
    category: "infobar",
    name: "displayed",
    sendInPings: ["custom"],
    lifetime: "ping",
    disabled: false,
  },
  [],
);

/**
 * The translation infobar was closed.
 *
 * Generated from `infobar.closed`.
 */
export const closed = new EventMetricType(
  {
    category: "infobar",
    name: "closed",
    sendInPings: ["custom"],
    lifetime: "ping",
    disabled: false,
  },
  [],
);

/**
 * The "Translate" button was pressed on translation infobar.
 *
 * Generated from `infobar.translate`.
 */
export const translate = new EventMetricType(
  {
    category: "infobar",
    name: "translate",
    sendInPings: ["custom"],
    lifetime: "ping",
    disabled: false,
  },
  [],
);

/**
 * "Never translate language" button in the infobar options was pressed.
 *
 * Generated from `infobar.never_translate_lang`.
 */
export const neverTranslateLang = new EventMetricType(
  {
    category: "infobar",
    name: "never_translate_lang",
    sendInPings: ["custom"],
    lifetime: "ping",
    disabled: false,
  },
  [],
);

/**
 * "Never translate site" button in the infobar options was pressed.
 *
 * Generated from `infobar.never_translate_site`.
 */
export const neverTranslateSite = new EventMetricType(
  {
    category: "infobar",
    name: "never_translate_site",
    sendInPings: ["custom"],
    lifetime: "ping",
    disabled: false,
  },
  [],
);

/**
 * "Not now" button on the infobar was pressed.
 *
 * Generated from `infobar.not_now`.
 */
export const notNow = new EventMetricType(
  {
    category: "infobar",
    name: "not_now",
    sendInPings: ["custom"],
    lifetime: "ping",
    disabled: false,
  },
  [],
);

/**
 * "This page is in" language was changed manually.
 *
 * Generated from `infobar.change_lang`.
 */
export const changeLang = new EventMetricType(
  {
    category: "infobar",
    name: "change_lang",
    sendInPings: ["custom"],
    lifetime: "ping",
    disabled: false,
  },
  [],
);
