#!/usr/bin/env bash

set -e

VERSION=6.0.2
wget https://snapshots.mitmproxy.org/$VERSION/mitmproxy-$VERSION-linux.tar.gz
tar -xvf mitmproxy-$VERSION-linux.tar.gz
rm mitmproxy-$VERSION-linux.tar.gz
mkdir -p ~/.local/bin/
mv mitm* ~/.local/bin/

exit 0
