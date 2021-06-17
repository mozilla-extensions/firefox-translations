# Getting started

The commands in these instructions are meant to be run in the root folder in this repo.

## First time setup

Install dependencies using [yarn v1](https://classic.yarnpkg.com/en/docs/install/):

```bash
yarn install
```

## Import Bergamot Translator

There are two ways

### Using known-to-work Bergamot Translator WASM artifacts and importing them to the extension

To use artifacts that are known to work (built by bergamot-translator's CI):

```bash
yarn bergamot-translator:download-and-import
```

Note: Once this command has run, it will create a folder called `downloaded-bergamot-translator-wasm-artifacts` and if this folder exists, it will not re-download the artifacts again. Thus, to make sure that you are using the most up to date WASM artifacts, remove the `downloaded-bergamot-translator-wasm-artifacts` folder, then re-run the command.

### Building Bergamot Translator WASM artifacts and importing them to the extension

If you want to try out custom changes to [bergamot-translator](https://github.com/mozilla/bergamot-translator/README.md), first make sure that you have checked out the submodules:

```
git submodule update --init --recursive
```

Then, follow the upstream instructions ([bergamot-translator/README](https://github.com/mozilla/bergamot-translator/README.md) for setting up an environment that successfully builds bergamot-translator.

When all is properly set-up, you should be able to run the following to build and import the custom WASM artifacts into the extension:

```bash
./bergamot-translator/build-wasm.sh
./import-bergamot-translator.sh ./bergamot-translator/build-wasm/
```

Re-run this command any time there has been an update in the bergamot-translator submodule.

## Start development mode

First, import bergamot models locally, since the extension downloads the models from a local endpoint when running in development mode:

```bash
yarn bergamot-models:import
```

If you haven't already, download and install Firefox Nightly from [here](https://www.mozilla.org/en-US/firefox/channel/desktop/) before running the below commands.

Finally, use the commands below to build the extension, launch the browser, install the extension and start Webpack in watch mode, which repeats the build process and reloads the extension when source files are changed.

```bash
yarn watch:firefox-infobar-ui
```
