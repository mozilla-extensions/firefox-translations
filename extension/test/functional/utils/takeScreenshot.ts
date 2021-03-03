import * as fs from "fs";
import { join } from "path";
const sanitize = require("sanitize-filename");

export const takeScreenshot = async (driver, title = "Untitled screenshot") => {
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
    return await fs.promises.writeFile(destinationPath, data, "base64");
  } catch (screenshotError) {
    console.error(
      "An exception occurred while grabbing a screenshot. This has been caught to make sure that tests keep running despite missing screenshot artifacts. Original exception:",
      screenshotError,
    );
  }
};

module.exports = { takeScreenshot };
