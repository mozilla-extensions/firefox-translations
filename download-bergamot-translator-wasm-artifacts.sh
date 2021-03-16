# The artifacts are built from this commit: https://github.com/mozilla/bergamot-translator/commit/bf28edad82660db6a9524ae0e7f05dab007f78ce
# Links are fetched manually from https://app.circleci.com/pipelines/github/mozilla/bergamot-translator/14/workflows/395cfa6a-eb2d-439b-8b89-d5c4c18f1dba/jobs/15/artifacts
if [ ! -d downloaded-bergamot-translator-wasm-artifacts ]; then
  mkdir downloaded-bergamot-translator-wasm-artifacts
  cd downloaded-bergamot-translator-wasm-artifacts
  wget "https://15-346428477-gh.circle-artifacts.com/0/build-wasm/wasm/bergamot-translator-worker.data"
  wget "https://15-346428477-gh.circle-artifacts.com/0/build-wasm/wasm/bergamot-translator-worker.js"
  wget "https://15-346428477-gh.circle-artifacts.com/0/build-wasm/wasm/bergamot-translator-worker.wasm"
fi
