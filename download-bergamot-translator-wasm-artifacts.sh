# The artifacts are built from the same source code as this commit: https://github.com/mozilla/bergamot-translator/commit/fff70d6564964bfea081e747850f339df32e94f2
# Links were fetched manually from https://app.circleci.com/pipelines/github/mozilla/bergamot-translator/74/workflows/439bdc32-fd8a-466b-80f6-259d53185f12/jobs/77/artifacts
if [ ! -d downloaded-bergamot-translator-wasm-artifacts ]; then
  mkdir downloaded-bergamot-translator-wasm-artifacts
  cd downloaded-bergamot-translator-wasm-artifacts
  wget "https://77-346428477-gh.circle-artifacts.com/0/build-wasm/bergamot-translator-worker.js"
  wget "https://77-346428477-gh.circle-artifacts.com/0/build-wasm/bergamot-translator-worker.wasm"
fi
