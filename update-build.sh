#!/bin/bash
# Update build number in coordfinder.js with current git commit hash

# Get short commit hash
BUILD=$(git rev-parse --short HEAD)

# Update coordfinder.js
sed -i "s/CF.build = \"dev\";/CF.build = \"$BUILD\";/" src/coordfinder.js

echo "Updated CF.build to: $BUILD"
