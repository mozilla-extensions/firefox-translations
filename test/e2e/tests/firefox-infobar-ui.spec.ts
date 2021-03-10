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

async function lookForInfobar(driver, nthTab) {
  return lookForBrowserElement(
    driver,
    By.css,
    `tabpanels#tabbrowser-tabpanels.plain > hbox:nth-of-type(${nthTab}) notification`,
  );
}

async function lookForInfobarTranslateButton(driver, nthTab) {
  return lookForBrowserElement(
    driver,
    By.css,
    `tabpanels#tabbrowser-tabpanels.plain > hbox:nth-of-type(${nthTab}) notification hbox.translate-offer-box button.notification-button.primary`,
  );
}

async function lookForFixturePageOriginalContent(driver) {
  return lookForPageElement(
    driver,
    By.xpath,
    "//*[contains(text(),'Una estrategia republicana para obstaculizar')]",
  );
}

async function lookForFixturePageTranslatedContent(driver, timeout) {
  return lookForPageElement(
    driver,
    By.xpath,
    "//*[contains(text(),'A Republican strategy to hinder')]",
    timeout,
  );
}

let tabsCurrentlyOpened = 1;

const fixtureUrl = "http://0.0.0.0:4001/newstest2013.es.top10lines.html";
const maxToleratedModelLoadingDurationInSeconds = 20;
const maxToleratedTranslationDurationInSeconds = 100;

if (process.env.UI === "firefox-infobar-ui") {
  describe("Infobar interactions", function() {
    // This gives Firefox time to start, and us a bit longer during some of the tests.
    this.timeout(
      (15 +
        maxToleratedModelLoadingDurationInSeconds +
        maxToleratedTranslationDurationInSeconds * 5) *
        1000,
    );

    let driver;

    before(async function() {
      driver = await launchFirefox();
      await installExtension(driver);
      // Allow our extension some time to set up the initial ui
      await driver.sleep(1000);
    });

    after(async function() {
      await driver.quit();
    });

    it("The translation infobar is not shown on eg about:debugging", async function() {
      await navigateToURL(driver, "about:debugging");
      const infobarElement = await lookForInfobar(driver, tabsCurrentlyOpened);
      assertElementDoesNotExist(infobarElement, "infobarElement");
      await takeScreenshot(driver, this.test.fullTitle());
    });

    const assertInfobarIsShown = async nthTab => {
      const infobarElement = await lookForInfobar(driver, nthTab);
      assertElementExists(infobarElement, "infobarElement");
      const valueAttribute = await infobarElement.getAttribute("value");
      assert.equal(valueAttribute, "translation");
    };

    it("The translation infobar is shown on a web-page with Spanish content", async function() {
      // ... this test continues the session from the previous test
      await navigateToURL(driver, fixtureUrl);
      await assertInfobarIsShown(tabsCurrentlyOpened);
      const translateButtonElement = await lookForInfobarTranslateButton(
        driver,
        tabsCurrentlyOpened,
      );
      assertElementExists(translateButtonElement, "translateButtonElement");
      await takeScreenshot(driver, this.test.fullTitle());
    });

    const translateViaInfobar = async nthTab => {
      const originalPageElement = await lookForFixturePageOriginalContent(
        driver,
      );
      assertElementExists(originalPageElement, "originalPageElement");
      await assertInfobarIsShown(tabsCurrentlyOpened);
      const translateButtonElement = await lookForInfobarTranslateButton(
        driver,
        nthTab,
      );
      assertElementExists(translateButtonElement, "translateButtonElement");
      await translateButtonElement.click();
    };

    const assertTranslationSucceeded = async () => {
      const translatedPageElement = await lookForFixturePageTranslatedContent(
        driver,
        (maxToleratedModelLoadingDurationInSeconds +
          maxToleratedTranslationDurationInSeconds) *
          1000,
      );
      assertElementExists(translatedPageElement, "translatedPageElement");
    };

    it("Translation via the infobar works", async function() {
      // ... this test continues the session from the previous test
      await translateViaInfobar(tabsCurrentlyOpened);
      await assertTranslationSucceeded();
      await takeScreenshot(driver, this.test.fullTitle());
    });

    it("Translation via the infobar works after further navigations", async function() {
      // ... this test continues the session from the previous test
      await navigateToURL(driver, fixtureUrl);
      await translateViaInfobar(tabsCurrentlyOpened);
      await assertTranslationSucceeded();
      await takeScreenshot(
        driver,
        `${this.test.fullTitle()} - After navigation 1`,
      );
      await navigateToURL(driver, fixtureUrl);
      await translateViaInfobar(tabsCurrentlyOpened);
      await assertTranslationSucceeded();
      await takeScreenshot(
        driver,
        `${this.test.fullTitle()} - After navigation 2`,
      );
    });

    it("Translation via the infobar works when translating in multiple tabs at the same time", async function() {
      // ... this test continues the session from the previous test
      await driver.switchTo().newWindow("tab");
      tabsCurrentlyOpened++;
      await navigateToURL(driver, fixtureUrl);
      await translateViaInfobar(tabsCurrentlyOpened);
      const originalWindow = await driver.getWindowHandle();
      await driver.switchTo().newWindow("tab");
      tabsCurrentlyOpened++;
      await navigateToURL(driver, fixtureUrl);
      await translateViaInfobar(tabsCurrentlyOpened);
      await assertTranslationSucceeded();
      await takeScreenshot(driver, `${this.test.fullTitle()} - Tab 2`);
      await driver.switchTo().window(originalWindow);
      await assertTranslationSucceeded();
      await takeScreenshot(driver, `${this.test.fullTitle()} - Tab 1`);
    });
  });
}
