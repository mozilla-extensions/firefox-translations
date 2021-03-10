/* eslint-env node */
const path = require("path");

const urlsToOpenOnRun = [
  "http://0.0.0.0:4000/newstest2013.es.top10lines.html",
  "http://0.0.0.0:4000/newstest2013.es.top300lines.html",
  "http://0.0.0.0:4000/es.wikipedia.org-2020-11-21/original.html",
  "http://0.0.0.0:4000/es.wikipedia.org-2021-01-20-welcome-box/original.html",
  "http://0.0.0.0:4000/es.wikipedia.org-2020-11-21-events-on-nov-21-box/original.html",
  "https://es.wikipedia.org",
  "http://localhost:8000/bergamot.html",
  "https://www.mozilla.org/",
  "https://www.mozilla.org/es-ES/",
  "https://www.mozilla.org/fr/",
  "https://www.mozilla.org/fi/",
];

const {
  buildPath,
  targetEnvironment,
  targetBrowser,
  ui,
} = require("./build-config.js");
const sourceDir = buildPath;
const artifactsDir = path.join(
  ".",
  "dist",
  targetEnvironment,
  targetBrowser,
  ui,
);

// Using native UI requires a special build and signing process, restricted to specific extension ids
const firefoxInfobarUi =
  targetBrowser === "firefox" && ui === "firefox-infobar-ui";
const extensionId = firefoxInfobarUi
  ? "bergamot-browser-extension@mozilla.org"
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
    browserConsole: ui === "firefox-infobar-ui",
  },
};

if (targetBrowser === "firefox") {
  defaultConfig.run.firefox = process.env.FIREFOX_BINARY || "nightly";
  defaultConfig.run.target = ["firefox-desktop"];
  defaultConfig.run.startUrl = [
    `about:devtools-toolbox?type=extension&id=${encodeURIComponent(
      extensionId,
    )}`,
    `http://localhost:${process.env.REMOTE_DEV_SERVER_PORT}/`,
    ...urlsToOpenOnRun,
    "about:debugging#/runtime/this-firefox",
  ];
  defaultConfig.run.pref = [
    "extensions.experiments.enabled=true",
    "browser.proton.enabled=true",
    "dom.postMessage.sharedArrayBuffer.bypassCOOP_COEP.insecure.enabled=true",
    "javascript.options.wasm_simd=true",
    "javascript.options.wasm_simd_wormhole=true",
    "browser.translation.ui.show=false",
    "browser.translation.detectLanguage=false",
    "browser.aboutConfig.showWarning=false",
    "browser.ctrlTab.recentlyUsedOrder=false",
  ];
  defaultConfig.filename = firefoxInfobarUi
    ? `bergamot-browser-extension-{version}-firefox-infobar-ui.xpi`
    : `bergamot-browser-extension-{version}-firefox-cross-browser-ui.xpi`;
}

if (targetBrowser === "chrome") {
  defaultConfig.run.target = ["chromium"];
  defaultConfig.run.args = ["--js-flags=--experimental-wasm-simd"];
  defaultConfig.run.startUrl = [
    // "chrome://extensions", // Not available until https://github.com/mozilla/web-ext/issues/1979 is resolved
    `http://localhost:${process.env.REMOTE_DEV_SERVER_PORT}/`,
    ...urlsToOpenOnRun,
  ];
  defaultConfig.filename = `${extensionId}-{version}-chrome-cross-browser-ui.zip`;
}

module.exports = defaultConfig;
