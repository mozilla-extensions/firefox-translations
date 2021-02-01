set -e
set -x

cd ../bergamot-translator
mkdir -p build-wasm
cd build-wasm
emcmake cmake -DCOMPILE_WASM=on ../
emmake make -j
cat wasm/bergamot-translator-worker.js ../../extension/src/wasm/bergamot-translator-worker.appendix.js > ../../extension/src/wasm/bergamot-translator-worker.js
cp wasm/bergamot-translator-worker.wasm ../../extension/src/wasm/bergamot-translator-worker.wasm
