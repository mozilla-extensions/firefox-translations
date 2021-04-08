/* eslint-env node, mocha */

import { installExtension, launchFirefox } from "../../utils/setupWebdriver";
import { lookForPageElement } from "../../utils/lookForElement";
import { navigateToURL } from "../../utils/navigateToURL";
import { By } from "selenium-webdriver";
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
import {
  startTestServers,
  verifyTestProxyServer,
} from "../../utils/setupServers";
import { readSeenTelemetry } from "../../utils/telemetry";

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

let proxyInstanceId;
let shutdownTestServers;
const maxToleratedTelemetryUploadingDurationInSeconds = 10;

let tabsCurrentlyOpened = 1;

const fixtureUrl = "http://0.0.0.0:4001/newstest2013.es.top10lines.html";
const maxToleratedModelLoadingDurationInSeconds = 20;
const maxToleratedTranslationDurationInSeconds = 100;

if (process.env.UI === "firefox-infobar-ui") {
  before(async function() {
    const _ = await startTestServers();
    proxyInstanceId = _.proxyInstanceId;
    shutdownTestServers = _.shutdownTestServers;
  });

  after(function() {
    shutdownTestServers();
  });

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
      driver = await launchFirefox();
      await installExtension(driver);
      // Allow our extension some time to set up the initial ui
      await driver.sleep(1000);
    });

    after(async function() {
      await takeScreenshot(driver, this.test.fullTitle());
      await driver.quit();
    });

    it("Proxy server for telemetry-validation is properly configured", async function() {
      await verifyTestProxyServer(driver, this.test);
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
      await assertOriginalPageElementExists();
      await translateViaInfobar(driver, tabsCurrentlyOpened);
      await assertTranslationSucceeded();
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

    it("Translation via the infobar works after further navigations", async function() {
      // ... this test continues the session from the previous test
      await navigateToURL(driver, fixtureUrl);
      await assertOriginalPageElementExists();
      await translateViaInfobar(driver, tabsCurrentlyOpened);
      await assertTranslationSucceeded();
      await takeScreenshot(
        driver,
        `${this.test.fullTitle()} - After navigation 1`,
      );
      await navigateToURL(driver, fixtureUrl);
      await assertOriginalPageElementExists();
      await translateViaInfobar(driver, tabsCurrentlyOpened);
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
      await assertOriginalPageElementExists();
      await translateViaInfobar(driver, tabsCurrentlyOpened);
      const originalWindow = await driver.getWindowHandle();
      await driver.switchTo().newWindow("tab");
      tabsCurrentlyOpened++;
      await navigateToURL(driver, fixtureUrl);
      await assertOriginalPageElementExists();
      await translateViaInfobar(driver, tabsCurrentlyOpened);
      await assertTranslationSucceeded();
      await takeScreenshot(driver, `${this.test.fullTitle()} - Tab 2`);
      await driver.switchTo().window(originalWindow);
      await assertTranslationSucceeded();
      await takeScreenshot(driver, `${this.test.fullTitle()} - Tab 1`);
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
        16,
        16,
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
        "The first ping's event name is 'close'",
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
        19,
        20,
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
        "The second ping's event name is 'not_now'",
      );
    });

    // Check telemetry for: When the user hits the infobar button or menu item 'Never translate language'"
    // Check telemetry for: When the user hits the infobar button or menu item 'Never translate site'"
  });
}
