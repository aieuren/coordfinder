// Test interface compatibility between coordfinder.js and expected API
var fs = require('fs');

// Load coordfinder.js
var cfCode = fs.readFileSync('./src/coordfinder.js', 'utf8');
global.window = undefined;
eval(cfCode);

console.log('=== Interface Compatibility Test ===\n');

var issues = [];
var passed = [];

// Test 1: Check if CoordFinder is exported
if (typeof CoordFinder !== 'undefined') {
    passed.push('✓ CoordFinder is exported globally');
} else {
    issues.push('✗ CoordFinder is NOT exported (only CF)');
}

// Test 2: Check static methods
var staticMethods = ['pointIn', 'pointsIn', 'groupsIn', 'version', 'ratingDefault'];
staticMethods.forEach(function(method) {
    if (typeof CoordFinder[method] !== 'undefined') {
        passed.push('✓ CoordFinder.' + method + ' exists');
    } else {
        issues.push('✗ CoordFinder.' + method + ' is missing');
    }
});

// Test 3: Check instance methods
var cf = new CoordFinder();
var instanceMethods = ['parse', 'points', 'groups', 'log', 'foundRatings', 'ratingIndex'];
instanceMethods.forEach(function(method) {
    if (typeof cf[method] === 'function') {
        passed.push('✓ CoordFinder.prototype.' + method + ' exists');
    } else {
        issues.push('✗ CoordFinder.prototype.' + method + ' is missing');
    }
});

// Test 4: Check Point class
if (typeof CoordFinder.Point !== 'undefined') {
    passed.push('✓ CoordFinder.Point class exists');
    
    // Test Point methods
    var text = "59.32894 18.06491";
    var point = CoordFinder.pointIn(text);
    
    if (point) {
        var pointMethods = [
            'latitude', 'longitude', 'first', 'last', 'original',
            'textBefore', 'textAfter', 'originalText', 'context',
            'asText', 'log', 'rating', 'reprojectTo',
            'maxErrors', 'maxErrorBounds', 'asDebugText'
        ];
        
        pointMethods.forEach(function(method) {
            if (typeof point[method] === 'function') {
                passed.push('✓ Point.' + method + '() exists');
            } else {
                issues.push('✗ Point.' + method + '() is missing');
            }
        });
        
        // Test basic functionality
        try {
            var lat = point.latitude();
            var lon = point.longitude();
            var formatted = point.asText();
            passed.push('✓ Point methods work: lat=' + lat.toFixed(5) + ', lon=' + lon.toFixed(5));
        } catch(e) {
            issues.push('✗ Point methods throw error: ' + e.message);
        }
    } else {
        issues.push('✗ CoordFinder.pointIn() returned null for valid input');
    }
} else {
    issues.push('✗ CoordFinder.Point class is missing');
}

// Test 5: Check RefSys constants
if (typeof CoordFinder.RefSys !== 'undefined') {
    passed.push('✓ CoordFinder.RefSys exists');
    
    var refSystems = ['Unknown', 'WGS84', 'WGS84NorthernEurope', 'SWEREF99TM', 'RT90_25gonV'];
    refSystems.forEach(function(rs) {
        if (typeof CoordFinder.RefSys[rs] !== 'undefined') {
            passed.push('✓ CoordFinder.RefSys.' + rs + ' exists');
        } else {
            issues.push('✗ CoordFinder.RefSys.' + rs + ' is missing');
        }
    });
} else {
    issues.push('✗ CoordFinder.RefSys is missing');
}

// Test 6: Check other exported classes
var classes = ['CoordUnit', 'CoordAxis', 'BoundingBox', 'Coord'];
classes.forEach(function(cls) {
    if (typeof CoordFinder[cls] !== 'undefined') {
        passed.push('✓ CoordFinder.' + cls + ' exists');
    } else {
        issues.push('✗ CoordFinder.' + cls + ' is missing');
    }
});

// Test 7: Test actual parsing with docpage.html example
console.log('\n=== Functional Test ===\n');
var testText = "The ship was at 58.8 and 10,9. Lighthouse at 58°54,0'N, 011 00,0 E.";
try {
    var points = CoordFinder.pointsIn(testText);
    console.log('Input: "' + testText + '"');
    console.log('Found ' + points.length + ' points:');
    points.forEach(function(p, i) {
        console.log('  ' + (i+1) + '. ' + p.asText() + ' (rating: ' + p.rating().toFixed(2) + ')');
    });
    passed.push('✓ Functional test passed');
} catch(e) {
    issues.push('✗ Functional test failed: ' + e.message);
    console.log('Error: ' + e.message);
}

// Print results
console.log('\n=== Results ===\n');
console.log('Passed: ' + passed.length);
console.log('Issues: ' + issues.length);

if (issues.length > 0) {
    console.log('\n=== Issues Found ===\n');
    issues.forEach(function(issue) {
        console.log(issue);
    });
}

console.log('\n=== Summary ===\n');
if (issues.length === 0) {
    console.log('✅ All interface compatibility tests passed!');
    process.exit(0);
} else {
    console.log('⚠️  Some compatibility issues found.');
    console.log('Total checks: ' + (passed.length + issues.length));
    console.log('Success rate: ' + Math.round(100 * passed.length / (passed.length + issues.length)) + '%');
    process.exit(1);
}
