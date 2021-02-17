set -e
set -x

git submodule update --init --recursive
cd ../bergamot-translator/docker
make
cd ../build-wasm-docker
cat wasm/bergamot-translator-worker.js ../../extension/src/wasm/bergamot-translator-worker.appendix.js > ../../extension/src/wasm/bergamot-translator-worker.js
cp wasm/bergamot-translator-worker.wasm ../../extension/src/wasm/bergamot-translator-worker.wasm
cp wasm/bergamot-translator-worker.data ../../extension/src/wasm/bergamot-translator-worker.data
