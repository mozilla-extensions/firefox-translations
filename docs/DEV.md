<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

**Contents**

- [Developing this extension](#developing-this-extension)
  - [First time setup](#first-time-setup)
  - [Using known-to-work Bergamot Translator WASM artifacts and importing them to the extension](#using-known-to-work-bergamot-translator-wasm-artifacts-and-importing-them-to-the-extension)
  - [Building Bergamot Translator WASM artifacts and importing them to the extension](#building-bergamot-translator-wasm-artifacts-and-importing-them-to-the-extension)
  - [Creating extension builds for distribution](#creating-extension-builds-for-distribution)
  - [Development mode](#development-mode)
    - [Firefox - Infobar UI](#firefox---infobar-ui)
    - [Chrome - Cross-browser UI](#chrome---cross-browser-ui)
    - [Firefox - Cross-browser UI](#firefox---cross-browser-ui)
  - [Creating a signed build of the extension for self-distribution](#creating-a-signed-build-of-the-extension-for-self-distribution)
  - [Run end-to-end tests](#run-end-to-end-tests)
    - [Locally](#locally)
    - [Continuous Integration](#continuous-integration)
    - [Troubleshooting functional tests](#troubleshooting-functional-tests)
  - [Troubleshooting the extension when it is running](#troubleshooting-the-extension-when-it-is-running)
    - [Firefox - Infobar UI](#firefox---infobar-ui-1)
    - [Firefox - Cross-browser UI](#firefox---cross-browser-ui-1)
  - [Analyze webpack bundle size](#analyze-webpack-bundle-size)
    - [Firefox - Infobar UI](#firefox---infobar-ui-2)
    - [Chrome - Cross-browser UI](#chrome---cross-browser-ui-1)
    - [Firefox - Cross-browser UI](#firefox---cross-browser-ui-2)
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

Note: Once this command has run, it will create a folder called `downloaded-bergamot-translator-wasm-artifacts` and if this folder exists, it will not re-download the artifacts again. Thus, to make sure that you are using the most up to date WASM artifacts, remove the `downloaded-bergamot-translator-wasm-artifacts` folder, then re-run the command.

## Building Bergamot Translator WASM artifacts and importing them to the extension

If you want to try out custom changes to [bergamot-translator](../bergamot-translator/README.md), first make sure that you have checked out the submodules:

```
git submodule update --init --recursive
```

Then, follow the upstream instructions ([bergamot-translator/README](../bergamot-translator/README.md) for setting up an environment that successfully builds bergamot-translator.

When all is properly set-up, you should be able to run the following to build and import the custom WASM artifacts into the extension:

```bash
yarn bergamot-translator:build-and-import
```

Re-run this command any time there has been an update in the bergamot-translator submodule.

## Creating extension builds for distribution

To build for Firefox:

```bash
yarn build:cross-browser-ui:firefox
```

The build artifact will be created under `dist/production/firefox/cross-browser-ui`.

For Chrome:

```bash
yarn build:cross-browser-ui:chrome
```

The build artifact will be created under `dist/production/chrome/cross-browser-ui`.

To build the Firefox native UI variant:

```bash
yarn build:firefox-infobar-ui
```

The build artifact will be created under `dist/production/firefox/firefox-infobar-ui`.

## Development mode

First, import bergamot models locally, since the extension downloads the models from a local endpoint when running in development mode:

```bash
yarn bergamot-models:import
```

If you haven't already, download and install Firefox Nightly from [here](https://www.mozilla.org/en-US/firefox/channel/desktop/) before running the below commands.

Finally, use the commands below to build the extension, launch the browser, install the extension and start Webpack in watch mode, which repeats the build process and reloads the extension when source files are changed.

### Firefox - Infobar UI

```bash
yarn watch:firefox-infobar-ui
```

### Chrome - Cross-browser UI

```bash
yarn watch:cross-browser-ui:chrome
```

### Firefox - Cross-browser UI

```bash
yarn watch:cross-browser-ui:firefox
```

## Creating a signed build of the extension for self-distribution

After version bumping and setting the API_KEY and API_SECRET env vars:

```bash
yarn build:cross-browser-ui:firefox && npx web-ext sign --api-key $API_KEY --api-secret $API_SECRET
```

Note: This is for Firefox version with the cross-browser UI only. Chrome Web Store does not offer signed builds for self-distribution and the Firefox infobar UI version gets signed via a separate process.

## Run end-to-end tests

### Locally

Before running the tests locally for the first time, install [mitmproxy](https://mitmproxy.org). Example installation command for Mac:

```bash
brew install mitmproxy
```

To run the end-to-end tests, run:

```bash
yarn e2e-tests
```

Note, to modify the `test/e2e/intercept-telemetry-requests.py` script, it may be useful to have the Python deps installed:

```bash
test/e2e/setup-python-venv.sh
```

### Continuous Integration

End-to-end tests are run against each new commits/PRs. Read more about the current CI setup [here](./CI.md).

### Troubleshooting functional tests

**Basic principles**

End-to-end tests are run using the built extension artifacts found in `dist/production/`. To test new non-test-related code changes, remember to re-run the relevant build command.

**Intervening**

If you want to intervene in a test (eg. to double-check something), follow this pattern:

1. Add a long delay, eg `await driver.sleep(60 * 60 * 1000);` to the test at the place you want to intervene.
2. Make sure to temporarily also increase the timeout for the test you are running.
3. Run the tests and intervene manually as desired.

**Obtaining Geckodriver logs**

To troubleshoot issues with failing tests when only cryptic error messages are available, check the geckodriver logs, located in `test/e2e/results/logs/`.

## Troubleshooting the extension when it is running

Hint: To produce a clean log output for forwarding to developers / attaching to issues, first click the Trash can icon in the top left before repeating the steps that leads to the erroneous behavior.

### Firefox - Infobar UI

1. Go to `about:devtools-toolbox?type=extension&id=bergamot-browser-extension%40mozilla.org`
2. Click Console

### Firefox - Cross-browser UI

1. Go to `about:devtools-toolbox?type=extension&id=bergamot-browser-extension%40browser.mt`
2. Click Console

## Analyze webpack bundle size

### Firefox - Infobar UI

```bash
yarn build:firefox-infobar-ui
npx webpack-bundle-analyzer build/production/firefox/firefox-infobar-ui.stats.json build/production/firefox/firefox-infobar-ui
```

### Chrome - Cross-browser UI

```bash
yarn build:cross-browser-ui:chrome
npx webpack-bundle-analyzer build/production/chrome/cross-browser-ui.stats.json build/production/chrome/cross-browser-ui
```

### Firefox - Cross-browser UI

```bash
yarn build:cross-browser-ui:firefox
npx webpack-bundle-analyzer build/production/firefox/cross-browser-ui.stats.json build/production/firefox/cross-browser-ui
```

## Opening up specific extension pages

(Only relevant when developing the Cross-browser UI)

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
