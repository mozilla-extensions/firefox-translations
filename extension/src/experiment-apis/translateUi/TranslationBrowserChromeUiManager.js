/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "(TranslationBrowserChromeUiNotificationManager)" }]*/

class TranslationBrowserChromeUiNotificationManager {
  constructor(browser, apiEventEmitter, TranslationInfoBarStates) {
    this.uiState = null;
    this.TranslationInfoBarStates = TranslationInfoBarStates;
    this.apiEventEmitter = apiEventEmitter;
    this.browser = browser;
  }

  translate(aFrom, aTo) {
    console.log("translate", { aFrom, aTo });
    this.apiEventEmitter.emit("onTranslateButtonPressed", aFrom, aTo);
  }

  showOriginalContent() {
    console.log("showOriginalContent");
    this.apiEventEmitter.emit("onShowOriginalButtonPressed", "foo");
  }

  showTranslatedContent() {
    console.log("showTranslatedContent");
    this.apiEventEmitter.emit("onShowTranslatedButtonPressed", "foo");
  }

  infobarClosed() {
    console.log("infobarClosed");
    this.apiEventEmitter.emit("onInfoBarClosed", "foo");
  }

  /*
  | "onSelectTranslateTo"
  | "onSelectTranslateFrom"
  | "onNeverTranslateThisSite"
   */
}
