import { assertElementExists } from "./assertElement";
import { assert } from "chai";
import { By } from "selenium-webdriver";
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
    `tabpanels#tabbrowser-tabpanels.plain > hbox:nth-of-type(${nthTab}) notification hbox.translate-offer-box button.notification-button.primary`,
  );
}

export const assertInfobarIsShown = async (driver, nthTab) => {
  const infobarElement = await lookForInfobar(driver, nthTab);
  assertElementExists(infobarElement, "infobarElement");
  const valueAttribute = await infobarElement.getAttribute("value");
  assert.equal(valueAttribute, "translation");
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
