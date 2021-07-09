# Continuous Integration

[Circle CI](https://circleci.com/) is used for continuous integration.

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
