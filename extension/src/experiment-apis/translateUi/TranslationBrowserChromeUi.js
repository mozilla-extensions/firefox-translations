class TranslationBrowserChromeUi {
  originalShown = false;

  constructor(browser, context) {
    this.browser = browser;
    const chromeWin = this.browser.ownerGlobal;

    // The manager instance is injected into the translation notification bar and handles events from therein
    this.translationBrowserChromeUiNotificationManager = new TranslationBrowserChromeUiNotificationManager(
      browser,
    );

    // As a workaround to be able to load updates for the translation notification on extension reload
    // we use the current unix timestamp as part of the element id.
    // TODO: Restrict to development mode only (possibly with the extension version as cachebuster, to allow updates to privileged UI without restarting the browser
    chromeWin.now = Date.now();

    // Restrict to specific languages
    chromeWin.Translation = {
      ...chromeWin.Translation,
      supportedSourceLanguages: ["cs", "de", "en", "es", "et", "fr", "pl"],
      supportedTargetLanguages: ["cs", "de", "en", "es", "et", "fr", "pl"],
    };

    try {
      chromeWin.customElements.setElementCreationCallback(
        `translation-notification-${chromeWin.now}`,
        () => {
          Services.scriptloader.loadSubScript(
            context.extension.getURL(
              "experiment-apis/translateUi/content/translation-notification.js",
            ) +
              "?cachebuster=" +
              chromeWin.now,
            chromeWin,
          );
        },
      );
    } catch (e) {
      console.log(
        "Error occurred when attempting to load the translation notification script, but we continue nevertheless",
        e,
      );
    }
  }

  showURLBarIcon() {
    console.debug("showURLBarIcon");
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

    // TODO: Figure out why this A. Doesn't show an url bar icon and B. Shows a strangely rendered popup at the corner of the window instead next to the URL bar
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
    // TODO: Use tab-specific notification box instead (currently fails with error message below)
    /*
      can't access property "parentNode", (intermediate value).parentNode is undefined getBrowserContainer@chrome://browser/content/tabbrowser.js:773:7
      getNotificationBox/browser._notificationBox<@chrome://browser/content/tabbrowser.js:781:16
      get stack@chrome://global/content/elements/notificationbox.js:43:14
      appendNotification@chrome://global/content/elements/notificationbox.js:154:7
      showTranslationInfoBar@moz-extension://b86cdfd7-cc81-7043-a052-4099e6793737/experiment-apis/translateUi/TranslationBrowserChromeUi.js?cachebuster=1610956673613:122:35
     */
    // return this.browser.ownerGlobal.gBrowser.getNotificationBox(this.browser);
    // Fallback to use high priority notification box
    return this.browser.ownerGlobal.gHighPriorityNotificationBox;
  }

  showTranslationInfoBar() {
    console.debug("showTranslationInfoBar");
    const notificationBox = this.notificationBox;
    const chromeWin = this.browser.ownerGlobal;
    const notif = notificationBox.appendNotification(
      "",
      "translation",
      null,
      notificationBox.PRIORITY_INFO_HIGH,
      null,
      null,
      `translation-notification-${chromeWin.now}`,
    );
    notif.init(this.translationBrowserChromeUiNotificationManager);
    return notif;
  }
}
