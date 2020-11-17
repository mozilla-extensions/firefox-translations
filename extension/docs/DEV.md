<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

**Contents**

- [Developing this add-on](#developing-this-add-on)
  - [Get started](#get-started)
  - [Creating build artifacts](#creating-build-artifacts)
  - [Development mode](#development-mode)
    - [Bergamot REST API server (temporary requirement)](#bergamot-rest-api-server-temporary-requirement)
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

The build artifact will be created under `dist/firefox/`.

For Chrome:

```
TARGET_BROWSER=chrome yarn build:production
```

The build artifact will be created under `dist/chrome/`.

## Development mode

To build for and launch Firefox, install the extension and start Webpack in watch mode:

```
yarn watch
```

To utilize the Redux dev tools, run the following in another terminal:

```
yarn remotedev
```

For Chrome:

```
yarn watch:chrome
```

In another terminal:

```
yarn remotedev:chrome
```

### Bergamot REST API server (temporary requirement)

Note: At this stage of development of the Bergamot translation engine, two REST API servers needs to be launched from the command line on the same system that the extension runs on:

```
git clone https://github.com/browsermt/macos-server.git
cd macos-server
./server/rest-server -c inboundModel/config.yml -p 8787 --log-level debug -w 5000
```

In another terminal:

```
./server/rest-server -c outboundModel/config.yml -p 8788 --log-level debug -w 5000
```

The binary is currently only available for Mac OSX. For any other system, compile from source: [https://github.com/browsermt/mts](https://github.com/browsermt/mts).

This dependence on a REST API server will be removed soon.

## Opening up specific extension pages

From the background context:

```javascript
(typeof browser !== "undefined" ? browser : chrome).runtime.getURL(
  `main-interface/main-interface.html`,
);
```

```javascript
(typeof browser !== "undefined" ? browser : chrome).runtime.getURL(
  `main-interface/main-interface.html#/components`,
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

Note: This is for Firefox only. Chrome Web Store does not offer signed builds for self-distribution.

## Troubleshooting

1. Go to `about:devtools-toolbox?type=extension&id=bergamot-browser-extension%40browser.mt`
2. Click Console

To clear the current output, click the Trash can icon in the top left.
