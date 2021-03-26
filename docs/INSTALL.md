<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

**Contents**

- [Installation instructions](#installation-instructions)
  - [Firefox - Infobar UI](#firefox---infobar-ui)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Installation instructions

This document outlines how to get the v0.3.0 pre-release version of the extension running locally.

Before installing, please take a minute to read [the release notes](https://github.com/mozilla-extensions/bergamot-browser-extension/releases/tag/v0.3.0).

<!--
There are three flavors:

- **Firefox - Infobar UI** - Firefox-only version which uses native browser UI elements
- **Chrome - Cross-browser UI** - Chrome version of the extension - uses a cross-browser compatible UI (since we have no way of modifying native browser UI elements on Chrome)
- **Firefox - Cross-browser UI** - Firefox version of the extension with the cross-browser compatible UI
-->

## Firefox - Infobar UI

- The current release requires bleeding edge browser capabilities. If you haven't already, download and install Firefox Nightly, English or German edition from [https://www.mozilla.org/en-US/firefox/all/#product-desktop-nightly](https://www.mozilla.org/en-US/firefox/all/#product-desktop-nightly).
- (Optionally [create a new profile](https://developer.mozilla.org/Firefox/Multiple_profiles))
- Make sure that the following preferences are set to `true` in `about:config`:
  - `xpinstall.signatures.dev-root` (Create this pref if it doesn't exist. This is required to be able to test these unreleased candidate builds)
  - `browser.proton.enabled` (This enables the preview of the upcoming Firefox design)
  - `dom.postMessage.sharedArrayBuffer.bypassCOOP_COEP.insecure.enabled` (Temporary requirement until https://github.com/mozilla/bergamot-translator/issues/37 or https://bugzilla.mozilla.org/show_bug.cgi?id=1674383 is resolved)
- Click [here](https://github.com/mozilla-extensions/bergamot-browser-extension/releases/download/v0.3.0/bergamot-browser-extension-0.3.0-firefox-infobar-ui.dev-root-signed.xpi) to start the download and installation of the extension
- Click `Continue to Installation` in the popup that comes up (Allows extensions to be downloaded from GitHub)
- Click `Add` (Adds the extension to Firefox)
- To try it out, visit a page in a language combination that is supported for translation
  - With Firefox Nightly English edition, visit a page in either Spanish or Estonian, eg https://www.mozilla.org/es-ES/ and https://www.mozilla.org/et/
- With Firefox Nightly German edition, visit a page in English, eg https://www.mozilla.org/en-US/
- Press Translate in the translation infobar that pops up

<!--
## Chrome - Cross-browser UI

- If you haven't already, download and install [Chrome Canary](https://www.google.com/chrome/canary/) since the current release requires bleeding edge browser capabilities.
- Download the latest Chrome zip file, linked [here](https://github.com/mozilla-extensions/bergamot-browser-extension/releases/download/v0.3.0/bergamot-browser-extension_browser.mt-0.3.0-chrome-cross-browser-ui.zip)
- Unpack the zip file locally
- Start Chrome Canary with the following extra argument: `--js-flags="--experimental-wasm-simd"`, eg `/Applications/Google\ Chrome\ Canary.app/Contents/MacOS/Google\ Chrome\ Canary --js-flags="--experimental-wasm-simd"`
- Enter `chrome://extensions` in Chrome's address bar and press enter
- Flip the Developer mode switch up on the right so that the toolbar with the `Load unpacked`, `Pack extension` and `Update` buttons are shown
- Click `Load unpacked`
- Choose the directory that you unpacked from the zip file
- Note that the extension icon may not be visible directly. Click the puzzle icon far to the right of the address bar and click the pin symbol next to the Bergamot Translate icon so that the pin becomes blue. This will make the Bergamot Translate extension icon show at all times.

## Firefox - Cross-browser UI

- The current release requires bleeding edge browser capabilities. If you haven't already, download and install Firefox Nightly, English or German edition from [https://www.mozilla.org/en-US/firefox/all/#product-desktop-nightly](https://www.mozilla.org/en-US/firefox/all/#product-desktop-nightly).
- (Optionally [create a new profile](https://developer.mozilla.org/Firefox/Multiple_profiles))
- Make sure that the following preferences are set to `true` in `about:config`:
  - `xpinstall.signatures.dev-root` (Create this pref if it doesn't exist. This is required to be able to test these unreleased candidate builds)
  - `browser.proton.enabled` (This enables the preview of the upcoming Firefox design)
  - `dom.postMessage.sharedArrayBuffer.bypassCOOP_COEP.insecure.enabled` (Temporary requirement until https://github.com/mozilla/bergamot-translator/issues/37 or https://bugzilla.mozilla.org/show_bug.cgi?id=1674383 is resolved)
- Click [here](https://github.com/mozilla-extensions/bergamot-browser-extension/releases/download/v0.3.0/bergamot-browser-extension-0.3.0-firefox-cross-browser-ui.xpi) to start the download and installation of the extension
- Click `Continue to Installation` in the popup that comes up (Allows extensions to be downloaded from GitHub)
- Click `Add` (Adds the extension to Firefox)
- To try it out, visit a page in a language combination that is supported for translation
  - With Firefox Nightly English edition, visit a page in either Spanish or Estonian, eg https://www.mozilla.org/es-ES/ and https://www.mozilla.org/et/
- With Firefox Nightly German edition, visit a page in English, eg https://www.mozilla.org/en-US/
- Press Translate in the translation infobar that pops up
-->
