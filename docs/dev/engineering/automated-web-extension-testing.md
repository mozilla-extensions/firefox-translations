in-browser tests

these tests run inside an extension page to be able to have access to the same privileges that web extension background script has

e2e tests

selenium because of only that allows access to the privileged parts of the ui

## Run end-to-end tests

### Locally

Before running the tests locally for the first time, install [mitmproxy](https://mitmproxy.org). Example installation command for Mac:

```bash
brew install mitmproxy
```

To run the end-to-end tests, run:

```bash
yarn e2e-tests
```

Note, to modify the `test/e2e/intercept-telemetry-requests.py` script, it may be useful to have the Python deps installed:

```bash
test/e2e/setup-python-venv.sh
```

### Troubleshooting functional tests

**Basic principles**

End-to-end tests are run using the built extension artifacts found in `dist/production/`. To test new non-test-related code changes, remember to re-run the relevant build command.

**Intervening**

If you want to intervene in a test (eg. to double-check something), follow this pattern:

1. Add a long delay, eg `await driver.sleep(60 * 60 * 1000);` to the test at the place you want to intervene.
2. Make sure to temporarily also increase the timeout for the test you are running.
3. Run the tests and intervene manually as desired.

**Obtaining Geckodriver logs**

To troubleshoot issues with failing tests when only cryptic error messages are available, check the geckodriver logs, located in `test/e2e/results/logs/`.

## Relevant engineering background

Maintenance and development of this component requires experience in:

- ...

- Web extension regression tests (CI, e2e tests)
  Senior/Staff Test Engineer with great experience in configuring CI and writing Selenium-based e2e tests for web extensions
