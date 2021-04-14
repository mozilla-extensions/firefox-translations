import {
  assertElementDoesNotExist,
  assertElementExists,
} from "./assertElement";
import { assert } from "chai";
import { By, until } from "selenium-webdriver";
import { lookForBrowserElement } from "./lookForElement";

const cssSelectorForInfobarDeck = `#tab-notification-deck > vbox`;

export async function lookForInfobar(driver, nthTab) {
  return lookForBrowserElement(
    driver,
    By.css,
    `${cssSelectorForInfobarDeck}:nth-of-type(${nthTab}) notification`,
  );
}

export async function lookForInfobarTranslateButton(driver, nthTab) {
  return lookForBrowserElement(
    driver,
    By.css,
    `${cssSelectorForInfobarDeck}:nth-of-type(${nthTab}) notification hbox.translate-offer-box button[anonid="translate"]`,
  );
}

export async function lookForInfobarNotNowButton(driver, nthTab) {
  return lookForBrowserElement(
    driver,
    By.css,
    `${cssSelectorForInfobarDeck}:nth-of-type(${nthTab}) notification hbox.translate-offer-box button[anonid="notNow"]`,
  );
}

export async function lookForInfobarOptionsButton(driver, nthTab) {
  return lookForBrowserElement(
    driver,
    By.css,
    `${cssSelectorForInfobarDeck}:nth-of-type(${nthTab}) notification button[anonid="options"]`,
  );
}

export async function lookForInfobarNeverTranslateCurrentLanguageMenuItem(
  driver,
  nthTab,
) {
  return lookForBrowserElement(
    driver,
    By.css,
    `${cssSelectorForInfobarDeck}:nth-of-type(${nthTab}) notification button[anonid="options"] menuitem[anonid="neverForLanguage"]`,
  );
}

export async function lookForInfobarNeverTranslateSiteMenuItem(driver, nthTab) {
  return lookForBrowserElement(
    driver,
    By.css,
    `${cssSelectorForInfobarDeck}:nth-of-type(${nthTab}) notification button[anonid="options"] menuitem[anonid="neverForSite"]`,
  );
}

export async function lookForInfobarCloseButton(driver, nthTab) {
  return lookForBrowserElement(
    driver,
    By.css,
    `${cssSelectorForInfobarDeck}:nth-of-type(${nthTab}) notification toolbarbutton[anonid="closeButton"]`,
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

export const closeInfobarViaNeverTranslateCurrentLanguageMenuItem = async (
  driver,
  nthTab,
) => {
  const infobarElement = await assertInfobarIsShown(driver, nthTab);
  const optionsButtonElement = await lookForInfobarOptionsButton(
    driver,
    nthTab,
  );
  assertElementExists(optionsButtonElement, "optionsButtonElement");
  await optionsButtonElement.click();
  const neverTranslateCurrentLanguageMenuItemElement = await lookForInfobarNeverTranslateCurrentLanguageMenuItem(
    driver,
    nthTab,
  );
  assertElementExists(
    neverTranslateCurrentLanguageMenuItemElement,
    "neverTranslateCurrentLanguageMenuItemElement",
  );
  await driver.sleep(500); // Work around apparent race condition that would result in "displayed" telemetry being sent after "closed" telemetry
  await neverTranslateCurrentLanguageMenuItemElement.click();
  await driver.wait(until.stalenessOf(infobarElement), 1000);
};

export const closeInfobarViaNeverTranslateSiteMenuItem = async (
  driver,
  nthTab,
) => {
  const infobarElement = await assertInfobarIsShown(driver, nthTab);
  const optionsButtonElement = await lookForInfobarOptionsButton(
    driver,
    nthTab,
  );
  assertElementExists(optionsButtonElement, "optionsButtonElement");
  await optionsButtonElement.click();
  const neverTranslateSiteMenuItemElement = await lookForInfobarNeverTranslateSiteMenuItem(
    driver,
    nthTab,
  );
  assertElementExists(
    neverTranslateSiteMenuItemElement,
    "neverTranslateSiteMenuItemElement",
  );
  await driver.sleep(500); // Work around apparent race condition that would result in "displayed" telemetry being sent after "closed" telemetry
  await neverTranslateSiteMenuItemElement.click();
  await driver.wait(until.stalenessOf(infobarElement), 1000);
};
