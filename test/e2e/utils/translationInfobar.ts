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

export const assertOnInfoBarDisplayedTelemetry = (
  telemetryPayload,
  expectedFromLang: string,
  expectedToLang: string,
) => {
  // Check telemetry for: Record when the infobar is displayed - with language pair information as metadata
  assert.strictEqual(
    telemetryPayload.events.length,
    1,
    "The telemetry payload contains one Glean event",
  );
  assert.strictEqual(
    telemetryPayload.events[0].category,
    "infobar",
    "The telemetry payload's event category is 'infobar'",
  );
  assert.strictEqual(
    telemetryPayload.events[0].name,
    "displayed",
    "The telemetry payload's event name is 'displayed'",
  );
  assert.deepStrictEqual(
    telemetryPayload.metrics.string,
    {
      "metadata.from_lang": expectedFromLang,
      "metadata.to_lang": expectedToLang,
    },
    "The telemetry payload's string metrics are correct",
  );
};

export const assertOnInfoBarClosedTelemetry = (
  telemetryPayload,
  expectedFromLang: string,
  expectedToLang: string,
) => {
  // Check telemetry for: When the user hits the infobar button or menu item 'Close'
  assert.strictEqual(
    telemetryPayload.events.length,
    1,
    "The telemetry payload contains one Glean event",
  );
  assert.strictEqual(
    telemetryPayload.events[0].category,
    "infobar",
    "The telemetry payload's event category is 'infobar'",
  );
  assert.strictEqual(
    telemetryPayload.events[0].name,
    "closed",
    "The telemetry payload's event name is 'closed'",
  );
  assert.deepStrictEqual(
    telemetryPayload.metrics.string,
    {
      "metadata.from_lang": expectedFromLang,
      "metadata.to_lang": expectedToLang,
    },
    "The telemetry payload's string metrics are correct",
  );
};

export const assertOnNeverTranslateSelectedLanguageTelemetry = (
  telemetryPayload1,
  telemetryPayload2,
  expectedFromLang: string,
  expectedToLang: string,
) => {
  // Check telemetry for: When the user hits the infobar button or menu item 'Never translate language'"
  assert.strictEqual(
    telemetryPayload1.events.length,
    1,
    "The first telemetry payload contains one Glean event",
  );
  assert.strictEqual(
    telemetryPayload1.events[0].category,
    "infobar",
    "The first telemetry payload's event category is 'infobar'",
  );
  assert.strictEqual(
    telemetryPayload1.events[0].name,
    "never_translate_lang",
    "The first telemetry payload's event name is 'never_translate_lang'",
  );
  assert.deepStrictEqual(
    telemetryPayload1.metrics.string,
    {
      "metadata.from_lang": expectedFromLang,
      "metadata.to_lang": expectedToLang,
    },
    "The telemetry payload's string metrics are correct",
  );
  assertOnInfoBarClosedTelemetry(
    telemetryPayload2,
    expectedFromLang,
    expectedToLang,
  );
};

export const assertOnNeverTranslateThisSiteTelemetry = (
  telemetryPayload1,
  telemetryPayload2,
  expectedFromLang: string,
  expectedToLang: string,
) => {
  // Check telemetry for: When the user hits the infobar button or menu item 'Never translate site'"
  assert.strictEqual(
    telemetryPayload1.events.length,
    1,
    "The first telemetry payload contains one Glean event",
  );
  assert.strictEqual(
    telemetryPayload1.events[0].category,
    "infobar",
    "The first telemetry payload's event category is 'infobar'",
  );
  assert.strictEqual(
    telemetryPayload1.events[0].name,
    "never_translate_site",
    "The first telemetry payload's event name is 'never_translate_site'",
  );
  assert.deepStrictEqual(
    telemetryPayload1.metrics.string,
    {
      "metadata.from_lang": expectedFromLang,
      "metadata.to_lang": expectedToLang,
    },
    "The telemetry payload's string metrics are correct",
  );
  assertOnInfoBarClosedTelemetry(
    telemetryPayload2,
    expectedFromLang,
    expectedToLang,
  );
};

export const assertOnTranslateButtonPressedTelemetry = (
  telemetryPayload,
  expectedFromLang: string,
  expectedToLang: string,
) => {
  // Check telemetry for: When the user hits the infobar button or menu item 'Translate'
  assert.strictEqual(
    telemetryPayload.events.length,
    1,
    "The telemetry payload contains one Glean event",
  );
  assert.strictEqual(
    telemetryPayload.events[0].category,
    "infobar",
    "The telemetry payload's event category is 'infobar'",
  );
  assert.strictEqual(
    telemetryPayload.events[0].name,
    "translate",
    "The telemetry payload's event name is 'translate'",
  );
  assert.deepStrictEqual(
    telemetryPayload.metrics.string,
    {
      "metadata.from_lang": expectedFromLang,
      "metadata.to_lang": expectedToLang,
    },
    "The telemetry payload's string metrics are correct",
  );
};

export const assertOnNotNowButtonPressedTelemetry = (
  telemetryPayload1,
  telemetryPayload2,
  expectedFromLang: string,
  expectedToLang: string,
) => {
  // Check telemetry for: When the user hits the infobar button or menu item 'Not Now'"
  assert.strictEqual(
    telemetryPayload1.events.length,
    1,
    "The first telemetry payload contains one Glean event",
  );
  assert.strictEqual(
    telemetryPayload1.events[0].category,
    "infobar",
    "The first telemetry payload's event category is 'infobar'",
  );
  assert.strictEqual(
    telemetryPayload1.events[0].name,
    "not_now",
    "The first telemetry payload's event name is 'not_now'",
  );
  assert.deepStrictEqual(
    telemetryPayload1.metrics.string,
    {
      "metadata.from_lang": expectedFromLang,
      "metadata.to_lang": expectedToLang,
    },
    "The telemetry payload's string metrics are correct",
  );
  assertOnInfoBarClosedTelemetry(
    telemetryPayload2,
    expectedFromLang,
    expectedToLang,
  );
};
