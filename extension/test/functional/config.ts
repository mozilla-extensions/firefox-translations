/* eslint-env node */

// Preferences set during testing
const defaultTestPreferences = {
  // Improve debugging using `browser toolbox`.
  "devtools.chrome.enabled": true,
  "devtools.debugger.remote-enabled": true,
  "devtools.debugger.prompt-connection": false,

  // Removing warning for `about:config`
  "general.warnOnAboutConfig": false,

  // Additional preferences necessary for the extension to function properly
  "extensions.experiments.enabled": true,
  "browser.proton.enabled": true,
  "dom.postMessage.sharedArrayBuffer.bypassCOOP_COEP.insecure.enabled": true,
  "javascript.options.wasm_simd": true,
  "javascript.options.wasm_simd_wormhole": true,
  "browser.translation.ui.show": false,
  "browser.translation.detectLanguage": false,
  "browser.aboutConfig.showWarning": false,
  "browser.ctrlTab.recentlyUsedOrder": false,

  /**
   * NOTE: Geckodriver sets many additional prefs at:
   * https://searchfox.org/mozilla-central/source/testing/geckodriver/src/prefs.rs
   *
   * In, particular, actual telemetry uploading is disabled:
   * ("toolkit.telemetry.server", Pref::new("https://%(server)s/dummy/telemetry/")),
   */
};

module.exports = {
  defaultTestPreferences,
};
