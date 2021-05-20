/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global ExtensionAPI, ExtensionCommon, Services */

"use strict";

this.telemetryEnvironment = class extends ExtensionAPI {
  getAPI(context) {
    const { TelemetryController } = ChromeUtils.import(
      "resource://gre/modules/TelemetryController.jsm",
      {},
    );
    const { TelemetryEnvironment } = ChromeUtils.import(
      "resource://gre/modules/TelemetryEnvironment.jsm",
      {},
    );

    /**
     * These attributes are already sent as part of the telemetry ping envelope
     * @returns {{}}
     */
    const collectTelemetryEnvironmentBasedAttributes = () => {
      const environment = TelemetryEnvironment.currentEnvironment;
      console.log("TelemetryEnvironment.currentEnvironment", environment);

      return {
        systemMemoryMb: environment.system.memoryMB,
        systemCpuCores: environment.system.cpu.cores,
        systemCpuSpeedMhz: environment.system.cpu.speedMHz,
      };
    };

    return {
      experiments: {
        telemetryEnvironment: {
          async getTranslationRelevantFxTelemetryMetrics() {
            await TelemetryController.promiseInitialized();

            const telemetryEnvironmentBasedAttributes = collectTelemetryEnvironmentBasedAttributes();

            console.log(
              "telemetryEnvironmentBasedAttributes",
              telemetryEnvironmentBasedAttributes,
            );

            return {
              ...telemetryEnvironmentBasedAttributes,
            };
          },
        },
      },
    };
  }
};
