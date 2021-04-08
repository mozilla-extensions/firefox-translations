/* eslint-env node, mocha */

import { installExtension, launchFirefox } from "../../utils/setupWebdriver";
import { lookForPageElement } from "../../utils/lookForElement";
import { navigateToURL } from "../../utils/navigateToURL";
import { By } from "selenium-webdriver";
import { assertElementExists } from "../../utils/assertElement";
import { takeScreenshot } from "../../utils/takeScreenshot";
import {
  assertInfobarIsShown,
  lookForInfobarTranslateButton,
  translateViaInfobar,
} from "../../utils/translationInfobar";
import { startTestServers } from "../../utils/setupServers";

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

let shutdownTestServers;

const tabsCurrentlyOpened = 1;

const fixtureUrl = "http://0.0.0.0:4001/multiple-frames.html";
const maxToleratedModelLoadingDurationInSeconds = 20;
const maxToleratedTranslationDurationInSeconds = 100;

if (process.env.UI === "firefox-infobar-ui") {
  describe("Multiple frames", function() {
    // This gives Firefox time to start, and us a bit longer during some of the tests.
    this.timeout(
      (15 +
        maxToleratedModelLoadingDurationInSeconds +
        maxToleratedTranslationDurationInSeconds * 5) *
        1000,
    );

    let driver;

    before(async function() {
      const _ = await startTestServers();
      shutdownTestServers = _.shutdownTestServers;
      driver = await launchFirefox();
      await installExtension(driver);
      // Allow our extension some time to set up the initial ui
      await driver.sleep(1000);
    });

    after(async function() {
      await takeScreenshot(driver, this.test.fullTitle());
      await driver.quit();
      shutdownTestServers();
    });

    it("The translation infobar is shown on a multi-frame web-page with Spanish content", async function() {
      // ... this test continues the session from the previous test
      await navigateToURL(driver, fixtureUrl);
      await assertInfobarIsShown(driver, tabsCurrentlyOpened);
      const translateButtonElement = await lookForInfobarTranslateButton(
        driver,
        tabsCurrentlyOpened,
      );
      assertElementExists(translateButtonElement, "translateButtonElement");
      await takeScreenshot(driver, this.test.fullTitle());
    });

    const assertOriginalPageElementExists = async () => {
      const originalPageElement = await lookForFixturePageOriginalContent(
        driver,
      );
      assertElementExists(originalPageElement, "originalPageElement");
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

    it("Translation of all frames", async function() {
      // ... this test continues the session from the previous test
      await assertOriginalPageElementExists();
      await translateViaInfobar(driver, tabsCurrentlyOpened);
      await assertTranslationSucceeded();
      const iframe = driver.findElement(By.css("iframe"));
      await driver.switchTo().frame(iframe);
      await assertTranslationSucceeded();
      await takeScreenshot(driver, this.test.fullTitle());
    });
  });
}
