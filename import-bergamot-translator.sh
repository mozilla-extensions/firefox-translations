#!/usr/bin/env bash

# Usage: ./import-bergamot-translator.sh <artifacts-directory>
# Where <artifacts-directory> is the directory of where the bergamot-translator build artifacts are located
# (defaults to ../bergamot-translator/build-wasm/wasm)
#
# Note that the import script concatenates the contents of the `bergamot-translator-worker.js` WASM build artifact
# with the contents of `src/wasm/bergamot-translator-worker.appendix.js` and stores the result
# into `extension/src/wasm/bergamot-translator-worker.js`

set -e
set -x

if [ "$1" != "" ]; then
  ARTIFACTS_DIRECTORY="$1"
else
  ARTIFACTS_DIRECTORY=./bergamot-translator/build-wasm/wasm
fi

cat "$ARTIFACTS_DIRECTORY/bergamot-translator-worker.js" src/core/static/wasm/bergamot-translator-worker.appendix.js > src/core/static/wasm/bergamot-translator-worker.js
cp "$ARTIFACTS_DIRECTORY/bergamot-translator-worker.wasm" src/core/static/wasm/bergamot-translator-worker.wasm

# Download models
MODELS_UPDATED=0
if [ ! -d "bergamot-models" ]; then
  git clone --depth 1 --branch main --single-branch https://github.com/mozilla-applied-ml/bergamot-models
  MODELS_UPDATED=1
else
  cd bergamot-models
  git fetch
  # Only pull if necessary
  if [ $(git rev-parse HEAD) != $(git rev-parse @{u}) ]; then
    git pull --ff-only
    MODELS_UPDATED=1
  fi
  cd -
fi
if [ "$MODELS_UPDATED" == "1" ]; then
  mkdir -p test/fixtures/models
  rm -rf test/fixtures/models/*
  cp -rf bergamot-models/prod/* test/fixtures/models
  gunzip test/fixtures/models/*/*
fi

exit 0
