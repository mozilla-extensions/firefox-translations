/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "(TranslationBrowserChromeUiNotificationManager)" }]*/

class TranslationBrowserChromeUiNotificationManager {
  constructor(browser, apiEventEmitter, tabId, TranslationInfoBarStates) {
    this.uiState = null;
    this.TranslationInfoBarStates = TranslationInfoBarStates;
    this.apiEventEmitter = apiEventEmitter;
    this.tabId = tabId;
    this.browser = browser;
  }

  infobarDisplayed() {
    console.log("infobarDisplayed");
    this.apiEventEmitter.emit("onInfoBarDisplayed", this.tabId);
  }

  toLanguageChanged() {
    console.log("toLanguageChanged");
    this.apiEventEmitter.emit("onSelectTranslateTo", this.tabId);
  }

  fromLanguageChanged() {
    console.log("fromLanguageChanged");
    this.apiEventEmitter.emit("onSelectTranslateFrom", this.tabId);
  }

  infobarClosed() {
    console.log("infobarClosed");
    this.apiEventEmitter.emit("onInfoBarClosed", this.tabId);
  }

  neverForLanguage() {
    console.log("neverForLanguage");
    this.apiEventEmitter.emit("onNeverTranslateSelectedLanguage", this.tabId);
  }

  neverForSite() {
    console.log("neverForSite");
    this.apiEventEmitter.emit("onNeverTranslateThisSite", this.tabId);
  }

  showOriginalContent() {
    console.log("showOriginalContent");
    this.apiEventEmitter.emit("onShowOriginalButtonPressed", this.tabId);
  }

  showTranslatedContent() {
    console.log("showTranslatedContent");
    this.apiEventEmitter.emit("onShowTranslatedButtonPressed", this.tabId);
  }

  translate(from, to) {
    console.log("translate", { from, to });
    this.apiEventEmitter.emit("onTranslateButtonPressed", this.tabId, from, to);
  }

  notNow() {
    console.log("notNow");
    this.apiEventEmitter.emit("onNotNowButtonPressed", this.tabId);
  }

  /*
  | "onNeverTranslateThisSite"
   */
}
