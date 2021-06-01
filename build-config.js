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
} else {
  extensionBuildEnvironment = "local";
}
if (targetEnvironment !== "production") {
  extensionBuildEnvironment += `:${targetEnvironment}`;
}

const extensionId =
  ui === "firefox-infobar-ui"
    ? "firefox-translations@mozilla.org"
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
