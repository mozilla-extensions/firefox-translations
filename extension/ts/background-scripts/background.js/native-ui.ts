/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "(extensionGlue)" }]*/

import { initErrorReportingInBackgroundScript } from "../../shared-resources/ErrorReporting";
import { browser as crossBrowser, Runtime } from "webextension-polyfill-ts";
import { Store } from "./lib/Store";
import { localStorageWrapper } from "./lib/localStorageWrapper";
import Port = Runtime.Port;
import { MobxKeystoneBackgroundContextHost } from "./lib/MobxKeystoneBackgroundContextHost";
import { ExtensionState } from "../../shared-resources/models/ExtensionState";
import { createBackgroundContextRootStore } from "./lib/createBackgroundContextRootStore";
import { contentScriptBergamotApiClientPortListener } from "./lib/contentScriptBergamotApiClientPortListener";
import { contentScriptFrameInfoPortListener } from "./lib/contentScriptFrameInfoPortListener";
import { contentScriptLanguageDetectorProxyPortListener } from "./lib/contentScriptLanguageDetectorProxyPortListener";
import { NativeTranslateUiBroker } from "./lib/NativeTranslateUiBroker";
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

  async start() {
    // Set up native translate ui
    const nativeTranslateUiBroker = new NativeTranslateUiBroker(
      this.extensionState,
    );
    await nativeTranslateUiBroker.start();

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
  // TODO: disable behind pref - incl pref listener to react to pref changes

  await extensionGlue.init();
  await runMigrations();
  await extensionGlue.start();
}
onEveryExtensionLoad().then();
