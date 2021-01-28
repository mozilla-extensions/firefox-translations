set -e
set -x

cd ../bergamot-translator
mkdir -p build-wasm
cd build-wasm
emcmake cmake -DCOMPILE_WASM=on ../
emmake make -j
cp wasm/bergamot-translator-wasm.js ../../extension/src/wasm/
cp wasm/bergamot-translator-wasm.wasm ../../extension/src/wasm/
