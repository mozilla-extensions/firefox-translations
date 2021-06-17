# Building and installing the extension

## Creating extension builds

```bash
yarn build:firefox-infobar-ui
```

The build artifact will be created under `dist/production/firefox/firefox-infobar-ui`.

### Installing locally built versions of the extension

Artifacts built locally or via CircleCI are unsigned, and additional config preferences are necessary to get them to work as expected.

- Make sure that the following preferences are set to `true` in `about:config`:
  - `extensions.experiments.enabled`
  - `javascript.options.wasm_simd`
  - `javascript.options.wasm_simd_wormhole`
  - `dom.postMessage.sharedArrayBuffer.bypassCOOP_COEP.insecure.enabled`
- Make sure that the following preferences are set to `false` in `about:config`:
  - `xpinstall.signatures.required`

## Analyze webpack bundle size

```bash
yarn build:firefox-infobar-ui
npx webpack-bundle-analyzer build/production/firefox/firefox-infobar-ui.stats.json build/production/firefox/firefox-infobar-ui
```
