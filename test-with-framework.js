#!/usr/bin/env node

var fs = require('fs');
var vm = require('vm');

// Create global context
var context = {
    console: console,
    global: global,
    window: undefined
};

// Load coordfinder
var cfCode = fs.readFileSync('./src/coordfinder.js', 'utf8');
vm.runInNewContext(cfCode, context);
context.CF = context.CF || context.global.CF;
var CF = context.CF;

if (!CF) {
    console.error('ERROR: CF not loaded');
    process.exit(1);
}

console.log('CF loaded, version:', CF.version);

// Load test framework
var tfCode = fs.readFileSync('./src/test-framework.js', 'utf8');
vm.runInNewContext(tfCode, context);
context.TestFramework = context.TestFramework || context.global.TestFramework;
var TF = context.TestFramework;

console.log('TestFramework loaded');

// Load test parser - needs TestFramework in context
var tpCode = fs.readFileSync('./src/test-parser.js', 'utf8');
vm.runInNewContext(tpCode, context);
context.MarkdownTestParser = context.MarkdownTestParser || context.global.MarkdownTestParser;
var Parser = context.MarkdownTestParser;

console.log('Parser loaded');

// Parse tests
var testFile = fs.readFileSync('./requirements/test-suites-tdd.txt', 'utf8');
var parser = new Parser();
var suites = parser.parse(testFile);

console.log('\nLoaded', suites.length, 'suites with', 
    suites.reduce(function(sum, s) { return sum + s.tests.length; }, 0), 'tests\n');

// Run all tests
var runner = new TF.TestRunner();
for (var i = 0; i < suites.length; i++) {
    runner.addSuite(suites[i]);
}

var runnerResults = runner.run();

// Show results
var passed = 0;
var failed = 0;
var allResults = [];

console.log('=== TEST RESULTS ===\n');

// Flatten suite results
for (var i = 0; i < runnerResults.suiteResults.length; i++) {
    var suiteResult = runnerResults.suiteResults[i];
    for (var j = 0; j < suiteResult.results.length; j++) {
        var r = suiteResult.results[j];
        allResults.push(r);
        
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
