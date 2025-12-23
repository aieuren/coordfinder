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

// ——————————— PointTest ——————————— //
// Tests finding a single coordinate pair
function PointTest(id, name, input, expected) {
    this.id = id;
    this.name = name;
    this.input = input;
    this.expected = expected; // Format: "lat lon" with specific decimals
    this.type = "PointTest";
}

PointTest.prototype.run = function() {
    try {
        var point = CF.pointIn(this.input);
        
        if (!this.expected) {
            // Expected no point to be found
            if (point === null) {
                return new TestResult(this, true, "Correctly found no point");
            } else {
                var actual = this._formatPoint(point);
                return new TestResult(this, false, 
                    "Expected no point, but found: " + actual,
                    actual, null);
            }
        }
        
        if (point === null) {
            return new TestResult(this, false, 
                "Expected point but found none",
                null, this.expected);
        }
        
        var actual = this._formatPoint(point);
        var passed = this._comparePoints(actual, this.expected);
        
        if (passed) {
            return new TestResult(this, true, "Point matches expected", actual, this.expected);
        } else {
            return new TestResult(this, false, 
                "Point mismatch\n   Expected: " + this.expected + "\n   Actual:   " + actual,
                actual, this.expected);
        }
        
    } catch(e) {
        return new TestResult(this, false, "Exception: " + e.message, null, this.expected);
    }
};

PointTest.prototype._formatPoint = function(point) {
    var lat = point.latitude();
    var lon = point.longitude();
    
    // Determine decimal places from expected format
    var decimals = this._getExpectedDecimals();
    
    return lat.toFixed(decimals) + " " + lon.toFixed(decimals);
};

PointTest.prototype._getExpectedDecimals = function() {
    if (!this.expected) return 3;
    
    var parts = this.expected.split(/\s+/);
    if (parts.length < 1) return 3;
    
    var match = parts[0].match(/\.(\d+)/);
    return match ? match[1].length : 0;
};

PointTest.prototype._comparePoints = function(actual, expected) {
    // Normalize whitespace
    actual = actual.trim().replace(/\s+/g, ' ');
    expected = expected.trim().replace(/\s+/g, ' ');
    
    return actual === expected;
};

// ——————————— PointsTest ——————————— //
// Tests finding multiple coordinate pairs
function PointsTest(id, name, input, expectedCount) {
    this.id = id;
    this.name = name;
    this.input = input;
    this.expectedCount = expectedCount;
    this.type = "PointsTest";
}

PointsTest.prototype.run = function() {
    try {
        var points = CF.pointsIn(this.input);
        var actualCount = points.length;
        
        if (actualCount === this.expectedCount) {
            return new TestResult(this, true, 
                "Found " + actualCount + " point(s) as expected",
                actualCount, this.expectedCount);
        } else {
            var msg = "Expected " + this.expectedCount + " point(s), found " + actualCount;
            if (actualCount > 0) {
                msg += "\n   Found points:";
                for (var i = 0; i < points.length; i++) {
                    msg += "\n   - " + points[i].latitude().toFixed(3) + ", " + 
                           points[i].longitude().toFixed(3);
                }
            }
            return new TestResult(this, false, msg, actualCount, this.expectedCount);
        }
        
    } catch(e) {
        return new TestResult(this, false, "Exception: " + e.message, null, this.expectedCount);
    }
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

TestSuite.prototype.addPointTest = function(id, name, input, expected) {
    this.tests.push(new PointTest(id, name, input, expected));
    return this;
};

TestSuite.prototype.addPointsTest = function(id, name, input, expectedCount) {
    this.tests.push(new PointsTest(id, name, input, expectedCount));
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
        html += '<button class="copy-btn" onclick="copyTest(\'' + r.test.id + '\', ' + r.passed + ', \'' + 
                this._escapeForJs(r.test.name) + '\', \'' + this._escapeForJs(r.message || '') + '\')">📋</button>';
        html += '</div>';
        
        if (!r.passed) {
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
    PointTest: PointTest,
    PointsTest: PointsTest,
    TestSuite: TestSuite,
    TestRunner: TestRunner,
    TestResult: TestResult,
    TestSuiteResult: TestSuiteResult,
    TestRunnerResult: TestRunnerResult
};

})(typeof window !== 'undefined' ? window : global);
