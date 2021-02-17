set -e
set -x

cd ../bergamot-translator/build-wasm-docker
cat wasm/bergamot-translator-worker.js ../../extension/src/wasm/bergamot-translator-worker.appendix.js > ../../extension/src/wasm/bergamot-translator-worker.js
cp wasm/bergamot-translator-worker.wasm ../../extension/src/wasm/bergamot-translator-worker.wasm
cp wasm/bergamot-translator-worker.data ../../extension/src/wasm/bergamot-translator-worker.data
