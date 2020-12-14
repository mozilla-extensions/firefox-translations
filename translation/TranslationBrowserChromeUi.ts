// Temporary mock
// noinspection JSUnusedLocalSymbols
class JSWindowActorParent {
  public browsingContext;
}

export class TranslationBrowserChromeUi extends JSWindowActorParent {
  private originalShown;

  get browser() {
    return this.browsingContext.top.embedderElement;
  }

  showURLBarIcon() {
    let chromeWin = this.browser.ownerGlobal;
    let PopupNotifications = chromeWin.PopupNotifications;
    let removeId = this.originalShown ? "translated" : "translate";
    let notification = PopupNotifications.getNotification(
      removeId,
      this.browser,
    );
    if (notification) {
      PopupNotifications.remove(notification);
    }

    let callback = aTopic => {
      if (aTopic == "swapping") {
        let infoBarVisible = this.notificationBox.getNotificationWithValue(
          "translation",
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
        "translation",
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
      { dismissed: true, eventCallback: callback },
    );
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
      "translation-notification",
    );
    notif.init(this);
    return notif;
  }

}
