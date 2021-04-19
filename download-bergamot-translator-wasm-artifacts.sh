# The artifacts are built from the same source code as this commit: https://github.com/mozilla/bergamot-translator/commit/bf28edad82660db6a9524ae0e7f05dab007f78ce
# Links were fetched manually from https://app.circleci.com/pipelines/github/mozilla/bergamot-translator/29/workflows/0c20b796-3cd6-43e8-93da-1b062e87af32/jobs/36/artifacts
if [ ! -d downloaded-bergamot-translator-wasm-artifacts ]; then
  mkdir downloaded-bergamot-translator-wasm-artifacts
  cd downloaded-bergamot-translator-wasm-artifacts
  wget "https://36-346428477-gh.circle-artifacts.com/0/build-wasm/wasm/bergamot-translator-worker.data"
  wget "https://36-346428477-gh.circle-artifacts.com/0/build-wasm/wasm/bergamot-translator-worker.js"
  wget "https://36-346428477-gh.circle-artifacts.com/0/build-wasm/wasm/bergamot-translator-worker.wasm"
fi
