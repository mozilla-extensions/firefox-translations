/* eslint-env node, mocha */

import { assert } from "chai";
import { setupWebdriver } from "../utils/setupWebdriver";
import { getChromeElement } from "../utils/getChromeElement";
import { navigateToURL } from "../utils/navigateToURL";
import { defaultTestPreferences } from "../config";
import { By } from "selenium-webdriver";

async function getInfobar(driver) {
  return getChromeElement(driver, By.css, "notification");
}

async function getInfobarTranslateButton(driver) {
  return getChromeElement(
    driver,
    By.css,
    "notification hbox.translate-offer-box button.notification-button.primary",
  );
}

if (process.env.UI === "native-ui") {
  describe("Infobar interaction", function() {
    // This gives Firefox time to start, and us a bit longer during some of the tests.
    this.timeout(15000);

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

    it("The translation infobar is not shown on about:debugging", async () => {
      await navigateToURL(driver, "about:debugging");
      const notice = await getInfobar(driver);
      assert(notice === null);
    });

    it("The translation infobar is shown on a web-page with Spanish content", async () => {
      await navigateToURL(
        driver,
        "http://0.0.0.0:4001/es.wikipedia.org-2021-01-20-welcome-box.html",
      );
      const infobarElement = await getInfobar(driver);
      assert(infobarElement !== null);
      const valueAttribute = await infobarElement.getAttribute("value");
      assert.equal(valueAttribute, "translation");
      const translateButtonElement = await getInfobarTranslateButton(driver);
      assert(translateButtonElement !== null);
    });

    it("Translation via the infobar on a web-page with Spanish content works", async () => {
      await navigateToURL(
        driver,
        "http://0.0.0.0:4001/es.wikipedia.org-2021-01-20-welcome-box.html",
      );
      const infobarElement = await getInfobar(driver);
      assert(infobarElement !== null);
      const valueAttribute = await infobarElement.getAttribute("value");
      assert.equal(valueAttribute, "translation");
      const translateButtonElement = await getInfobarTranslateButton(driver);
      assert(translateButtonElement !== null);
      translateButtonElement.click();
    });
  });
}
