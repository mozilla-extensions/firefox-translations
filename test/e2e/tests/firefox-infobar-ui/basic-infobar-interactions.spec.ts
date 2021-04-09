/* eslint-env node, mocha */

import { installExtension, launchFirefox } from "../../utils/setupWebdriver";
import { navigateToURL } from "../../utils/navigateToURL";
import { assertElementExists } from "../../utils/assertElement";
import { takeScreenshot } from "../../utils/takeScreenshot";
import {
  assertInfobarIsNotShown,
  assertInfobarIsShown,
  closeInfobarViaCloseButton,
  closeInfobarViaNotNowButton,
  lookForInfobarTranslateButton,
  translateViaInfobar,
} from "../../utils/translationInfobar";
import * as assert from "assert";
import { startTestServers } from "../../utils/setupServers";
import { readSeenTelemetry } from "../../utils/telemetry";
import {
  assertOriginalPageElementExists,
  assertTranslationSucceeded,
  fixtureUrl,
  maxToleratedModelLoadingDurationInSeconds,
  maxToleratedTranslationDurationInSeconds,
} from "../../utils/translationAssertions";

let proxyInstanceId;
let shutdownTestServers;
const maxToleratedTelemetryUploadingDurationInSeconds = 10;

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
    await navigateToURL(driver, fixtureUrl);
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
    const seenTelemetry = await readSeenTelemetry(
      0,
      0,
      proxyInstanceId,
      maxToleratedTelemetryUploadingDurationInSeconds * 1000,
    );
    // Check telemetry for: Record when the infobar is displayed - with language pair information as metadata
    assert.strictEqual(
      seenTelemetry[0].events.length,
      1,
      "The first ping contains one Glean event",
    );
    assert.strictEqual(
      seenTelemetry[0].events[0].category,
      "infobar",
      "The first ping's event category is 'infobar'",
    );
    assert.strictEqual(
      seenTelemetry[0].events[0].name,
      "displayed",
      "The first ping's event name is 'displayed'",
    );
  });

  it("Translation via the infobar works", async function() {
    // ... this test continues the session from the previous test
    await assertOriginalPageElementExists(driver);
    await translateViaInfobar(driver, tabsCurrentlyOpened);
    await assertTranslationSucceeded(driver);
    await takeScreenshot(driver, this.test.fullTitle());
  });

  it("Telemetry checks after: Translation via the infobar works", async function() {
    // ... this test continues the session from the previous test
    const seenTelemetry = await readSeenTelemetry(
      1,
      2,
      proxyInstanceId,
      maxToleratedTelemetryUploadingDurationInSeconds * 1000,
    );

    // Check telemetry for: When the user hits the infobar button or menu item 'Translate'
    assert.strictEqual(
      seenTelemetry[0].events.length,
      1,
      "The first ping contains one Glean event",
    );
    assert.strictEqual(
      seenTelemetry[0].events[0].category,
      "infobar",
      "The first ping's event category is 'infobar'",
    );
    assert.strictEqual(
      seenTelemetry[0].events[0].name,
      "translate",
      "The first ping's event name is 'translate'",
    );
    assert.deepStrictEqual(
      seenTelemetry[0].metrics.string,
      {
        "metadata.from_lang": "es",
        "metadata.to_lang": "en",
      },
      "The first ping's string metrics are correct",
    );

    // Check telemetry for: Translated words per second, Model load time, Translation time
    assert.deepStrictEqual(
      seenTelemetry[1].metrics.string,
      {
        "metadata.from_lang": "es",
        "metadata.to_lang": "en",
        "performance.model_load_time": "-1",
        "performance.translation_time": "-1",
        "performance.words_per_second": "-1",
      },
      "The second ping's string metrics are correct",
    );
  });

  it("The translation infobar can be closed via the close button", async function() {
    // ... this test continues the session from the previous test
    await navigateToURL(driver, fixtureUrl);
    await closeInfobarViaCloseButton(driver, tabsCurrentlyOpened);
    await takeScreenshot(driver, this.test.fullTitle());
  });

  it("Telemetry checks after: The translation infobar can be closed via the close button", async function() {
    // ... this test continues the session from the previous test
    const seenTelemetry = await readSeenTelemetry(
      4,
      4,
      proxyInstanceId,
      maxToleratedTelemetryUploadingDurationInSeconds * 1000,
    );

    // Check telemetry for: When the user hits the infobar button or menu item 'Close'
    assert.strictEqual(
      seenTelemetry[0].events.length,
      1,
      "The first ping contains one Glean event",
    );
    assert.strictEqual(
      seenTelemetry[0].events[0].category,
      "infobar",
      "The first ping's event category is 'infobar'",
    );
    assert.strictEqual(
      seenTelemetry[0].events[0].name,
      "closed",
      "The first ping's event name is 'closed'",
    );
  });

  it("The translation infobar can be closed via the 'Not now' button", async function() {
    // ... this test continues the session from the previous test
    await navigateToURL(driver, fixtureUrl);
    await closeInfobarViaNotNowButton(driver, tabsCurrentlyOpened);
    await takeScreenshot(driver, this.test.fullTitle());
  });

  it("Telemetry checks after: The translation infobar can be closed via the 'Not now' button", async function() {
    // ... this test continues the session from the previous test
    const seenTelemetry = await readSeenTelemetry(
      6,
      7,
      proxyInstanceId,
      maxToleratedTelemetryUploadingDurationInSeconds * 1000,
    );

    // Check telemetry for: When the user hits the infobar button or menu item 'Not Now'"
    assert.strictEqual(
      seenTelemetry[0].events.length,
      1,
      "The first ping contains one Glean event",
    );
    assert.strictEqual(
      seenTelemetry[0].events[0].category,
      "infobar",
      "The first ping's event category is 'infobar'",
    );
    assert.strictEqual(
      seenTelemetry[0].events[0].name,
      "not_now",
      "The first ping's event name is 'not_now'",
    );
    assert.strictEqual(
      seenTelemetry[1].events.length,
      1,
      "The second ping contains one Glean event",
    );
    assert.strictEqual(
      seenTelemetry[1].events[0].category,
      "infobar",
      "The second ping's event category is 'infobar'",
    );
    assert.strictEqual(
      seenTelemetry[1].events[0].name,
      "closed",
      "The second ping's event name is 'closed'",
    );
  });
});
