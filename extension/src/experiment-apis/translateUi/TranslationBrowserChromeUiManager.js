class TranslationBrowserChromeUiNotificationManager {
  constructor(browser) {
    this.browser = browser;
  }

  shouldShowInfoBar(aPrincipal) {
    // Check if we should never show the infobar for this language.
    const neverForLangs = Services.prefs.getCharPref(
      "browser.translation.neverForLanguages",
    );
    if (neverForLangs.split(",").includes(this.detectedLanguage)) {
      TranslationTelemetry.recordAutoRejectedTranslationOffer();
      return false;
    }

    // or if we should never show the infobar for this domain.
    const perms = Services.perms;
    if (
      perms.testExactPermissionFromPrincipal(aPrincipal, "translate") ==
      perms.DENY_ACTION
    ) {
      TranslationTelemetry.recordAutoRejectedTranslationOffer();
      return false;
    }

    return true;
  }

  infobarClosed() {
    console.log("infobarClosed");
  }
}
