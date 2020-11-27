/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

import { config } from "../config";

// Temporary mock
class Services {
  static locale: { appLocaleAsBCP47: "foo" };
  static prefs: { getCharPref: (pref) => "foo" };
}

export const Translation = {
  STATE_OFFER: 0,
  STATE_TRANSLATING: 1,
  STATE_TRANSLATED: 2,
  STATE_ERROR: 3,
  STATE_UNAVAILABLE: 4,

  translationListener: null,

  serviceUnavailable: false,

  // TODO: Refactor to take the combination of source+target as language pairs into consideration
  supportedSourceLanguages: config.supportedLanguagePairs.map(lp => lp[0]),
  supportedTargetLanguages: config.supportedLanguagePairs.map(lp => lp[1]),

  setListenerForTests(listener) {
    this.translationListener = listener;
  },

  _defaultTargetLanguage: "",
  get defaultTargetLanguage() {
    if (!this._defaultTargetLanguage) {
      this._defaultTargetLanguage = Services.locale.appLocaleAsBCP47.split(
        "-",
      )[0];
    }
    return this._defaultTargetLanguage;
  },
};
