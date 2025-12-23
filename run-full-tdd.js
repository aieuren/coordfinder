#!/usr/bin/env node

// TDD Test Runner - Dynamically runs all TDD tests from test-suites-tdd.txt
// This is the canonical test suite that must pass before any commit

var fs = require('fs');

// Load coordfinder
var cfCode = fs.readFileSync('./src/coordfinder.js', 'utf8');
global.window = undefined;
eval(cfCode);

// Load test framework and parser
eval(fs.readFileSync('./src/test-framework.js', 'utf8'));
eval(fs.readFileSync('./src/test-parser.js', 'utf8'));

console.log('=== TDD Test Suite ===');
console.log('CoordFinder version:', CF.version);
console.log('Build:', CF.build);
console.log('');

// Parse test file
var testFile = fs.readFileSync('./requirements/test-suites-tdd.txt', 'utf8');
var parser = new MarkdownTestParser();
var suites = parser.parse(testFile);

var totalTests = 0;
suites.forEach(function(suite) {
    totalTests += suite.tests.length;
});

console.log('Running ' + totalTests + ' tests from requirements/test-suites-tdd.txt\n');

// Run all tests
var runner = new TestFramework.TestRunner();
for (var i = 0; i < suites.length; i++) {
    runner.addSuite(suites[i]);
}

var runnerResults = runner.run();

// Display results
var passed = 0;
var failed = 0;
var currentSuite = '';

for (var i = 0; i < runnerResults.suiteResults.length; i++) {
    var suiteResult = runnerResults.suiteResults[i];
    
    if (suiteResult.suite.name !== currentSuite) {
        currentSuite = suiteResult.suite.name;
        console.log('\n=== ' + currentSuite + ' ===\n');
    }
    
    for (var j = 0; j < suiteResult.results.length; j++) {
        var r = suiteResult.results[j];
        
        if (r.passed) {
            passed++;
            console.log('✓', r.test.id, r.test.name);
        } else {
            failed++;
            console.log('✗', r.test.id, r.test.name);
            if (r.message) {
                var lines = r.message.split('\n');
                for (var k = 0; k < lines.length; k++) {
                    console.log('  ', lines[k]);
                }
            }
        }
    }
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
