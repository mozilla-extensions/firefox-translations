/* eslint-env node */
const path = require("path");

const examplePageToTranslate = "https://es.wikipedia.org";

const targetBrowser = process.env.TARGET_BROWSER || "firefox";

const sourceDir = path.join(".", "build", targetBrowser);
const artifactsDir = path.join(".", "dist", targetBrowser);

const defaultConfig = {
  // Global options:
  sourceDir,
  artifactsDir,
  ignoreFiles: [".DS_Store"],
  // Command options:
  build: {
    overwriteDest: true,
  },
  run: {
    browserConsole: true,
  },
};

if (targetBrowser === "firefox") {
  defaultConfig.run.firefox =
    process.env.FIREFOX_BINARY || "firefoxdeveloperedition";
  defaultConfig.run.target = ["firefox-desktop"];
  defaultConfig.run.startUrl = [
    "about:devtools-toolbox?type=extension&id=bergamot-browser-extension%40browser.mt",
    "http://localhost:8181/",
    examplePageToTranslate,
    "about:debugging#/runtime/this-firefox",
  ];
  defaultConfig.run.pref = [
    "extensions.experiments.enabled=true",
    // "browser.translation.ui.show=true",
    // "browser.translation.detectLanguage=true",
    // "browser.translation.engine=Google",
    "browser.ctrlTab.recentlyUsedOrder=false",
  ];
  defaultConfig.filename = `{name}-{version}-firefox.xpi`;
}

if (targetBrowser === "chromium") {
  defaultConfig.run.target = ["chromium"];
  defaultConfig.run.startUrl = ["chrome://extensions", examplePageToTranslate];
  defaultConfig.filename = `{name}-{version}-chrome.zip`;
}

module.exports = defaultConfig;
