#!/bin/bash
# Update build number with timestamp

# Get version
VERSION=$(grep 'CF.version = ' src/coordfinder.js | sed 's/.*"\(.*\)".*/\1/')

# Generate timestamp-based build number: YYYYMMDD-HHMMSS
BUILD=$(date +%Y%m%d-%H%M%S)

# Update BUILD file
echo "$BUILD" > BUILD

# Update coordfinder.js
sed -i.bak "s/CF.build = \"[^\"]*\";/CF.build = \"$BUILD\";/" src/coordfinder.js && rm src/coordfinder.js.bak

echo "Updated build to: $BUILD"
echo ""
echo "Commit template:"
echo "----------------------------------------"
echo "[v$VERSION] Your commit message here"
echo ""
echo "Build: $BUILD"
echo ""
echo "Co-authored-by: Ona <no-reply@ona.com>"
echo "----------------------------------------"
