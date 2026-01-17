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
            
            // Finalize previous test if exists
            if (currentTest && currentTest.id && currentSuite) {
                this._addTestToSuite(currentSuite, currentTest);
            }
            
            currentSuite = new TestSuite(suiteName);
            this.suites.push(currentSuite);
            currentTest = null;
            state = 'none';
            continue;
        }
        
        // Test header (## CoordFinder Test: or ## Point Test: or ## Points Test: for backwards compatibility)
        if (trimmed.match(/^##\s+(CoordFinder|Point|Points)\s+Test:\s*(.+)$/)) {
            var testType = RegExp.$1;
            var testName = RegExp.$2;
            
            if (!currentSuite) {
                throw new Error('Test found without test suite at line ' + (i + 1));
            }
            
            // Finalize previous test if exists
            if (currentTest && currentTest.id) {
                this._addTestToSuite(currentSuite, currentTest);
            }
            
            // Map CoordFinder to appropriate type (will be determined by Method:)
            if (testType === 'CoordFinder') {
                testType = 'CoordFinder'; // Keep as is, will be refined by Method
            }
            
            currentTest = {
                type: testType,
                name: testName,
                id: null,
                implements: null,
                method: null,
                input: '',
                expected: null,
                expectedType: null,
                expectedObject: null,
                count: null,
                coords: [],
                crs: null,
                bounds: null
            };
            state = 'test';
            continue;
        }
        
        // Test-ID
        if (state === 'test' && trimmed.match(/^Test-ID:\s*(.+)$/)) {
            currentTest.id = RegExp.$1.trim();
            continue;
        }
        
        // Method (optional, for CoordFinder tests)
        // Allow Method: in both 'test' and 'input' states (for flexibility in test ordering)
        if ((state === 'test' || state === 'input') && trimmed.match(/^Method:\s*(.+)$/)) {
            currentTest.method = RegExp.$1.trim();
            // Determine test type from method if type is CoordFinder
            if (currentTest.type === 'CoordFinder') {
                if (currentTest.method === 'pointIn()') {
                    currentTest.type = 'Point';
                } else if (currentTest.method === 'pointsIn()') {
                    currentTest.type = 'Points';
                }
            }
            continue;
        }
        
        // Implements test-IDs (optional)
        if (state === 'test' && trimmed.match(/^Implements test-IDs?:\s*(.+)$/i)) {
            currentTest.implements = RegExp.$1.trim();
            continue;
        }
        
        // Input section (can be "Input:" or "Input: value")
        if (trimmed.match(/^Input:\s*(.*)$/)) {
            if (!currentTest) {
                // Skip input if no test is active
                continue;
            }
            state = 'input';
            var inputValue = RegExp.$1.trim();
            if (inputValue) {
                // Input on same line - remove only outer quotes (first and last)
                var inputLine = inputValue;
                if ((inputLine[0] === '"' && inputLine[inputLine.length - 1] === '"') ||
                    (inputLine[0] === "'" && inputLine[inputLine.length - 1] === "'")) {
                    inputLine = inputLine.substring(1, inputLine.length - 1);
                }
                // Unescape inner quotes
                inputLine = inputLine.replace(/\\"/g, '"').replace(/\\'/g, "'");
                currentTest.input = inputLine;
            }
            continue;
        }
        
        // Expected section (can be "Expected:" or "Expected: value")
        if (trimmed.match(/^Expected:\s*(.*)$/)) {
            if (!currentTest) {
                // Skip expected if no test is active
                continue;
            }
            state = 'expected';
            var expectedValue = RegExp.$1.trim();
            if (expectedValue) {
                // Expected value on same line - process it
                this._parseExpectedValue(currentTest, expectedValue);
            }
            continue;
        }
        
        // Collect input
        if (state === 'input' && currentTest) {
            // Allow empty lines in input (important for grouping tests)
            if (trimmed === '') {
                // Empty line
                if (currentTest.input) {
                    currentTest.input += '\n';
                }
                continue;
            }
            
            // Remove quotes only if they wrap the entire line (both start and end)
            var inputLine = trimmed;
            if ((inputLine[0] === '"' && inputLine[inputLine.length - 1] === '"') ||
                (inputLine[0] === "'" && inputLine[inputLine.length - 1] === "'")) {
                inputLine = inputLine.substring(1, inputLine.length - 1);
            }
            if (currentTest.input) {
                currentTest.input += '\n' + inputLine;
            } else {
                currentTest.input = inputLine;
            }
            continue;
        }
        
        // Collect expected
        if (state === 'expected' && trimmed !== '' && currentTest) {
            // Check if it's an object property (starts with - followed by name:value or name: with no value)
            // Must have colon to be a property, otherwise it's a negative number
            if (trimmed.match(/^-\s*([^:]+):\s*(.*)$/)) {
                var propName = RegExp.$1.trim();
                var propValue = RegExp.$2.trim();
                
                // Handle special property: Inratingorder (list of originalText values)
                if (propName.toLowerCase() === 'inratingorder') {
                    if (!currentTest.expectedInRatingOrder) {
                        currentTest.expectedInRatingOrder = [];
                        currentTest.expectedType = 'inratingorder';
                    }
                    // If there's a value on the same line, add it
                    if (propValue) {
                        currentTest.expectedInRatingOrder.push(this._parseValue(propValue));
                    }
                    // Next lines with "  - " will be added to this list
                }
                // Handle special property: Contains (for string matching)
                else if (propName.toLowerCase() === 'contains') {
                    if (!currentTest.expectedContains) {
                        currentTest.expectedContains = [];
                        currentTest.expectedType = 'contains';
                    }
                    currentTest.expectedContains.push(this._parseValue(propValue));
                } else if (propName.toLowerCase() === 'contains not') {
                    if (!currentTest.expectedNotContains) {
                        currentTest.expectedNotContains = [];
                        if (!currentTest.expectedType) {
                            currentTest.expectedType = 'contains';
                        }
                    }
                    currentTest.expectedNotContains.push(this._parseValue(propValue));
                } else {
                    // Initialize expectedObject if needed
                    if (!currentTest.expectedObject) {
                        currentTest.expectedObject = {};
                        currentTest.expectedType = 'object';
                    }
                    
                    // Handle nested properties (e.g., "N.value", "refsys.name")
                    this._setNestedProperty(currentTest.expectedObject, propName, this._parseValue(propValue));
                    
                    // Also handle legacy format for backward compatibility
                    if (propName.toLowerCase() === 'count') {
                        currentTest.count = parseInt(propValue, 10);
                    } else if (propName.toLowerCase() === 'crs') {
                        currentTest.crs = propValue;
                    } else if (propName.toLowerCase() === 'bounds') {
                        var parts = propValue.split(/\s+/);
                        if (parts.length >= 4) {
                            currentTest.bounds = {
                                minLat: parseFloat(parts[0]),
                                minLon: parseFloat(parts[1]),
                                maxLat: parseFloat(parts[2]),
                                maxLon: parseFloat(parts[3])
                            };
                        }
                    }
                }
            }
            // Check if it's an indented list item (starts with spaces and -)
            else if (line.match(/^\s{2,}-\s+(.+)$/) && currentTest.expectedInRatingOrder) {
                // Add to inratingorder list
                var itemValue = RegExp.$1.trim();
                currentTest.expectedInRatingOrder.push(this._parseValue(itemValue));
            }
            else {
                // Not a property line (or starts with - but no colon), parse as simple value
                this._parseExpectedValue(currentTest, trimmed);
            }
            continue;
        }
        
        // Empty line - don't finalize test, just skip
        // Tests are finalized when we see a new test header or end of file
        if (trimmed === '') {
            continue;
        }
    }
    
    // Finalize last test if exists
    if (currentTest && currentTest.id) {
        this._addTestToSuite(currentSuite, currentTest);
    }
    
    return this.suites;
};

// Helper: Parse expected value (simple values like numbers, strings, booleans, null, approximate)
MarkdownTestParser.prototype._parseExpectedValue = function(test, value) {
    // Handle approximate values (~58.1)
    if (value.match(/^~(.+)$/)) {
        test.expected = parseFloat(RegExp.$1);
        test.expectedType = 'approximate';
        return;
    }
    
    // Handle null
    if (value.toLowerCase() === 'null' || value === '-') {
        test.expected = null;
        test.expectedType = 'null';
        return;
    }
    
    // Handle boolean
    if (value.toLowerCase() === 'true') {
        test.expected = true;
        test.expectedType = 'boolean';
        return;
    }
    if (value.toLowerCase() === 'false') {
        test.expected = false;
        test.expectedType = 'boolean';
        return;
    }
    
    // Handle quoted string (ASCII and Unicode quotes)
    // Remove matching quotes from start and end
    var firstChar = value.charCodeAt(0);
    var lastChar = value.charCodeAt(value.length - 1);
    var hasQuotes = (
        (firstChar === 34 && lastChar === 34) ||  // "..."
        (firstChar === 39 && lastChar === 39) ||  // '...'
        (firstChar === 8220 && lastChar === 8221) ||  // "..." (left and right)
        (firstChar === 8221 && lastChar === 8221) ||  // "..." (both right)
        (firstChar === 8220 && lastChar === 8220) ||  // "..." (both left)
        (firstChar === 8216 && lastChar === 8217) ||  // '...' (left and right)
        (firstChar === 8217 && lastChar === 8217) ||  // '...' (both right)
        (firstChar === 8216 && lastChar === 8216)     // '...' (both left)
    );
    
    if (hasQuotes) {
        test.expected = value.substring(1, value.length - 1);
        test.expectedType = 'string';
        return;
    }
    
    // Try to parse as lat lon pair
    var parts = value.split(/\s+/);
    if (parts.length >= 2 && !isNaN(parseFloat(parts[0])) && !isNaN(parseFloat(parts[1]))) {
        // Always store as string in expected for both pointIn() and pointsIn()
        // This allows string comparison for simple cases
        test.expected = value;
        test.expectedType = 'string';
        return;
    }
    
    // Try to parse as number
    if (!isNaN(parseFloat(value)) && isFinite(value)) {
        test.expected = parseFloat(value);
        test.expectedType = 'number';
        return;
    }
    
    // Default: treat as string
    test.expected = value;
    test.expectedType = 'string';
};

// Helper: Parse a value (for object properties)
MarkdownTestParser.prototype._parseValue = function(str) {
    // Handle approximate values
    if (str.match(/^~(.+)$/)) {
        return { approx: parseFloat(RegExp.$1) };
    }
    
    // Handle null
    if (str.toLowerCase() === 'null') {
        return null;
    }
    
    // Handle boolean
    if (str.toLowerCase() === 'true') return true;
    if (str.toLowerCase() === 'false') return false;
    
    // Handle quoted string (ASCII and Unicode quotes)
    // Remove matching quotes from start and end
    var firstChar = str.charCodeAt(0);
    var lastChar = str.charCodeAt(str.length - 1);
    var hasQuotes = (
        (firstChar === 34 && lastChar === 34) ||  // "..."
        (firstChar === 39 && lastChar === 39) ||  // '...'
        (firstChar === 8220 && lastChar === 8221) ||  // "..." (left and right)
        (firstChar === 8221 && lastChar === 8221) ||  // "..." (both right)
        (firstChar === 8220 && lastChar === 8220) ||  // "..." (both left)
        (firstChar === 8216 && lastChar === 8217) ||  // '...' (left and right)
        (firstChar === 8217 && lastChar === 8217) ||  // '...' (both right)
        (firstChar === 8216 && lastChar === 8216)     // '...' (both left)
    );
    
    if (hasQuotes) {
        return str.substring(1, str.length - 1);
    }
    
    // Try to parse as number
    if (!isNaN(parseFloat(str)) && isFinite(str)) {
        return parseFloat(str);
    }
    
    // Default: return as string
    return str;
};

// Helper: Set nested property in object (e.g., "N.value" -> obj.N.value)
MarkdownTestParser.prototype._setNestedProperty = function(obj, path, value) {
    var parts = path.split('.');
    var current = obj;
    
    for (var i = 0; i < parts.length - 1; i++) {
        var part = parts[i];
        if (!current[part]) {
            current[part] = {};
        }
        current = current[part];
    }
    
    current[parts[parts.length - 1]] = value;
};

MarkdownTestParser.prototype._addTestToSuite = function(suite, test) {
    if (!test.id) {
        console.warn('Test without ID skipped:', test.name);
        return;
    }
    
    // Remove surrounding quotes from input if present (for multi-line inputs)
    if (test.input) {
        var input = test.input.trim();
        var firstChar = input.charCodeAt(0);
        var lastChar = input.charCodeAt(input.length - 1);
        
        // Check for ASCII quotes (34 = ", 39 = ') or Unicode quotes (8220 = ", 8221 = ", 8216 = ', 8217 = ')
        var hasQuotes = (
            (firstChar === 34 && lastChar === 34) ||  // "..."
            (firstChar === 39 && lastChar === 39) ||  // '...'
            (firstChar === 8220 && lastChar === 8221) ||  // "..."
            (firstChar === 8216 && lastChar === 8217)     // '...'
        );
        
        if (hasQuotes) {
            test.input = input.substring(1, input.length - 1);
        }
    }
    
    // If test has a Method specified, create a MethodTest
    if (test.method) {
        var expected = test.expectedInRatingOrder || test.expectedObject || test.expected;
        var expectedType = test.expectedType || 'auto';
        var expectedContains = test.expectedContains || null;
        var expectedNotContains = test.expectedNotContains || null;
        
        // For pointsIn(), create expected object with count and bounds if available
        if (test.method === 'pointsIn()' && (test.count !== null || test.bounds)) {
            expected = {};
            if (test.count !== null) expected.count = test.count;
            if (test.bounds) expected.bounds = test.bounds;
            if (test.coords && test.coords.length > 0) expected.coords = test.coords;
            expectedType = 'object';
        }
        
        suite.addMethodTest(test.id, test.name, test.method, test.input, expected, expectedType, test.implements, expectedContains, expectedNotContains);
        return;
    }
    
    // Legacy test types (Point/Points) without Method field are no longer supported
    if (test.type === 'Point' || test.type === 'Points') {
        console.warn('Legacy test type without Method field skipped:', test.id, '- Please add Method field');
        return;
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
