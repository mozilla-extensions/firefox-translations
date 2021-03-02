import { Context, WebDriver } from "./setupWebdriver";

const webdriver = require("selenium-webdriver");
const until = webdriver.until;

export const getChromeElement = async (driver: WebDriver, byMethod, byArg) => {
  driver.setContext(Context.CHROME);
  try {
    return await driver.wait(until.elementLocated(byMethod(byArg)), 1000);
  } catch (e) {
    if (e.message.indexOf("Waiting for element to be located") > -1) {
      return null;
    }
    // propagate unexpected errors
    console.error("Unexpected error in getChromeElement:", e);
    throw e;
  }
};
