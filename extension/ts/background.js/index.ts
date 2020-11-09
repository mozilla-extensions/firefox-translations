/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "(extensionGlue)" }]*/

import { initErrorReportingInBackgroundScript } from "../shared-resources/ErrorReporting";
import { browser as crossBrowser, Runtime } from "webextension-polyfill-ts";
import { Store } from "./Store";
import { localStorageWrapper } from "./lib/localStorageWrapper";
import { getCurrentTab } from "./lib/getCurrentTab";
import Port = Runtime.Port;
import { LanguageDetector } from "./LanguageDetector";
import { DynamicActionIcon } from "./lib/DynamicActionIcon";
const store = new Store(localStorageWrapper);

/**
 * Ties together overall execution logic and allows content scripts
 * to access persistent storage and background-context API:s via cross-process messaging
 */
class ExtensionGlue {
  private extensionPreferencesPortListener: (port: Port) => void;
  private mainInterfacePortListener: (port: Port) => void;
  private contentScriptLanguageDetectorProxyPortListener: (port: Port) => void;

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
    const dynamicActionIcon = new DynamicActionIcon(
      crossBrowser.browserAction,
      48,
      48,
      24,
      29,
    );

    const showSpecificExtensionIconOnTranslatablePages = async () => {
      const setActiveExtensionIcon = async tabId => {
        try {
          await dynamicActionIcon.setIcon({
            path: "icons/extension-icon.48x48.png",
            tabId,
          });
          dynamicActionIcon.stopLoadingAnimation(tabId);
          dynamicActionIcon.drawBadge(
            {
              text: "es",
              textColor: "#000000",
              backgroundColor: "#ffffffAA",
            },
            tabId,
          );

          setTimeout(() => {
            dynamicActionIcon.startLoadingAnimation(tabId);
          }, 2000);

          setTimeout(() => {
            dynamicActionIcon.stopLoadingAnimation(tabId);
            dynamicActionIcon.drawBadge(
              {
                text: "es",
                textColor: "#ffffff",
                backgroundColor: "#000000AA",
              },
              tabId,
            );
          }, 4000);

          crossBrowser.browserAction.setPopup({
            popup: "/main-interface/main-interface.html#/",
            tabId,
          });
        } catch (e) {
          if (e.message.indexOf("Invalid tab ID") === 0) {
            // do nothing, the tab does not exist anymore
          } else {
            throw e;
          }
        }
      };
      const setInactiveExtensionIcon = async tabId => {
        try {
          crossBrowser.browserAction.setIcon({
            path: "icons/extension-icon.inactive.38x38.png",
            tabId,
          });
          crossBrowser.browserAction.setPopup({
            popup: "/main-interface/main-interface.html#/",
            tabId,
          });
        } catch (e) {
          if (e.message.indexOf("Invalid tab ID") === 0) {
            // do nothing, the tab does not exist anymore
          } else {
            throw e;
          }
        }
      };

      const tab = await getCurrentTab();

      // Sometimes there is no current tab object. Assume not a translatable page...
      if (!tab) {
        setInactiveExtensionIcon(null);
        return;
      }

      // TODO
      const urlShouldNotBeTranslated = (url: string) => false;

      if (tab.url) {
        if (urlShouldNotBeTranslated(tab.url)) {
          await setInactiveExtensionIcon(tab.id);
        } else {
          await setActiveExtensionIcon(tab.id);
        }
      } else {
        // tab.url is not available in Firefox unless the tabs permission is granted, hence this workaround:
        const onExecuted = async result => {
          const url = result ? result[0] : false;
          if (!url || urlShouldNotBeTranslated(url)) {
            await setInactiveExtensionIcon(tab.id);
          } else {
            await setActiveExtensionIcon(tab.id);
          }
        };
        const executing = crossBrowser.tabs.executeScript({
          code: "location.href",
        });
        executing.then(onExecuted, async () => {
          await setInactiveExtensionIcon(tab.id);
        });
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

    // Set up a connection / listener for the content-script-language-detector-proxy
    let portFromContentScriptLanguageDetectorProxy;
    this.contentScriptLanguageDetectorProxyPortListener = p => {
      if (p.name !== "port-from-content-script-language-detector-proxy") {
        return;
      }
      portFromContentScriptLanguageDetectorProxy = p;
      portFromContentScriptLanguageDetectorProxy.onMessage.addListener(
        async function(m: { str: string; requestId: string }) {
          // console.log("Message from content-script-language-detector-proxy:", { m });
          const { str, requestId } = m;
          const results = await LanguageDetector.detectLanguage({ text: str });
          console.log({ results });
          portFromContentScriptLanguageDetectorProxy.postMessage({
            languageDetectorResults: {
              results,
              requestId,
            },
          });
        },
      );
    };
    crossBrowser.runtime.onConnect.addListener(
      this.contentScriptLanguageDetectorProxyPortListener,
    );
  }

  async cleanup() {
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
    if (this.contentScriptLanguageDetectorProxyPortListener) {
      try {
        crossBrowser.runtime.onConnect.removeListener(
          this.contentScriptLanguageDetectorProxyPortListener,
        );
      } catch (err) {
        console.warn(
          "contentScriptLanguageDetectorProxyPortListener removal error",
          err,
        );
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
