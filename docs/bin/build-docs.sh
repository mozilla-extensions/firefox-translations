#!/bin/bash
#
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

# Build all docs with one command
# Documentation will be placed in `build/docs`.

set -xe

DEST_PATH=../build/docs

# Clean
rm -rf $DEST_PATH
mkdir -p $DEST_PATH

# Add redirect from the root page to the user docs
echo '<meta http-equiv=refresh content=0;url=user/index.html>' > $DEST_PATH/index.html

# Add npm assets necessary at build time
cp ../node_modules/mermaid/dist/mermaid.min.js shared/

# TODO: Add telemetry docs
# TODO: Add data-review docs?

# Build the user book
output=$(mdbook build user/ 2>&1)
if echo "$output" | grep -q "\[ERROR\]" ; then
    exit 1
fi

# Build the dev book
output=$(mdbook build dev/ 2>&1)
if echo "$output" | grep -q "\[ERROR\]" ; then
    exit 1
fi

# Check links
link-checker $DEST_PATH --disable-external true --allow-hash-href true
