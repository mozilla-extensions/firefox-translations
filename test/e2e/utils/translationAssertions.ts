import { assertElementExists } from "./assertElement";
import { lookForPageElement } from "./lookForElement";
import { By } from "selenium-webdriver";
import { WebDriver } from "./setupWebdriver";
import { assert } from "chai";

export const fixtureUrl = "http://0.0.0.0:4001/newstest2013.es.top10lines.html";
export const maxToleratedModelLoadingDurationInSeconds = 20;
export const maxToleratedTranslationDurationInSeconds = 100;

async function lookForFixturePageOriginalContent(driver: WebDriver) {
  return lookForPageElement(
    driver,
    By.xpath,
    "//*[contains(text(),'Una estrategia republicana para obstaculizar')]",
  );
}

async function lookForFixturePageTranslatedContent(driver: WebDriver, timeout) {
  return lookForPageElement(
    driver,
    By.xpath,
    "//*[contains(text(),'A Republican strategy to hinder')]",
    timeout,
  );
}

export const assertOriginalPageElementExists = async (driver: WebDriver) => {
  const originalPageElement = await lookForFixturePageOriginalContent(driver);
  assertElementExists(originalPageElement, "originalPageElement");
};

export const assertTranslationSucceeded = async (driver: WebDriver) => {
  const translatedPageElement = await lookForFixturePageTranslatedContent(
    driver,
    (maxToleratedModelLoadingDurationInSeconds +
      maxToleratedTranslationDurationInSeconds) *
      1000,
  );
  assertElementExists(translatedPageElement, "translatedPageElement");
};

export const assertOnTranslationAttemptConcludedTelemetry = telemetryPayload => {
  assert.strictEqual(
    telemetryPayload.metrics.string["metadata.from_lang"],
    "es",
    "The telemetry payload's string metrics 'metadata.from_lang' is correct",
  );
  assert.strictEqual(
    telemetryPayload.metrics.string["metadata.to_lang"],
    "en",
    "The telemetry payload's string metrics 'metadata.to_lang' is correct",
  );
  // Check telemetry for: Translated words per second, Model load time, Translation time
  assert(
    parseInt(
      telemetryPayload.metrics.string["performance.model_load_time"],
      10,
    ) > 0,
    "The telemetry payload's string metrics 'performance.model_load_time' is a string that when parsed evaluates to more than 0",
  );
  assert(
    parseInt(
      telemetryPayload.metrics.string["performance.translation_time"],
      10,
    ) > 0,
    "The telemetry payload's string metrics 'performance.translation_time' is a string that when parsed evaluates to more than 0",
  );
  assert(
    parseInt(
      telemetryPayload.metrics.string["performance.words_per_second"],
      10,
    ) > 0,
    "The telemetry payload's string metrics 'performance.words_per_second' is a string that when parsed evaluates to more than 0",
  );
};
