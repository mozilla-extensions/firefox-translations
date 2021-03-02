import { Context } from "./setupWebdriver";

export const navigateToURL = async (driver, url) => {
  const previousContext = driver.getContext();
  driver.setContext(Context.CONTENT);
  await driver.get(url);
  driver.setContext(previousContext);
};
