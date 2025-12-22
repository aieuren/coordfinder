#!/usr/bin/env node

// run-tests.js - Command-line test runner for CoordFinder

// Load dependencies
require('../src/coordfinder.js');
require('../src/test-framework.js');
require('./test-suites.js');

// Parse command line arguments
var args = process.argv.slice(2);
var selectedSuites = [];

if (args.length === 0 || args.includes('--all')) {
    // Run all suites
    selectedSuites = CoordFinderTestSuites.all();
} else {
    // Run specific suites
    if (args.includes('--standard')) {
        selectedSuites.push(CoordFinderTestSuites.standardTests);
    }
    if (args.includes('--format')) {
        selectedSuites.push(CoordFinderTestSuites.formatTests);
    }
    if (args.includes('--sweref')) {
        selectedSuites.push(CoordFinderTestSuites.swerefTests);
    }
    if (args.includes('--edge')) {
        selectedSuites.push(CoordFinderTestSuites.edgeCaseTests);
    }
    
    if (selectedSuites.length === 0) {
        console.log('Usage: node run-tests.js [options]');
        console.log('');
        console.log('Options:');
        console.log('  --all        Run all test suites (default)');
        console.log('  --standard   Run standard tests');
        console.log('  --format     Run format tests');
        console.log('  --sweref     Run SWEREF99 TM tests');
        console.log('  --edge       Run edge case tests');
        console.log('');
        console.log('Examples:');
        console.log('  node run-tests.js --all');
        console.log('  node run-tests.js --standard --format');
        process.exit(1);
    }
}

// Create runner and add suites
var runner = new TestFramework.TestRunner();
for (var i = 0; i < selectedSuites.length; i++) {
    runner.addSuite(selectedSuites[i]);
}

// Run tests
console.log('');
console.log('╔═══════════════════════════════════════════════════╗');
console.log('║         CoordFinder Test Runner                  ║');
console.log('╚═══════════════════════════════════════════════════╝');
console.log('');

var result = runner.run();

// Display results
console.log(result.toString());

// Exit with appropriate code
process.exit(result.totalFailed > 0 ? 1 : 0);
