<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

**Contents**

- [Developing this add-on](#developing-this-add-on)
  - [Get started](#get-started)
  - [Creating build artifacts](#creating-build-artifacts)
  - [Development mode](#development-mode)
    - [Firefox](#firefox)
    - [Chrome](#chrome)
  - [Opening up specific extension pages](#opening-up-specific-extension-pages)
  - [Creating a signed build of the extension for self-distribution](#creating-a-signed-build-of-the-extension-for-self-distribution)
  - [Troubleshooting](#troubleshooting)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Developing this add-on

## Get started

```
yarn install
cp .env.example .env.development
cp .env.example .env.production
```

Configure `.env.development` and `.env.production` with values as per https://docs.sentry.io/cli/configuration/.

Hint: You can verify that the Sentry configuration is working using:

```
cp .env.development .env
npx sentry-cli info
cp .env.production .env
npx sentry-cli info
```

## Creating build artifacts

To build for Firefox:

```
yarn build:production
```

The build artifact will be created under `dist/firefox/extension-ui`.

For Chrome:

```
TARGET_BROWSER=chrome yarn build:production
```

The build artifact will be created under `dist/chrome/extension-ui`.

To build the Firefox native UI variant:

```
UI=native-ui yarn build:production
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
