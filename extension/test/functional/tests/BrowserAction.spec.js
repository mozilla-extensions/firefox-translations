/* eslint-env node, mocha */

// for unhandled promise rejection debugging
process.on("unhandledRejection", r => console.error(r)); // eslint-disable-line no-console

const assert = require("assert");
const { setupWebdriver } = require("../utils/setupWebdriver");
const { getChromeElementBy } = require("../utils/getChromeElementBy");
const {
  ui: { extensionWidgetId },
} = require("../utils/ui");
const { defaultTestPreferences } = require("../config");

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
      driver.quit();
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
