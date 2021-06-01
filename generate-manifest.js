/* eslint-env node */

const fs = require("fs");
const path = require("path");
const packageJson = require("./package.json");
const {
  buildPath,
  targetEnvironment,
  targetBrowser,
  ui,
  extensionId,
} = require("./build-config.js");

async function generateManifest({ dotEnvPath }) {
  require("dotenv").config({ path: dotEnvPath });
  const manifest = {
    manifest_version: 2,
    name: `${
      ui === "firefox-infobar-ui"
        ? `Firefox Translations`
        : `Bergamot Browser Extension`
    }${targetEnvironment !== "production" ? " (DEV)" : ""}`,
    description: "__MSG_extensionDescription__",
    version: `${packageJson.version}`,
    incognito: "spanning", // Share context between private and non-private windows
    default_locale: "en_US",
    background: {
      scripts: ["commons.js", "background.js"],
    },
    content_scripts: [
      {
        js: ["commons.js"],
        matches: ["<all_urls>"],
        all_frames: true,
        run_at: "document_idle",
        match_about_blank: false,
      },
      {
        js: ["dom-translation-content-script.js"],
        matches: ["<all_urls>"],
        all_frames: true,
        run_at: "document_idle",
        match_about_blank: false,
      },
    ],
    permissions: ["<all_urls>", "storage"],
    // Make source maps available also when installed as non-temporary extension
    web_accessible_resources: [
      "commons.js.map",
      "background.js.map",
      "dom-translation-content-script.js.map",
      "translation-worker.js.map",
    ],
  };
  if (process.env.USE_BERGAMOT_REST_API === "1") {
    manifest.permissions.push(`${process.env.BERGAMOT_REST_API_INBOUND_URL}/*`);
  }
  if (ui === "firefox-infobar-ui") {
    manifest.icons = {
      16: "icons/translation.16x16.png",
      32: "icons/translation.32x32.png",
    };
    manifest.hidden = false;
    manifest.experiment_apis = {
      extensionPreferences: {
        schema: "./experiment-apis/extensionPreferences/schema.json",
        parent: {
          scopes: ["addon_parent"],
          script: "./experiment-apis/extensionPreferences/api.js",
          paths: [["experiments", "extensionPreferences"]],
        },
      },
      telemetryEnvironment: {
        schema: "./experiment-apis/telemetryEnvironment/schema.json",
        parent: {
          scopes: ["addon_parent"],
          script: "./experiment-apis/telemetryEnvironment/api.js",
          paths: [["experiments", "telemetryEnvironment"]],
        },
      },
      telemetryPreferences: {
        schema: "./experiment-apis/telemetryPreferences/schema.json",
        parent: {
          scopes: ["addon_parent"],
          script: "./experiment-apis/telemetryPreferences/api.js",
          paths: [["experiments", "telemetryPreferences"]],
        },
      },
      translateUi: {
        schema: "./experiment-apis/translateUi/schema.json",
        parent: {
          scopes: ["addon_parent"],
          script: "./experiment-apis/translateUi/api.js",
          paths: [["experiments", "translateUi"]],
        },
      },
    };
  } else {
    manifest.icons = {
      48: "icons/extension-icon.48x48.png",
      96: "icons/extension-icon.96x96.png",
      128: "icons/extension-icon.128x128.png",
    };
    manifest.browser_action = {
      default_icon: "icons/extension-icon.inactive.38x38.png",
      default_title: "__MSG_browserActionButtonTitle__",
      default_popup: "main-interface/popup.html",
    };
    manifest.options_ui = {
      page: "options-ui/options-ui.html",
    };
  }
  if (targetBrowser === "firefox") {
    manifest.applications = {
      gecko: {
        id: extensionId,
        strict_min_version: "90.0a1",
      },
    };
    if (ui === "cross-browser-ui") {
      manifest.browser_action.browser_style = false;
      manifest.options_ui.browser_style = false;
    }
  }
  if (targetBrowser === "chrome") {
    if (ui === "cross-browser-ui") {
      manifest.browser_action.chrome_style = false;
      manifest.options_ui.chrome_style = false;
    }
    // https://github.com/WebAssembly/content-security-policy/issues/7
    manifest.content_security_policy =
      "script-src 'self' 'unsafe-eval'; object-src 'self';";
  }
  const targetPath = path.join(buildPath, "manifest.json");
  await fs.promises.mkdir(buildPath, { recursive: true });
  await fs.promises.writeFile(targetPath, JSON.stringify(manifest, null, 2));
}

module.exports = { generateManifest };

if (require.main === module) {
  const dotEnvPath =
    process.env.NODE_ENV === "production"
      ? "./.env.production"
      : "./.env.development";
  generateManifest({ dotEnvPath });
}
