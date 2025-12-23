#!/bin/bash
# Update build number in coordfinder.js with current git commit hash

# Get version and build
VERSION=$(grep 'CF.version = ' src/coordfinder.js | sed 's/.*"\(.*\)".*/\1/')
BUILD=$(git rev-parse --short HEAD)

# Update coordfinder.js - replace any existing build value
sed -i.bak "s/CF.build = \"[^\"]*\";/CF.build = \"$BUILD\";/" src/coordfinder.js && rm src/coordfinder.js.bak

echo "Updated CF.build to: $BUILD"
echo ""
echo "Commit template:"
echo "----------------------------------------"
echo "[v$VERSION] Your commit message here"
echo ""
echo "Build: $BUILD"
echo ""
echo "Co-authored-by: Ona <no-reply@ona.com>"
echo "----------------------------------------"
