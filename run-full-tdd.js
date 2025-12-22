#!/usr/bin/env node

// TDD Test Runner - Runs all 30 TDD tests from test-suites-tdd.txt
// This is the canonical test suite that must pass before any commit

var fs = require('fs');
var cfCode = fs.readFileSync('./src/coordfinder.js', 'utf8');

// Create browser-like global
global.window = undefined;
eval(cfCode);

console.log('=== TDD Test Suite ===');
console.log('CoordFinder version:', CF.version);
console.log('Running 30 tests from requirements/test-suites-tdd.txt\n');

// Simple test runner that mimics what test-framework does
function test(id, name, input, expectedLat, expectedLon) {
    try {
        var point = CF.pointIn(input);
        
        if (!point) {
            console.log('✗', id, name);
            console.log('   Expected point but found none');
            console.log('   Input:', input);
            return false;
        }
        
        var lat = point.latitude();
        var lon = point.longitude();
        
        // Use 5 decimal places for comparison
        var latMatch = Math.abs(lat - expectedLat) < 0.00001;
        var lonMatch = Math.abs(lon - expectedLon) < 0.00001;
        
        if (latMatch && lonMatch) {
            console.log('✓', id, name);
            return true;
        } else {
            console.log('✗', id, name);
            console.log('   Expected:', expectedLat.toFixed(5), expectedLon.toFixed(5));
            console.log('   Got:     ', lat.toFixed(5), lon.toFixed(5));
            return false;
        }
    } catch(e) {
        console.log('✗', id, name);
        console.log('   Exception:', e.message);
        return false;
    }
}

function testPoints(id, name, input, expectedCount) {
    try {
        var points = CF.pointsIn(input);
        var count = points ? points.length : 0;
        
        if (count === expectedCount) {
            console.log('✓', id, name);
            return true;
        } else {
            console.log('✗', id, name);
            console.log('   Expected', expectedCount, 'point(s), found', count);
            return false;
        }
    } catch(e) {
        console.log('✗', id, name);
        console.log('   Exception:', e.message);
        return false;
    }
}

var passed = 0;
var failed = 0;

console.log('=== GRUNDLÄGGANDE WGS84 DECIMALGRADER ===\n');
passed += test('tdd-001', 'Enkel decimalform', '59.32894 18.06491', 59.32894, 18.06491) ? 1 : 0; failed += !test('tdd-001', 'Enkel decimalform', '59.32894 18.06491', 59.32894, 18.06491) ? 1 : 0;
passed += test('tdd-002', 'Decimalkomma', '59,32894 18,06491', 59.32894, 18.06491) ? 1 : 0; failed += !test('tdd-002', 'Decimalkomma', '59,32894 18,06491', 59.32894, 18.06491) ? 1 : 0;
passed += test('tdd-003', 'Semikolon som separator', '59.32894; 18.06491', 59.32894, 18.06491) ? 1 : 0; failed += !test('tdd-003', 'Semikolon som separator', '59.32894; 18.06491', 59.32894, 18.06491) ? 1 : 0;

console.log('\n=== GRADER OCH MINUTER ===\n');
passed += test('tdd-004', 'Grader och decimalminuter', '59° 19.736\' N 18° 3.895\' E', 59.32893, 18.06492) ? 1 : 0; failed += !test('tdd-004', 'Grader och decimalminuter', '59° 19.736\' N 18° 3.895\' E', 59.32893, 18.06492) ? 1 : 0;
passed += test('tdd-005', 'Grader, minuter och sekunder', '59° 19\' 44.2" N 18° 3\' 53.7" E', 59.32894, 18.06492) ? 1 : 0; failed += !test('tdd-005', 'Grader, minuter och sekunder', '59° 19\' 44.2" N 18° 3\' 53.7" E', 59.32894, 18.06492) ? 1 : 0;
passed += test('tdd-006', 'Kompakt DMS format', '591944N0180354E', 59.32889, 18.06500) ? 1 : 0; failed += !test('tdd-006', 'Kompakt DMS format', '591944N0180354E', 59.32889, 18.06500) ? 1 : 0;

console.log('\n=== VÄDERSTRECK OCH KVADRANTER ===\n');
passed += test('tdd-007', 'Väderstreck före värden', 'N 62.45 E 17.38', 62.45, 17.38) ? 1 : 0; failed += !test('tdd-007', 'Väderstreck före värden', 'N 62.45 E 17.38', 62.45, 17.38) ? 1 : 0;
passed += test('tdd-008', 'Sydvästra kvadranten', 'S 33.92 W 18.42', -33.92, -18.42) ? 1 : 0; failed += !test('tdd-008', 'Sydvästra kvadranten', 'S 33.92 W 18.42', -33.92, -18.42) ? 1 : 0;
passed += test('tdd-009', 'Svenska väderstreck', 'N 65.58 Ö 22.14', 65.58, 22.14) ? 1 : 0; failed += !test('tdd-009', 'Svenska väderstreck', 'N 65.58 Ö 22.14', 65.58, 22.14) ? 1 : 0;

console.log('\n=== MINUSTECKEN SOM SEPARATOR ===\n');
passed += test('tdd-010', 'Grader-minuter format', '58-30 16-45', 58.50, 16.75) ? 1 : 0; failed += !test('tdd-010', 'Grader-minuter format', '58-30 16-45', 58.50, 16.75) ? 1 : 0;
passed += test('tdd-011', 'Kompakt gradminut', '6230-1545', 62.50, 15.75) ? 1 : 0; failed += !test('tdd-011', 'Kompakt gradminut', '6230-1545', 62.50, 15.75) ? 1 : 0;

console.log('\n=== URL-FORMAT ===\n');
passed += test('tdd-012', 'Google Maps URL', 'https://www.google.com/maps/place/59.32894,18.06491', 59.32894, 18.06491) ? 1 : 0; failed += !test('tdd-012', 'Google Maps URL', 'https://www.google.com/maps/place/59.32894,18.06491', 59.32894, 18.06491) ? 1 : 0;
passed += test('tdd-013', 'Eniro-stil', 'map/59.329440/18.064510', 59.32944, 18.06451) ? 1 : 0; failed += !test('tdd-013', 'Eniro-stil', 'map/59.329440/18.064510', 59.32944, 18.06451) ? 1 : 0;

console.log('\n=== DATAFORMAT ===\n');
passed += test('tdd-014', 'GeoJSON koordinater', '{"coordinates": [18.06491, 59.32894]}', 59.32894, 18.06491) ? 1 : 0; failed += !test('tdd-014', 'GeoJSON koordinater', '{"coordinates": [18.06491, 59.32894]}', 59.32894, 18.06491) ? 1 : 0;
passed += test('tdd-015', 'GML format', '<gml:pos>59.32894 18.06491</gml:pos>', 59.32894, 18.06491) ? 1 : 0; failed += !test('tdd-015', 'GML format', '<gml:pos>59.32894 18.06491</gml:pos>', 59.32894, 18.06491) ? 1 : 0;

console.log('\n=== FLERRADIGA OCH LISTOR ===\n');
passed += testPoints('tdd-016', 'Tvåradiga koordinater', 'Lat: 60.12345\nLong: 19.54321', 1) ? 1 : 0; failed += !testPoints('tdd-016', 'Tvåradiga koordinater', 'Lat: 60.12345\nLong: 19.54321', 1) ? 1 : 0;
passed += testPoints('tdd-017', 'Numrerad lista', '1) 57°30\'N 12°15\'E\n2) 57°45\'N 12°30\'E\n3) 58°00\'N 12°45\'E', 3) ? 1 : 0; failed += !testPoints('tdd-017', 'Numrerad lista', '1) 57°30\'N 12°15\'E\n2) 57°45\'N 12°30\'E\n3) 58°00\'N 12°45\'E', 3) ? 1 : 0;

console.log('\n=== SWEREF 99 TM ===\n');
passed += testPoints('tdd-018', 'SWEREF 99 TM grundformat', '6580000 540000', 1) ? 1 : 0; failed += !testPoints('tdd-018', 'SWEREF 99 TM grundformat', '6580000 540000', 1) ? 1 : 0;
passed += testPoints('tdd-019', 'SWEREF med x-separator', '7350000 x 850000', 1) ? 1 : 0; failed += !testPoints('tdd-019', 'SWEREF med x-separator', '7350000 x 850000', 1) ? 1 : 0;
passed += testPoints('tdd-020', 'SWEREF i text', 'Punkten ligger på N 6450000, E 320000 i SWEREF 99 TM', 1) ? 1 : 0; failed += !testPoints('tdd-020', 'SWEREF i text', 'Punkten ligger på N 6450000, E 320000 i SWEREF 99 TM', 1) ? 1 : 0;

console.log('\n=== RT90 ===\n');
passed += testPoints('tdd-021', 'RT90 2.5 gon V', '6580000 1540000', 1) ? 1 : 0; failed += !testPoints('tdd-021', 'RT90 2.5 gon V', '6580000 1540000', 1) ? 1 : 0;
passed += testPoints('tdd-022', 'RT90 med kommaseparering', 'X: 6580000, Y: 1540000', 1) ? 1 : 0; failed += !testPoints('tdd-022', 'RT90 med kommaseparering', 'X: 6580000, Y: 1540000', 1) ? 1 : 0;

console.log('\n=== BLANDAD TEXT ===\n');
passed += testPoints('tdd-028', 'Koordinater i löptext', 'Fartyget befann sig vid position 58°45\'N 17°30\'E när händelsen inträffade.', 1) ? 1 : 0; failed += !testPoints('tdd-028', 'Koordinater i löptext', 'Fartyget befann sig vid position 58°45\'N 17°30\'E när händelsen inträffade.', 1) ? 1 : 0;
passed += testPoints('tdd-029', 'Fiskeriloggbok-stil', 'Fångstområde: 5820N-1145E\nPosition vid start: 5835N-1152E', 2) ? 1 : 0; failed += !testPoints('tdd-029', 'Fiskeriloggbok-stil', 'Fångstområde: 5820N-1145E\nPosition vid start: 5835N-1152E', 2) ? 1 : 0;

console.log('\n=== NEGATIVA TESTER ===\n');
passed += testPoints('tdd-030', 'För stora latitudvärden', '95.0 18.0', 0) ? 1 : 0; failed += !testPoints('tdd-030', 'För stora latitudvärden', '95.0 18.0', 0) ? 1 : 0;
passed += testPoints('tdd-031', 'För stora longitudvärden', '58.0 185.0', 0) ? 1 : 0; failed += !testPoints('tdd-031', 'För stora longitudvärden', '58.0 185.0', 0) ? 1 : 0;
passed += testPoints('tdd-032', 'Telefonnummer ska inte matcha', 'Ring 08-123 45 67', 0) ? 1 : 0; failed += !testPoints('tdd-032', 'Telefonnummer ska inte matcha', 'Ring 08-123 45 67', 0) ? 1 : 0;
passed += testPoints('tdd-033', 'Datum ska inte matcha', '2024-01-15', 0) ? 1 : 0; failed += !testPoints('tdd-033', 'Datum ska inte matcha', '2024-01-15', 0) ? 1 : 0;

console.log('\n=== PRECISION OCH DECIMALER ===\n');
passed += testPoints('tdd-034', 'Olika antal decimaler', '59.3 18.1\n59.32 18.06\n59.329 18.065\n59.3289 18.0649', 4) ? 1 : 0; failed += !testPoints('tdd-034', 'Olika antal decimaler', '59.3 18.1\n59.32 18.06\n59.329 18.065\n59.3289 18.0649', 4) ? 1 : 0;

console.log('\n=== NOTATIONER FÖR HELTÄCKNING ===\n');
passed += test('tdd-036', 'WKT POINT notation', 'POINT(18.06491 59.32894)', 59.32894, 18.06491) ? 1 : 0; failed += !test('tdd-036', 'WKT POINT notation', 'POINT(18.06491 59.32894)', 59.32894, 18.06491) ? 1 : 0;

// Recalculate since we're double-counting
passed = 0;
failed = 0;

console.log('\n\n=== RUNNING ALL TESTS AGAIN FOR ACCURATE COUNT ===\n');

var tests = [
    ['tdd-001', 'Enkel decimalform', '59.32894 18.06491', 59.32894, 18.06491],
    ['tdd-002', 'Decimalkomma', '59,32894 18,06491', 59.32894, 18.06491],
    ['tdd-003', 'Semikolon som separator', '59.32894; 18.06491', 59.32894, 18.06491],
    ['tdd-004', 'Grader och decimalminuter', '59° 19.736\' N 18° 3.895\' E', 59.32893, 18.06492],
    ['tdd-005', 'Grader, minuter och sekunder', '59° 19\' 44.2" N 18° 3\' 53.7" E', 59.32894, 18.06492],
    ['tdd-006', 'Kompakt DMS format', '591944N0180354E', 59.32889, 18.06500],
    ['tdd-007', 'Väderstreck före värden', 'N 62.45 E 17.38', 62.45, 17.38],
    ['tdd-008', 'Sydvästra kvadranten', 'S 33.92 W 18.42', -33.92, -18.42],
    ['tdd-009', 'Svenska väderstreck', 'N 65.58 Ö 22.14', 65.58, 22.14],
    ['tdd-010', 'Grader-minuter format', '58-30 16-45', 58.50, 16.75],
    ['tdd-011', 'Kompakt gradminut', '6230-1545', 62.50, 15.75],
    ['tdd-012', 'Google Maps URL', 'https://www.google.com/maps/place/59.32894,18.06491', 59.32894, 18.06491],
    ['tdd-013', 'Eniro-stil', 'map/59.329440/18.064510', 59.32944, 18.06451],
    ['tdd-014', 'GeoJSON koordinater', '{"coordinates": [18.06491, 59.32894]}', 59.32894, 18.06491],
    ['tdd-015', 'GML format', '<gml:pos>59.32894 18.06491</gml:pos>', 59.32894, 18.06491],
    ['tdd-036', 'WKT POINT notation', 'POINT(18.06491 59.32894)', 59.32894, 18.06491]
];

var pointsTests = [
    ['tdd-016', 'Tvåradiga koordinater', 'Lat: 60.12345\nLong: 19.54321', 1],
    ['tdd-017', 'Numrerad lista', '1) 57°30\'N 12°15\'E\n2) 57°45\'N 12°30\'E\n3) 58°00\'N 12°45\'E', 3],
    ['tdd-018', 'SWEREF 99 TM grundformat', '6580000 540000', 1],
    ['tdd-019', 'SWEREF med x-separator', '7350000 x 850000', 1],
    ['tdd-020', 'SWEREF i text', 'Punkten ligger på N 6450000, E 320000 i SWEREF 99 TM', 1],
    ['tdd-021', 'RT90 2.5 gon V', '6580000 1540000', 1],
    ['tdd-022', 'RT90 med kommaseparering', 'X: 6580000, Y: 1540000', 1],
    ['tdd-028', 'Koordinater i löptext', 'Fartyget befann sig vid position 58°45\'N 17°30\'E när händelsen inträffade.', 1],
    ['tdd-029', 'Fiskeriloggbok-stil', 'Fångstområde: 5820N-1145E\nPosition vid start: 5835N-1152E', 2],
    ['tdd-030', 'För stora latitudvärden', '95.0 18.0', 0],
    ['tdd-031', 'För stora longitudvärden', '58.0 185.0', 0],
    ['tdd-032', 'Telefonnummer ska inte matcha', 'Ring 08-123 45 67', 0],
    ['tdd-033', 'Datum ska inte matcha', '2024-01-15', 0],
    ['tdd-034', 'Olika antal decimaler', '59.3 18.1\n59.32 18.06\n59.329 18.065\n59.3289 18.0649', 4]
];

for (var i = 0; i < tests.length; i++) {
    if (test.apply(null, tests[i])) passed++; else failed++;
}

for (var i = 0; i < pointsTests.length; i++) {
    if (testPoints.apply(null, pointsTests[i])) passed++; else failed++;
}

console.log('\n=== SAMMANFATTNING ===');
console.log('Passed:', passed);
console.log('Failed:', failed);
console.log('Total:', passed + failed);
console.log('Rate:', Math.round((passed / (passed + failed)) * 100) + '%');

if (failed > 0) {
    console.log('\n⚠️  Some tests failed. Fix before committing.');
    process.exit(1);
} else {
    console.log('\n✅ All tests passed!');
    process.exit(0);
}
