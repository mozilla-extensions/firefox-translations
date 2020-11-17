/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "(extensionGlue)" }]*/

import { initErrorReportingInBackgroundScript } from "../shared-resources/ErrorReporting";
import { browser as crossBrowser, Runtime } from "webextension-polyfill-ts";
import { Store } from "./Store";
import { localStorageWrapper } from "./lib/localStorageWrapper";
import Port = Runtime.Port;
import { LanguageDetector } from "./LanguageDetector";
import { MobxKeystoneBackgroundContextHost } from "./MobxKeystoneBackgroundContextHost";
import { BergamotApiClient } from "./BergamotApiClient";
import { FrameInfo } from "../shared-resources/bergamot.types";
import { ExtensionState } from "../shared-resources/models/ExtensionState";
import { createBackgroundContextRootStore } from "./lib/createBackgroundContextRootStore";
import { ExtensionIconTranslationState } from "./ExtensionIconTranslationState";
const store = new Store(localStorageWrapper);
const bergamotApiClient = new BergamotApiClient();

/**
 * Ties together overall execution logic and allows content scripts
 * to access persistent storage and background-context API:s via cross-process messaging
 */
class ExtensionGlue {
  private extensionState: ExtensionState = createBackgroundContextRootStore();
  private extensionPreferencesPortListener: (port: Port) => void;
  private mainInterfacePortListener: (port: Port) => void;
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

  async openGetStarted() {
    const consentFormUrl = crossBrowser.runtime.getURL(
      `get-started/get-started.html`,
    );
    await crossBrowser.tabs.create({ url: consentFormUrl });
  }

  async start() {
    // Let extension icon react to document translation state changes
    const extensionIconTranslationState = new ExtensionIconTranslationState(
      this.extensionState,
    );
    await extensionIconTranslationState.init();

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

    // Set up a connection / listener for content-script-language-detector-proxy
    this.contentScriptLanguageDetectorProxyPortListener = (port: Port) => {
      if (port.name !== "port-from-content-script-language-detector-proxy") {
        return;
      }
      port.onMessage.addListener(async function(m: {
        str: string;
        requestId: string;
      }) {
        // console.debug("Message from content-script-language-detector-proxy:", { m });
        const { str, requestId } = m;
        const results = await LanguageDetector.detectLanguage({ text: str });
        // console.debug({ results });
        try {
          port.postMessage({
            languageDetectorResults: {
              results,
              requestId,
            },
          });
        } catch (err) {
          if (err.message === "Attempt to postMessage on disconnected port") {
            console.warn(
              "Attempt to postMessage on disconnected port, but it is ok",
              err,
            );
          } else {
            throw err;
          }
        }
      });
    };
    crossBrowser.runtime.onConnect.addListener(
      this.contentScriptLanguageDetectorProxyPortListener,
    );

    // Set up a connection / listener for content-script-bergamot-api-client
    this.contentScriptBergamotApiClientPortListener = (port: Port) => {
      if (port.name !== "port-from-content-script-bergamot-api-client") {
        return;
      }
      port.onMessage.addListener(async function(m: {
        texts: [];
        requestId: string;
      }) {
        // console.debug("Message from content-script-bergamot-api-client:", {m});
        const { texts, requestId } = m;
        const results = await bergamotApiClient.sendTranslationRequest(texts);
        // console.log({ results });
        try {
          port.postMessage({
            translationRequestResults: {
              results,
              requestId,
            },
          });
        } catch (err) {
          if (err.message === "Attempt to postMessage on disconnected port") {
            console.warn(
              "Attempt to postMessage on disconnected port, but it is ok",
              err,
            );
          } else {
            throw err;
          }
        }
      });
    };
    crossBrowser.runtime.onConnect.addListener(
      this.contentScriptBergamotApiClientPortListener,
    );

    // Set up a connection / listener for content-script-frame-info
    this.contentScriptFrameInfoPortListener = (port: Port) => {
      if (port.name !== "port-from-content-script-frame-info") {
        return;
      }
      port.onMessage.addListener(async function(
        m: { requestId: string },
        senderPort,
      ) {
        // console.debug("Message from port-from-content-script-frame-info:", {m});
        const { requestId } = m;
        const frameInfo: FrameInfo = {
          windowId: senderPort.sender.tab.windowId,
          tabId: senderPort.sender.tab.id,
          frameId: senderPort.sender.frameId,
        };
        try {
          port.postMessage({
            requestId,
            frameInfo,
          });
        } catch (err) {
          if (err.message === "Attempt to postMessage on disconnected port") {
            console.warn(
              "Attempt to postMessage on disconnected port, but it is ok",
              err,
            );
          } else {
            throw err;
          }
        }
      });
    };
    crossBrowser.runtime.onConnect.addListener(
      this.contentScriptFrameInfoPortListener,
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
    if (this.contentScriptBergamotApiClientPortListener) {
      try {
        crossBrowser.runtime.onConnect.removeListener(
          this.contentScriptBergamotApiClientPortListener,
        );
      } catch (err) {
        console.warn(
          "contentScriptBergamotApiClientPortListener removal error",
          err,
        );
      }
    }
    if (this.contentScriptFrameInfoPortListener) {
      try {
        crossBrowser.runtime.onConnect.removeListener(
          this.contentScriptFrameInfoPortListener,
        );
      } catch (err) {
        console.warn("contentScriptFrameInfoPortListener removal error", err);
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
