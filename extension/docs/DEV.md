<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

**Contents**

- [Developing the extension](#developing-the-extension)
  - [First time setup](#first-time-setup)
  - [Creating build artifacts](#creating-build-artifacts)
  - [Development mode](#development-mode)
    - [Firefox](#firefox)
    - [Chrome](#chrome)
  - [Creating a signed build of the extension for self-distribution](#creating-a-signed-build-of-the-extension-for-self-distribution)
  - [Troubleshooting](#troubleshooting)
  - [Analyze webpack bundle size](#analyze-webpack-bundle-size)
  - [Opening up specific extension pages](#opening-up-specific-extension-pages)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Developing this add-on

The commands in these instructions are meant to be run in the `extension/` folder in this repo.

## Get started

```
yarn install
cp .env.example .env.development
cp .env.example .env.production
```

## Creating build artifacts

To build for Firefox:

```
yarn build:production
```

The build artifact will be created under `dist/firefox/extension-ui`.

For Chrome:

```
yarn build:production:chrome
```

The build artifact will be created under `dist/chrome/extension-ui`.

To build the Firefox native UI variant:

```
yarn build:production:native-ui
```

The build artifact will be created under `dist/firefox/native-ui`.

## Development mode

To build for, launch the browser, install the extension and start Webpack in watch mode.

Note that you also temporarily need a REST server running locally. See [INSTALL.md](./INSTALL.md).

### Firefox

```
yarn watch
```

Or, for the Firefox native UI variant:

```
yarn watch:native-ui
```

### Chrome

```
yarn watch:chrome
```

## Creating a signed build of the extension for self-distribution

After version bumping and setting the API_KEY and API_SECRET env vars:

```
yarn build:production && npx web-ext sign --api-key $API_KEY --api-secret $API_SECRET
```

Note: This is for Firefox and non-native UI only. Chrome Web Store does not offer signed builds for self-distribution.

## Troubleshooting

1. Go to `about:devtools-toolbox?type=extension&id=bergamot-browser-extension%40browser.mt`
2. Click Console

To clear the current output, click the Trash can icon in the top left.

## Analyze webpack bundle size

Firefox:

```
yarn build:production
npx webpack-bundle-analyzer build/firefox/extension-ui.stats.json build/firefox/extension-ui
```

Chrome:

```
yarn build:production:chrome
npx webpack-bundle-analyzer build/chrome/extension-ui.stats.json build/chrome/extension-ui
```

Firefox native UI variant:

```
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

```
cp .env.development .env
npx sentry-cli info
cp .env.production .env
npx sentry-cli info
```
