/* eslint-env node */

const fs = require("fs");
const path = require("path");
const packageJson = require("./package.json");
const {
  buildPath,
  targetEnvironment,
  targetBrowser,
  ui,
} = require("./build-config.js");

// Using native UI requires a special build and signing process, restricted to specific extension ids
const extensionId =
  targetBrowser === "firefox" && ui === "firefox-infobar-ui"
    ? "firefox-translations@mozilla.org"
    : "bergamot-browser-extension@browser.mt";

async function generateManifest({ dotEnvPath }) {
  require("dotenv").config({ path: dotEnvPath });
  const manifest = {
    manifest_version: 2,
    name: `Bergamot Translate${
      targetEnvironment !== "production" ? " (DEV)" : ""
    }`,
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
    permissions: ["<all_urls>", "storage", "alarms"],
    icons: {
      48: "icons/extension-icon.48x48.png",
      96: "icons/extension-icon.96x96.png",
      128: "icons/extension-icon.128x128.png",
    },
  };
  if (process.env.USE_BERGAMOT_REST_API === "1") {
    manifest.permissions.push(`${process.env.BERGAMOT_REST_API_INBOUND_URL}/*`);
  }
  if (ui === "firefox-infobar-ui") {
    manifest.hidden = false; // TODO: Set to true for Normandy-deployed builds
    manifest.experiment_apis = {
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
        strict_min_version: "88.0a1",
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
