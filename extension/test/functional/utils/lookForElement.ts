import { Context, WebDriver } from "./setupWebdriver";
import { WebElementPromise } from "selenium-webdriver";

const webdriver = require("selenium-webdriver");
const until = webdriver.until;

export const lookForBrowserElement = async (
  driver: WebDriver,
  byMethod,
  byArg,
  timeoutMs: number = 1000,
) => {
  driver.setContext(Context.CHROME);
  return lookForElement(driver, byMethod, byArg, timeoutMs);
};

export const lookForPageElement = async (
  driver: WebDriver,
  byMethod,
  byArg,
  timeoutMs: number = 1000,
) => {
  driver.setContext(Context.CONTENT);
  return lookForElement(driver, byMethod, byArg, timeoutMs);
};

/**
 * Convenience wrapper for looking for an element in the current page or browser ui.
 * Does not assume that the element exists (assertions are left to the tests utilizing the method).
 *
 * @param driver
 * @param byMethod Pass in one of the methods of webdriver.By, eg webdriver.By.css
 * @param byArg The argument (all methods)
 * @param timeoutMs
 * @return Promise<null | WebElementPromise>
 */
export const lookForElement = async (
  driver: WebDriver,
  byMethod,
  byArg,
  timeoutMs: number = 1000,
): Promise<null | WebElementPromise> => {
  const stackTrace = new Error().stack;
  try {
    return await driver.wait(until.elementLocated(byMethod(byArg)), timeoutMs);
  } catch (e) {
    if (e.message.indexOf("Waiting for element to be located") > -1) {
      return null;
    }
    if (
      e.message.indexOf(
        "Tried to run command without establishing a connection",
      ) > -1
    ) {
      console.info(
        "Webdriver/Geckodriver has crashed recently and is not currently available. Original error details: ",
        e,
      );
      console.debug("Full stacktrace: ", stackTrace);
      throw new Error(
        "Webdriver/Geckodriver has crashed recently and is not currently available",
      );
    }
    // propagate unexpected errors
    console.error("Unexpected error in lookForElement:", e);
    throw new Error("Unexpected error in lookForElement occured");
  }
};
