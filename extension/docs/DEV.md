<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

**Contents**

- [Developing this extension](#developing-this-extension)
  - [First time setup](#first-time-setup)
  - [Creating build artifacts](#creating-build-artifacts)
  - [Development mode](#development-mode)
    - [Firefox](#firefox)
    - [Chrome](#chrome)
  - [Creating a signed build of the extension for self-distribution](#creating-a-signed-build-of-the-extension-for-self-distribution)
  - [Troubleshooting](#troubleshooting)
  - [Analyze webpack bundle size](#analyze-webpack-bundle-size)
  - [Opening up specific extension pages](#opening-up-specific-extension-pages)
  - [Enabling error reporting via Sentry](#enabling-error-reporting-via-sentry)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Developing this extension

The commands in these instructions are meant to be run in the `extension/` folder in this repo.

## First time setup

1. Install dependencies using [yarn](https://yarnpkg.com/getting-started/install):

```bash
yarn install
```

2. Initialize the build-specific configuration files:

```bash
cp .env.example .env.development
cp .env.example .env.production
```

Build Bergamot Translator for WASM:

```bash
source /path/to/emsdk_env.sh
./build-and-import-bergamot-translator.sh
```

Repeat this last step any time there has been an update in the bergamot-translator submodule.

## Creating build artifacts

To build for Firefox:

```bash
yarn build:production
```

The build artifact will be created under `dist/firefox/extension-ui`.

For Chrome:

```bash
yarn build:production:chrome
```

The build artifact will be created under `dist/chrome/extension-ui`.

To build the Firefox native UI variant:

```bash
yarn build:production:native-ui
```

The build artifact will be created under `dist/firefox/native-ui`.

## Development mode

This will build the extension, launch the browser, install the extension and start Webpack in watch mode, which repeats the build process and reloads the extension when source files are changed.

If you haven't already, download and install Firefox Nightly from [here](https://www.mozilla.org/en-US/firefox/channel/desktop/) before running the below commands.

### Firefox

```bash
yarn watch
```

Or, for the Firefox native UI variant:

```bash
yarn watch:native-ui
```

### Chrome

```bash
yarn watch:chrome
```

## Creating a signed build of the extension for self-distribution

After version bumping and setting the API_KEY and API_SECRET env vars:

```bash
yarn build:production && npx web-ext sign --api-key $API_KEY --api-secret $API_SECRET
```

Note: This is for Firefox and non-native UI only. Chrome Web Store does not offer signed builds for self-distribution.

## Troubleshooting

1. Go to `about:devtools-toolbox?type=extension&id=bergamot-browser-extension%40browser.mt`
2. Click Console

To clear the current output, click the Trash can icon in the top left.

## Analyze webpack bundle size

Firefox:

```bash
yarn build:production
npx webpack-bundle-analyzer build/firefox/extension-ui.stats.json build/firefox/extension-ui
```

Chrome:

```bash
yarn build:production:chrome
npx webpack-bundle-analyzer build/chrome/extension-ui.stats.json build/chrome/extension-ui
```

Firefox native UI variant:

```bash
yarn build:production:native-ui
npx webpack-bundle-analyzer build/firefox/native-ui.stats.json build/firefox/native-ui
```

## Opening up specific extension pages

From the background context:

```javascript
(typeof browser !== "undefined" ? browser : chrome).runtime.getURL(
  `main-interface/popup.html`,
);
```

```javascript
(typeof browser !== "undefined" ? browser : chrome).runtime.getURL(
  `main-interface/popup.html#/components`,
);
```

```javascript
(typeof browser !== "undefined" ? browser : chrome).runtime.getURL(
  `get-started/get-started.html`,
);
```

```javascript
(typeof browser !== "undefined" ? browser : chrome).runtime.getURL(
  `options-ui/options-ui.html`,
);
```

## Enabling error reporting via Sentry

Configure `.env.development` and `.env.production` with values as per https://docs.sentry.io/cli/configuration/.

Hint: You can verify that the Sentry configuration is working using:

```bash
cp .env.development .env
npx sentry-cli info
cp .env.production .env
npx sentry-cli info
```
