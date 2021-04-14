# The artifacts are built from this commit: https://github.com/mozilla/bergamot-translator/commit/bf28edad82660db6a9524ae0e7f05dab007f78ce
# Links were fetched manually from https://app.circleci.com/pipelines/github/mozilla/bergamot-translator/29/workflows/ee468970-db75-49ba-8b89-83eec2cef9cc/jobs/30/steps
if [ ! -d downloaded-bergamot-translator-wasm-artifacts ]; then
  mkdir downloaded-bergamot-translator-wasm-artifacts
  cd downloaded-bergamot-translator-wasm-artifacts
  wget "https://30-346428477-gh.circle-artifacts.com/0/build-wasm/wasm/bergamot-translator-worker.data"
  wget "https://30-346428477-gh.circle-artifacts.com/0/build-wasm/wasm/bergamot-translator-worker.js"
  wget "https://30-346428477-gh.circle-artifacts.com/0/build-wasm/wasm/bergamot-translator-worker.wasm"
fi
