/* eslint-env node, mocha */

// for unhandled promise rejection debugging
process.on("unhandledRejection", r => console.error(r)); // eslint-disable-line no-console

const assert = require("assert");
const { ui, setupWebdriver } = require("./utils");
const { defaultTestPreferences } = require("./config");
const firefox = require("selenium-webdriver/firefox");
const Context = firefox.Context;
const webdriver = require("selenium-webdriver");
const By = webdriver.By;
const until = webdriver.until;
let extensionId;

async function promiseBrowserActionIcon(driver) {
  const browserActionId = `${ui.extensionWidgetId(extensionId)}-browser-action`;
  driver.setContext(Context.CHROME);
  return driver.wait(until.elementLocated(By.id(browserActionId)), 1000);
}

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
    return assert(typeof button === "object");
  });

  it("responds to click", async () => {
    const button = await promiseBrowserActionIcon(driver);
    button.click();
    // TODO: Add some actual assertion here, verifying that the main interface is shown
    assert(true);
  });
});
