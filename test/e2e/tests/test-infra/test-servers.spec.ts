/* eslint-env node, mocha */

import { launchFirefox } from "../../utils/setupWebdriver";
import { takeScreenshot } from "../../utils/takeScreenshot";
import {
  startTestServers,
  verifyTestProxyServer,
} from "../../utils/setupServers";

let shutdownTestServers;

describe("Test servers", function() {
  // This gives Firefox time to start, and us a bit longer during some of the tests.
  this.timeout(25 * 1000);

  let driver;

  before(async function() {
    const _ = await startTestServers();
    shutdownTestServers = _.shutdownTestServers;
    driver = await launchFirefox();
    // Allow our extension some time to set up the initial ui
    await driver.sleep(1000);
  });

  after(async function() {
    await takeScreenshot(driver, this.test.fullTitle());
    await driver.quit();
    shutdownTestServers();
  });

  it("Proxy server for telemetry-validation is properly configured", async function() {
    await verifyTestProxyServer(driver, this.test);
  });
});
