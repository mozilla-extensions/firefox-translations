/* eslint-env node, mocha */

import { assert } from "chai";
import { installExtension, launchFirefox } from "../utils/setupWebdriver";
import {
  lookForBrowserElement,
  lookForPageElement,
} from "../utils/lookForElement";
import { navigateToURL } from "../utils/navigateToURL";
import { By } from "selenium-webdriver";
import {
  assertElementDoesNotExist,
  assertElementExists,
} from "../utils/assertElement";
import { takeScreenshot } from "../utils/takeScreenshot";

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

async function lookForFixturePageOriginalContent(driver) {
  return lookForPageElement(
    driver,
    By.xpath,
    "//*[contains(text(),'Bienvenidos')]",
  );
}

async function lookForFixturePageTranslatedContent(driver, timeout) {
  return lookForPageElement(
    driver,
    By.xpath,
    "//*[contains(text(),'Welcome')]",
    timeout,
  );
}

if (process.env.UI === "native-ui") {
  describe("Infobar interactions", function() {
    // This gives Firefox time to start, and us a bit longer during some of the tests.
    this.timeout((15 + 60) * 1000);

    let driver;

    before(async () => {
      driver = await launchFirefox();
      await installExtension(driver);
      // Allow our extension some time to set up the initial ui
      await driver.sleep(1000);
    });

    after(async () => {
      await driver.quit();
    });

    it("The translation infobar is not shown on eg about:debugging", async () => {
      await navigateToURL(driver, "about:debugging");
      const infobarElement = await lookForInfobar(driver);
      assertElementDoesNotExist(infobarElement, "infobarElement");
      await takeScreenshot(driver, this.ctx.test.fullTitle());
    });

    const assertInfobarIsShown = async () => {
      const infobarElement = await lookForInfobar(driver);
      assertElementExists(infobarElement, "infobarElement");
      const valueAttribute = await infobarElement.getAttribute("value");
      assert.equal(valueAttribute, "translation");
    };

    it("The translation infobar is shown on a web-page with Spanish content", async () => {
      // ... this test continues the session from the previous test
      await navigateToURL(
        driver,
        "http://0.0.0.0:4001/es.wikipedia.org-2021-01-20-welcome-box.html",
      );
      await assertInfobarIsShown();
      const translateButtonElement = await lookForInfobarTranslateButton(
        driver,
      );
      assertElementExists(translateButtonElement, "translateButtonElement");
      await takeScreenshot(driver, this.ctx.test.fullTitle());
    });

    const translateViaInfobar = async () => {
      const originalPageElement = await lookForFixturePageOriginalContent(
        driver,
      );
      assertElementExists(originalPageElement, "originalPageElement");
      await assertInfobarIsShown();
      const translateButtonElement = await lookForInfobarTranslateButton(
        driver,
      );
      assertElementExists(translateButtonElement, "translateButtonElement");
      await translateButtonElement.click();
    };

    const assertTranslationSucceeded = async () => {
      const translatedPageElement = await lookForFixturePageTranslatedContent(
        driver,
        30 * 1000,
      );
      assertElementExists(translatedPageElement, "translatedPageElement");
    };

    it("Translation via the infobar works", async () => {
      // ... this test continues the session from the previous test
      await translateViaInfobar();
      await assertTranslationSucceeded();
      await takeScreenshot(driver, this.ctx.test.fullTitle());
    });

    it("Translation via the infobar works after navigating to another page", async () => {
      // ... this test continues the session from the previous test
      await navigateToURL(
        driver,
        "http://0.0.0.0:4001/es.wikipedia.org-2021-01-20-welcome-box.html",
      );
      await translateViaInfobar();
      await assertTranslationSucceeded();
      await takeScreenshot(
        driver,
        `${this.ctx.test.fullTitle()} - After navigation 1`,
      );
      await navigateToURL(
        driver,
        "http://0.0.0.0:4001/es.wikipedia.org-2021-01-20-welcome-box.html",
      );
      await translateViaInfobar();
      await assertTranslationSucceeded();
      await takeScreenshot(
        driver,
        `${this.ctx.test.fullTitle()} - After navigation 2`,
      );
    });
  });
}
