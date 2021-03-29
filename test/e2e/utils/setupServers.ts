import * as fs from "fs";
import { join } from "path";

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
};

export const launchFixturesServer = () => {
  launchTestServer(
    "yarn",
    ["serve-fixtures", "--port", "4001"],
    "fixtures-server",
    {},
  );
};

export const launchTestProxyServer = () => {
  const TELEMETRY_FOLDER = "foo";
  launchTestServer(
    "mitmdump",
    ["-s", "./test/e2e/intercept-telemetry-requests.py"],
    "test-proxy-server",
    { TELEMETRY_FOLDER },
  );
};
