/* eslint-env node, mocha */

import { assert } from "chai";
import { setupWebdriver } from "../utils/setupWebdriver";
const { getChromeElementBy } = require("../utils/getChromeElementBy");
import { defaultTestPreferences } from "../config";
import { extensionWidgetId } from "../utils/extensionWidgetId";

let extensionId;

async function promiseBrowserActionIcon(driver) {
  const browserActionId = `${extensionWidgetId(extensionId)}-browser-action`;
  return getChromeElementBy.id(driver, browserActionId);
}

if (process.env.UI === "extension-ui") {
  describe("BrowserAction interaction", function() {
    // This gives Firefox time to start, and us a bit longer during some of the tests.
    this.timeout(15000);

    let driver;

    before(async () => {
      driver = await setupWebdriver.promiseSetupDriver(defaultTestPreferences);
      extensionId = await setupWebdriver.installExtension(driver);
      // Allow our extension some time to set up the initial ui
      await driver.sleep(1000);
    });

    after(async () => {
      await driver.quit();
    });

    it("the element exists", async () => {
      const button = await promiseBrowserActionIcon(driver);
      assert(button !== null);
    });

    it("responds to click", async () => {
      const button = await promiseBrowserActionIcon(driver);
      button.click();
      // TODO: Add some actual assertion here, verifying that the main interface is shown
      assert(true);
    });
  });
}
