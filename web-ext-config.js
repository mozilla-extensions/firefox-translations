/* eslint-env node */
const path = require("path");

const urlsToOpenOnRun = [
  "http://0.0.0.0:4000/multiple-frames.html",
  "http://0.0.0.0:4000/newstest2013.es.top10lines.html",
  "http://0.0.0.0:4000/newstest2013.es.top300lines.html",
  "http://0.0.0.0:4000/wmt18.et.top10lines.html",
  "http://0.0.0.0:4000/es.wikipedia.org-2020-11-21-full-page/original.html",
  "http://0.0.0.0:4000/es.wikipedia.org-2021-01-20-welcome-box/original.html",
  "http://0.0.0.0:4000/es.wikipedia.org-2020-11-21-events-on-nov-21-box/original.html",
  "https://es.wikipedia.org",
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
  extensionId,
} = require("./build-config.js");
const sourceDir = buildPath;
const artifactsDir = path.join(
  ".",
  "dist",
  targetEnvironment,
  targetBrowser,
  ui,
);

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
    "browser.aboutConfig.showWarning=false",
    "browser.ctrlTab.recentlyUsedOrder=false",
  ];
  defaultConfig.filename =
    ui === "firefox-infobar-ui"
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
  defaultConfig.filename = `bergamot-browser-extension-{version}-chrome-cross-browser-ui.zip`;
}

module.exports = defaultConfig;
