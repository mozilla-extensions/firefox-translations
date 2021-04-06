/* eslint-env node, mocha */

import { installExtension, launchFirefox } from "../utils/setupWebdriver";
import { lookForPageElement } from "../utils/lookForElement";
import { navigateToURL } from "../utils/navigateToURL";
import { By } from "selenium-webdriver";
import {
  assertElementDoesNotExist,
  assertElementExists,
} from "../utils/assertElement";
import { takeScreenshot } from "../utils/takeScreenshot";
import {
  assertInfobarIsShown,
  lookForInfobar,
  lookForInfobarTranslateButton,
  translateViaInfobar,
} from "../utils/translation";
import * as assert from "assert";
import * as waitOn from "wait-on";
import {
  launchFixturesServer,
  launchTestProxyServer,
} from "../utils/setupServers";
import { readSeenTelemetry } from "../utils/telemetry";

async function lookForMitmProxyConfigurationSuccessMessage(driver, timeout) {
  return lookForPageElement(
    driver,
    By.xpath,
    "//*[contains(text(),'Install mitmproxy')]",
    timeout,
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

let proxyInstanceId;
let fixturesServerProcess;
let testProxyServerProcess;
const maxToleratedTelemetryUploadingDurationInSeconds = 10;

let tabsCurrentlyOpened = 1;

const fixtureUrl = "http://0.0.0.0:4001/newstest2013.es.top10lines.html";
const maxToleratedModelLoadingDurationInSeconds = 20;
const maxToleratedTranslationDurationInSeconds = 100;

if (process.env.UI === "firefox-infobar-ui") {
  before(async function() {
    // Launch and make sure required test servers are available before commencing tests
    fixturesServerProcess = launchFixturesServer().serverProcess;
    const _ = launchTestProxyServer();
    proxyInstanceId = _.proxyInstanceId;
    testProxyServerProcess = _.serverProcess;
    await waitOn({
      resources: ["tcp:localhost:4001", "tcp:localhost:8080"],
      timeout: 5000, // timeout in ms, default Infinity
    });
  });

  after(function() {
    fixturesServerProcess.kill();
    testProxyServerProcess.kill();
  });

  describe("Infobar interactions", function() {
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
      await navigateToURL(driver, "http://mitm.it");
      const mitmProxyConfigurationSuccessMessageElement = await lookForMitmProxyConfigurationSuccessMessage(
        driver,
        3000,
      );
      assertElementExists(
        mitmProxyConfigurationSuccessMessageElement,
        "mitmProxyConfigurationSuccessMessageElement",
      );
      await takeScreenshot(driver, `${this.test.fullTitle()} - http nav`);

      try {
        await navigateToURL(driver, "https://mozilla.com");
        await takeScreenshot(driver, `${this.test.fullTitle()} - https nav`);
        assert(
          true,
          "Successfully visited a https site without encountering a certificate error",
        );
      } catch (err) {
        if (
          err.name === "InsecureCertificateError" ||
          (err.name === "WebDriverError" &&
            err.message.includes(
              "Reached error page: about:neterror?e=nssFailure2",
            ))
        ) {
          assert(
            false,
            "The mitxproxy certificate is not installed in the profile",
          );
        }
        throw err;
      }
    });

    it("The translation infobar is not shown on eg about:debugging", async function() {
      await navigateToURL(driver, "about:debugging");
      const infobarElement = await lookForInfobar(driver, tabsCurrentlyOpened);
      assertElementDoesNotExist(infobarElement, "infobarElement");
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
        0,
        1,
        proxyInstanceId,
        maxToleratedTelemetryUploadingDurationInSeconds * 1000,
      );
      assert.strictEqual(
        seenTelemetry[0].events.length,
        1,
        "The first ping contains one Glean event",
      );
      assert.strictEqual(
        seenTelemetry[0].metrics.string["metadata.from_lang"],
        "es",
        "The first ping has correct from_lang metadata",
      );
      assert.strictEqual(
        seenTelemetry[1].metrics.string["metadata.from_lang"],
        "es",
        "The second ping has correct from_lang metadata",
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
  });
}
