/* eslint-env node */

const firefox = require("selenium-webdriver/firefox");
const Context = firefox.Context;

module.exports.nav = {
  navigateToURL: async (driver, url) => {
    // navigate to a regular page
    driver.setContext(Context.CONTENT);
    await driver.get(url);
    driver.setContext(Context.CHROME);
  },
};
