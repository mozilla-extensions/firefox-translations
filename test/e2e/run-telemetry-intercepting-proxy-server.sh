#!/usr/bin/env bash

set -e

# Run script from the context of the script-containing directory
cd "$(dirname $0)"

if [ ! -d ./venv ]; then
  ./setup-python-venv.sh
  # avoid venv/bin/activate: Permission denied
  chmod +x venv/bin/activate
fi
source venv/bin/activate

mitmdump -s ./intercept-telemetry-requests.py # --set termlog_verbosity=debug
