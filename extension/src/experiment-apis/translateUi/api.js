/* eslint-env commonjs */
/* eslint no-unused-vars: off */
/* eslint no-console: ["warn", { allow: ["info", "warn", "error"] }] */
/* global ExtensionAPI */

"use strict";

this.translateUi = class extends ExtensionAPI {
  getAPI(context) {
    const { Services } = ChromeUtils.import(
      "resource://gre/modules/Services.jsm",
      {},
    );

    /*
    const { ExtensionCommon } = ChromeUtils.import(
      "resource://gre/modules/ExtensionCommon.jsm",
      {},
    );

    const { EventManager, EventEmitter } = ExtensionCommon;
    */

    const now = Date.now();

    /* global TranslationBrowserChromeUiManager */
    Services.scriptloader.loadSubScript(
      context.extension.getURL(
        "experiment-apis/translateUi/TranslationBrowserChromeUiManager.js",
      ) +
        "?cachebuster=" +
        now,
    );
    /* global TranslationBrowserChromeUi */
    Services.scriptloader.loadSubScript(
      context.extension.getURL(
        "experiment-apis/translateUi/TranslationBrowserChromeUi.js",
      ) +
        "?cachebuster=" +
        now,
    );
    /* global EveryWindow */
    Services.scriptloader.loadSubScript(
      context.extension.getURL("experiment-apis/translateUi/EveryWindow.js") +
        "?cachebuster=" +
        now,
    );

    const { ExtensionUtils } = ChromeUtils.import(
      "resource://gre/modules/ExtensionUtils.jsm",
      {},
    );
    const { ExtensionError } = ExtensionUtils;

    const { BrowserWindowTracker } = ChromeUtils.import(
      "resource:///modules/BrowserWindowTracker.jsm",
      {},
    );

    // const apiEventEmitter = new EventEmitter();
    return {
      experiments: {
        translateUi: {
          /* Start reacting to translation state updates */
          start: async function start() {
            try {
              console.log("Called start()");

              function getMostRecentBrowserWindow() {
                return BrowserWindowTracker.getTopWindow({
                  private: false,
                  allowPopups: false,
                });
              }

              const recentWindow = getMostRecentBrowserWindow();
              if (recentWindow && recentWindow.gBrowser) {
                const translationBrowserChromeUi = new TranslationBrowserChromeUi(
                  recentWindow.gBrowser,
                  context,
                );
                translationBrowserChromeUi.showURLBarIcon();
                translationBrowserChromeUi.showTranslationInfoBar();
              }

              return undefined;
            } catch (error) {
              // Surface otherwise silent or obscurely reported errors
              console.error(error.message, error.stack);
              throw new ExtensionError(error.message);
            }
          },

          /* Stop reacting to translation state updates */
          stop: async function stop() {
            try {
              console.log("Called stop()");
              return undefined;
            } catch (error) {
              // Surface otherwise silent or obscurely reported errors
              console.error(error.message, error.stack);
              throw new ExtensionError(error.message);
            }
          },
        },
      },
    };
  }
};
