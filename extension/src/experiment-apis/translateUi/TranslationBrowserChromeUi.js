export class TranslationBrowserChromeUi {
  constructor(browser) {
    this.browser = browser;
  }

  showURLBarIcon() {
    const chromeWin = this.browser.ownerGlobal;
    const PopupNotifications = chromeWin.PopupNotifications;
    const removeId = this.originalShown ? "translated" : "translate";
    const notification = PopupNotifications.getNotification(
      removeId,
      this.browser,
    );
    if (notification) {
      PopupNotifications.remove(notification);
    }

    const callback = aTopic => {
      if (aTopic === "swapping") {
        const infoBarVisible = this.notificationBox.getNotificationWithValue(
          "translation",
        );
        if (infoBarVisible) {
          this.showTranslationInfoBar();
        }
        return true;
      }

      if (aTopic !== "showing") {
        return false;
      }
      const translationNotification = this.notificationBox.getNotificationWithValue(
        "translation",
      );
      if (translationNotification) {
        translationNotification.close();
      } else {
        this.showTranslationInfoBar();
      }
      return true;
    };

    const addId = this.originalShown ? "translate" : "translated";
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
    const notificationBox = this.notificationBox;
    const notif = notificationBox.appendNotification(
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
