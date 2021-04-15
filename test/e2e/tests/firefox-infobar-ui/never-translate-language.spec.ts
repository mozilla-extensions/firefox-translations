/* eslint-env node, mocha */

import { installExtension, launchFirefox } from "../../utils/setupWebdriver";
import { navigateToURL } from "../../utils/navigateToURL";
import { takeScreenshot } from "../../utils/takeScreenshot";
import {
  assertInfobarIsNotShown,
  assertOnNeverTranslateSelectedLanguageTelemetry,
  closeInfobarViaNeverTranslateCurrentLanguageMenuItem,
} from "../../utils/translationInfobar";
import { startTestServers } from "../../utils/setupServers";
import {
  maxToleratedTelemetryUploadingDurationInSeconds,
  readSeenTelemetry,
} from "../../utils/telemetry";
import {
  fixtureUrl,
  maxToleratedModelLoadingDurationInSeconds,
  maxToleratedTranslationDurationInSeconds,
} from "../../utils/translationAssertions";

let proxyInstanceId;
let shutdownTestServers;

const tabsCurrentlyOpened = 1;

describe("Never translate language", function() {
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
    proxyInstanceId = _.proxyInstanceId;
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

  it("The translation infobar can be closed via the 'Never translate [Language]' menu item", async function() {
    // ... this test continues the session from the previous test
    await navigateToURL(driver, fixtureUrl);
    await closeInfobarViaNeverTranslateCurrentLanguageMenuItem(
      driver,
      tabsCurrentlyOpened,
    );
    await takeScreenshot(driver, this.test.fullTitle());
  });

  it("Telemetry checks after: The translation infobar can be closed via the 'Never translate [Language]' menu item", async function() {
    // ... this test continues the session from the previous test
    const seenTelemetry = await readSeenTelemetry(1, 2, proxyInstanceId);
    assertOnNeverTranslateSelectedLanguageTelemetry(
      seenTelemetry[0],
      seenTelemetry[1],
    );
  });

  it("The translation infobar is no longer displayed when visiting a page with the same language", async function() {
    // ... this test continues the session from the previous test
    await navigateToURL(driver, fixtureUrl);
    await assertInfobarIsNotShown(driver, tabsCurrentlyOpened);
    await takeScreenshot(driver, this.test.fullTitle());
  });
});
