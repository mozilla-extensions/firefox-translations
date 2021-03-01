<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

**Contents**

- [Continuous Integration](#continuous-integration)
  - [CircleCI](#circleci)
    - [Run Circle CI locally (requires Docker)](#run-circle-ci-locally-requires-docker)
  - [Taskcluster](#taskcluster)
    - [Test Taskcluster workflows locally](#test-taskcluster-workflows-locally)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Continuous Integration

Both [Circle CI](https://circleci.com/) and Taskcluster is used for continuous integration. CircleCI is used as a general purpose CI, while the Taskcluster integration supports [the automated workflows common to all Mozilla extensions](https://github.com/mozilla-extensions/xpi-manifest/blob/master/docs/adding-a-new-xpi.md#adding-a-new-xpi).

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
git clone . /tmp/$(basename $PWD)
cd /tmp/$(basename $PWD)
circleci build
```

Note: Steps related to caching and uploading/storing artifacts will report as failed locally. This is not necessarily a problem, they are designed to fail since the operations are not supported locally by the CircleCI build agent.

## Taskcluster

Configured via `./.taskcluster.yml` and `./taskcluster/`.

### Test Taskcluster workflows locally

Taskcluster runs the following package scripts:

```
yarn build
yarn lint
```

Run these locally to make sure that they work.
