# The artifacts are built from the same source code as this commit: https://github.com/mozilla/bergamot-translator/commit/48fde5e1985f1d9badebddd526c53f29cf3704a9
# Links were fetched manually from https://app.circleci.com/pipelines/github/mozilla/bergamot-translator/42/workflows/b46ed52b-b237-4472-976c-11e6a6b90292/jobs/46/artifacts
if [ ! -d downloaded-bergamot-translator-wasm-artifacts ]; then
  mkdir downloaded-bergamot-translator-wasm-artifacts
  cd downloaded-bergamot-translator-wasm-artifacts
  wget "https://46-346428477-gh.circle-artifacts.com/0/build-wasm/wasm/bergamot-translator-worker.js"
  wget "https://46-346428477-gh.circle-artifacts.com/0/build-wasm/wasm/bergamot-translator-worker.wasm"
fi
