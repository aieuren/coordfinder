// test-parser.js - Parse Markdown test files into TestSuite objects

(function(global) {
'use strict';

// Require test framework
if (typeof TestFramework === 'undefined') {
    throw new Error('TestFramework not loaded. Include test-framework.js first.');
}

var TestSuite = TestFramework.TestSuite;

// ——————————— MarkdownTestParser ——————————— //
function MarkdownTestParser() {
    this.suites = [];
}

// Parse markdown text into test suites
MarkdownTestParser.prototype.parse = function(markdownText) {
    this.suites = [];
    var lines = markdownText.split(/\r?\n/);
    
    var currentSuite = null;
    var currentTest = null;
    var state = 'none'; // none, test, input, expected
    
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        var trimmed = line.trim();
        
        // Test suite header (# Title)
        if (trimmed.match(/^#\s+(.+)$/)) {
            var suiteName = RegExp.$1;
            currentSuite = new TestSuite(suiteName);
            this.suites.push(currentSuite);
            currentTest = null;
            state = 'none';
            continue;
        }
        
        // Test header (## Point Test: or ## Points Test:)
        if (trimmed.match(/^##\s+(Point|Points)\s+Test:\s*(.+)$/)) {
            var testType = RegExp.$1;
            var testName = RegExp.$2;
            
            if (!currentSuite) {
                throw new Error('Test found without test suite at line ' + (i + 1));
            }
            
            currentTest = {
                type: testType,
                name: testName,
                id: null,
                input: '',
                expected: null,
                count: null
            };
            state = 'test';
            continue;
        }
        
        // Test-ID
        if (state === 'test' && trimmed.match(/^Test-ID:\s*(.+)$/)) {
            currentTest.id = RegExp.$1.trim();
            continue;
        }
        
        // Input section
        if (trimmed === 'Input:') {
            state = 'input';
            continue;
        }
        
        // Expected section
        if (trimmed === 'Expected:') {
            state = 'expected';
            continue;
        }
        
        // Collect input
        if (state === 'input' && trimmed !== '') {
            // Remove quotes if present
            var inputLine = trimmed.replace(/^["']|["']$/g, '');
            if (currentTest.input) {
                currentTest.input += '\n' + inputLine;
            } else {
                currentTest.input = inputLine;
            }
            continue;
        }
        
        // Collect expected
        if (state === 'expected' && trimmed !== '') {
            if (currentTest.type === 'Point') {
                // Point Test: expected format is "lat lon" or "null"
                if (trimmed.toLowerCase() === 'null' || trimmed === '-') {
                    currentTest.expected = null;
                } else {
                    currentTest.expected = trimmed;
                }
            } else if (currentTest.type === 'Points') {
                // Points Test: expected format is "- Count: N"
                if (trimmed.match(/^-?\s*Count:\s*(\d+)$/i)) {
                    currentTest.count = parseInt(RegExp.$1, 10);
                }
            }
            continue;
        }
        
        // Empty line or new section - finalize current test
        if (trimmed === '' && currentTest && currentTest.id) {
            this._addTestToSuite(currentSuite, currentTest);
            currentTest = null;
            state = 'none';
        }
    }
    
    // Finalize last test if exists
    if (currentTest && currentTest.id) {
        this._addTestToSuite(currentSuite, currentTest);
    }
    
    return this.suites;
};

MarkdownTestParser.prototype._addTestToSuite = function(suite, test) {
    if (!test.id) {
        console.warn('Test without ID skipped:', test.name);
        return;
    }
    
    if (test.type === 'Point') {
        suite.addPointTest(test.id, test.name, test.input, test.expected);
    } else if (test.type === 'Points') {
        if (test.count === null) {
            console.warn('Points test without count skipped:', test.id);
            return;
        }
        suite.addPointsTest(test.id, test.name, test.input, test.count);
    }
};

// Parse markdown file (for Node.js)
MarkdownTestParser.prototype.parseFile = function(filename) {
    if (typeof require === 'undefined') {
        throw new Error('parseFile only available in Node.js');
    }
    
    var fs = require('fs');
    var content = fs.readFileSync(filename, 'utf-8');
    return this.parse(content);
};

// Load markdown tests from URL (for browser)
MarkdownTestParser.prototype.loadFromURL = function(url, callback) {
    var self = this;
    
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    var suites = self.parse(xhr.responseText);
                    callback(null, suites);
                } catch(e) {
                    callback(e, null);
                }
            } else {
                callback(new Error('Failed to load: ' + url), null);
            }
        }
    };
    xhr.send();
};

// Export
global.MarkdownTestParser = MarkdownTestParser;

})(typeof window !== 'undefined' ? window : global);
