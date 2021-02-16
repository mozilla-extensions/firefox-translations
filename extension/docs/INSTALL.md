<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

**Contents**

- [Installation instructions](#installation-instructions)
  - [Firefox - Extension UI](#firefox---extension-ui)
  - [Chrome - Extension UI](#chrome---extension-ui)
  - [Firefox - Native UI](#firefox---native-ui)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Installation instructions

This document outlines how to get the v0.2.0 pre-release version of the extension running locally.

There are three flavors:

- **Firefox - Extension UI** - Firefox version of the extension
- **Chrome - Extension UI** - Chrome version of the extension
- **Firefox - Native UI** - Firefox-only version which uses native browser UI elements

## Firefox - Extension UI

- If you haven't already, download and install Firefox Nightly from [here](https://www.mozilla.org/en-US/firefox/channel/desktop/) since the current release requires bleeding edge browser capabilities.
- Make sure that the following preferences are set to `true` in `about:config`:
  - `dom.postMessage.sharedArrayBuffer.bypassCOOP_COEP.insecure.enabled`
  - `javascript.options.wasm_simd`
  - `javascript.options.wasm_simd_wormhole`
- Make sure that the following preferences are set to `false` in `about:config`:
  - `browser.translation.ui.show`
  - `browser.translation.ui.detectLanguage`
- Click [here](https://github.com/mozilla-extensions/bergamot-browser-extension/releases/download/untagged-41617d38f820c50109b8/bergamot-browser-extension_browser.mt-0.2.0-firefox.xpi) to start the download and installation of the extension
- Allow extensions to be downloaded from GitHub in the popup that comes up (Click `Continue to Installation`)
- Add the extension to Firefox (Click `Add`)

## Chrome - Extension UI

- If you haven't already, download and install [Chrome Canary](https://www.google.com/chrome/canary/) since the current release requires bleeding edge browser capabilities.
- Download the latest Chrome zip file, linked [here](https://github.com/mozilla-extensions/bergamot-browser-extension/releases/download/untagged-41617d38f820c50109b8/bergamot-browser-extension_browser.mt-0.2.0-chrome.zip)
- Unpack the zip file locally
- Start Chrome Canary with the following extra argument: `--js-flags="--experimental-wasm-simd"`, eg `/Applications/Google\ Chrome\ Canary.app/Contents/MacOS/Google\ Chrome\ Canary --js-flags="--experimental-wasm-simd"`
- Enter `chrome://extensions` in Chrome's address bar and press enter
- Flip the Developer mode switch up on the right so that the toolbar with the `Load unpacked`, `Pack extension` and `Update` buttons are shown
- Click `Load unpacked`
- Choose the directory that you unpacked from the zip file
- Note that the extension icon may not be visible directly. Click the puzzle icon far to the right of the address bar and click the pin symbol next to the Bergamot Translate icon so that the pin becomes blue. This will make the Bergamot Translate extension icon show at all times.

## Firefox - Native UI

- If you haven't already, download and install Firefox Nightly from [here](https://www.mozilla.org/en-US/firefox/channel/desktop/) since the current release requires bleeding edge browser capabilities.
- Make sure that the following preferences are set to `true` in `about:config`:
  - `extensions.experiments.enabled`
  - `browser.proton.enabled`
  - `dom.postMessage.sharedArrayBuffer.bypassCOOP_COEP.insecure.enabled`
  - `javascript.options.wasm_simd`
  - `javascript.options.wasm_simd_wormhole`
- Make sure that the following preferences are set to `false` in `about:config`:
  - `browser.translation.ui.show`
  - `browser.translation.ui.detectLanguage`
- Click [here](https://github.com/mozilla-extensions/bergamot-browser-extension/releases/download/untagged-41617d38f820c50109b8/translation_mozilla.org-0.2.0-firefox.xpi) to start the download and installation of the extension
- Allow extensions to be downloaded from GitHub in the popup that comes up (Click `Continue to Installation`)
- Add the extension to Firefox (Click `Add`)
