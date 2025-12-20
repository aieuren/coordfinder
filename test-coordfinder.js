// Test CoordFinder with the example text
require('./coordfinder.js');

var exampleText = `Report: 
"The ship was seen drifting about 200 meters west of the island at 58.8 and 10,9. Nothing seen around it.

Observation made at 10 minutes past 14 from the lighthouse at 58°54,0'N, 011 00,0 E."`;

console.log("=== Testing CoordFinder ===\n");
console.log("Input text:");
console.log(exampleText);
console.log("\n=== Results ===\n");

// Test static method pointIn
console.log("1. CF.pointIn() - First point:");
var firstPoint = CF.pointIn(exampleText);
if (firstPoint) {
    console.log("   Found: " + firstPoint.asText());
    console.log("   Latitude: " + firstPoint.latitude());
    console.log("   Longitude: " + firstPoint.longitude());
    console.log("   Rating: " + firstPoint.rating());
    console.log("   Context: " + firstPoint.context({maxChars: 30}));
} else {
    console.log("   No point found");
}

// Test static method pointsIn
console.log("\n2. CF.pointsIn() - All points:");
var allPoints = CF.pointsIn(exampleText);
console.log("   Found " + allPoints.length + " points:");
for (var i = 0; i < allPoints.length; i++) {
    console.log("   Point " + (i+1) + ": " + allPoints[i].asText());
    console.log("      Lat/Lng: " + allPoints[i].latitude() + ", " + allPoints[i].longitude());
    console.log("      Rating: " + allPoints[i].rating());
    console.log("      Original: " + allPoints[i].originalText());
}

// Test instance method with detailed info
console.log("\n3. Instance method with logging:");
var cf = new CF();
cf.parse(exampleText);
var points = cf.points();
console.log("   Found " + points.length + " points");
console.log("\n   Parse log:");
console.log(cf.log());

// Test grouping
console.log("\n4. CF.groupsIn() - Grouped points:");
var groups = CF.groupsIn(exampleText);
console.log("   Found " + groups.length + " groups:");
for (var i = 0; i < groups.length; i++) {
    console.log("   Group " + (i+1) + " (" + groups[i].length + " points):");
    for (var j = 0; j < groups[i].length; j++) {
        console.log("      " + groups[i][j].asText());
    }
}

// Test unused coords
console.log("\n5. Unused coordinates:");
var unused = cf.unusedCoords();
console.log("   Found " + unused.length + " unused coordinates:");
for (var i = 0; i < unused.length; i++) {
    console.log("   - " + unused[i].originalText() + " (value: " + unused[i].value + ")");
}

// Test different output formats
if (allPoints.length > 0) {
    console.log("\n6. Different output formats for first point:");
    var p = allPoints[0];
    console.log("   Plain: " + p.asText({format: 'plain'}));
    console.log("   Degrees: " + p.asText({format: 'degrees', directionLetter: 'after'}));
    console.log("   With symbols: " + p.asText({format: 'degrees', symbols: true}));
    console.log("   Compact: " + p.asText({format: 'plain', compact: true}));
    console.log("   Non-localized: " + p.asText({localized: false}));
}

console.log("\n=== Test Complete ===");
