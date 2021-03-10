import * as fs from "fs";
import { join } from "path";
import { Context } from "./setupWebdriver";
const sanitize = require("sanitize-filename");

/* eslint-disable consistent-return */
export const takeScreenshot = async (
  driver,
  title = "Untitled screenshot",
): Promise<void> => {
  const previousContext = driver.getContext();
  await driver.setContext(Context.CHROME);
  try {
    const destinationPath = join(
      process.cwd(),
      "test",
      "functional",
      "results",
      "screenshots",
      `${sanitize(title)}.png`,
    );
    const data = await driver.takeScreenshot();
    await driver.setContext(previousContext);
    return fs.promises.writeFile(destinationPath, data, "base64");
  } catch (screenshotError) {
    console.error(
      "An exception occurred while grabbing a screenshot. This has been caught to make sure that tests keep running despite missing screenshot artifacts. Original exception:",
      screenshotError,
    );
  } finally {
    await driver.setContext(previousContext);
  }
};

module.exports = { takeScreenshot };
