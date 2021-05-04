#!/usr/bin/env bash

# Usage: ./import-bergamot-translator.sh <artifacts-directory>
# Where <artifacts-directory> is the directory of where the bergamot-translator build artifacts are located
# (defaults to ../bergamot-translator/build-wasm/wasm)

set -e
# set -x

if [ "$1" != "" ]; then
  ARTIFACTS_DIRECTORY="$1"
else
  echo "Error: Missing ARTIFACTS_DIRECTORY argument"
  exit 1
fi

echo "* Constructing a TypeScript module from the emscripten JS glue code"
TS_FILE=src/core/ts/web-worker-scripts/translation-worker.js/bergamot-translator-worker.ts
echo "// @ts-nocheck" > $TS_FILE
echo "" >> $TS_FILE
echo "// Note: The source code in this file is imported from bergamot-translator via" >> $TS_FILE
echo "// the import-bergamot-translator.sh script in the root of this repo. " >> $TS_FILE
echo "// Changes will be overwritten on each import!" >> $TS_FILE
cat "$ARTIFACTS_DIRECTORY/bergamot-translator-worker.js" | sed 's/wasmBinaryFile = "/wasmBinaryFile = "wasm\//g' >> $TS_FILE
echo "export { addOnPreMain, Module, FS, WORKERFS };" >> $TS_FILE

echo "* Autoformatting imported TypeScript module"
yarn prettier src/core/ts/web-worker-scripts/translation-worker.js/bergamot-translator-worker.ts --write

echo "* Copying bergamot-translator wasm artifact (as is)"
cp "$ARTIFACTS_DIRECTORY/bergamot-translator-worker.wasm" src/core/static/wasm/bergamot-translator-worker.wasm

echo "* Checkout out the relevant revision of the bergamot-models repo"
MODELS_UPDATED=0
MODELS_GIT_REV="c163547f0bbe0c3f9015e78612ef98601f0d0c68"
if [ ! -d "bergamot-models" ]; then
  git clone --branch main --single-branch https://github.com/mozilla-applied-ml/bergamot-models
  MODELS_UPDATED=1
fi
cd bergamot-models
if [ $(git rev-parse HEAD) != "$MODELS_GIT_REV" ]; then
  git fetch
  git checkout $MODELS_GIT_REV
  MODELS_UPDATED=1
fi
cd -
if [ "$MODELS_UPDATED" == "1" ]; then
  echo "* Importing model files from bergamot-models repo"
  mkdir -p test/fixtures/models
  rm -rf test/fixtures/models/*
  cp -rf bergamot-models/prod/* test/fixtures/models
fi

echo "* Done"

exit 0
