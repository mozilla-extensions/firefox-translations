## Start development mode

### Chrome - Cross-browser UI

```bash
yarn watch:cross-browser-ui:chrome
```

### Firefox - Cross-browser UI

```bash
yarn watch:cross-browser-ui:firefox
```

## Creating extension builds

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

## Creating a signed build of the extension for self-distribution

After version bumping and setting the API_KEY and API_SECRET env vars:

```bash
yarn build:cross-browser-ui:firefox && npx web-ext sign --api-key $API_KEY --api-secret $API_SECRET
```

Note: This is for Firefox version with the cross-browser UI only. Chrome Web Store does not offer signed builds for self-distribution and the Firefox infobar UI version gets signed via a separate process.

## Troubleshooting the extension when it is running

1. Go to `about:devtools-toolbox?type=extension&id=bergamot-browser-extension%40browser.mt`
2. Click Console

## Analyze webpack bundle size

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

<!--
## Enabling error reporting via Sentry

(Currently not used)

Configure `.env.development` and `.env.production` with values as per https://docs.sentry.io/cli/configuration/.

Hint: You can verify that the Sentry configuration is working using:

```bash
cp .env.development .env
npx sentry-cli info
cp .env.production .env
npx sentry-cli info
```
-->
