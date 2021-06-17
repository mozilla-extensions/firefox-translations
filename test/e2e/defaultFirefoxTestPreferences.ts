// Preferences set during testing
export const defaultFirefoxTestPreferences = {
  // Improve debugging using `browser toolbox`.
  "devtools.chrome.enabled": true,
  "devtools.debugger.remote-enabled": true,
  "devtools.debugger.prompt-connection": false,

  // Removing warning for `about:config`
  "general.warnOnAboutConfig": false,

  // Make the Firefox telemetry client id assertable in tests
  "toolkit.telemetry.cachedClientID": "12345678-90ab-cdef-1234-567890abcdef",

  // Set the preference that signals that the user has Firefox telemetry enabled
  "datareporting.healthreport.uploadEnabled": true,

  // Override the telemetry inactivity threshold to 20 seconds instead of 1 minute so that we can verify submitted telemetry faster
  "extensions.translations.telemetryInactivityThresholdInSecondsOverride": "20",

  // Additional preferences necessary for the extension to function properly
  "extensions.experiments.enabled": true,
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
