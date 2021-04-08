/* eslint-env node, mocha */

import { installExtension, launchFirefox } from "../../utils/setupWebdriver";
import { navigateToURL } from "../../utils/navigateToURL";
import { takeScreenshot } from "../../utils/takeScreenshot";
import { translateViaInfobar } from "../../utils/translationInfobar";
import { startTestServers } from "../../utils/setupServers";
import { maxToleratedTelemetryUploadingDurationInSeconds } from "../../utils/telemetry";
import {
  assertOriginalPageElementExists,
  assertTranslationSucceeded,
  fixtureUrl,
  maxToleratedModelLoadingDurationInSeconds,
  maxToleratedTranslationDurationInSeconds,
} from "../../utils/translationAssertions";

let shutdownTestServers;

let tabsCurrentlyOpened = 1;

describe("Translation: Simultaneous tabs", function() {
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

  it("Translation via the infobar works when translating in multiple tabs at the same time", async function() {
    // ... this test continues the session from the previous test
    await driver.switchTo().newWindow("tab");
    tabsCurrentlyOpened++;
    await navigateToURL(driver, fixtureUrl);
    await assertOriginalPageElementExists(driver);
    await translateViaInfobar(driver, tabsCurrentlyOpened);
    const originalWindow = await driver.getWindowHandle();
    await driver.switchTo().newWindow("tab");
    tabsCurrentlyOpened++;
    await navigateToURL(driver, fixtureUrl);
    await assertOriginalPageElementExists(driver);
    await translateViaInfobar(driver, tabsCurrentlyOpened);
    await assertTranslationSucceeded(driver);
    await takeScreenshot(driver, `${this.test.fullTitle()} - Tab 2`);
    await driver.switchTo().window(originalWindow);
    await assertTranslationSucceeded(driver);
    await takeScreenshot(driver, `${this.test.fullTitle()} - Tab 1`);
  });
});
