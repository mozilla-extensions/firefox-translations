/* eslint-env node */

const path = require("path");

if (!process.env.TARGET_BROWSER) {
  throw new Error("Missing TARGET_BROWSER env var");
}
if (!process.env.UI) {
  throw new Error("Missing UI env var");
}
const targetEnvironment =
  process.env.NODE_ENV === "production" ? "production" : "development";
const targetBrowser = process.env.TARGET_BROWSER;
const ui = process.env.UI;

let extensionBuildEnvironment;
if (process.env.CIRCLECI === "true") {
  extensionBuildEnvironment = "circleci";
} else if (process.env.CI === "true") {
  extensionBuildEnvironment = "ci";
} else if (process.env.MC === "1") {
  extensionBuildEnvironment = "mozilla";
} else {
  extensionBuildEnvironment = "local";
}
if (targetEnvironment !== "production") {
  extensionBuildEnvironment += `:${targetEnvironment}`;
}

const extensionId =
  ui === "firefox-infobar-ui"
    ? `${
        process.env.MC === "1"
          ? "firefox-translations@mozilla.org"
          : "firefox-infobar-ui-bergamot-browser-extension@browser.mt"
      }`
    : "bergamot-browser-extension@browser.mt";

const buildPath = path.join(
  __dirname,
  "build",
  targetEnvironment,
  targetBrowser,
  ui,
);

const buildConfig = {
  targetEnvironment,
  targetBrowser,
  ui,
  extensionId,
  buildPath,
  extensionBuildEnvironment,
};

console.info(`Build config: `, buildConfig);

module.exports = buildConfig;
