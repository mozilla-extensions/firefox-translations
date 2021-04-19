<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

**Contents**

- [Continuous Integration](#continuous-integration)
  - [CircleCI](#circleci)
    - [Run Circle CI locally (requires Docker)](#run-circle-ci-locally-requires-docker)
    - [Installing artifacts created by CircleCI](#installing-artifacts-created-by-circleci)
  - [Taskcluster](#taskcluster)
    - [Test Taskcluster workflows locally](#test-taskcluster-workflows-locally)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Continuous Integration

Both [Circle CI](https://circleci.com/) and Taskcluster is used for continuous integration. CircleCI is used as a general purpose CI, while the Taskcluster integration supports [the automated workflows common to all Mozilla extensions](https://github.com/mozilla-extensions/xpi-manifest/blob/master/docs/adding-a-new-xpi.md#adding-a-new-xpi).

Extension artifacts built via the TaskCluster CI are signed using a development certificate, which enables some privileges in non-release versions of Firefox given that the pref `xpinstall.signatures.dev-root` is set to `true`. These artifacts are used in pre-releases.

## CircleCI

Configured via `./.circleci/config.yml`.

### Run Circle CI locally (requires Docker)

1. [Install the CircleCI local cli](https://circleci.com/docs/2.0/local-cli/#installation)
2. Validate Circle CI configuration (useful exercise before pushing any changes to the configuration)

```shell
circleci config validate -c .circleci/config.yml
```

3. To better mimic the starting point for CI, commit your changes and clone your repository into a clean directory then run CircleCI inside that directory:

```shell
git clone . ../$(basename $PWD)-ci-clone
cd ../$(basename $PWD)-ci-clone
circleci build
```

Note: Steps related to caching and uploading/storing artifacts will report as failed locally. This is not necessarily a problem, they are designed to fail since the operations are not supported locally by the CircleCI build agent.

4. To troubleshoot issues locally, launch the above clone of the repo in the same docker image used by Circle CI:

```shell
cd ../$(basename $PWD)-ci-clone
git pull
docker run -v "$PWD:/home/circleci/checkout" -it circleci/node:latest-browsers /bin/bash
cd ~/checkout
```

Then manually launch the commands from `.circleci/config.yml` until the error has been reproduced.

To forward the GUI to you local Mac workstation, start XQuartz and replace the docker run command above with:

```
xhost + 127.0.0.1
docker run -v "$PWD:/home/circleci/checkout" -e DISPLAY=host.docker.internal:0 -it circleci/node:latest-browsers /bin/bash
```

### Installing artifacts created by CircleCI

Artifacts built via CircleCI are unsigned (just like developer-created local builds), and additional config preferences are necessary to get them to work as expected. First enable the preferences outlined in the [general installation instructions](./INSTALL.md), then:

- Make sure that the following preferences are set to `true` in `about:config`:
  - `extensions.experiments.enabled`
  - `javascript.options.wasm_simd`
  - `javascript.options.wasm_simd_wormhole`
- Make sure that the following preferences are set to `false` in `about:config`:
  - `xpinstall.signatures.required`

## Taskcluster

Configured via `./.taskcluster.yml` and `./taskcluster/`.

### Test Taskcluster workflows locally

Taskcluster runs the following package scripts:

```
yarn build
yarn lint
```

Run these locally to make sure that they work.
