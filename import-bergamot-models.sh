#!/usr/bin/env bash

# Usage: ./import-bergamot-models.sh

set -e
# set -x

echo "* Checkout out the relevant revision of the bergamot-models repo"
MODELS_UPDATED=0
MODELS_GIT_REV="3e8993bdf05b7294a99747675954e9166304592f" # v0.2.1
if [ ! -d "bergamot-models" ]; then
  git clone --branch main --single-branch https://github.com/mozilla-applied-ml/bergamot-models
  MODELS_UPDATED=1
fi
cd bergamot-models
if [ $(git rev-parse HEAD) != "$MODELS_GIT_REV" ]; then
  git fetch
  git checkout $MODELS_GIT_REV
  MODELS_UPDATED=1
fi
cd -
if [ "$MODELS_UPDATED" == "1" ]; then
  echo "* Importing model files from bergamot-models repo"
  mkdir -p test/locally-hosted-files/models
  mv test/locally-hosted-files/models/dummy tmp
  rm -rf test/locally-hosted-files/models/*
  cp -rf bergamot-models/prod/* test/locally-hosted-files/models
  ls -l test/locally-hosted-files/models/*
  mv tmp test/locally-hosted-files/models/dummy
fi

echo "* Done"

exit 0
