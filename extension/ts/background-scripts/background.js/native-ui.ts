/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

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
import { NativeTranslateUiBroker } from "./native-ui/NativeTranslateUiBroker";
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
  await extensionGlue.init();
  await runMigrations();
  await extensionGlue.start();
}
onEveryExtensionLoad().then();

// Open and keep the test-runner open after each extension reload when in development mode
if (process.env.NODE_ENV !== "production") {
  (async () => {
    const extensionPageForTestsUrl = crossBrowser.runtime.getURL(
      `test-runner/index.html`,
    );
    await crossBrowser.tabs.create({
      url: extensionPageForTestsUrl,

      active: false,
    });
  })();
}
