/* eslint-env node */
const path = require("path");

const examplePagesToTranslate = [
  "https://es.wikipedia.org",
  "https://www.mozilla.org/",
  "https://www.mozilla.org/es-ES/",
  "https://www.mozilla.org/fr/",
  "https://www.mozilla.org/fi/",
];

const targetBrowser = process.env.TARGET_BROWSER || "firefox";
const ui = process.env.UI === "native-ui" ? "native-ui" : "extension-ui";
const sourceDir = path.join(".", "build", targetBrowser, ui);
const artifactsDir = path.join(".", "dist", targetBrowser, ui);

// Using native UI requires a special build and signing process, restricted to specific extension ids
const extensionId =
  targetBrowser === "firefox" && ui === "native-ui"
    ? "translation@mozilla.org"
    : "bergamot-browser-extension@browser.mt";

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
    browserConsole: ui === "native-ui",
  },
};

if (targetBrowser === "firefox") {
  defaultConfig.run.firefox =
    process.env.FIREFOX_BINARY || "firefoxdeveloperedition";
  defaultConfig.run.target = ["firefox-desktop"];
  defaultConfig.run.startUrl = [
    `about:devtools-toolbox?type=extension&id=${encodeURIComponent(
      extensionId,
    )}`,
    "http://localhost:8181/",
    ...examplePagesToTranslate,
    "about:debugging#/runtime/this-firefox",
  ];
  defaultConfig.run.pref = [
    "browser.aboutConfig.showWarning=false",
    "browser.proton.enabled=true",
    "extensions.experiments.enabled=true",
    // "browser.translation.ui.show=true",
    // "browser.translation.detectLanguage=true",
    // "browser.translation.engine=Google",
    "browser.ctrlTab.recentlyUsedOrder=false",
  ];
  defaultConfig.filename = `${extensionId}-{version}-firefox.xpi`;
}

if (targetBrowser === "chromium") {
  defaultConfig.run.target = ["chromium"];
  defaultConfig.run.startUrl = [
    // "chrome://extensions", // Not available until https://github.com/mozilla/web-ext/issues/1979 is resolved
    "http://localhost:8182/",
    ...examplePagesToTranslate,
  ];
  defaultConfig.filename = `${extensionId}-{version}-chrome.zip`;
}

module.exports = defaultConfig;
