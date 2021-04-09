/* eslint-env node, mocha */

import { installExtension, launchFirefox } from "../../utils/setupWebdriver";
import { navigateToURL } from "../../utils/navigateToURL";
import { takeScreenshot } from "../../utils/takeScreenshot";
import {
  assertInfobarIsNotShown,
  closeInfobarViaNeverTranslateSiteMenuItem,
} from "../../utils/translationInfobar";
import * as assert from "assert";
import { startTestServers } from "../../utils/setupServers";
import { readSeenTelemetry } from "../../utils/telemetry";
import {
  fixtureUrl,
  maxToleratedModelLoadingDurationInSeconds,
  maxToleratedTranslationDurationInSeconds,
} from "../../utils/translationAssertions";

let proxyInstanceId;
let shutdownTestServers;
const maxToleratedTelemetryUploadingDurationInSeconds = 10;

const tabsCurrentlyOpened = 1;

describe("Never translate site", function() {
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

  it("The translation infobar can be closed via the 'Never translate site' menu item", async function() {
    // ... this test continues the session from the previous test
    await navigateToURL(driver, fixtureUrl);
    await closeInfobarViaNeverTranslateSiteMenuItem(
      driver,
      tabsCurrentlyOpened,
    );
    await takeScreenshot(driver, this.test.fullTitle());
  });

  it("Telemetry checks after: The translation infobar can be closed via the 'Never translate site' menu item", async function() {
    // ... this test continues the session from the previous test
    const seenTelemetry = await readSeenTelemetry(
      1,
      2,
      proxyInstanceId,
      maxToleratedTelemetryUploadingDurationInSeconds * 1000,
    );

    // Check telemetry for: When the user hits the infobar button or menu item 'Never translate site'"
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
      "never_translate_site",
      "The first ping's event name is 'never_translate_site'",
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

  it("The translation infobar is no longer displayed when visiting the same site", async function() {
    // ... this test continues the session from the previous test
    await navigateToURL(driver, fixtureUrl);
    await assertInfobarIsNotShown(driver, tabsCurrentlyOpened);
    await takeScreenshot(driver, this.test.fullTitle());
  });
});
