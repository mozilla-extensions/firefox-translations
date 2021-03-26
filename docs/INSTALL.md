<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

**Contents**

- [Installation instructions](#installation-instructions)
  - [Firefox - Infobar UI](#firefox---infobar-ui)
  - [Chrome - Cross-browser UI](#chrome---cross-browser-ui)
  - [Firefox - Cross-browser UI](#firefox---cross-browser-ui)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Installation instructions

This document outlines how to get the v0.3.0 pre-release version of the extension running locally.

Before installing, please take a minute to read [the release notes](https://github.com/mozilla-extensions/bergamot-browser-extension/releases/tag/v0.3.0).

There are three flavors:

- **Firefox - Infobar UI** - Firefox-only version which uses native browser UI elements
- **Chrome - Cross-browser UI** - Chrome version of the extension - uses a cross-browser compatible UI (since we have no way of modifying native browser UI elements on Chrome)
- **Firefox - Cross-browser UI** - Firefox version of the extension with the cross-browser compatible UI

## Firefox - Infobar UI

- If you haven't already, download and install Firefox Nightly from [here](https://www.mozilla.org/en-US/firefox/channel/desktop/) since the current release requires bleeding edge browser capabilities.
- Make sure that the following preferences are set to `true` in `about:config`:
  - `browser.proton.enabled`
  - `dom.postMessage.sharedArrayBuffer.bypassCOOP_COEP.insecure.enabled`
- Make sure that the following preferences are set to `false` in `about:config`:
  - `browser.translation.ui.show`
  - `browser.translation.ui.detectLanguage`
- Click [here](https://github.com/mozilla-extensions/bergamot-browser-extension/releases/download/v0.2.0/translation_mozilla.org-0.2.0-firefox.xpi) to start the download and installation of the extension
- Allow extensions to be downloaded from GitHub in the popup that comes up (Click `Continue to Installation`)
- Add the extension to Firefox (Click `Add`)

## Chrome - Cross-browser UI

- If you haven't already, download and install [Chrome Canary](https://www.google.com/chrome/canary/) since the current release requires bleeding edge browser capabilities.
- Download the latest Chrome zip file, linked [here](https://github.com/mozilla-extensions/bergamot-browser-extension/releases/download/v0.2.0/bergamot-browser-extension_browser.mt-0.2.0-chrome.zip)
- Unpack the zip file locally
- Start Chrome Canary with the following extra argument: `--js-flags="--experimental-wasm-simd"`, eg `/Applications/Google\ Chrome\ Canary.app/Contents/MacOS/Google\ Chrome\ Canary --js-flags="--experimental-wasm-simd"`
- Enter `chrome://extensions` in Chrome's address bar and press enter
- Flip the Developer mode switch up on the right so that the toolbar with the `Load unpacked`, `Pack extension` and `Update` buttons are shown
- Click `Load unpacked`
- Choose the directory that you unpacked from the zip file
- Note that the extension icon may not be visible directly. Click the puzzle icon far to the right of the address bar and click the pin symbol next to the Bergamot Translate icon so that the pin becomes blue. This will make the Bergamot Translate extension icon show at all times.

## Firefox - Cross-browser UI

- If you haven't already, download and install Firefox Nightly from [here](https://www.mozilla.org/en-US/firefox/channel/desktop/) since the current release requires bleeding edge browser capabilities.
- Make sure that the following preferences are set to `true` in `about:config`:
  - `dom.postMessage.sharedArrayBuffer.bypassCOOP_COEP.insecure.enabled`
  - `javascript.options.wasm_simd`
  - `javascript.options.wasm_simd_wormhole`
- Make sure that the following preferences are set to `false` in `about:config`:
  - `xpinstall.signatures.required`
  - `browser.translation.ui.show`
  - `browser.translation.ui.detectLanguage`
- Click [here](https://github.com/mozilla-extensions/bergamot-browser-extension/releases/download/v0.2.0/bergamot-browser-extension_browser.mt-0.2.0-firefox.xpi) to start the download and installation of the extension
- Allow extensions to be downloaded from GitHub in the popup that comes up (Click `Continue to Installation`)
- Add the extension to Firefox (Click `Add`)
