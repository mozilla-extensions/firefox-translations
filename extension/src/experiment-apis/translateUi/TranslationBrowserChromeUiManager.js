/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "(TranslationBrowserChromeUiNotificationManager)" }]*/

class TranslationBrowserChromeUiNotificationManager {
  constructor(browser, apiEventEmitter) {
    this.apiEventEmitter = apiEventEmitter;
    this.browser = browser;
  }

  translate(aFrom, aTo) {
    console.log("translate", { aFrom, aTo });
    this.apiEventEmitter.emit(
      "translateUi.onTranslateButtonPressed",
      aFrom,
      aTo,
    );
  }

  showOriginalContent() {
    console.log("showOriginalContent");
    this.apiEventEmitter.emit("translateUi.onShowOriginalButtonPressed", "foo");
  }

  showTranslatedContent() {
    console.log("showTranslatedContent");
    this.apiEventEmitter.emit(
      "translateUi.onShowTranslatedButtonPressed",
      "foo",
    );
  }

  infobarClosed() {
    console.log("infobarClosed");
    this.apiEventEmitter.emit("translateUi.onInfoBarClosed", "foo");
  }

  /*
  | "onSelectTranslateTo"
  | "onSelectTranslateFrom"
  | "onNeverTranslateThisSite"
   */
}
