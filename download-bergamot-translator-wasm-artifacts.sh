# The artifacts are built from the same source code as this commit: https://github.com/mozilla/bergamot-translator/commit/a8cd998720bc34a6ab0d7615557cb402d4326a48
# Links were fetched manually from https://app.circleci.com/pipelines/github/mozilla/bergamot-translator/64/workflows/6b9c3f45-f900-414d-8060-10cf2e6ec32b/jobs/69/artifacts
if [ ! -d downloaded-bergamot-translator-wasm-artifacts ]; then
  mkdir downloaded-bergamot-translator-wasm-artifacts
  cd downloaded-bergamot-translator-wasm-artifacts
  wget "https://69-346428477-gh.circle-artifacts.com/0/build-wasm/bergamot-translator-worker.js"
  wget "https://69-346428477-gh.circle-artifacts.com/0/build-wasm/bergamot-translator-worker.wasm"
fi
