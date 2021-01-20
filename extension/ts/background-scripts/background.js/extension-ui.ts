/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "(extensionGlue)" }]*/

import { initErrorReportingInBackgroundScript } from "../../shared-resources/ErrorReporting";
import { browser as crossBrowser, Runtime } from "webextension-polyfill-ts";
import Port = Runtime.Port;
import { Store } from "./state-management/Store";
import { localStorageWrapper } from "./state-management/localStorageWrapper";
import { MobxKeystoneBackgroundContextHost } from "./state-management/MobxKeystoneBackgroundContextHost";
import { createBackgroundContextRootStore } from "./state-management/createBackgroundContextRootStore";
import { contentScriptBergamotApiClientPortListener } from "./contentScriptBergamotApiClientPortListener";
import { contentScriptFrameInfoPortListener } from "./contentScriptFrameInfoPortListener";
import { contentScriptLanguageDetectorProxyPortListener } from "./contentScriptLanguageDetectorProxyPortListener";
import { ExtensionState } from "../../shared-resources/models/ExtensionState";
import { ExtensionIconTranslationState } from "./extension-ui/ExtensionIconTranslationState";
import { connectRootStoreToDevTools } from "./state-management/connectRootStoreToDevTools";
const store = new Store(localStorageWrapper);

/**
 * Ties together overall execution logic and allows content scripts
 * to access persistent storage and background-context API:s via cross-process messaging
 */
class ExtensionGlue {
  private extensionState: ExtensionState = createBackgroundContextRootStore();
  private extensionPreferencesPortListener: (port: Port) => void;
  private contentScriptLanguageDetectorProxyPortListener: (port: Port) => void;
  private contentScriptBergamotApiClientPortListener: (port: Port) => void;
  private contentScriptFrameInfoPortListener: (port: Port) => void;

  constructor() {}

  async init() {
    // Initiate the root extension state store
    this.extensionState = createBackgroundContextRootStore();

    // Allow for easy introspection of extension state in development mode
    if (
      process.env.NODE_ENV !== "production" &&
      process.env.REMOTE_DEV_SERVER_PORT
    ) {
      // noinspection ES6MissingAwait
      connectRootStoreToDevTools(this.extensionState);
    }

    // Make the root extension state store available to content script contexts
    const mobxKeystoneBackgroundContextHost = new MobxKeystoneBackgroundContextHost();
    mobxKeystoneBackgroundContextHost.init(this.extensionState);

    // Enable error reporting if not opted out
    this.extensionPreferencesPortListener = await initErrorReportingInBackgroundScript(
      store,
      [
        "port-from-options-ui:index",
        "port-from-options-ui:form",
        "port-from-main-interface:index",
        "port-from-get-started:index",
        "port-from-get-started:component",
        "port-from-dom-translation-content-script:index",
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
    if (process.env.NODE_ENV !== "production") {
      // Open the test-runner to run tests
      const extensionPageForTestsUrl = crossBrowser.runtime.getURL(
        `test-runner/index.html`,
      );
      await crossBrowser.tabs.create({ url: extensionPageForTestsUrl });
    }

    // Let extension icon react to document translation state changes
    const extensionIconTranslationState = new ExtensionIconTranslationState(
      this.extensionState,
    );
    await extensionIconTranslationState.init();

    // Set up content script port listeners
    this.contentScriptLanguageDetectorProxyPortListener = contentScriptLanguageDetectorProxyPortListener;
    this.contentScriptBergamotApiClientPortListener = contentScriptBergamotApiClientPortListener;
    this.contentScriptFrameInfoPortListener = contentScriptFrameInfoPortListener;
    [
      "contentScriptLanguageDetectorProxyPortListener",
      "contentScriptBergamotApiClientPortListener",
      "contentScriptFrameInfoPortListener",
    ].forEach(listenerName => {
      crossBrowser.runtime.onConnect.addListener(this[listenerName]);
    });
  }

  async cleanup() {
    // Tear down content script port listeners
    [
      "extensionPreferencesPortListener",
      "contentScriptLanguageDetectorProxyPortListener",
      "contentScriptBergamotApiClientPortListener",
      "contentScriptFrameInfoPortListener",
    ].forEach(listenerName => {
      try {
        crossBrowser.runtime.onConnect.removeListener(this[listenerName]);
      } catch (err) {
        console.warn(`${listenerName} removal error`, err);
      }
    });
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
