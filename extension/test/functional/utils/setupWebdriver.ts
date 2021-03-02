import * as cmd from "selenium-webdriver/lib/command";
import * as firefox from "selenium-webdriver/firefox";
import { Builder, WebDriver } from "selenium-webdriver";
import * as FxRunnerUtils from "fx-runner/lib/utils";
import * as Fs from "fs-extra";
import * as path from "path";

// @ts-ignore
const Context = firefox.Context;

async function promiseActualBinary(binary) {
  try {
    let normalizedBinary = await FxRunnerUtils.normalizeBinary(binary);
    normalizedBinary = path.resolve(normalizedBinary);
    await Fs.stat(normalizedBinary);
    return normalizedBinary;
  } catch (ex) {
    if (ex.code === "ENOENT") {
      throw new Error(`Could not find ${binary}`);
    }
    throw ex;
  }
}

export const setupWebdriver = {
  /**
   * Launches Firefox.
   *
   * @param {object} FIREFOX_PREFERENCES key-value of prefname value.
   * @returns {Promise<*>} driver A configured Firefox webdriver object
   */
  promiseSetupDriver: async (FIREFOX_PREFERENCES): Promise<WebDriver> => {
    const options = new firefox.Options();

    Object.keys(FIREFOX_PREFERENCES).forEach(key => {
      options.setPreference(key, FIREFOX_PREFERENCES[key]);
    });

    const builder = new Builder()
      .forBrowser("firefox")
      .setFirefoxOptions(options);

    // Use standalone geckodriver server if GECKODRIVER_URL env var is set
    // (this is useful for debugging test failures)
    if (process.env.GECKODRIVER_URL) {
      builder.usingServer(process.env.GECKODRIVER_URL);
    }

    const binaryLocation = await promiseActualBinary(
      process.env.FIREFOX_BINARY || "firefox",
    );
    await options.setBinary(binaryLocation);
    const driver = await builder.build();

    // Firefox will have started up by now
    // @ts-ignore
    driver.setContext(Context.CHROME);
    return driver;
  },

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
  installExtension: async (driver, fileLocation: string = null) => {
    fileLocation =
      fileLocation || path.join(process.cwd(), process.env.EXTENSION_ARTIFACT);

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
  },

  uninstallExtension: async (driver, extensionId) => {
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
  },
};
