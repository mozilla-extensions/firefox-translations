# The artifacts are built from the same source code as this commit: https://github.com/mozilla/bergamot-translator/commit/67aade4df5e780e517ffa69cad480be1385b7fde
# Links were fetched manually from https://app.circleci.com/pipelines/github/mozilla/bergamot-translator/39/workflows/29fd5e7a-ed8c-43e3-9fd8-374476d588fa/jobs/43/artifacts
if [ ! -d downloaded-bergamot-translator-wasm-artifacts ]; then
  mkdir downloaded-bergamot-translator-wasm-artifacts
  cd downloaded-bergamot-translator-wasm-artifacts
  wget "https://43-346428477-gh.circle-artifacts.com/0/build-wasm/wasm/bergamot-translator-worker.js"
  wget "https://43-346428477-gh.circle-artifacts.com/0/build-wasm/wasm/bergamot-translator-worker.wasm"
fi
