/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "(extensionGlue)" }]*/

import { initErrorReportingInBackgroundScript } from "../../../../core/ts/shared-resources/ErrorReporting";
import { browser as crossBrowser, Runtime } from "webextension-polyfill-ts";
import Port = Runtime.Port;
import { localStorageWrapper } from "../../../../core/ts/background-scripts/background.js/state-management/localStorageWrapper";
import { contentScriptFrameInfoPortListener } from "../../../../core/ts/background-scripts/background.js/contentScriptFrameInfoPortListener";
import { ExtensionState } from "../../../../core/ts/shared-resources/models/ExtensionState";
import { createBackgroundContextRootStore } from "../../../../core/ts/background-scripts/background.js/state-management/createBackgroundContextRootStore";
import { contentScriptLanguageDetectorProxyPortListener } from "../../../../core/ts/background-scripts/background.js/contentScriptLanguageDetectorProxyPortListener";
import { Store } from "../../../../core/ts/background-scripts/background.js/state-management/Store";
import { connectRootStoreToDevTools } from "../../../../core/ts/background-scripts/background.js/state-management/connectRootStoreToDevTools";
import { MobxKeystoneBackgroundContextHost } from "../../../../core/ts/background-scripts/background.js/state-management/MobxKeystoneBackgroundContextHost";
import { NativeTranslateUiBroker } from "./NativeTranslateUiBroker";
import { contentScriptBergamotApiClientPortListener } from "../../../../core/ts/background-scripts/background.js/contentScriptBergamotApiClientPortListener";
import { BERGAMOT_VERSION_FULL } from "../../../../core/ts/web-worker-scripts/translation-worker.js/bergamot-translator-version";
import { config } from "../../../../core/ts/config";
const store = new Store(localStorageWrapper);
/* eslint-disable no-unused-vars */
// TODO: update typescript-eslint when support for this kind of declaration is supported
type PortListener = (port: Port) => void;
/* eslint-enable no-unused-vars */

/**
 * Ties together overall execution logic and allows content scripts
 * to access persistent storage and background-context API:s via cross-process messaging
 */
class ExtensionGlue {
  private extensionState: ExtensionState = createBackgroundContextRootStore();
  private extensionPreferencesPortListener: PortListener;
  private contentScriptLanguageDetectorProxyPortListener: PortListener;
  private contentScriptBergamotApiClientPortListener: PortListener;
  private contentScriptFrameInfoPortListener: PortListener;
  private nativeTranslateUiBroker: NativeTranslateUiBroker;

  constructor() {}

  async init() {
    // Add version to extension log output to facilitate general troubleshooting
    const manifest = crossBrowser.runtime.getManifest();
    console.info(
      `Extension ${manifest.name} version ${manifest.version} [build id "${config.extensionBuildId}"] (with bergamot-translator ${BERGAMOT_VERSION_FULL}) initializing.`,
    );

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
    this.nativeTranslateUiBroker = new NativeTranslateUiBroker(
      this.extensionState,
    );
    await this.nativeTranslateUiBroker.start();

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

  // TODO: Run this cleanup-method when relevant
  async cleanup() {
    await this.nativeTranslateUiBroker.stop();
    // Tear down content script port listeners
    [
      this.extensionPreferencesPortListener,
      this.contentScriptLanguageDetectorProxyPortListener,
      this.contentScriptBergamotApiClientPortListener,
      this.contentScriptFrameInfoPortListener,
    ].forEach((listener: PortListener) => {
      try {
        crossBrowser.runtime.onConnect.removeListener(listener);
      } catch (err) {
        console.warn(`Port listener removal error`, err);
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
      `test-runner/index.html?grep=`,
    );
    await crossBrowser.tabs.create({
      url: extensionPageForTestsUrl,

      active: false,
    });
  })();
}
