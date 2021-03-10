import { assert } from "chai";
import { WebElement } from "selenium-webdriver";

export const assertElementExists = (
  element: WebElement | null,
  ref: string,
) => {
  assert.notStrictEqual(element, null, `Element ${ref} exists`);
};

export const assertElementDoesNotExist = (
  element: WebElement | null,
  ref: string,
) => {
  assert.strictEqual(element, null, `Element ${ref} does not exist`);
};
