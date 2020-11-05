/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Temporary mock
class Services {
  static locale: { appLocaleAsBCP47: "foo" };
  static prefs: { getCharPref: (pref) => "foo"};
}

export const Translation = {
  STATE_OFFER: 0,
  STATE_TRANSLATING: 1,
  STATE_TRANSLATED: 2,
  STATE_ERROR: 3,
  STATE_UNAVAILABLE: 4,

  translationListener: null,

  serviceUnavailable: false,

  supportedSourceLanguages: [
    "bg",
    "cs",
    "de",
    "en",
    "es",
    "fr",
    "ja",
    "ko",
    "nl",
    "no",
    "pl",
    "pt",
    "ru",
    "tr",
    "vi",
    "zh",
  ],
  supportedTargetLanguages: [
    "bg",
    "cs",
    "de",
    "en",
    "es",
    "fr",
    "ja",
    "ko",
    "nl",
    "no",
    "pl",
    "pt",
    "ru",
    "tr",
    "vi",
    "zh",
  ],

  setListenerForTests(listener) {
    this.translationListener = listener;
  },

  _defaultTargetLanguage: "",
  get defaultTargetLanguage() {
    if (!this._defaultTargetLanguage) {
      this._defaultTargetLanguage = Services.locale.appLocaleAsBCP47.split(
        "-"
      )[0];
    }
    return this._defaultTargetLanguage;
  },

  openProviderAttribution() {
    let attribution = this.supportedEngines[this.translationEngine];
    // TODO Open link in new tab
  },

  /**
   * The list of translation engines and their attributions.
   */
  supportedEngines: {
    Google: "",
    Bergamot: "https://browser.mt/",
    Bing: "http://aka.ms/MicrosoftTranslatorAttribution",
    Yandex: "http://translate.yandex.com/",
  },

  /**
   * Fallback engine (currently Bergamot) if the preferences seem confusing.
   */
  get defaultEngine() {
    return Object.keys(this.supportedEngines)[1];
  },

  /**
   * Returns the name of the preferred translation engine.
   */
  get translationEngine() {
    let engine = Services.prefs.getCharPref("browser.translation.engine");
    return !Object.keys(this.supportedEngines).includes(engine)
      ? this.defaultEngine
      : engine;
  },
};
