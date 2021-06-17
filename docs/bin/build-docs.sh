#!/bin/bash
#
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

# Build all docs with one command
# Documentation will be placed in `build/docs`.

set -xe

DEST_PATH=../build/docs

# To cleanly apply some preprocessing, we copy all src files to an
# intermediate path before running mdbook
INTERMEDIATE_SRC_PATH=../build/tmp-docs

# Clean
rm -rf $INTERMEDIATE_SRC_PATH
mkdir -p $INTERMEDIATE_SRC_PATH
rm -rf $DEST_PATH
mkdir -p $DEST_PATH

# Copy src files to the intermediate source dir
cp -r dev shared user $INTERMEDIATE_SRC_PATH/

# Add npm assets necessary at build time
cp ../node_modules/mermaid/dist/mermaid.min.js $INTERMEDIATE_SRC_PATH/shared/

# TODO: Add telemetry docs
# TODO: Add data-review docs?

# Build the docs
cat dev/SUMMARY.tpl.md dev/api-docs-summary.md > $INTERMEDIATE_SRC_PATH/dev/SUMMARY.md
cd $INTERMEDIATE_SRC_PATH
output=$(mdbook build user/ 2>&1)
if echo "$output" | grep -q "\[ERROR\]" ; then
    exit 1
fi
output=$(mdbook build dev/ 2>&1)
if echo "$output" | grep -q "\[ERROR\]" ; then
    exit 1
fi
cd -

# Clean up intermediate src files
rm -rf $INTERMEDIATE_SRC_PATH

# Add redirect from the root page to the user docs
echo '<meta http-equiv=refresh content=0;url=user/index.html>' > $DEST_PATH/index.html
