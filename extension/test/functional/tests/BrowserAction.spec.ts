/* eslint-env node, mocha */

import { assert } from "chai";
import { installExtension, launchFirefox } from "../utils/setupWebdriver";
import { extensionWidgetId } from "../utils/extensionWidgetId";
import { lookForBrowserElement } from "../utils/lookForElement";
import { By } from "selenium-webdriver";
import { assertElementExists } from "../utils/assertElement";

let extensionId;

async function lookForBrowserActionIcon(driver) {
  const browserActionId = `${extensionWidgetId(extensionId)}-browser-action`;
  return lookForBrowserElement(driver, By.id, browserActionId);
}

if (process.env.UI === "extension-ui") {
  describe("BrowserAction interaction", function() {
    // This gives Firefox time to start, and us a bit longer during some of the tests.
    this.timeout(15000);

    let driver;

    before(async () => {
      driver = await launchFirefox();
      extensionId = await installExtension(driver);
      // Allow our extension some time to set up the initial ui
      await driver.sleep(1000);
    });

    after(async () => {
      await driver.quit();
    });

    it("the element exists", async () => {
      const browserActionButtonElement = await lookForBrowserActionIcon(driver);
      assertElementExists(
        browserActionButtonElement,
        "browserActionButtonElement",
      );
    });

    it("responds to click", async () => {
      const browserActionButtonElement = await lookForBrowserActionIcon(driver);
      assertElementExists(
        browserActionButtonElement,
        "browserActionButtonElement",
      );
      await browserActionButtonElement.click();
      // TODO: Add some actual assertion here, verifying that the main interface is shown
      assert(true);
    });
  });
}
