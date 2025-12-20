#!/usr/bin/env node

// Simple demonstration of CoordFinder
// This shows the exact code from your example

console.log("=".repeat(60));
console.log("CoordFinder Demo");
console.log("=".repeat(60));

// Load the library
require('./coordfinder.js');

var text = 'The ship was at 58.8 and 10,9. Lighthouse at 58°54,0\'N, 011 00,0 E.';

console.log("\nInput text:");
console.log(text);
console.log("\n" + "=".repeat(60));

// ===== SIMPLE USAGE =====
console.log("\n1. SIMPLE USAGE");
console.log("-".repeat(60));
console.log("Code: var points = CF.pointsIn(text);");
console.log("");

var points = CF.pointsIn(text);

console.log("Result: Found " + points.length + " coordinate pairs\n");

for (var i = 0; i < points.length; i++) {
    console.log("Point " + (i + 1) + ":");
    console.log("  Formatted:  " + points[i].asText());
    console.log("  Latitude:   " + points[i].latitude());
    console.log("  Longitude:  " + points[i].longitude());
    console.log("  Rating:     " + points[i].rating());
    console.log("  Original:   " + points[i].originalText());
    console.log("");
}

// ===== DETAILED USAGE =====
console.log("=".repeat(60));
console.log("\n2. DETAILED USAGE WITH RATINGS");
console.log("-".repeat(60));
console.log("Code:");
console.log("  var cf = new CF();");
console.log("  cf.parse(text);");
console.log("  var highConfidence = cf.points({rating: 0.8});");
console.log("");

var cf = new CF();
cf.parse(text);
var highConfidence = cf.points({rating: 0.8});

console.log("Result:");
console.log("  All points:         " + cf.points().length);
console.log("  High confidence:    " + highConfidence.length + " (rating >= 0.8)");
console.log("");

if (highConfidence.length > 0) {
    console.log("High confidence points:");
    for (var i = 0; i < highConfidence.length; i++) {
        console.log("  - " + highConfidence[i].asText() + 
                   " (rating: " + highConfidence[i].rating() + ")");
    }
} else {
    console.log("  (No points with rating >= 0.8)");
}

// ===== PARSE LOG =====
console.log("\n" + "=".repeat(60));
console.log("\n3. PARSE LOG");
console.log("-".repeat(60));
console.log("Code: console.log(cf.log());");
console.log("");
console.log(cf.log());

// ===== DIFFERENT FORMATS =====
console.log("\n" + "=".repeat(60));
console.log("\n4. DIFFERENT OUTPUT FORMATS");
console.log("-".repeat(60));

if (points.length > 0) {
    var p = points[0];
    console.log("Using first point for format examples:\n");
    
    console.log("Plain (default):");
    console.log("  p.asText({format: 'plain'})");
    console.log("  → " + p.asText({format: 'plain'}));
    console.log("");
    
    console.log("Degrees with direction after:");
    console.log("  p.asText({format: 'degrees', directionLetter: 'after'})");
    console.log("  → " + p.asText({format: 'degrees', directionLetter: 'after'}));
    console.log("");
    
    console.log("Compact:");
    console.log("  p.asText({compact: true})");
    console.log("  → " + p.asText({compact: true}));
    console.log("");
    
    console.log("Non-localized (period as decimal):");
    console.log("  p.asText({localized: false})");
    console.log("  → " + p.asText({localized: false}));
    console.log("");
}

// ===== ADDITIONAL INFO =====
console.log("=".repeat(60));
console.log("\n5. ADDITIONAL INFORMATION");
console.log("-".repeat(60));

for (var i = 0; i < points.length; i++) {
    var p = points[i];
    console.log("\nPoint " + (i + 1) + " details:");
    console.log("  Reference System: " + p.refsys.name);
    console.log("  Context:          " + p.context({maxChars: 30}));
    console.log("  Rating Log:       " + p.ratingLog());
    
    var errors = p.maxErrors();
    console.log("  Max Errors:       N: ±" + errors.N.toFixed(6) + "°, E: ±" + errors.E.toFixed(6) + "°");
}

console.log("\n" + "=".repeat(60));
console.log("Demo Complete!");
console.log("=".repeat(60));
