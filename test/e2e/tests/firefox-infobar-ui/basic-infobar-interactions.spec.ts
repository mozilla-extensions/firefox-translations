/* eslint-env node, mocha */

import { installExtension, launchFirefox } from "../../utils/setupWebdriver";
import { navigateToURL } from "../../utils/navigateToURL";
import { assertElementExists } from "../../utils/assertElement";
import { takeScreenshot } from "../../utils/takeScreenshot";
import {
  assertInfobarIsNotShown,
  assertInfobarIsShown,
  assertOnInfoBarClosedTelemetry,
  assertOnInfoBarDisplayedTelemetry,
  assertOnNotNowButtonPressedTelemetry,
  assertOnTranslateButtonPressedTelemetry,
  closeInfobarViaCloseButton,
  closeInfobarViaNotNowButton,
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

describe("Basic infobar interactions", function() {
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

  it("The translation infobar is not shown on eg about:debugging", async function() {
    await navigateToURL(driver, "about:debugging");
    await assertInfobarIsNotShown(driver, tabsCurrentlyOpened);
    await takeScreenshot(driver, this.test.fullTitle());
  });

  it("The translation infobar is shown on a web-page with Spanish content", async function() {
    // ... this test continues the session from the previous test
    await navigateToURL(driver, fixtures.es.url);
    await assertInfobarIsShown(driver, tabsCurrentlyOpened);
    const translateButtonElement = await lookForInfobarTranslateButton(
      driver,
      tabsCurrentlyOpened,
    );
    assertElementExists(translateButtonElement, "translateButtonElement");
    await takeScreenshot(driver, this.test.fullTitle());
  });

  it("Telemetry checks after: The translation infobar is shown on a web-page with Spanish content", async function() {
    // ... this test continues the session from the previous test
    const seenTelemetry = await readSeenTelemetry(0, 0, proxyInstanceId);
    assertOnInfoBarDisplayedTelemetry(seenTelemetry[0], "es", "en");
  });

  it("Translation via the infobar works", async function() {
    // ... this test continues the session from the previous test
    await assertOriginalPageElementExists(driver, fixtures.es);
    await translateViaInfobar(driver, tabsCurrentlyOpened);
    await assertTranslationSucceeded(driver, fixtures.es);
    await takeScreenshot(driver, this.test.fullTitle());
  });

  it("Telemetry checks after: Translation via the infobar works", async function() {
    // ... this test continues the sessiAn from the previous test
    const seenTelemetry = await readSeenTelemetry(1, 2, proxyInstanceId);
    assertOnTranslateButtonPressedTelemetry(seenTelemetry[0], "es", "en");
    assertOnTranslationAttemptConcludedTelemetry(seenTelemetry[1], "es", "en");
  });

  it("The translation infobar can be closed via the close button", async function() {
    // ... this test continues the session from the previous test
    await navigateToURL(driver, fixtures.es.url);
    await closeInfobarViaCloseButton(driver, tabsCurrentlyOpened);
    await takeScreenshot(driver, this.test.fullTitle());
  });

  it("Telemetry checks after: The translation infobar can be closed via the close button", async function() {
    // ... this test continues the session from the previous test
    const seenTelemetry = await readSeenTelemetry(4, 4, proxyInstanceId);
    assertOnInfoBarClosedTelemetry(seenTelemetry[0], "es", "en");
  });

  it("The translation infobar can be closed via the 'Not now' button", async function() {
    // ... this test continues the session from the previous test
    await navigateToURL(driver, fixtures.es.url);
    await closeInfobarViaNotNowButton(driver, tabsCurrentlyOpened);
    await takeScreenshot(driver, this.test.fullTitle());
  });

  it("Telemetry checks after: The translation infobar can be closed via the 'Not now' button", async function() {
    // ... this test continues the session from the previous test
    const seenTelemetry = await readSeenTelemetry(6, 7, proxyInstanceId);
    assertOnNotNowButtonPressedTelemetry(
      seenTelemetry[0],
      seenTelemetry[1],
      "es",
      "en",
    );
  });
});
