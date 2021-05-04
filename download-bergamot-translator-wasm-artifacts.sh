# The artifacts are built from the same source code as this commit: https://github.com/mozilla/bergamot-translator/commit/8b2f660169512e9040aa32aa0dd6524b8e358a75
# Links were fetched manually from https://app.circleci.com/pipelines/github/mozilla/bergamot-translator/63/workflows/4824fb5f-8947-4e9b-b49b-738a4d8341c6/jobs/68/artifacts
if [ ! -d downloaded-bergamot-translator-wasm-artifacts ]; then
  mkdir downloaded-bergamot-translator-wasm-artifacts
  cd downloaded-bergamot-translator-wasm-artifacts
  wget "https://68-346428477-gh.circle-artifacts.com/0/build-wasm/bergamot-translator-worker.js"
  wget "https://68-346428477-gh.circle-artifacts.com/0/build-wasm/bergamot-translator-worker.wasm"
fi
