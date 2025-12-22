#!/usr/bin/env node

// convert-tests.js - Convert Markdown test files to JavaScript

var fs = require('fs');
var path = require('path');

// Load dependencies
require('../src/test-framework.js');
require('../src/test-parser.js');

// Parse command line arguments
var args = process.argv.slice(2);

if (args.length === 0) {
    console.log('Usage: node convert-tests.js <input.md> [output.js]');
    console.log('');
    console.log('Converts Markdown test files to JavaScript test suites.');
    console.log('');
    console.log('Examples:');
    console.log('  node convert-tests.js tests.md');
    console.log('  node convert-tests.js my-tests.md my-tests-generated.js');
    process.exit(1);
}

var inputFile = args[0];
var outputFile = args[1];

// Generate output filename if not provided
if (!outputFile) {
    var basename = path.basename(inputFile, path.extname(inputFile));
    outputFile = basename + '-generated.js';
}

console.log('Converting Markdown tests to JavaScript...');
console.log('Input:  ' + inputFile);
console.log('Output: ' + outputFile);
console.log('');

try {
    // Parse markdown file
    var parser = new MarkdownTestParser();
    var suites = parser.parseFile(inputFile);
    
    console.log('Parsed ' + suites.length + ' test suite(s):');
    
    var totalTests = 0;
    for (var i = 0; i < suites.length; i++) {
        var suite = suites[i];
        console.log('  - ' + suite.name + ' (' + suite.tests.length + ' tests)');
        totalTests += suite.tests.length;
    }
    
    console.log('Total: ' + totalTests + ' tests');
    console.log('');
    
    // Generate JavaScript code
    var js = generateJavaScript(suites, inputFile);
    
    // Write to file
    fs.writeFileSync(outputFile, js, 'utf-8');
    
    console.log('✅ Successfully converted to ' + outputFile);
    console.log('');
    console.log('Usage:');
    console.log('  <script src="coordfinder.js"></script>');
    console.log('  <script src="test-framework.js"></script>');
    console.log('  <script src="' + outputFile + '"></script>');
    
} catch(e) {
    console.error('❌ Error: ' + e.message);
    if (e.stack) {
        console.error(e.stack);
    }
    process.exit(1);
}

function generateJavaScript(suites, sourceFile) {
    var lines = [];
    
    lines.push('// Generated from: ' + sourceFile);
    lines.push('// Generated at: ' + new Date().toISOString());
    lines.push('// DO NOT EDIT - This file is auto-generated');
    lines.push('');
    lines.push('(function(global) {');
    lines.push("'use strict';");
    lines.push('');
    lines.push('if (typeof TestFramework === \'undefined\') {');
    lines.push('    throw new Error(\'TestFramework not loaded. Include test-framework.js first.\');');
    lines.push('}');
    lines.push('');
    lines.push('var TestSuite = TestFramework.TestSuite;');
    lines.push('');
    
    // Generate code for each suite
    var suiteVars = [];
    
    for (var i = 0; i < suites.length; i++) {
        var suite = suites[i];
        var varName = 'suite' + (i + 1);
        suiteVars.push(varName);
        
        lines.push('// ═══════════════════════════════════════════════════════════════');
        lines.push('// ' + suite.name);
        lines.push('// ═══════════════════════════════════════════════════════════════');
        lines.push('');
        lines.push('var ' + varName + ' = new TestSuite(\'' + escapeString(suite.name) + '\');');
        lines.push('');
        
        // Generate code for each test
        for (var j = 0; j < suite.tests.length; j++) {
            var test = suite.tests[j];
            
            lines.push('// ─────────────────────────────────────────────────────────────');
            lines.push('// ' + test.type + ' Test: ' + test.name);
            lines.push('// ─────────────────────────────────────────────────────────────');
            
            if (test.type === 'Point') {
                lines.push(varName + '.addPointTest(');
                lines.push('    \'' + escapeString(test.id) + '\',');
                lines.push('    \'' + escapeString(test.name) + '\',');
                lines.push('    \'' + escapeString(test.input) + '\',');
                if (test.expected === null) {
                    lines.push('    null');
                } else {
                    lines.push('    \'' + escapeString(test.expected) + '\'');
                }
                lines.push(');');
            } else if (test.type === 'Points') {
                lines.push(varName + '.addPointsTest(');
                lines.push('    \'' + escapeString(test.id) + '\',');
                lines.push('    \'' + escapeString(test.name) + '\',');
                lines.push('    \'' + escapeString(test.input) + '\',');
                lines.push('    ' + test.count);
                lines.push(');');
            }
            
            lines.push('');
        }
    }
    
    // Export
    lines.push('// ═══════════════════════════════════════════════════════════════');
    lines.push('// Export');
    lines.push('// ═══════════════════════════════════════════════════════════════');
    lines.push('');
    lines.push('global.GeneratedTestSuites = {');
    
    for (var i = 0; i < suiteVars.length; i++) {
        var comma = i < suiteVars.length - 1 ? ',' : '';
        lines.push('    ' + suiteVars[i] + ': ' + suiteVars[i] + comma);
    }
    
    lines.push('    ');
    lines.push('    all: function() {');
    lines.push('        return [' + suiteVars.join(', ') + '];');
    lines.push('    }');
    lines.push('};');
    lines.push('');
    lines.push('})(typeof window !== \'undefined\' ? window : global);');
    
    return lines.join('\n');
}

function escapeString(str) {
    return str.replace(/\\/g, '\\\\')
              .replace(/'/g, "\\'")
              .replace(/\n/g, '\\n')
              .replace(/\r/g, '\\r')
              .replace(/\t/g, '\\t');
}
