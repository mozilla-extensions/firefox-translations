# The artifacts are built from this commit: https://github.com/mozilla/bergamot-translator/pull/1/commits/cdd09531d5325d72a5c805fa2abac3a8dc1a12b9
# Links are fetched manually from https://app.circleci.com/pipelines/github/mozilla/bergamot-translator/8/workflows/60d4895c-caf1-461c-bef6-88e37db4adcd/jobs/10/artifacts
if [ ! -d downloaded-bergamot-translator-wasm-artifacts ]; then
  mkdir downloaded-bergamot-translator-wasm-artifacts
  cd downloaded-bergamot-translator-wasm-artifacts
  wget "https://10-340211362-gh.circle-artifacts.com/0/build-wasm/wasm/bergamot-translator-worker.data"
  wget "https://10-340211362-gh.circle-artifacts.com/0/build-wasm/wasm/bergamot-translator-worker.js"
  wget "https://10-340211362-gh.circle-artifacts.com/0/build-wasm/wasm/bergamot-translator-worker.wasm"
fi
