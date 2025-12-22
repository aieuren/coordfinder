#!/usr/bin/env node

// Simple TDD test runner without Node.js
// This simulates what would happen in a browser

var fs = require('fs');
var vm = require('vm');

// Read and execute coordfinder.js in a sandbox
var coordfinderCode = fs.readFileSync('./src/coordfinder.js', 'utf-8');

// Create a global context
var context = {
    console: console,
    global: {},
    window: undefined
};

// Execute coordfinder in context
vm.runInNewContext(coordfinderCode, context);

// Get CF from context
var CF = context.CF || context.global.CF;

if (!CF) {
    console.error('ERROR: CF not found in context');
    process.exit(1);
}

// Test function
var passed = 0;
var failed = 0;

function test(id, name, input, expectedLat, expectedLon) {
    try {
        var point = CF.pointIn(input);
        
        if (!point) {
            console.log('✗', id, name, '- NO POINT FOUND');
            console.log('  Input:', input);
            failed++;
            return false;
        }
        
        var lat = point.latitude();
        var lon = point.longitude();
        var latOk = Math.abs(lat - expectedLat) < 0.00001;
        var lonOk = Math.abs(lon - expectedLon) < 0.00001;
        
        if (latOk && lonOk) {
            console.log('✓', id, name);
            passed++;
            return true;
        } else {
            console.log('✗', id, name);
            console.log('  Expected:', expectedLat.toFixed(5), expectedLon.toFixed(5));
            console.log('  Got:     ', lat.toFixed(5), lon.toFixed(5));
            failed++;
            return false;
        }
    } catch(e) {
        console.log('✗', id, name, '- ERROR:', e.message);
        failed++;
        return false;
    }
}

console.log('\n=== GRUNDLÄGGANDE WGS84 DECIMALGRADER ===\n');
test('tdd-001', 'Enkel decimalform', '59.32894 18.06491', 59.32894, 18.06491);
test('tdd-002', 'Decimalkomma', '59,32894 18,06491', 59.32894, 18.06491);
test('tdd-003', 'Semikolon som separator', '59.32894; 18.06491', 59.32894, 18.06491);

console.log('\n=== GRADER OCH MINUTER ===\n');
test('tdd-004', 'Grader och decimalminuter', '59° 19.736\' N 18° 3.895\' E', 59.32893, 18.06492);
test('tdd-005', 'Grader, minuter och sekunder', '59° 19\' 44.2" N 18° 3\' 53.7" E', 59.32894, 18.06492);
test('tdd-006', 'Kompakt DMS format', '591944N0180354E', 59.32889, 18.06500);

console.log('\n=== VÄDERSTRECK OCH KVADRANTER ===\n');
test('tdd-007', 'Väderstreck före värden', 'N 62.45 E 17.38', 62.45, 17.38);
test('tdd-008', 'Sydvästra kvadranten', 'S 33.92 W 18.42', -33.92, -18.42);
test('tdd-009', 'Svenska väderstreck', 'N 65.58 Ö 22.14', 65.58, 22.14);

console.log('\n=== MINUSTECKEN SOM SEPARATOR ===\n');
test('tdd-010', 'Grader-minuter format', '58-30 16-45', 58.50, 16.75);
test('tdd-011', 'Kompakt gradminut', '6230-1545', 62.50, 15.75);

console.log('\n=== URL-FORMAT ===\n');
test('tdd-012', 'Google Maps URL', 'https://www.google.com/maps/@59.32894,18.06491', 59.32894, 18.06491);
test('tdd-013', 'Eniro-stil URL', 'map/59.329440/18.064510', 59.32944, 18.06451);

console.log('\n=== DATAFORMAT ===\n');
test('tdd-014', 'GeoJSON', '{"coordinates": [18.06491, 59.32894]}', 59.32894, 18.06491);
test('tdd-015', 'GML', '<gml:pos>59.32894 18.06491</gml:pos>', 59.32894, 18.06491);

console.log('\n=== PREFIX ===\n');
test('tdd-025', 'Lat/Long prefix', 'Lat: 61.234567 Long: 15.876543', 61.234567, 15.876543);

console.log('\n=== KOMPAKT/GLEST ===\n');
test('tdd-023', 'Very compact DM', '5830N01245E', 58.50, 12.75);
test('tdd-024', 'Mycket glest format', '58  °  30  \'  N    12  °  45  \'  E', 58.50, 12.75);

console.log('\n=== WKT ===\n');
test('tdd-036', 'WKT POINT', 'POINT(18.06491 59.32894)', 59.32894, 18.06491);

console.log('\n=== SAMMANFATTNING ===\n');
console.log('Passed:', passed);
console.log('Failed:', failed);
console.log('Total: ', passed + failed);
console.log('Rate:  ', Math.round((passed/(passed+failed))*100) + '%');

process.exit(failed > 0 ? 1 : 0);
