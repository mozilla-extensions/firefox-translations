import { Translation } from "./Translation";
import { TranslationTelemetry } from "./TranslationTelemetry";
import {TRANSLATION_PREF_SHOWUI} from "./translation.constants";

// Temporary mock
class JSWindowActorParent {
  public browsingContext;
  sendAsyncMessage(ref) {}
  async sendQuery(ref, data): Promise<any> {return "foo";}
}

// Temporary mock
class Services {
  static prefs: { getCharPref: (pref) => "foo", getBoolPref: (pref) => false};
  static perms: {testExactPermissionFromPrincipal: (aPrincipal, permissionRef) => "foo", DENY_ACTION: "foo"};
}

/* Translation objects keep the information related to translation for
 * a specific browser.  The properties exposed to the infobar are:
 * - detectedLanguage, code of the language detected on the web page.
 * - state, the state in which the infobar should be displayed
 * - translatedFrom, if already translated, source language code.
 * - translatedTo, if already translated, target language code.
 * - translate, method starting the translation of the current page.
 * - showOriginalContent, method showing the original page content.
 * - showTranslatedContent, method showing the translation for an
 *   already translated page whose original content is shown.
 * - originalShown, boolean indicating if the original or translated
 *   version of the page is shown.
 */
export class TranslationParent extends JSWindowActorParent {

  private translationTelemetry;
  private _state;
  private detectedLanguage;
  private translatedFrom;
  private translatedTo;
  private originalShown;

  constructor() {
    super();
    this.translationTelemetry = new TranslationTelemetry();
  }

  actorCreated() {
    this._state = 0;
    this.originalShown = true;
  }

  get browser() {
    return this.browsingContext.top.embedderElement;
  }

  receiveMessage(aMessage) {
    switch (aMessage.name) {
      case "Translation:DocumentState":
        this.documentStateReceived(aMessage.data);
        break;
    }
  }

  documentStateReceived(aData) {
    if (aData.state == Translation.STATE_OFFER) {
      if (aData.detectedLanguage == Translation.defaultTargetLanguage) {
        // Detected language is the same as the user's locale.
        return;
      }

      if (
        !Translation.supportedTargetLanguages.includes(aData.detectedLanguage)
      ) {
        // Detected language is not part of the supported languages.
        this.translationTelemetry.recordMissedTranslationOpportunity(
          aData.detectedLanguage
        );
        return;
      }

      this.translationTelemetry.recordTranslationOpportunity(aData.detectedLanguage);
    }

    if (!Services.prefs.getBoolPref(TRANSLATION_PREF_SHOWUI)) {
      return;
    }

    // Set all values before showing a new translation infobar.
    this._state = Translation.serviceUnavailable
      ? Translation.STATE_UNAVAILABLE
      : aData.state;
    this.detectedLanguage = aData.detectedLanguage;
    this.translatedFrom = aData.translatedFrom;
    this.translatedTo = aData.translatedTo;
    this.originalShown = aData.originalShown;

    this.showURLBarIcon();

    if (this.shouldShowInfoBar(this.browser.contentPrincipal)) {
      this.showTranslationInfoBar();
    }
  }

  translate(aFrom, aTo) {
    if (
      aFrom == aTo ||
      (this.state == Translation.STATE_TRANSLATED &&
        this.translatedFrom == aFrom &&
        this.translatedTo == aTo)
    ) {
      // Nothing to do.
      return;
    }

    if (this.state == Translation.STATE_OFFER) {
      if (this.detectedLanguage != aFrom) {
        this.translationTelemetry.recordDetectedLanguageChange(true);
      }
    } else {
      if (this.translatedFrom != aFrom) {
        this.translationTelemetry.recordDetectedLanguageChange(false);
      }
      if (this.translatedTo != aTo) {
        this.translationTelemetry.recordTargetLanguageChange();
      }
    }

    this.state = Translation.STATE_TRANSLATING;
    this.translatedFrom = aFrom;
    this.translatedTo = aTo;

    this.sendQuery("Translation:TranslateDocument", {
      from: aFrom,
      to: aTo,
    }).then(
      result => {
        this.translationFinished(result);
      },
      () => {}
    );
  }

  showURLBarIcon() {
    let chromeWin = this.browser.ownerGlobal;
    let PopupNotifications = chromeWin.PopupNotifications;
    let removeId = this.originalShown ? "translated" : "translate";
    let notification = PopupNotifications.getNotification(
      removeId,
      this.browser
    );
    if (notification) {
      PopupNotifications.remove(notification);
    }

    let callback = (aTopic, aNewBrowser) => {
      if (aTopic == "swapping") {
        let infoBarVisible = this.notificationBox.getNotificationWithValue(
          "translation"
        );
        if (infoBarVisible) {
          this.showTranslationInfoBar();
        }
        return true;
      }

      if (aTopic != "showing") {
        return false;
      }
      let translationNotification = this.notificationBox.getNotificationWithValue(
        "translation"
      );
      if (translationNotification) {
        translationNotification.close();
      } else {
        this.showTranslationInfoBar();
      }
      return true;
    };

    let addId = this.originalShown ? "translate" : "translated";
    PopupNotifications.show(
      this.browser,
      addId,
      null,
      addId + "-notification-icon",
      null,
      null,
      { dismissed: true, eventCallback: callback }
    );
  }

  get state() {
    return this._state;
  }

  set state(val) {
    let notif = this.notificationBox.getNotificationWithValue("translation");
    if (notif) {
      notif.state = val;
    }
    this._state = val;
  }

  showOriginalContent() {
    this.originalShown = true;
    this.showURLBarIcon();
    this.sendAsyncMessage("Translation:ShowOriginal");
    this.translationTelemetry.recordShowOriginalContent();
  }

  showTranslatedContent() {
    this.originalShown = false;
    this.showURLBarIcon();
    this.sendAsyncMessage("Translation:ShowTranslation");
  }

  get notificationBox() {
    return this.browser.ownerGlobal.gBrowser.getNotificationBox(this.browser);
  }

  showTranslationInfoBar() {
    let notificationBox = this.notificationBox;
    let notif = notificationBox.appendNotification(
      "",
      "translation",
      null,
      notificationBox.PRIORITY_INFO_HIGH,
      null,
      null,
      "translation-notification"
    );
    notif.init(this);
    return notif;
  }

  shouldShowInfoBar(aPrincipal) {
    // Never show the infobar automatically while the translation
    // service is temporarily unavailable.
    if (Translation.serviceUnavailable) {
      return false;
    }

    // Check if we should never show the infobar for this language.
    let neverForLangs = Services.prefs.getCharPref(
      "browser.translation.neverForLanguages"
    );
    if (neverForLangs.split(",").includes(this.detectedLanguage)) {
      this.translationTelemetry.recordAutoRejectedTranslationOffer();
      return false;
    }

    // or if we should never show the infobar for this domain.
    let perms = Services.perms;
    if (
      perms.testExactPermissionFromPrincipal(aPrincipal, "translate") ==
      perms.DENY_ACTION
    ) {
      this.translationTelemetry.recordAutoRejectedTranslationOffer();
      return false;
    }

    return true;
  }

  translationFinished(result) {
    if (result.success) {
      this.originalShown = false;
      this.state = Translation.STATE_TRANSLATED;
      this.showURLBarIcon();

      // Record the number of characters translated.
      this.translationTelemetry.recordTranslation(
        result.from,
        result.to,
        result.characterCount
      );
    } else if (result.unavailable) {
      Translation.serviceUnavailable = true;
      this.state = Translation.STATE_UNAVAILABLE;
    } else {
      this.state = Translation.STATE_ERROR;
    }

    if (Translation.translationListener) {
      Translation.translationListener();
    }
  }

  infobarClosed() {
    if (this.state == Translation.STATE_OFFER) {
      this.translationTelemetry.recordDeniedTranslationOffer();
    }
  }
}

