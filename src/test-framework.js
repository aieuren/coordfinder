// test-framework.js - Test Framework for CoordFinder
// Supports Point Tests (single coordinate pair) and Points Tests (multiple pairs)

(function(global) {
'use strict';

// ——————————— TestResult ——————————— //
function TestResult(test, passed, message, actual, expected) {
    this.test = test;
    this.passed = passed;
    this.message = message || "";
    this.actual = actual;
    this.expected = expected;
    this.timestamp = new Date();
}

TestResult.prototype.toString = function() {
    var status = this.passed ? "✅ PASS" : "❌ FAIL";
    var msg = status + " [" + this.test.id + "] " + this.test.name;
    if (!this.passed && this.message) {
        msg += "\n   " + this.message;
    }
    return msg;
};

// ——————————— MethodTest ——————————— //
// Tests a specific method on a Point object
function MethodTest(id, name, method, input, expected, expectedType, implementsTestIds, expectedContains, expectedNotContains) {
    this.id = id;
    this.name = name;
    this.method = method;
    this.input = input;
    this.expected = expected;
    this.expectedType = expectedType || 'auto';
    this.implementsTestIds = implementsTestIds || null;
    this.expectedContains = expectedContains || null;
    this.expectedNotContains = expectedNotContains || null;
    this.type = "MethodTest";
}

MethodTest.prototype.run = function() {
    try {
        // Determine if this is a CoordFinder method or Point method
        var methodName = this.method.match(/^([^(]+)/)[1].trim();
        var isStaticMethod = ['pointIn', 'pointsIn'].indexOf(methodName) !== -1;
        var isInstanceMethod = ['points', 'groups', 'foundRatings', 'ratingIndex', 'log'].indexOf(methodName) !== -1;
        
        var target;
        var actual;
        
        if (isStaticMethod) {
            // For pointIn/pointsIn, call directly (handled in _executeMethod)
            actual = this._executeMethod(null);
            
            // Special handling for pointsIn() with count and/or bounds
            if (methodName === 'pointsIn' && this.expected && 
                (this.expected.count !== undefined || this.expected.bounds)) {
                
                // Check count
                if (this.expected.count !== undefined && actual.length !== this.expected.count) {
                    var msg = "Expected " + this.expected.count + " point(s), found " + actual.length;
                    if (actual.length > 0) {
                        msg += "\n   Found points:";
                        for (var i = 0; i < actual.length; i++) {
                            msg += "\n   - " + actual[i].latitude().toFixed(3) + ", " + 
                                   actual[i].longitude().toFixed(3);
                        }
                    }
                    return new TestResult(this, false, msg, actual.length, this.expected.count);
                }
                
                // Check bounds if specified
                if (this.expected.bounds && actual.length > 0) {
                    for (var i = 0; i < actual.length; i++) {
                        var p = actual[i];
                        var lat = p.latitude();
                        var lon = p.longitude();
                        
                        if (lat < this.expected.bounds.minLat || lat > this.expected.bounds.maxLat ||
                            lon < this.expected.bounds.minLon || lon > this.expected.bounds.maxLon) {
                            var msg = "Point " + (i + 1) + " outside expected bounds\n";
                            msg += "   Point: " + lat.toFixed(4) + ", " + lon.toFixed(4) + "\n";
                            msg += "   Bounds: [" + this.expected.bounds.minLat + ", " + 
                                   this.expected.bounds.minLon + "] to [" + 
                                   this.expected.bounds.maxLat + ", " + this.expected.bounds.maxLon + "]";
                            return new TestResult(this, false, msg);
                        }
                    }
                }
                
                var msg = "Found " + actual.length + " point(s)";
                if (this.expected.bounds) msg += " within expected bounds";
                return new TestResult(this, true, msg, actual.length, this.expected.count);
            }
        } else if (isInstanceMethod) {
            // Create CF instance and parse input
            var cf = new CF();
            cf.parse(this.input);
            target = cf;
            actual = this._executeMethod(target);
        } else {
            // Parse input to get point
            var point = CF.pointIn(this.input);
            if (!point) {
                return new TestResult(this, false, "No point found in input", null, this.expected);
            }
            target = point;
            actual = this._executeMethod(target);
        }
        
        // Compare based on expected type
        var comparison = this._compare(actual, this.expected, this.expectedType);
        
        if (comparison.passed) {
            return new TestResult(this, true, "Method result matches expected", actual, this.expected);
        } else {
            return new TestResult(this, false, comparison.message, actual, this.expected);
        }
        
    } catch(e) {
        return new TestResult(this, false, "Exception: " + e.message + "\nStack: " + e.stack, null, this.expected);
    }
};

MethodTest.prototype._executeMethod = function(point) {
    // Parse method name and arguments
    var match = this.method.match(/^([^(]+)\(([^)]*)\)$/);
    if (!match) {
        throw new Error("Invalid method format: " + this.method);
    }
    
    var methodName = match[1].trim();
    var argsStr = match[2].trim();
    
    // Parse arguments
    var args = [];
    var namedArgs = {};
    var hasNamedArgs = false;
    
    if (argsStr) {
        // Split by comma, but handle nested parentheses
        var parts = this._splitArguments(argsStr);
        for (var i = 0; i < parts.length; i++) {
            var arg = parts[i].trim();
            if (arg.includes('=')) {
                // Named argument like format=degrees or maxchars=15
                var eqParts = arg.split('=');
                var name = eqParts[0].trim();
                var value = this._parseArgumentValue(eqParts[1].trim());
                namedArgs[name] = value;
                hasNamedArgs = true;
            } else {
                args.push(this._parseArgumentValue(arg));
            }
        }
    }
    
    // If we have named arguments, pass them as an options object
    if (hasNamedArgs) {
        args.push(namedArgs);
    }
    
    // For pointIn() and pointsIn(), call CF static methods with input as first argument
    if (methodName === 'pointIn' || methodName === 'pointsIn') {
        if (typeof CF[methodName] !== 'function') {
            throw new Error("Method not found on CF: " + methodName);
        }
        // First argument is the input text
        var methodArgs = [this.input].concat(args);
        return CF[methodName].apply(CF, methodArgs);
    }
    
    // Execute method on point
    if (typeof point[methodName] !== 'function') {
        throw new Error("Method not found: " + methodName);
    }
    
    return point[methodName].apply(point, args);
};

MethodTest.prototype._splitArguments = function(argsStr) {
    var args = [];
    var current = '';
    var depth = 0;
    
    for (var i = 0; i < argsStr.length; i++) {
        var ch = argsStr[i];
        if (ch === '(' || ch === '[' || ch === '{') {
            depth++;
            current += ch;
        } else if (ch === ')' || ch === ']' || ch === '}') {
            depth--;
            current += ch;
        } else if (ch === ',' && depth === 0) {
            args.push(current);
            current = '';
        } else {
            current += ch;
        }
    }
    
    if (current) {
        args.push(current);
    }
    
    return args;
};

MethodTest.prototype._parseArgumentValue = function(str) {
    // Try to parse as number
    if (!isNaN(parseFloat(str)) && isFinite(str)) {
        return parseFloat(str);
    }
    
    // Try to parse as boolean
    if (str.toLowerCase() === 'true') return true;
    if (str.toLowerCase() === 'false') return false;
    
    // Remove quotes if present
    if ((str[0] === '"' && str[str.length - 1] === '"') ||
        (str[0] === "'" && str[str.length - 1] === "'")) {
        return str.substring(1, str.length - 1);
    }
    
    // Return as string
    return str;
};

MethodTest.prototype._compare = function(actual, expected, type) {
    // Convert Point object to string for comparison if expected is a string
    if (actual && typeof actual === 'object' && actual.constructor && actual.constructor.name === 'Point' && typeof expected === 'string') {
        // Determine decimal places from expected format
        var parts = expected.split(/\s+/);
        var latDecimals = 3; // default
        var lonDecimals = 3; // default
        
        if (parts.length >= 1) {
            var match = parts[0].match(/\.(\d+)/);
            latDecimals = match ? match[1].length : 0;
        }
        if (parts.length >= 2) {
            var match = parts[1].match(/\.(\d+)/);
            lonDecimals = match ? match[1].length : 0;
        }
        
        // Format: "lat lon"
        actual = actual.latitude().toFixed(latDecimals) + ' ' + actual.longitude().toFixed(lonDecimals);
    }
    
    // Convert Points array for pointsIn() results
    if (Array.isArray(actual) && actual.length > 0 && actual[0].constructor && actual[0].constructor.name === 'Point') {
        // If expected is a number, just return count
        if (typeof expected === 'number') {
            actual = actual.length;
        }
        // If expected is a string, convert points to "lat lon" format
        else if (typeof expected === 'string') {
            // Determine decimal places from expected format
            var parts = expected.split(/\s+/);
            var latDecimals = 3; // default
            var lonDecimals = 3; // default
            
            if (parts.length >= 1) {
                var match = parts[0].match(/\.(\d+)/);
                latDecimals = match ? match[1].length : 0;
            }
            if (parts.length >= 2) {
                var match = parts[1].match(/\.(\d+)/);
                lonDecimals = match ? match[1].length : 0;
            }
            
            // Convert all points to "lat lon" format
            var pointStrs = [];
            for (var i = 0; i < actual.length; i++) {
                pointStrs.push(actual[i].latitude().toFixed(latDecimals) + ' ' + actual[i].longitude().toFixed(lonDecimals));
            }
            actual = pointStrs.join('\n');
        }
        // If expected is an object (with count/bounds), create result object
        else if (typeof expected === 'object' && expected !== null) {
            var result = {
                Count: actual.length
            };
            
            // Check if all points are within expected bounds
            if (expected.bounds) {
                var allWithinBounds = true;
                for (var i = 0; i < actual.length; i++) {
                    var lat = actual[i].latitude();
                    var lon = actual[i].longitude();
                    if (lat < expected.bounds.minLat || lat > expected.bounds.maxLat ||
                        lon < expected.bounds.minLon || lon > expected.bounds.maxLon) {
                        allWithinBounds = false;
                        break;
                    }
                }
                result.boundsCheck = allWithinBounds;
            }
            
            actual = result;
        }
    }
    
    // Auto-detect type if not specified
    if (type === 'auto') {
        if (expected === null) {
            type = 'null';
        } else if (typeof expected === 'boolean') {
            type = 'boolean';
        } else if (typeof expected === 'number') {
            type = 'number';
        } else if (typeof expected === 'string') {
            type = 'string';
        } else if (typeof expected === 'object') {
            type = 'object';
        }
    }
    
    switch(type) {
        case 'number':
            return this._compareNumber(actual, expected);
        
        case 'approximate':
            return this._compareApproximate(actual, expected);
        
        case 'string':
            return this._compareString(actual, expected);
        
        case 'boolean':
            return this._compareBoolean(actual, expected);
        
        case 'null':
            return this._compareNull(actual, expected);
        
        case 'object':
            return this._compareObject(actual, expected);
        
        case 'contains':
            return this._compareContains(actual, this.expectedContains);
        
        default:
            return this._compareDefault(actual, expected);
    }
};

MethodTest.prototype._compareNumber = function(actual, expected) {
    var tolerance = 0.00001;
    if (Math.abs(actual - expected) < tolerance) {
        return { passed: true };
    }
    return {
        passed: false,
        message: "Number mismatch\n   Expected: " + expected + "\n   Actual:   " + actual
    };
};

MethodTest.prototype._compareApproximate = function(actual, expected) {
    // For approximate values, allow 10% tolerance
    var tolerance = Math.abs(expected * 0.1);
    if (Math.abs(actual - expected) <= tolerance) {
        return { passed: true };
    }
    return {
        passed: false,
        message: "Approximate value mismatch (tolerance: ±" + tolerance.toFixed(2) + ")\n   Expected: ~" + expected + "\n   Actual:   " + actual
    };
};

MethodTest.prototype._compareString = function(actual, expected) {
    if (actual === expected) {
        return { passed: true };
    }
    return {
        passed: false,
        message: "String mismatch\n   Expected: \"" + expected + "\"\n   Actual:   \"" + actual + "\""
    };
};

MethodTest.prototype._compareBoolean = function(actual, expected) {
    if (actual === expected) {
        return { passed: true };
    }
    return {
        passed: false,
        message: "Boolean mismatch\n   Expected: " + expected + "\n   Actual:   " + actual
    };
};

MethodTest.prototype._compareNull = function(actual, expected) {
    if (actual === null) {
        return { passed: true };
    }
    
    // Convert Point objects to string representation
    var actualStr = actual;
    if (actual && typeof actual === 'object' && typeof actual.toString === 'function') {
        actualStr = actual.toString();
    } else {
        try {
            actualStr = JSON.stringify(actual);
        } catch (e) {
            actualStr = String(actual);
        }
    }
    
    return {
        passed: false,
        message: "Expected null\n   Actual:   " + actualStr
    };
};

MethodTest.prototype._compareContains = function(actual, expectedContains) {
    if (typeof actual !== 'string') {
        return {
            passed: false,
            message: "Expected string for Contains check\n   Actual type: " + typeof actual
        };
    }
    
    // Check that all expectedContains are present
    var missing = [];
    if (expectedContains) {
        for (var i = 0; i < expectedContains.length; i++) {
            var searchStr = expectedContains[i];
            if (actual.indexOf(searchStr) === -1) {
                missing.push(searchStr);
            }
        }
    }
    
    // Check that all expectedNotContains are absent
    var shouldNotContain = [];
    if (this.expectedNotContains) {
        for (var i = 0; i < this.expectedNotContains.length; i++) {
            var searchStr = this.expectedNotContains[i];
            if (actual.indexOf(searchStr) !== -1) {
                shouldNotContain.push(searchStr);
            }
        }
    }
    
    if (missing.length === 0 && shouldNotContain.length === 0) {
        return { passed: true };
    }
    
    var message = "";
    if (missing.length > 0) {
        message += "String does not contain expected substrings:\n   Missing: " + JSON.stringify(missing);
    }
    if (shouldNotContain.length > 0) {
        if (message) message += "\n";
        message += "String contains forbidden substrings:\n   Found: " + JSON.stringify(shouldNotContain);
    }
    message += "\n   Actual: " + JSON.stringify(actual);
    
    return {
        passed: false,
        message: message
    };
};

MethodTest.prototype._compareObject = function(actual, expected) {
    var result = this._compareObjectRecursive(actual, expected, '', actual);
    if (result.passed) {
        return { passed: true };
    }
    return {
        passed: false,
        message: "Object mismatch\n" + result.errors.join('\n')
    };
};

MethodTest.prototype._compareObjectRecursive = function(actual, expected, path, root) {
    var errors = [];
    if (!root) root = actual;
    
    // Special handling: if expected has "Count" and actual is an array, compare array.length
    if (expected.Count !== undefined && Array.isArray(actual)) {
        if (actual.length !== expected.Count) {
            errors.push("   Count: expected " + expected.Count + ", got " + actual.length);
        }
        // Don't check other properties if Count is the only one
        if (Object.keys(expected).length === 1) {
            return {
                passed: errors.length === 0,
                errors: errors
            };
        }
    }
    
    for (var key in expected) {
        if (!expected.hasOwnProperty(key)) continue;
        
        // Skip Count if we already handled it above
        if (key === 'Count' && Array.isArray(actual)) continue;
        
        var expectedVal = expected[key];
        var actualVal = this._getNestedProperty(actual, key);
        var currentPath = path ? path + '.' + key : key;
        
        // Handle approximate values
        if (typeof expectedVal === 'object' && expectedVal !== null && expectedVal.approx !== undefined) {
            var tolerance = Math.abs(expectedVal.approx * 0.1);
            if (actualVal === undefined || actualVal === null) {
                errors.push("   " + currentPath + ": missing (expected ~" + expectedVal.approx + ")");
            } else if (Math.abs(actualVal - expectedVal.approx) > tolerance) {
                errors.push("   " + currentPath + ": expected ~" + expectedVal.approx + ", got " + actualVal);
            }
        }
        // Handle nested objects
        else if (typeof expectedVal === 'object' && expectedVal !== null) {
            if (actualVal === undefined || actualVal === null) {
                errors.push("   " + currentPath + ": missing");
            } else {
                var nestedResult = this._compareObjectRecursive(actualVal, expectedVal, currentPath, root);
                if (!nestedResult.passed) {
                    errors = errors.concat(nestedResult.errors);
                }
            }
        }
        // Direct comparison
        else {
            // Special case: refsys comparison
            // If expected is a string and actual is a refsys object, compare with canonicalName
            if (currentPath === 'refsys' && typeof expectedVal === 'string' && 
                actualVal && typeof actualVal === 'object' && actualVal.canonicalName) {
                actualVal = actualVal.canonicalName;
            }
            // Special case: refsys.name should use canonicalName
            else if (currentPath === 'refsys.name' && actualVal && typeof actualVal === 'string') {
                // Get the refsys object from root
                var refsys = this._getNestedProperty(root, 'refsys');
                if (refsys && refsys.canonicalName) {
                    actualVal = refsys.canonicalName;
                }
            }
            
            // Special case: range comparison "min < max" or "< max"
            var isRangeComparison = false;
            if (typeof expectedVal === 'string' && expectedVal.indexOf('<') !== -1) {
                // Handle "< max" format
                if (expectedVal.trim().startsWith('<')) {
                    var maxStr = expectedVal.trim().substring(1).trim();
                    var max = parseFloat(maxStr);
                    if (!isNaN(max) && typeof actualVal === 'number') {
                        isRangeComparison = true;
                        if (actualVal >= max) {
                            errors.push("   " + currentPath + ": expected " + expectedVal + ", got " + actualVal);
                        }
                    }
                }
                // Handle "min < max" format
                else if (expectedVal.indexOf(' < ') !== -1) {
                    var parts = expectedVal.split(' < ');
                    if (parts.length === 2) {
                        var min = parseFloat(parts[0]);
                        var max = parseFloat(parts[1]);
                        if (!isNaN(min) && !isNaN(max) && typeof actualVal === 'number') {
                            isRangeComparison = true;
                            if (actualVal < min || actualVal > max) {
                                errors.push("   " + currentPath + ": expected " + expectedVal + ", got " + actualVal);
                            }
                        }
                    }
                }
            }
            
            if (!isRangeComparison) {
                if (actualVal === undefined) {
                    errors.push("   " + currentPath + ": missing (expected " + JSON.stringify(expectedVal) + ")");
                } else if (actualVal !== expectedVal) {
                    errors.push("   " + currentPath + ": expected " + JSON.stringify(expectedVal) + ", got " + JSON.stringify(actualVal));
                }
            }
        }
    }
    
    return {
        passed: errors.length === 0,
        errors: errors
    };
};

MethodTest.prototype._compareDefault = function(actual, expected) {
    if (actual === expected) {
        return { passed: true };
    }
    return {
        passed: false,
        message: "Value mismatch\n   Expected: " + JSON.stringify(expected) + "\n   Actual:   " + JSON.stringify(actual)
    };
};

MethodTest.prototype._getNestedProperty = function(obj, path) {
    var parts = path.split('.');
    var current = obj;
    
    // Special case: CRS is an alias for refsys.canonicalName
    if (path === 'CRS' && obj.refsys && obj.refsys.canonicalName) {
        return obj.refsys.canonicalName;
    }
    
    // Special case: refsys.name should use canonicalName
    if (path === 'refsys.name' && obj.refsys && obj.refsys.canonicalName) {
        return obj.refsys.canonicalName;
    }
    
    for (var i = 0; i < parts.length; i++) {
        if (current === null || current === undefined) return undefined;
        current = current[parts[i]];
    }
    
    return current;
};

// ——————————— TestSuite ——————————— //
function TestSuite(name) {
    this.name = name;
    this.tests = [];
}

TestSuite.prototype.addTest = function(test) {
    this.tests.push(test);
    return this;
};

TestSuite.prototype.addMethodTest = function(id, name, method, input, expected, expectedType, implementsTestIds, expectedContains, expectedNotContains) {
    this.tests.push(new MethodTest(id, name, method, input, expected, expectedType, implementsTestIds, expectedContains, expectedNotContains));
    return this;
};

TestSuite.prototype.run = function() {
    var results = [];
    
    for (var i = 0; i < this.tests.length; i++) {
        results.push(this.tests[i].run());
    }
    
    return new TestSuiteResult(this, results);
};

// ——————————— TestSuiteResult ——————————— //
function TestSuiteResult(suite, results) {
    this.suite = suite;
    this.results = results;
    this.passed = 0;
    this.failed = 0;
    this.total = results.length;
    
    for (var i = 0; i < results.length; i++) {
        if (results[i].passed) {
            this.passed++;
        } else {
            this.failed++;
        }
    }
}

TestSuiteResult.prototype.toString = function() {
    var lines = [];
    lines.push("═══════════════════════════════════════════════════");
    lines.push("Test Suite: " + this.suite.name);
    lines.push("═══════════════════════════════════════════════════");
    lines.push("");
    
    for (var i = 0; i < this.results.length; i++) {
        lines.push(this.results[i].toString());
    }
    
    lines.push("");
    lines.push("───────────────────────────────────────────────────");
    lines.push("Results: " + this.passed + " passed, " + this.failed + " failed, " + 
               this.total + " total");
    
    if (this.failed === 0) {
        lines.push("✅ ALL TESTS PASSED");
    } else {
        lines.push("❌ " + this.failed + " TEST(S) FAILED");
    }
    lines.push("═══════════════════════════════════════════════════");
    
    return lines.join('\n');
};

TestSuiteResult.prototype.toHTML = function() {
    var html = '<div class="test-suite-result">';
    html += '<h2>' + this.suite.name + '</h2>';
    html += '<div class="summary">';
    html += '<span class="passed">' + this.passed + ' passed</span> ';
    html += '<span class="failed">' + this.failed + ' failed</span> ';
    html += '<span class="total">' + this.total + ' total</span>';
    html += '</div>';
    
    html += '<div class="test-results">';
    for (var i = 0; i < this.results.length; i++) {
        var r = this.results[i];
        var cssClass = r.passed ? 'test-pass' : 'test-fail';
        html += '<div class="test-result ' + cssClass + '">';
        html += '<div class="test-header">';
        html += '<span class="test-status">' + (r.passed ? '✅' : '❌') + '</span>';
        html += '<span class="test-id">[' + r.test.id + ']</span>';
        html += '<span class="test-name">' + r.test.name + '</span>';
        if (r.test.implementsTestIds) {
            html += '<span class="test-implements" title="Implements: ' + this._escapeHtml(r.test.implementsTestIds) + '">🔗</span>';
        }
        html += '<button class="copy-btn" onclick="copyTest(\'' + r.test.id + '\', ' + r.passed + ', \'' + 
                this._escapeForJs(r.test.name) + '\', \'' + this._escapeForJs(r.message || '') + '\', \'' + 
                this._escapeForJs(r.test.input || '') + '\')">📋</button>';
        html += '</div>';
        
        if (r.test.implementsTestIds) {
            html += '<div class="test-implements-info">Implements: ' + this._escapeHtml(r.test.implementsTestIds) + '</div>';
        }
        
        if (!r.passed) {
            // Show input for failed tests
            if (r.test.input) {
                html += '<div class="test-input"><strong>Input:</strong> ' + this._escapeHtml(r.test.input) + '</div>';
            }
            html += '<div class="test-message">' + this._escapeHtml(r.message) + '</div>';
        }
        
        html += '</div>';
    }
    html += '</div>';
    html += '</div>';
    
    return html;
};

TestSuiteResult.prototype._escapeHtml = function(text) {
    return text.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;')
               .replace(/\n/g, '<br>');
};

TestSuiteResult.prototype._escapeForJs = function(text) {
    return text.replace(/\\/g, '\\\\')
               .replace(/'/g, "\\'")
               .replace(/"/g, '\\"')
               .replace(/\n/g, '\\n');
};

// ——————————— TestRunner ——————————— //
function TestRunner() {
    this.suites = [];
}

TestRunner.prototype.addSuite = function(suite) {
    this.suites.push(suite);
    return this;
};

TestRunner.prototype.run = function() {
    var results = [];
    
    for (var i = 0; i < this.suites.length; i++) {
        results.push(this.suites[i].run());
    }
    
    return new TestRunnerResult(results);
};

// ——————————— TestRunnerResult ——————————— //
function TestRunnerResult(suiteResults) {
    this.suiteResults = suiteResults;
    this.totalPassed = 0;
    this.totalFailed = 0;
    this.totalTests = 0;
    
    for (var i = 0; i < suiteResults.length; i++) {
        this.totalPassed += suiteResults[i].passed;
        this.totalFailed += suiteResults[i].failed;
        this.totalTests += suiteResults[i].total;
    }
}

TestRunnerResult.prototype.toString = function() {
    var lines = [];
    
    for (var i = 0; i < this.suiteResults.length; i++) {
        lines.push(this.suiteResults[i].toString());
        lines.push("");
    }
    
    lines.push("╔═══════════════════════════════════════════════════╗");
    lines.push("║              OVERALL TEST RESULTS                 ║");
    lines.push("╠═══════════════════════════════════════════════════╣");
    lines.push("║ Total Tests:  " + this._pad(this.totalTests, 4) + "                                  ║");
    lines.push("║ Passed:       " + this._pad(this.totalPassed, 4) + "                                  ║");
    lines.push("║ Failed:       " + this._pad(this.totalFailed, 4) + "                                  ║");
    lines.push("╚═══════════════════════════════════════════════════╝");
    
    if (this.totalFailed === 0) {
        lines.push("");
        lines.push("🎉 ALL TESTS PASSED! 🎉");
    }
    
    return lines.join('\n');
};

TestRunnerResult.prototype._pad = function(num, width) {
    var str = num.toString();
    while (str.length < width) str = ' ' + str;
    return str;
};

TestRunnerResult.prototype.toHTML = function() {
    var html = '<div class="test-runner-result">';
    
    for (var i = 0; i < this.suiteResults.length; i++) {
        html += this.suiteResults[i].toHTML();
    }
    
    html += '<div class="overall-summary">';
    html += '<h2>Overall Results</h2>';
    html += '<div class="stats">';
    html += '<div class="stat"><span class="label">Total:</span> <span class="value">' + 
            this.totalTests + '</span></div>';
    html += '<div class="stat"><span class="label">Passed:</span> <span class="value passed">' + 
            this.totalPassed + '</span></div>';
    html += '<div class="stat"><span class="label">Failed:</span> <span class="value failed">' + 
            this.totalFailed + '</span></div>';
    html += '</div>';
    
    if (this.totalFailed === 0) {
        html += '<div class="success-message">🎉 ALL TESTS PASSED! 🎉</div>';
    }
    
    html += '</div>';
    html += '</div>';
    
    return html;
};

// Export
global.TestFramework = {
    MethodTest: MethodTest,
    TestSuite: TestSuite,
    TestRunner: TestRunner,
    TestResult: TestResult,
    TestSuiteResult: TestSuiteResult,
    TestRunnerResult: TestRunnerResult
};

})(typeof window !== 'undefined' ? window : global);
