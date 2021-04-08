import { assertElementExists } from "./assertElement";
import { lookForPageElement } from "./lookForElement";
import { By } from "selenium-webdriver";
import { WebDriver } from "./setupWebdriver";

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
