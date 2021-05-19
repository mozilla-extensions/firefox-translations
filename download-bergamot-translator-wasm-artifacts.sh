if [ ! -d downloaded-bergamot-translator-wasm-artifacts ]; then
  mkdir downloaded-bergamot-translator-wasm-artifacts
  cd downloaded-bergamot-translator-wasm-artifacts
  wget "https://github.com/mozilla/bergamot-translator/releases/download/v0.3.1/bergamot-translator-worker.js"
  wget "https://github.com/mozilla/bergamot-translator/releases/download/v0.3.1/bergamot-translator-worker.wasm.gz"
  gunzip bergamot-translator-worker.wasm.gz
fi
