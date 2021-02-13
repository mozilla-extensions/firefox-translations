/* eslint-env node */
const path = require("path");

const examplePagesToTranslate = [
  "http://0.0.0.0:4000/es.wikipedia.org-2021-01-20-welcome-box.html",
  "https://es.wikipedia.org",
  "https://www.mozilla.org/",
  "https://www.mozilla.org/es-ES/",
  "https://www.mozilla.org/fr/",
  "https://www.mozilla.org/fi/",
];

const { targetBrowser, ui } = require("./build-config.js");
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
    process.env.FIREFOX_BINARY || "nightly";
  defaultConfig.run.target = ["firefox-desktop"];
  defaultConfig.run.startUrl = [
    `about:devtools-toolbox?type=extension&id=${encodeURIComponent(
      extensionId,
    )}`,
    `http://localhost:${process.env.REMOTE_DEV_SERVER_PORT}/`,
    ...examplePagesToTranslate,
    "about:debugging#/runtime/this-firefox",
  ];
  defaultConfig.run.pref = [
    "browser.aboutConfig.showWarning=false",
    "browser.proton.enabled=true",
    "extensions.experiments.enabled=true",
    "dom.postMessage.sharedArrayBuffer.bypassCOOP_COEP.insecure.enabled=true",
    "javascript.options.wasm_simd=true",
    "javascript.options.wasm_simd_wormhole=true",
    // "browser.translation.ui.show=true",
    // "browser.translation.detectLanguage=true",
    "browser.ctrlTab.recentlyUsedOrder=false",
  ];
  defaultConfig.filename = `${extensionId}-{version}-firefox.xpi`;
}

if (targetBrowser === "chrome") {
  defaultConfig.run.target = ["chromium"];
  defaultConfig.run.startUrl = [
    // "chrome://extensions", // Not available until https://github.com/mozilla/web-ext/issues/1979 is resolved
    `http://localhost:${process.env.REMOTE_DEV_SERVER_PORT}/`,
    ...examplePagesToTranslate,
  ];
  defaultConfig.filename = `${extensionId}-{version}-chrome.zip`;
}

module.exports = defaultConfig;
