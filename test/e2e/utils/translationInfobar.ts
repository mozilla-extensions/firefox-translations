import {
  assertElementDoesNotExist,
  assertElementExists,
} from "./assertElement";
import { assert } from "chai";
import { By, until } from "selenium-webdriver";
import { lookForBrowserElement } from "./lookForElement";

export async function lookForInfobar(driver, nthTab) {
  return lookForBrowserElement(
    driver,
    By.css,
    `tabpanels#tabbrowser-tabpanels.plain > hbox:nth-of-type(${nthTab}) notification`,
  );
}

export async function lookForInfobarTranslateButton(driver, nthTab) {
  return lookForBrowserElement(
    driver,
    By.css,
    `tabpanels#tabbrowser-tabpanels.plain > hbox:nth-of-type(${nthTab}) notification hbox.translate-offer-box button[anonid="translate"]`,
  );
}

export async function lookForInfobarNotNowButton(driver, nthTab) {
  return lookForBrowserElement(
    driver,
    By.css,
    `tabpanels#tabbrowser-tabpanels.plain > hbox:nth-of-type(${nthTab}) notification hbox.translate-offer-box button[anonid="notNow"]`,
  );
}

export async function lookForInfobarOptionsButton(driver, nthTab) {
  return lookForBrowserElement(
    driver,
    By.css,
    `tabpanels#tabbrowser-tabpanels.plain > hbox:nth-of-type(${nthTab}) notification hbox.translate-offer-box button[anonid="options"]`,
  );
}

export async function lookForInfobarCloseButton(driver, nthTab) {
  return lookForBrowserElement(
    driver,
    By.css,
    `tabpanels#tabbrowser-tabpanels.plain > hbox:nth-of-type(${nthTab}) notification toolbarbutton[anonid="closeButton"]`,
  );
}

export const assertInfobarIsShown = async (driver, nthTab) => {
  const infobarElement = await lookForInfobar(driver, nthTab);
  assertElementExists(infobarElement, "infobarElement");
  const valueAttribute = await infobarElement.getAttribute("value");
  assert.equal(valueAttribute, "translation");
  return infobarElement;
};

export const assertInfobarIsNotShown = async (driver, nthTab) => {
  const infobarElement = await lookForInfobar(driver, nthTab);
  assertElementDoesNotExist(infobarElement, "infobarElement");
};

export const translateViaInfobar = async (driver, nthTab) => {
  await assertInfobarIsShown(driver, nthTab);
  const translateButtonElement = await lookForInfobarTranslateButton(
    driver,
    nthTab,
  );
  assertElementExists(translateButtonElement, "translateButtonElement");
  await translateButtonElement.click();
};

export const closeInfobarViaCloseButton = async (driver, nthTab) => {
  const infobarElement = await assertInfobarIsShown(driver, nthTab);
  const closeButtonElement = await lookForInfobarCloseButton(driver, nthTab);
  assertElementExists(closeButtonElement, "closeButtonElement");
  await driver.sleep(500); // Work around apparent race condition that would result in "displayed" telemetry being sent after "closed" telemetry
  await closeButtonElement.click();
  await driver.wait(until.stalenessOf(infobarElement), 1000);
};

export const closeInfobarViaNotNowButton = async (driver, nthTab) => {
  const infobarElement = await assertInfobarIsShown(driver, nthTab);
  const notNowButtonElement = await lookForInfobarNotNowButton(driver, nthTab);
  assertElementExists(notNowButtonElement, "notNowButtonElement");
  await driver.sleep(500); // Work around apparent race condition that would result in "displayed" telemetry being sent after "closed" telemetry
  await notNowButtonElement.click();
  await driver.wait(until.stalenessOf(infobarElement), 1000);
};
