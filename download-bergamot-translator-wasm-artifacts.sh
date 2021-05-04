# The artifacts are built from the same source code as this commit: https://github.com/mozilla/bergamot-translator/pull/50/commits/9a3129e10ff43e31c133eaa18d63e0976668df0a
# Links were fetched manually from https://app.circleci.com/pipelines/github/mozilla/bergamot-translator/61/workflows/006eb10c-2752-47e5-abb9-78e9b0ffa3d5/jobs/66/artifacts
if [ ! -d downloaded-bergamot-translator-wasm-artifacts ]; then
  mkdir downloaded-bergamot-translator-wasm-artifacts
  cd downloaded-bergamot-translator-wasm-artifacts
  wget "https://66-346428477-gh.circle-artifacts.com/0/build-wasm/bergamot-translator-worker.js"
  wget "https://66-346428477-gh.circle-artifacts.com/0/build-wasm/bergamot-translator-worker.wasm"
fi
