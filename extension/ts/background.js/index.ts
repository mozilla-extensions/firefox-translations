/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "(extensionGlue)" }]*/

import { initErrorReportingInBackgroundScript } from "../shared-resources/ErrorReporting";
import { browser as crossBrowser, Runtime } from "webextension-polyfill-ts";
import { Store } from "./Store";
import { localStorageWrapper } from "./lib/localStorageWrapper";
import { getCurrentTab } from "./lib/getCurrentTab";
import Port = Runtime.Port;
const store = new Store(localStorageWrapper);

/**
 * Ties together overall execution logic and allows content scripts
 * to access persistent storage and background-context API:s via cross-process messaging
 */
class ExtensionGlue {
  private getStartedPortListener;
  private extensionPreferencesPortListener: (port: Port) => void;
  private mainInterfacePortListener: (port: Port) => void;

  constructor() {}

  async init() {
    // Enable error reporting if not opted out
    this.extensionPreferencesPortListener = await initErrorReportingInBackgroundScript(
      store,
      [
        "port-from-options-ui:index",
        "port-from-options-ui:form",
        "port-from-main-interface:index",
        "port-from-get-started:index",
        "port-from-get-started:component",
        "port-from-document-translation-content-script:index",
      ],
    );
  }

  async openGetStarted() {
    const consentFormUrl = crossBrowser.runtime.getURL(
      `get-started/get-started.html`,
    );
    await crossBrowser.tabs.create({ url: consentFormUrl });
  }

  async start() {
    const showSpecificExtensionIconOnTranslatablePages = async () => {
      function setActiveExtensionIcon() {
        try {
          crossBrowser.browserAction.setIcon({
            path: "icons/extension-icon.38x38.png",
          });
          crossBrowser.browserAction.setPopup({
            popup: "/main-interface/main-interface.html#/",
          });
        } catch (e) {
          if (e.message.indexOf("Invalid tab ID") === 0) {
            // do nothing, the tab does not exist anymore
          } else {
            throw e;
          }
        }
      }
      function setInactiveExtensionIcon() {
        try {
          crossBrowser.browserAction.setIcon({
            path: "icons/extension-icon.inactive.38x38.png",
          });
          crossBrowser.browserAction.setPopup({
            popup: "/main-interface/main-interface.html#/",
          });
        } catch (e) {
          if (e.message.indexOf("Invalid tab ID") === 0) {
            // do nothing, the tab does not exist anymore
          } else {
            throw e;
          }
        }
      }

      const tab = await getCurrentTab();

      // Sometimes there is no current tab object. Assume not a translatable page...
      if (!tab) {
        setInactiveExtensionIcon();
        return;
      }

      // TODO
      const urlShouldNotBeTranslated = (url: string) => false;

      if (tab.url) {
        if (urlShouldNotBeTranslated(tab.url)) {
          setInactiveExtensionIcon();
        } else {
          setActiveExtensionIcon();
        }
      } else {
        // tab.url is not available in Firefox unless the tabs permission is granted, hence this workaround:
        const onExecuted = result => {
          const url = result ? result[0] : false;
          if (!url || urlShouldNotBeTranslated(url)) {
            setInactiveExtensionIcon();
          } else {
            setActiveExtensionIcon();
          }
        };
        const executing = crossBrowser.tabs.executeScript({
          code: "location.href",
        });
        executing.then(onExecuted, setInactiveExtensionIcon);
      }
    };
    crossBrowser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      showSpecificExtensionIconOnTranslatablePages();
    });
    crossBrowser.tabs.onActivated.addListener(({ tabId }) => {
      showSpecificExtensionIconOnTranslatablePages();
    });

    // Make the page action show on translatable pages in case extension is loaded/reloaded while on one
    await showSpecificExtensionIconOnTranslatablePages();

    // Set up a connection / listener for the main interface content script
    let portFromMainInterface;
    this.mainInterfacePortListener = p => {
      if (p.name !== "port-from-main-interface") {
        return;
      }
      portFromMainInterface = p;
      portFromMainInterface.onMessage.addListener(async function(m: {}) {
        console.log("Message from main-interface script:", { m });
      });
    };
    crossBrowser.runtime.onConnect.addListener(this.mainInterfacePortListener);

    // Register the content script necessary for document translation
    await crossBrowser.contentScripts.register({
      js: [{ file: "/document-translation-content-script.js" }],
      matches: ["<all_urls>"],
      allFrames: false,
      runAt: "document_start",
      matchAboutBlank: false,
    });
  }

  async cleanup() {
    if (this.getStartedPortListener) {
      try {
        crossBrowser.runtime.onConnect.removeListener(
          this.getStartedPortListener,
        );
      } catch (err) {
        console.warn("extensionRemovalRequestPortListener removal error", err);
      }
    }
    if (this.extensionPreferencesPortListener) {
      try {
        crossBrowser.runtime.onConnect.removeListener(
          this.extensionPreferencesPortListener,
        );
      } catch (err) {
        console.warn("extensionPreferencesPortListener removal error", err);
      }
    }
    if (this.mainInterfacePortListener) {
      try {
        crossBrowser.runtime.onConnect.removeListener(
          this.mainInterfacePortListener,
        );
      } catch (err) {
        console.warn("mainInterfacePortListener removal error", err);
      }
    }
  }
}

// make an instance of the ExtensionGlue class available to the extension background context
const extensionGlue = ((window as any).extensionGlue = new ExtensionGlue());

// migrations
const runMigrations = async () => {
  console.info("Running relevant migrations");
};

// init the extension glue on every extension load
async function onEveryExtensionLoad() {
  await extensionGlue.init();
  await runMigrations();
  const { hasOpenedGetStarted } = await crossBrowser.storage.local.get(
    "hasOpenedGetStarted",
  );
  if (!hasOpenedGetStarted) {
    await extensionGlue.openGetStarted();
    await crossBrowser.storage.local.set({ hasOpenedGetStarted: true });
  }
  await extensionGlue.start();
}
onEveryExtensionLoad().then();
