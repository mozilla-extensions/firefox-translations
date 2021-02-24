#!/usr/bin/env bash
set -e

# Create and activate a local Python 3 venv
python -m venv venv
source venv/bin/activate

# Install requirements
pip install -U glean_parser

echo "* Success: To activate the python venv, run"
echo "    source venv/bin/activate"
