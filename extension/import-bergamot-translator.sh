#!/usr/bin/env bash

# Usage: ./import-bergamot-translator.sh <artifacts-directory>
# Where <artifacts-directory> is the directory of where the bergamot-translator build artifacts are located
# (defaults to ../bergamot-translator/build-wasm/wasm)

set -e
set -x

if [ "$1" != "" ]; then
  ARTIFACTS_DIRECTORY="$1"
else
  ARTIFACTS_DIRECTORY=../bergamot-translator/build-wasm/wasm
fi

cat "$ARTIFACTS_DIRECTORY/bergamot-translator-worker.js" src/wasm/bergamot-translator-worker.appendix.js > src/wasm/bergamot-translator-worker.js
cp "$ARTIFACTS_DIRECTORY/bergamot-translator-worker.wasm" src/wasm/bergamot-translator-worker.wasm
cp "$ARTIFACTS_DIRECTORY/bergamot-translator-worker.data" src/wasm/bergamot-translator-worker.data

exit 0
