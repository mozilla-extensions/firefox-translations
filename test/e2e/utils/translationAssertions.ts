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

export const assertOnTranslationAttemptConcludedTelemetry = (
  telemetryPayload,
  expectedFromLang: string,
  expectedToLang: string,
) => {
  assert.strictEqual(
    telemetryPayload.metrics.string["metadata.from_lang"],
    expectedFromLang,
    "The telemetry payload's string metrics 'metadata.from_lang' is correct",
  );
  assert.strictEqual(
    telemetryPayload.metrics.string["metadata.to_lang"],
    expectedToLang,
    "The telemetry payload's string metrics 'metadata.to_lang' is correct",
  );
  // Check telemetry for: Translated words per second, Model load time, Translation time, Model download time
  assert(
    parseInt(
      telemetryPayload.metrics.string["performance.model_load_time"],
      10,
    ) >= 0,
    "The telemetry payload's string metrics 'performance.model_load_time' is a string that when parsed evaluates to 0 or greater",
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
  assert(
    parseInt(
      telemetryPayload.metrics.string["performance.model_download_time"],
      10,
    ) >= 0,
    "The telemetry payload's string metrics 'performance.model_download_time' is a string that when parsed evaluates to 0 or greater",
  );
};
