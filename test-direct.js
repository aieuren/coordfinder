#!/usr/bin/env node

// Load modules directly (not in VM)
global.CF = require('./src/coordfinder.js');
global.TestFramework = require('./src/test-framework.js');
global.MarkdownTestParser = require('./src/test-parser.js');

var fs = require('fs');

console.log('CF loaded, version:', CF.version);

// Parse tests
var testFile = fs.readFileSync('./requirements/test-suites-tdd.txt', 'utf8');
var parser = new MarkdownTestParser();
var suites = parser.parse(testFile);

console.log('\nLoaded', suites.length, 'suites with', 
    suites.reduce(function(sum, s) { return sum + s.tests.length; }, 0), 'tests\n');

// Run all tests
var runner = new TestFramework.TestRunner();
for (var i = 0; i < suites.length; i++) {
    runner.addSuite(suites[i]);
}

var runnerResults = runner.run();

// Show results
var passed = 0;
var failed = 0;

console.log('=== TEST RESULTS ===\n');

// Flatten suite results
for (var i = 0; i < runnerResults.suiteResults.length; i++) {
    var suiteResult = runnerResults.suiteResults[i];
    for (var j = 0; j < suiteResult.results.length; j++) {
        var r = suiteResult.results[j];
        
        if (r.passed) {
            passed++;
            console.log('✓', r.test.id, r.test.name);
        } else {
            failed++;
            console.log('✗', r.test.id, r.test.name);
            console.log('  ', r.message.split('\n').join('\n   '));
        }
    }
}

console.log('\n=== SUMMARY ===');
console.log('Passed:', passed);
console.log('Failed:', failed);
console.log('Total:', passed + failed);
console.log('Rate:', Math.round((passed / (passed + failed)) * 100) + '%');

process.exit(failed > 0 ? 1 : 0);
