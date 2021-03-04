import * as cmd from "selenium-webdriver/lib/command";
import { Options } from "selenium-webdriver/firefox";
import { Builder, WebDriver as OriginalWebDriver } from "selenium-webdriver";
import { normalizeBinary } from "fx-runner/lib/utils";
import * as fs from "fs";
import { resolve, join } from "path";
import { defaultFirefoxTestPreferences } from "../defaultFirefoxTestPreferences";

async function pathToFirefoxBinary(binary) {
  try {
    const normalizedBinary = resolve(await normalizeBinary(binary));
    await fs.promises.stat(normalizedBinary);
    return normalizedBinary;
  } catch (ex) {
    if (ex.code === "ENOENT") {
      throw new Error(`Could not find ${binary}`);
    }
    throw ex;
  }
}

/**
 * Complements some incomplete type definitions from @types/selenium-webdriver
 */
export interface WebDriver extends OriginalWebDriver {
  setContext: (string) => void;
}

/**
 * Enum of available command contexts.
 *
 * Command contexts are specific to Marionette, and may be used with the
 * {@link #context=} method. Contexts allow you to direct all subsequent
 * commands to either "content" (default) or "chrome". The latter gives
 * you elevated security permissions.
 *
 * @enum {string}
 */
export const Context = {
  CONTENT: "content",
  CHROME: "chrome",
};

export const launchFirefox = async (): Promise<WebDriver> => {
  // Selenium/Webdriver/Geckodriver sometimes throws exceptions that can't be caught.
  // We catch them here so that they show up in stderr without terminating the node process
  process.on("unhandledRejection", r => console.error("unhandledRejection", r));

  const options = new Options();

  Object.keys(defaultFirefoxTestPreferences).forEach(key => {
    options.setPreference(key, defaultFirefoxTestPreferences[key]);
  });

  const builder = new Builder()
    .forBrowser("firefox")
    .setFirefoxOptions(options);

  // Use standalone geckodriver server if GECKODRIVER_URL env var is set
  // (this is useful for debugging test failures)
  if (process.env.GECKODRIVER_URL) {
    builder.usingServer(process.env.GECKODRIVER_URL);
  }

  const binaryLocation = await pathToFirefoxBinary(
    process.env.FIREFOX_BINARY || "firefox",
  );
  await options.setBinary(binaryLocation);
  const driver: WebDriver = <WebDriver>await builder.build();

  // Firefox will have started up by now
  await driver.setContext(Context.CHROME);
  return driver;
};

/**
 * Install extension from a specific path
 *
 * Path defaults to the relative path found in the EXTENSION_ZIP
 * environment variable.
 *
 * @param {object} driver Configured Firefox webdriver
 * @param {string} fileLocation location for extension xpi/zip
 * @returns {Promise<void>} returns extension id)
 */
export const installExtension = async (driver, fileLocation: string = null) => {
  fileLocation =
    fileLocation || join(process.cwd(), process.env.EXTENSION_ARTIFACT);

  const executor = driver.getExecutor();
  executor.defineCommand(
    "installExtension",
    "POST",
    "/session/:sessionId/moz/addon/install",
  );
  const installCmd = new cmd.Command("installExtension");

  const session = await driver.getSession();
  installCmd.setParameters({
    sessionId: session.getId(),
    path: fileLocation,
    temporary: true,
  });
  const extensionId = await executor.execute(installCmd);
  console.log(
    `Extension at ${fileLocation} installed with (extensionId: ${extensionId})`,
  );
  return extensionId;
};

export const uninstallExtension = async (driver, extensionId) => {
  const executor = driver.getExecutor();
  executor.defineCommand(
    "uninstallExtension",
    "POST",
    "/session/:sessionId/moz/addon/uninstall",
  );
  const uninstallCmd = new cmd.Command("uninstallExtension");

  const session = await driver.getSession();
  uninstallCmd.setParameters({ sessionId: session.getId(), id: extensionId });
  await executor.execute(uninstallCmd);
  console.log(`Extension with id ${extensionId} uninstalled`);
};
