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
        if (state === 'test' && trimmed.match(/^Method:\s*(.+)$/)) {
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
            // Check if it's an object property (starts with -)
            if (trimmed.match(/^-\s*([^:]+):\s*(.+)$/)) {
                var propName = RegExp.$1.trim();
                var propValue = RegExp.$2.trim();
                
                // Handle special property: Contains (for string matching)
                if (propName.toLowerCase() === 'contains') {
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
            } else if (!trimmed.match(/^-/)) {
                // Not a property line, parse as simple value
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
    var firstChar = value.charCodeAt(0);
    var lastChar = value.charCodeAt(value.length - 1);
    var hasQuotes = (
        (firstChar === 34 && lastChar === 34) ||  // "..."
        (firstChar === 39 && lastChar === 39) ||  // '...'
        (firstChar === 8220 && lastChar === 8221) ||  // "..."
        (firstChar === 8216 && lastChar === 8217)     // '...'
    );
    
    if (hasQuotes) {
        test.expected = value.substring(1, value.length - 1);
        test.expectedType = 'string';
        return;
    }
    
    // Try to parse as lat lon pair (for backward compatibility)
    var parts = value.split(/\s+/);
    if (parts.length >= 2 && !isNaN(parseFloat(parts[0])) && !isNaN(parseFloat(parts[1]))) {
        // This is a lat lon pair
        if (!test.coords) test.coords = [];
        test.coords.push({
            lat: parseFloat(parts[0]),
            lon: parseFloat(parts[1])
        });
        test.expectedType = 'latlon';
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
    var firstChar = str.charCodeAt(0);
    var lastChar = str.charCodeAt(str.length - 1);
    var hasQuotes = (
        (firstChar === 34 && lastChar === 34) ||  // "..."
        (firstChar === 39 && lastChar === 39) ||  // '...'
        (firstChar === 8220 && lastChar === 8221) ||  // "..."
        (firstChar === 8216 && lastChar === 8217)     // '...'
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
    if (test.method && test.method !== 'pointIn()' && test.method !== 'pointsIn()') {
        var expected = test.expectedObject || test.expected;
        var expectedType = test.expectedType || 'auto';
        var expectedContains = test.expectedContains || null;
        var expectedNotContains = test.expectedNotContains || null;
        suite.addMethodTest(test.id, test.name, test.method, test.input, expected, expectedType, test.implements, expectedContains, expectedNotContains);
        return;
    }
    
    if (test.type === 'Point') {
        // If Point Test has count/coords/crs/bounds, treat it as Points Test
        var hasCoords = test.coords && test.coords.length > 0;
        if (test.count !== undefined || hasCoords || test.crs || test.bounds) {
            var coords = hasCoords ? test.coords : null;
            var crs = test.crs || null;
            var bounds = test.bounds || null;
            // Determine count: explicit count, or coords.length, or 1
            var count;
            if (test.count !== undefined && test.count !== null) {
                count = test.count;
            } else if (coords && coords.length > 0) {
                count = coords.length;
            } else {
                count = 1;
            }
            suite.addPointsTest(test.id, test.name, test.input, count, coords, crs, test.implements, bounds);
        } else {
            suite.addPointTest(test.id, test.name, test.input, test.expected, test.implements);
        }
    } else if (test.type === 'Points') {
        if (test.count === null) {
            console.warn('Points test without count skipped:', test.id);
            return;
        }
        var coords = test.coords.length > 0 ? test.coords : null;
        var crs = test.crs || null;
        var bounds = test.bounds || null;
        suite.addPointsTest(test.id, test.name, test.input, test.count, coords, crs, test.implements, bounds);
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
