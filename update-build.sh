#!/bin/bash
# Update build number in coordfinder.js with current git commit hash

# Get short commit hash
BUILD=$(git rev-parse --short HEAD)

# Update coordfinder.js - replace any existing build value
sed -i.bak "s/CF.build = \"[^\"]*\";/CF.build = \"$BUILD\";/" src/coordfinder.js && rm src/coordfinder.js.bak

echo "Updated CF.build to: $BUILD"
