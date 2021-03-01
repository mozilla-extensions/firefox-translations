/* eslint-env node */

const webdriver = require("selenium-webdriver");
const firefox = require("selenium-webdriver/firefox");
const By = webdriver.By;
const Context = firefox.Context;
const until = webdriver.until;

class getChromeElementBy {
  static async getChromeElement(driver, method, selector) {
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

  static async id(driver, id) {
    return this.getChromeElement(driver, "id", id);
  }

  static async className(driver, className) {
    return this.getChromeElement(driver, "className", className);
  }

  static async tagName(driver, tagName) {
    return this.getChromeElement(driver, "tagName", tagName);
  }
}

module.exports = {
  getChromeElementBy,
};
