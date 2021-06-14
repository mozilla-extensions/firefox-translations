/* eslint-env node, mocha */

import { installExtension, launchFirefox } from "../../utils/setupWebdriver";
import { navigateToURL } from "../../utils/navigateToURL";
import { By } from "selenium-webdriver";
import { assertElementExists } from "../../utils/assertElement";
import { takeScreenshot } from "../../utils/takeScreenshot";
import {
  assertInfobarIsShown,
  assertOnTranslateButtonPressedTelemetry,
  lookForInfobarTranslateButton,
  translateViaInfobar,
} from "../../utils/translationInfobar";
import { startTestServers } from "../../utils/setupServers";
import {
  maxToleratedTelemetryUploadingDurationInSeconds,
  readSeenTelemetry,
} from "../../utils/telemetry";
import {
  assertOnTranslationAttemptConcludedTelemetry,
  assertOriginalPageElementExists,
  assertTranslationSucceeded,
  fixtures,
  maxToleratedModelLoadingDurationInSeconds,
  maxToleratedTranslationDurationInSeconds,
} from "../../utils/translationAssertions";

let proxyInstanceId;
let shutdownTestServers;

const tabsCurrentlyOpened = 1;

describe("Translation: Multiple frames (with empty child frame)", function() {
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

  it("The translation infobar is shown on a multi-frame web-page with Spanish content", async function() {
    // ... this test continues the session from the previous test
    await navigateToURL(
      driver,
      fixtures.es.multipleFramesWithEmptyChildFrameUrl,
    );
    await assertInfobarIsShown(driver, tabsCurrentlyOpened);
    const translateButtonElement = await lookForInfobarTranslateButton(
      driver,
      tabsCurrentlyOpened,
    );
    assertElementExists(translateButtonElement, "translateButtonElement");
    await takeScreenshot(driver, this.test.fullTitle());
  });

  it("Translation of all frames", async function() {
    // ... this test continues the session from the previous test
    await assertOriginalPageElementExists(driver, fixtures.es);
    await translateViaInfobar(driver, tabsCurrentlyOpened);
    await assertTranslationSucceeded(driver, fixtures.es);
    const iframe = driver.findElement(By.css("iframe"));
    await driver.switchTo().frame(iframe);
    await assertTranslationSucceeded(driver, fixtures.es);
    await takeScreenshot(driver, this.test.fullTitle());
  });

  it("Telemetry checks after: Translation of all frames", async function() {
    // ... this test continues the session from the previous test
    const seenTelemetry = await readSeenTelemetry(0, 0, proxyInstanceId);
    assertOnTranslateButtonPressedTelemetry(seenTelemetry[0], "es", "en");
    assertOnTranslationAttemptConcludedTelemetry(seenTelemetry[0], "es", "en");
  });
});
