import * as firefox from "selenium-webdriver/firefox";
// @ts-ignore
const Context = firefox.Context;

export const navigateToURL = async (driver, url) => {
  const previousContext = driver.getContext();
  driver.setContext(Context.CONTENT);
  await driver.get(url);
  driver.setContext(previousContext);
};
