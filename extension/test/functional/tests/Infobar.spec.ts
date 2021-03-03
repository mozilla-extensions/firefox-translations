/* eslint-env node, mocha */

import { assert } from "chai";
import { setupWebdriver } from "../utils/setupWebdriver";
import {
  lookForBrowserElement,
  lookForPageElement,
} from "../utils/lookForElement";
import { navigateToURL } from "../utils/navigateToURL";
import { defaultTestPreferences } from "../config";
import { By } from "selenium-webdriver";

async function lookForInfobar(driver) {
  return lookForBrowserElement(driver, By.css, "notification");
}

async function lookForInfobarTranslateButton(driver) {
  return lookForBrowserElement(
    driver,
    By.css,
    "notification hbox.translate-offer-box button.notification-button.primary",
  );
}

async function lookForFixturePageContentHeader(driver, timeout) {
  return lookForPageElement(driver, By.css, "foo", timeout);
}

if (process.env.UI === "native-ui") {
  describe("Infobar interaction", function() {
    // This gives Firefox time to start, and us a bit longer during some of the tests.
    this.timeout((15 + 60) * 1000);

    let driver;

    before(async () => {
      driver = await setupWebdriver.promiseSetupDriver(defaultTestPreferences);
      await setupWebdriver.installExtension(driver);
      // Allow our extension some time to set up the initial ui
      await driver.sleep(1000);
    });

    after(async () => {
      await driver.quit();
    });

    it("The translation infobar is not shown on eg about:debugging", async () => {
      await navigateToURL(driver, "about:debugging");
      const infobarElement = await lookForInfobar(driver);
      assert.strictEqual(infobarElement, null, "Element does not exist");
    });

    it("The translation infobar is shown on a web-page with Spanish content", async () => {
      await navigateToURL(
        driver,
        "http://0.0.0.0:4001/es.wikipedia.org-2021-01-20-welcome-box.html",
      );
      const infobarElement = await lookForInfobar(driver);
      assert.notStrictEqual(infobarElement, null, "Element exists");
      const valueAttribute = await infobarElement.getAttribute("value");
      assert.equal(valueAttribute, "translation");
      const translateButtonElement = await lookForInfobarTranslateButton(
        driver,
      );
      assert.notStrictEqual(translateButtonElement, null, "Element exists");
    });

    it("Translation via the infobar on a web-page with Spanish content works", async () => {
      await navigateToURL(
        driver,
        "http://0.0.0.0:4001/es.wikipedia.org-2021-01-20-welcome-box.html",
      );
      const notYetTranslatedPageElement = lookForFixturePageContentHeader(
        driver,
        1000,
      );
      assert.notStrictEqual(
        notYetTranslatedPageElement,
        null,
        "Element exists",
      );
      const infobarElement = await lookForInfobar(driver);
      assert.notStrictEqual(infobarElement, null, "Element exists");
      const valueAttribute = await infobarElement.getAttribute("value");
      assert.equal(valueAttribute, "translation");
      const translateButtonElement = await lookForInfobarTranslateButton(
        driver,
      );
      assert.notStrictEqual(translateButtonElement, null, "Element exists");
      translateButtonElement.click();
      const translatedPageElement = lookForFixturePageContentHeader(
        driver,
        60 * 1000,
      );
      assert.notStrictEqual(translatedPageElement, null, "Element exists");
    });
  });
}
