# Installation instructions

This document outlines how to enable the pre-released version of Firefox Translations which comes bundled with Firefox Nightly.

### Configuring Nightly to enable the extension

- Download and install Firefox Nightly (English or German edition) from [https://www.mozilla.org/en-US/firefox/all/#product-desktop-nightly](https://www.mozilla.org/en-US/firefox/all/#product-desktop-nightly).
- Start Firefox Nightly
- [Create a new Firefox profile](https://support.mozilla.org/kb/profile-manager-create-remove-switch-firefox-profiles). A new profile isolates this testing from your normal browsing profile, and protects your normal browser.
- Activate the new translation user interface by going to `about:config`, clicking the “Accept the Risk and Continue” button, searching for the `extensions.translations.disabled` Boolean preference, and toggling the preference to `false` by clicking the toggle button
- Firefox Translations is now enabled

### Notes for returning testers

- If you have manually installed any previous version of the extension, please make sure to remove/uninstall it and restarting your browser. You will find it named "Firefox Translations" or "Bergamot Translate" in `about:addons`.
