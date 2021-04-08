/* eslint-env node, mocha */

import { installExtension, launchFirefox } from "../../utils/setupWebdriver";
import { navigateToURL } from "../../utils/navigateToURL";
import { assertElementExists } from "../../utils/assertElement";
import { takeScreenshot } from "../../utils/takeScreenshot";
import {
  assertInfobarIsShown,
  lookForInfobarTranslateButton,
  translateViaInfobar,
} from "../../utils/translationInfobar";
import { startTestServers } from "../../utils/setupServers";
import {
  assertOriginalPageElementExists,
  assertTranslationSucceeded,
  fixtureUrl,
  maxToleratedModelLoadingDurationInSeconds,
  maxToleratedTranslationDurationInSeconds,
} from "../../utils/translationAssertions";
import { maxToleratedTelemetryUploadingDurationInSeconds } from "../../utils/telemetry";

let shutdownTestServers;

const tabsCurrentlyOpened = 1;

if (process.env.UI === "firefox-infobar-ui") {
  describe("Translation: Subsequent navigations", function() {
    // This gives Firefox time to start, and us a bit longer during some of the tests.
    this.timeout(
      (15 +
        maxToleratedTelemetryUploadingDurationInSeconds +
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

    it("The translation infobar is shown on a web-page with Spanish content", async function() {
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

    it("Translation via the infobar works", async function() {
      // ... this test continues the session from the previous test
      await assertOriginalPageElementExists(driver);
      await translateViaInfobar(driver, tabsCurrentlyOpened);
      await assertTranslationSucceeded(driver);
      await takeScreenshot(driver, this.test.fullTitle());
    });

    it("Translation via the infobar works after further navigations", async function() {
      // ... this test continues the session from the previous test
      await navigateToURL(driver, fixtureUrl);
      await assertOriginalPageElementExists(driver);
      await translateViaInfobar(driver, tabsCurrentlyOpened);
      await assertTranslationSucceeded(driver);
      await takeScreenshot(
        driver,
        `${this.test.fullTitle()} - After navigation 1`,
      );
      await navigateToURL(driver, fixtureUrl);
      await assertOriginalPageElementExists(driver);
      await translateViaInfobar(driver, tabsCurrentlyOpened);
      await assertTranslationSucceeded(driver);
      await takeScreenshot(
        driver,
        `${this.test.fullTitle()} - After navigation 2`,
      );
    });
  });
}
