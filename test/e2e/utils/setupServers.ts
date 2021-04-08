import * as fs from "fs";
import { join } from "path";
import { nanoid } from "nanoid";
import { navigateToURL } from "./navigateToURL";
import { assertElementExists } from "./assertElement";
import { takeScreenshot } from "./takeScreenshot";
import { assert } from "chai";
import { WebDriver } from "./setupWebdriver";
import { lookForPageElement } from "./lookForElement";
import { By } from "selenium-webdriver";
import * as kill from "tree-kill";
import * as waitOn from "wait-on";

export const startTestServers = async () => {
  // Launch and make sure required test servers are available before commencing tests
  const fixturesServerProcess = launchFixturesServer().serverProcess;
  const { proxyInstanceId, serverProcess } = launchTestProxyServer();
  const testProxyServerProcess = serverProcess;
  await waitOn({
    resources: ["tcp:localhost:4001", "tcp:localhost:8080"],
    timeout: 5000, // timeout in ms, default Infinity
  });
  const shutdownTestServers = async () => {
    kill(fixturesServerProcess.pid, "SIGKILL");
    kill(testProxyServerProcess.pid, "SIGKILL");
  };
  return { proxyInstanceId, shutdownTestServers };
};

export const launchTestServer = (
  cmd: string,
  params: string[],
  ref: string,
  environmentVariables: { [k: string]: string },
) => {
  const logsPath = join(process.cwd(), "test", "e2e", "results", "logs");

  const logStream = fs.createWriteStream(join(logsPath, `./${ref}.log`), {
    flags: "a",
  });
  const errorLogStream = fs.createWriteStream(
    join(logsPath, `./${ref}.errors.log`),
    { flags: "a" },
  );

  const spawn = require("child_process").spawn;
  const serverProcess = spawn(cmd, params, {
    env: { ...process.env, environmentVariables },
  });

  serverProcess.stdout.pipe(logStream);
  serverProcess.stderr.pipe(errorLogStream);

  /* eslint-disable mozilla/balanced-listeners */
  serverProcess.on("close", function(code) {
    console.log(`Child process "${ref}" exited with code` + code);
  });
  /* eslint-enable mozilla/balanced-listeners */

  return { serverProcess };
};

export const launchFixturesServer = () => {
  return launchTestServer(
    "yarn",
    ["serve-fixtures", "--port", "4001"],
    "fixtures-server",
    {},
  );
};

export const launchTestProxyServer = () => {
  const date = new Date();
  const utcDateISOString = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000,
  )
    .toISOString()
    .split(".")[0];
  const proxyInstanceId = `${utcDateISOString}-${nanoid(4)}`;
  const { serverProcess } = launchTestServer(
    "mitmdump",
    [
      "-s",
      "./test/e2e/intercept-glean-telemetry-requests.py",
      "--set",
      "confdir=./test/e2e/.mitmproxy",
      "--set",
      "glean_app_id=org-mozilla-bergamot",
      "--set",
      `proxy_instance_id=${proxyInstanceId}`,
    ],
    "test-proxy-server",
    {},
  );
  return { serverProcess, proxyInstanceId };
};

async function lookForMitmProxyConfigurationSuccessMessage(driver, timeout) {
  return lookForPageElement(
    driver,
    By.xpath,
    "//*[contains(text(),'Install mitmproxy')]",
    timeout,
  );
}

export const verifyTestProxyServer = async function(driver: WebDriver, test) {
  await navigateToURL(driver, "http://mitm.it");
  const mitmProxyConfigurationSuccessMessageElement = await lookForMitmProxyConfigurationSuccessMessage(
    driver,
    3000,
  );
  assertElementExists(
    mitmProxyConfigurationSuccessMessageElement,
    "mitmProxyConfigurationSuccessMessageElement",
  );
  await takeScreenshot(driver, `${test.fullTitle()} - http nav`);

  try {
    await navigateToURL(driver, "https://mozilla.com");
    await takeScreenshot(driver, `${test.fullTitle()} - https nav`);
    assert(
      true,
      "Successfully visited a https site without encountering a certificate error",
    );
  } catch (err) {
    if (
      err.name === "InsecureCertificateError" ||
      (err.name === "WebDriverError" &&
        err.message.includes(
          "Reached error page: about:neterror?e=nssFailure2",
        ))
    ) {
      assert(
        false,
        "The mitxproxy certificate is not installed in the profile",
      );
    }
    throw err;
  }
};
