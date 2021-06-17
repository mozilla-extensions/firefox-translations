#!/bin/bash
#
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

# Build API docs
# Documentation will be placed in `dev/api-docs` for inclusion in the
# developer documentation.

set -e

REPO_PACKAGE_VERSION=$(node -p "require('../package.json').version")

typedoc --options typedoc.json --gitRevision "v$REPO_PACKAGE_VERSION"

cd dev

# Remove the first line (includes breadcrumbs) from the individual pages
# since it is superfluous when results are rendered in mdBook and the
# links in the breadcrumbs cause some linkchecking warnings
for FILE in api-docs/**/*.md; do
  tail -n +2 "$FILE" > "$FILE.tmp" && mv "$FILE.tmp" "$FILE"
done

# Create links to all the individual pages in a file that eventually
# ends up in SUMMARY.md (an mdBook requirement is that all files
# are linked in SUMMARY.md)
rm api-docs-summary.md || true
touch api-docs-summary.md
for f in api-docs/**/*.md; do
  b=$(basename $f)
  echo "  - [$b](./$f)" >> api-docs-summary.md
done
