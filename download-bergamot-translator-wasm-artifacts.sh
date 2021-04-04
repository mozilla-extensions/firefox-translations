# The artifacts are built from this commit: https://github.com/mozilla/bergamot-translator/commit/bf28edad82660db6a9524ae0e7f05dab007f78ce
# Links are fetched manually from https://app.circleci.com/pipelines/github/mozilla/bergamot-translator/14/workflows/395cfa6a-eb2d-439b-8b89-d5c4c18f1dba/jobs/15/artifacts

# Edits:
# https://app.circleci.com/pipelines/github/mozilla-extensions/bergamot-browser-extension/145/workflows/0c4b8045-444f-4265-aa31-2f240f9a6ceb/jobs/144

CIRCLECI_BASE_URL="https://33-346428477-gh.circle-artifacts.com/0/build-wasm/wasm"
if [ ! -d downloaded-bergamot-translator-wasm-artifacts ]; then
  mkdir downloaded-bergamot-translator-wasm-artifacts
  cd downloaded-bergamot-translator-wasm-artifacts
  wget "${CIRCLECI_BASE_URL}/bergamot-translator-worker.data"
  wget "${CIRCLECI_BASE_URL}/bergamot-translator-worker.js"
  wget "${CIRCLECI_BASE_URL}/bergamot-translator-worker.wasm"
fi
