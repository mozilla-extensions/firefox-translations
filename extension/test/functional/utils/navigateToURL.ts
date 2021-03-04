import { Context } from "./setupWebdriver";

export const navigateToURL = async (driver, url) => {
  const previousContext = driver.getContext();
  await driver.setContext(Context.CONTENT);
  await driver.get(url);
  await driver.setContext(previousContext);
};
