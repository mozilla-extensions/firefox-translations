/* eslint-env commonjs */
/* eslint no-unused-vars: off */
/* eslint no-console: ["warn", { allow: ["info", "warn", "error"] }] */
/* global ExtensionAPI */

"use strict";

this.translateUi = class extends ExtensionAPI {
  getAPI(context) {
    /*
    const { Services } = ChromeUtils.import(
      "resource://gre/modules/Services.jsm",
      {},
    );
     */

    const { ExtensionCommon } = ChromeUtils.import(
      "resource://gre/modules/ExtensionCommon.jsm",
      {},
    );

    // const { EventManager, EventEmitter } = ExtensionCommon;

    const { ExtensionUtils } = ChromeUtils.import(
      "resource://gre/modules/ExtensionUtils.jsm",
      {},
    );
    const { ExtensionError } = ExtensionUtils;

    // const apiEventEmitter = new EventEmitter();
    return {
      experiments: {
        translateUi: {
          /* Start reacting to translation state updates */
          start: async function start() {
            try {
              console.log("Called start()");
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
