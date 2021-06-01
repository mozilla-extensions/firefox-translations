import { assertElementExists } from "./assertElement";
import { lookForPageElement } from "./lookForElement";
import { By } from "selenium-webdriver";
import { WebDriver } from "./setupWebdriver";
import { assert } from "chai";

export const maxToleratedModelLoadingDurationInSeconds = 20;
export const maxToleratedTranslationDurationInSeconds = 100;

interface Fixture {
  url: string;
  multipleFramesUrl?: string;
  originalTextToLookFor: string;
  translatedTextToLookFor: string;
}

export const fixtures: { [k: string]: Fixture } = {
  es: {
    url: "http://0.0.0.0:4001/newstest2013.es.top10lines.html",
    multipleFramesUrl: "http://0.0.0.0:4001/multiple-frames.html",
    originalTextToLookFor: "Una estrategia republicana para obstaculizar",
    translatedTextToLookFor: "A Republican strategy to hinder",
  },
  et: {
    url: "http://0.0.0.0:4001/wmt18.et.top10lines.html",
    originalTextToLookFor:
      "Eestis ja Hispaanias peeti kinni neli Kemerovo grupeeringu liiget",
    translatedTextToLookFor:
      "Four members of the Kemerovo group detained in Estonia and Spain",
  },
};

export const fixtureUrl = "http://0.0.0.0:4001/newstest2013.es.top10lines.html";

const expectedFirefoxTelemetryClientId = "12345678-90ab-cdef-1234-567890abcdef";

async function lookForFixturePageOriginalContent(
  driver: WebDriver,
  fixture: Fixture,
) {
  return lookForPageElement(
    driver,
    By.xpath,
    `//*[contains(text(),'${fixture.originalTextToLookFor}')]`,
  );
}

async function lookForFixturePageTranslatedContent(
  driver: WebDriver,
  fixture: Fixture,
  timeout,
) {
  return lookForPageElement(
    driver,
    By.xpath,
    `//*[contains(text(),'${fixture.translatedTextToLookFor}')]`,
    timeout,
  );
}

export const assertOriginalPageElementExists = async (
  driver: WebDriver,
  fixture: Fixture,
) => {
  const originalPageElement = await lookForFixturePageOriginalContent(
    driver,
    fixture,
  );
  assertElementExists(originalPageElement, "originalPageElement");
};

export const assertTranslationSucceeded = async (
  driver: WebDriver,
  fixture: Fixture,
) => {
  const translatedPageElement = await lookForFixturePageTranslatedContent(
    driver,
    fixture,
    (maxToleratedModelLoadingDurationInSeconds +
      maxToleratedTranslationDurationInSeconds) *
      1000,
  );
  assertElementExists(translatedPageElement, "translatedPageElement");
};

export const assertTranslationTelemetryMetadata = (
  telemetryPayload,
  expectedFromLang: string,
  expectedToLang: string,
) => {
  assert.strictEqual(
    telemetryPayload.metrics.string["metadata.from_lang"],
    expectedFromLang,
    "The telemetry payload's string metric 'metadata.from_lang' is correct",
  );
  assert.strictEqual(
    telemetryPayload.metrics.string["metadata.to_lang"],
    expectedToLang,
    "The telemetry payload's string metric 'metadata.to_lang' is correct",
  );
  assert.strictEqual(
    telemetryPayload.metrics.string["metadata.firefox_client_id"],
    expectedFirefoxTelemetryClientId,
    "The telemetry payload's string metric 'metadata.firefox_client_id' is correct",
  );
  assert.isAtLeast(
    telemetryPayload.metrics.string["metadata.extension_version"].length,
    1,
    "The telemetry payload's string metric 'metadata.extension_version' is non-empty",
  );
  assert.isAtLeast(
    telemetryPayload.metrics.string["metadata.extension_build_id"].length,
    1,
    "The telemetry payload's string metric 'metadata.extension_build_id' is non-empty",
  );
  assert.isAtLeast(
    telemetryPayload.metrics.string["metadata.bergamot_translator_version"]
      .length,
    1,
    "The telemetry payload's string metric 'metadata.bergamot_translator_version' is non-empty",
  );
};

export const assertOnTranslationAttemptConcludedTelemetry = (
  telemetryPayload,
  expectedFromLang: string,
  expectedToLang: string,
) => {
  assertTranslationTelemetryMetadata(
    telemetryPayload,
    expectedFromLang,
    expectedToLang,
  );
  // Check telemetry for translation performance metrics
  assert.isAbove(
    telemetryPayload.metrics.timespan["performance.full_page_translated_time"]
      .value,
    0,
    "The telemetry payload's timespan metric 'performance.full_page_translated_time' is more than 0",
  );
  assert.isAtLeast(
    telemetryPayload.metrics.timespan["performance.model_download_time_num"]
      .value,
    0,
    "The telemetry payload's timespan metric 'performance.model_download_time_num' is at least 0",
  );
  assert.isAtLeast(
    telemetryPayload.metrics.timespan["performance.model_load_time_num"].value,
    0,
    "The telemetry payload's timespan metric 'performance.model_load_time_num' is at least 0",
  );
  assert.isAbove(
    telemetryPayload.metrics.timespan["performance.translation_engine_time"]
      .value,
    0,
    "The telemetry payload's timespan metric 'performance.translation_engine_time' is more than 0",
  );
  assert.isAbove(
    telemetryPayload.metrics.quantity["performance.full_page_translated_wps"],
    0,
    "The telemetry payload's quantity metric 'performance.full_page_translated_wps' is more than 0",
  );
  assert.isAbove(
    telemetryPayload.metrics.quantity["performance.translation_engine_wps"],
    0,
    "The telemetry payload's quantity metric 'performance.translation_engine_wps' is more than 0",
  );
  assert.isAtLeast(
    telemetryPayload.metrics.quantity["performance.word_count"],
    0,
    "The telemetry payload's quantity metric 'performance.word_count' is at least 0",
  );
  assert.isAtLeast(
    telemetryPayload.metrics.quantity["performance.word_count_visible"],
    0,
    "The telemetry payload's quantity metric 'performance.word_count_visible' is at least 0",
  );
  assert.isAtLeast(
    telemetryPayload.metrics.quantity[
      "performance.word_count_visible_in_viewport"
    ],
    0,
    "The telemetry payload's quantity metric 'performance.word_count_visible_in_viewport' is at least 0",
  );
};
