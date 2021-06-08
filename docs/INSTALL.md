<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

**Contents**

- [Installation instructions](#installation-instructions)
  - [Firefox - Infobar UI](#firefox---infobar-ui)
    - [Preparations](#preparations)
    - [Configuring Nightly to enable the extension](#configuring-nightly-to-enable-the-extension)
    - [Demo](#demo)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Installation instructions

This document outlines how to get the v0.4.1 pre-release version of the extension running locally.

Before installing, please take a minute to read [the release notes](https://github.com/mozilla-extensions/bergamot-browser-extension/releases/tag/v0.4.1).

<!--
There are three flavors:

- **Firefox - Infobar UI** - Firefox-only version which uses native browser UI elements
- **Chrome - Cross-browser UI** - Chrome version of the extension - uses a cross-browser compatible UI (since we have no way of modifying native browser UI elements on Chrome)
- **Firefox - Cross-browser UI** - Firefox version of the extension with the cross-browser compatible UI
-->

## Firefox - Infobar UI

### Preparations

- The current release requires bleeding edge browser capabilities. If you haven't already, download and install Firefox Nightly (English or German edition) from [https://www.mozilla.org/en-US/firefox/all/#product-desktop-nightly](https://www.mozilla.org/en-US/firefox/all/#product-desktop-nightly).
- If you have tried any previous version of the Firefox extension, please make sure to remove/uninstall it before installing the new version. You will find it named "Firefox Translations" or "Bergamot Translate" in `about:addons`.

### Configuring Nightly to enable the extension

- Change the following preferences `false` in `about:config`:
  - `extensions.translations.disabled`
- The extension is now enabled

### Demo

- To try it out, visit a page in a language combination that is supported for translation, eg one of:
  - With Firefox Nightly English edition, visit a page in either Spanish or Estonian, eg https://www.mozilla.org/es-ES/ or https://www.mozilla.org/et/
  - With Firefox Nightly German edition, visit a page in English, eg https://www.mozilla.org/en-US/
- Press Translate in the translation infobar that pops up
  - Note: For non-english editions of Nightly, one must eliminate EN and EN-US from the accepted languages (from the Language section of about:preferences, more precisely from the Webpage Language Settings) for the infobar to show

<!--
## Chrome - Cross-browser UI

- If you haven't already, download and install [Chrome Canary](https://www.google.com/chrome/canary/) since the current release requires bleeding edge browser capabilities.
- Download the latest Chrome zip file, linked [here](https://github.com/mozilla-extensions/bergamot-browser-extension/releases/download/v0.4.1/bergamot-browser-extension-0.4.1-chrome-cross-browser-ui.zip)
- Unpack the zip file locally
- Start Chrome Canary with the following extra argument: `--js-flags="--experimental-wasm-simd"`, eg `/Applications/Google\ Chrome\ Canary.app/Contents/MacOS/Google\ Chrome\ Canary --js-flags="--experimental-wasm-simd"`
- Enter `chrome://extensions` in Chrome's address bar and press enter
- Flip the Developer mode switch up on the right so that the toolbar with the `Load unpacked`, `Pack extension` and `Update` buttons are shown
- Click `Load unpacked`
- Choose the directory that you unpacked from the zip file
- Note that the extension icon may not be visible directly. Click the puzzle icon far to the right of the address bar and click the pin symbol next to the Bergamot Translate icon so that the pin becomes blue. This will make the Bergamot Translate extension icon show at all times.

## Firefox - Cross-browser UI

### Preparations

- The current release requires bleeding edge browser capabilities. If you haven't already, download and install Firefox Nightly (English or German edition) from [https://www.mozilla.org/en-US/firefox/all/#product-desktop-nightly](https://www.mozilla.org/en-US/firefox/all/#product-desktop-nightly).
- Optionally [create a new profile](https://developer.mozilla.org/Firefox/Multiple_profiles)

### Configuring Nightly and installing the extension

- Make sure that the following preferences are set to `true` in `about:config`:
  - `xpinstall.signatures.dev-root` (Create this pref if it doesn't exist. This is required to be able to test these unreleased candidate builds)
- Make sure that the following preferences are set to `false` in `about:config`:
  - `xpinstall.signatures.required` (This enables the use of ordinary extensions in the same profile)
- Click [here](https://github.com/mozilla-extensions/bergamot-browser-extension/releases/download/v0.4.1/bergamot-browser-extension-0.4.1-firefox-cross-browser-ui.xpi) to start the download and installation of the extension
- Wait for the extension to be downloaded
- Click `Add` in the popup that comes up
- The extension is now installed

### Demo

- To try it out, visit a page in a language combination that is supported for translation, eg one of:
  - With Firefox Nightly English edition, visit a page in either Spanish or Estonian, eg https://www.mozilla.org/es-ES/ or https://www.mozilla.org/et/
  - With Firefox Nightly German edition, visit a page in English, eg https://www.mozilla.org/en-US/
- Click the extension icon <img src="../src/core/static/icons/extension-icon.48x48.png"> next to the address bar
- Press Translate in the popup
-->
