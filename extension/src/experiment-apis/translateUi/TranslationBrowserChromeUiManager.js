/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "(TranslationBrowserChromeUiNotificationManager)" }]*/

class TranslationBrowserChromeUiNotificationManager {
  constructor(browser, apiEventEmitter, tabId, TranslationInfoBarStates) {
    this.uiState = null;
    this.TranslationInfoBarStates = TranslationInfoBarStates;
    this.apiEventEmitter = apiEventEmitter;
    this.tabId = tabId;
    this.browser = browser;
  }

  translate(aFrom, aTo) {
    console.log("translate", { aFrom, aTo });
    this.apiEventEmitter.emit(
      "onTranslateButtonPressed",
      this.tabId,
      aFrom,
      aTo,
    );
  }

  showOriginalContent() {
    console.log("showOriginalContent");
    this.apiEventEmitter.emit("onShowOriginalButtonPressed", this.tabId, "foo");
  }

  showTranslatedContent() {
    console.log("showTranslatedContent");
    this.apiEventEmitter.emit(
      "onShowTranslatedButtonPressed",
      this.tabId,
      "foo",
    );
  }

  infobarClosed() {
    console.log("infobarClosed");
    this.apiEventEmitter.emit("onInfoBarClosed", this.tabId, "foo");
  }

  /*
  | "onSelectTranslateTo"
  | "onSelectTranslateFrom"
  | "onNeverTranslateThisSite"
   */
}
