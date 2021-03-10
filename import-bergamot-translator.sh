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
cp "$ARTIFACTS_DIRECTORY/bergamot-translator-worker.data" src/core/static/wasm/bergamot-translator-worker.data

exit 0
