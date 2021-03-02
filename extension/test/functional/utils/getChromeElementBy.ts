import { Context, WebDriver } from "./setupWebdriver";

const webdriver = require("selenium-webdriver");
const By = webdriver.By;
const until = webdriver.until;

export class getChromeElementBy {
  static async getChromeElement(driver: WebDriver, method, selector) {
    driver.setContext(Context.CHROME);
    try {
      return await driver.wait(
        until.elementLocated(By[method](selector)),
        1000,
      );
    } catch (e) {
      if (e.message.indexOf("Waiting for element to be located") > -1) {
        return null;
      }
      // propagate unexpected errors
      console.error(e);
      throw e;
    }
  }

  static async id(driver: WebDriver, id) {
    return this.getChromeElement(driver, "id", id);
  }

  static async className(driver: WebDriver, className) {
    return this.getChromeElement(driver, "className", className);
  }

  static async tagName(driver: WebDriver, tagName) {
    return this.getChromeElement(driver, "tagName", tagName);
  }
}
