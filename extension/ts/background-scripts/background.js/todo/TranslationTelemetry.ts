/**
 * (This file has not yet been updated to reflect Bergamot integration requirements)
 *
 * Uses telemetry histograms for collecting statistics on the usage of the
 * translation component.
 *
 * NOTE: Metrics are only recorded if the user enabled the telemetry option.
 */
import {
  TRANSLATION_PREF_DETECT_LANG,
  TRANSLATION_PREF_SHOWUI,
} from "./translation.constants";

// Temporary mock
class Services {
  static telemetry: {
    getHistogramById: (id) => "foo";
    getKeyedHistogramById: (id) => "foo";
  };
  static prefs: { getBoolPref: (pref) => false };
}

export class TranslationTelemetry {
  private HISTOGRAMS;

  constructor() {
    // Constructing histograms.
    const plain = id => Services.telemetry.getHistogramById(id);
    const keyed = id => Services.telemetry.getKeyedHistogramById(id);
    this.HISTOGRAMS = {
      OPPORTUNITIES: () => plain("TRANSLATION_OPPORTUNITIES"),
      OPPORTUNITIES_BY_LANG: () =>
        keyed("TRANSLATION_OPPORTUNITIES_BY_LANGUAGE"),
      PAGES: () => plain("TRANSLATED_PAGES"),
      PAGES_BY_LANG: () => keyed("TRANSLATED_PAGES_BY_LANGUAGE"),
      CHARACTERS: () => plain("TRANSLATED_CHARACTERS"),
      DENIED: () => plain("DENIED_TRANSLATION_OFFERS"),
      AUTO_REJECTED: () => plain("AUTO_REJECTED_TRANSLATION_OFFERS"),
      SHOW_ORIGINAL: () => plain("REQUESTS_OF_ORIGINAL_CONTENT"),
      TARGET_CHANGES: () => plain("CHANGES_OF_TARGET_LANGUAGE"),
      DETECTION_CHANGES: () => plain("CHANGES_OF_DETECTED_LANGUAGE"),
      SHOW_UI: () => plain("SHOULD_TRANSLATION_UI_APPEAR"),
      DETECT_LANG: () => plain("SHOULD_AUTO_DETECT_LANGUAGE"),
    };

    // Capturing the values of flags at the startup.
    this.recordPreferences();
  }

  /**
   * Record a translation opportunity in the health report.
   * @param language
   *        The language of the page.
   */
  recordTranslationOpportunity(language) {
    return this._recordOpportunity(language, true);
  }

  /**
   * Record a missed translation opportunity in the health report.
   * A missed opportunity is when the language detected is not part
   * of the supported languages.
   * @param language
   *        The language of the page.
   */
  recordMissedTranslationOpportunity(language) {
    return this._recordOpportunity(language, false);
  }

  /**
   * Record an automatically rejected translation offer in the health
   * report. A translation offer is automatically rejected when a user
   * has previously clicked "Never translate this language" or "Never
   * translate this site", which results in the infobar not being shown for
   * the translation opportunity.
   *
   * These translation opportunities should still be recorded in addition to
   * recording the automatic rejection of the offer.
   */
  recordAutoRejectedTranslationOffer() {
    this.HISTOGRAMS.AUTO_REJECTED().add();
  }

  /**
   * Record a translation in the health report.
   * @param langFrom
   *        The language of the page.
   * @param langTo
   *        The language translated to
   * @param numCharacters
   *        The number of characters that were translated
   */
  recordTranslation(langFrom, langTo, numCharacters) {
    this.HISTOGRAMS.PAGES().add();
    this.HISTOGRAMS.PAGES_BY_LANG().add(langFrom + " -> " + langTo);
    this.HISTOGRAMS.CHARACTERS().add(numCharacters);
  }

  /**
   * Record a change of the detected language in the health report. This should
   * only be called when actually executing a translation, not every time the
   * user changes in the language in the UI.
   *
   * @param beforeFirstTranslation
   *        A boolean indicating if we are recording a change of detected
   *        language before translating the page for the first time. If we
   *        have already translated the page from the detected language and
   *        the user has manually adjusted the detected language false should
   *        be passed.
   */
  recordDetectedLanguageChange(beforeFirstTranslation) {
    this.HISTOGRAMS.DETECTION_CHANGES().add(beforeFirstTranslation);
  }

  /**
   * Record a change of the target language in the health report. This should
   * only be called when actually executing a translation, not every time the
   * user changes in the language in the UI.
   */
  recordTargetLanguageChange() {
    this.HISTOGRAMS.TARGET_CHANGES().add();
  }

  /**
   * Record a denied translation offer.
   */
  recordDeniedTranslationOffer() {
    this.HISTOGRAMS.DENIED().add();
  }

  /**
   * Record a "Show Original" command use.
   */
  recordShowOriginalContent() {
    this.HISTOGRAMS.SHOW_ORIGINAL().add();
  }

  /**
   * Record the state of translation preferences.
   */
  recordPreferences() {
    if (Services.prefs.getBoolPref(TRANSLATION_PREF_SHOWUI)) {
      this.HISTOGRAMS.SHOW_UI().add(1);
    }
    if (Services.prefs.getBoolPref(TRANSLATION_PREF_DETECT_LANG)) {
      this.HISTOGRAMS.DETECT_LANG().add(1);
    }
  }

  _recordOpportunity(language, success) {
    this.HISTOGRAMS.OPPORTUNITIES().add(success);
    this.HISTOGRAMS.OPPORTUNITIES_BY_LANG().add(language, success);
  }
}
