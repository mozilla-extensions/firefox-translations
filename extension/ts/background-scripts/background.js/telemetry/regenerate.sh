#!/usr/bin/env bash

set -e

# Run script from the context of the script-containing directory
cd "$(dirname $0)"

# glean_parser is a python package

if [ ! -d ./venv ]; then
  ./setup-python-venv.sh
fi
source venv/bin/activate

echo "* Generating glean JS code"
echo

glean_parser translate -o ./generated -f javascript metrics.yaml pings.yaml
echo


