<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

**Contents**

- [Developing this extension](#developing-this-extension)
  - [First time setup](#first-time-setup)
  - [Using known-to-work Bergamot Translator WASM artifacts and importing them to the extension](#using-known-to-work-bergamot-translator-wasm-artifacts-and-importing-them-to-the-extension)
  - [Building Bergamot Translator WASM artifacts and importing them to the extension](#building-bergamot-translator-wasm-artifacts-and-importing-them-to-the-extension)
  - [Creating extension builds for distribution](#creating-extension-builds-for-distribution)
  - [Development mode](#development-mode)
    - [Firefox](#firefox)
    - [Chrome](#chrome)
  - [Creating a signed build of the extension for self-distribution](#creating-a-signed-build-of-the-extension-for-self-distribution)
  - [Run end-to-end functional tests](#run-end-to-end-functional-tests)
    - [Locally](#locally)
    - [Continuous Integration](#continuous-integration)
    - [Troubleshooting functional tests](#troubleshooting-functional-tests)
  - [Troubleshooting the extension when it is running](#troubleshooting-the-extension-when-it-is-running)
    - [Firefox](#firefox-1)
  - [Analyze webpack bundle size](#analyze-webpack-bundle-size)
  - [Opening up specific extension pages](#opening-up-specific-extension-pages)
  - [Enabling error reporting via Sentry](#enabling-error-reporting-via-sentry)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Developing this extension

The commands in these instructions are meant to be run in the root folder in this repo.

## First time setup

Install dependencies using [yarn v1](https://classic.yarnpkg.com/en/docs/install/):

```bash
yarn install
```

## Using known-to-work Bergamot Translator WASM artifacts and importing them to the extension

To use artifacts that are known to work (built by bergamot-translator's CI):

```bash
yarn bergamot-translator:download-and-import
```

## Building Bergamot Translator WASM artifacts and importing them to the extension

If you are actively changing files in [bergamot-translator](../bergamot-translator/README.md), run the following to build and import locally built WASM artifacts:

```bash
yarn bergamot-translator:build-and-import
```

Repeat this process any time there has been an update in the bergamot-translator submodule.

## Creating extension builds for distribution

To build for Firefox:

```bash
yarn build:default
```

The build artifact will be created under `dist/firefox/extension-ui`.

For Chrome:

```bash
yarn build:chrome
```

The build artifact will be created under `dist/chrome/extension-ui`.

To build the Firefox native UI variant:

```bash
yarn build:native-ui
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
yarn build:default && npx web-ext sign --api-key $API_KEY --api-secret $API_SECRET
```

Note: This is for Firefox and non-native UI only. Chrome Web Store does not offer signed builds for self-distribution.

## Run end-to-end functional tests

### Locally

```bash
yarn functional-tests
```

### Continuous Integration

End-to-end functional tests are run against each new commits/PRs. Read more about the current CI setup [here](./CI.md).

### Troubleshooting functional tests

**Basic principles**

Functional tests are run using the built extension artifacts found in `dist/`. To test new non-test-related code changes, remember to re-run the relevant build command.

**Intervening**

If you want to intervene in a test (eg. to double-check something), follow this pattern:

1. Add a long delay, eg `await driver.sleep(60 * 60 * 1000);` to the test at the place you want to intervene.
2. Make sure to temporarily also increase the timeout for the test you are running.
3. Run the tests and intervene manually as desired.

**Obtaining Geckodriver logs**

To troubleshoot issues with failing tests when only cryptic error messages are available, check the geckodriver logs, located in `test/functional/results/logs/`.

## Troubleshooting the extension when it is running

### Firefox

1. Go to `about:devtools-toolbox?type=extension&id=bergamot-browser-extension%40browser.mt`
2. Click Console

Or, for the Firefox native UI variant:

1. Go to `about:devtools-toolbox?type=extension&id=bergamot-browser-extension%40mozilla.org`
2. Click Console

To produce a clean log output for forwarding to developers / attaching to issues, first click the Trash can icon in the top left before repeating the steps that leads to the erroneous behavior.

## Analyze webpack bundle size

Firefox:

```bash
yarn build:default
npx webpack-bundle-analyzer build/firefox/extension-ui.stats.json build/firefox/extension-ui
```

Chrome:

```bash
yarn build:chrome
npx webpack-bundle-analyzer build/chrome/extension-ui.stats.json build/chrome/extension-ui
```

Firefox native UI variant:

```bash
yarn build:native-ui
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
