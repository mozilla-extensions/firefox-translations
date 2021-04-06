import Glean from "@mozilla/glean/webext";
import { config } from "../../../config";

export const initializeGlean = () => {
  const appId = config.telemetryAppId;
  Glean.initialize(appId, true, {
    debug: { logPings: config.telemetryDebugMode },
  });
  console.info(
    `Glean.js: initialization completed with application ID ${appId}.`,
  );
};
