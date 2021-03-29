#!/usr/bin/env bash
set -e

# Run script from the context of the script-containing directory
cd "$(dirname $0)"

# Create and activate a local Python 3 venv
python -m venv venv
source venv/bin/activate

# Install requirements
pip install -U -r requirements.txt

echo "* Success: To activate the python venv, run"
echo "    source venv/bin/activate"
