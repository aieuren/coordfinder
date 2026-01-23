# Test Framework Specification

Version: 1.0  
Date: 2026-01-23

This document provides a complete specification for implementing a test framework compatible with CoordFinder's test format. The specification is detailed enough for independent implementation.

## Table of Contents

1. [Overview](#overview)
2. [Test File Format](#test-file-format)
3. [Test Execution](#test-execution)
4. [Test Framework API](#test-framework-api)
5. [Test Parser Specification](#test-parser-specification)
6. [Value Comparison Rules](#value-comparison-rules)
7. [Examples](#examples)

---

## Overview

### Purpose

The test framework parses Markdown-formatted test files and executes tests against a coordinate parsing library (CoordFinder). It supports:

- Point tests (single coordinate)
- Points tests (multiple coordinates)
- CoordFinder instance method tests
- Static method tests

### Architecture

```
Test File (Markdown)
        ↓
   Test Parser
        ↓
   Test Suites
        ↓
   Test Runner
        ↓
   Test Results
```

### Components

1. **Test Parser** - Parses Markdown test files into structured test objects
2. **Test Framework** - Executes tests and compares results
3. **Test Suite** - Container for related tests
4. **Test Result** - Outcome of a single test execution

---

## Test File Format

### File Structure

Test files are Markdown documents with the following structure:

```markdown
# Test Suite Name

## Test Type: Test Name
Test-ID: unique-id
Method: methodName()
Input: input text
Expected: expected value
```

### Test Suite Header

```markdown
# Suite Name
```

- **Format**: Single `#` followed by suite name
- **Purpose**: Groups related tests
- **Example**: `# Point.latitude()`

### Test Header

```markdown
## Test Type: Test Name
```

- **Format**: Double `##` followed by test type, colon, and test name
- **Test Types**:
  - `Point Test:` - Tests a single coordinate point
  - `Points Test:` - Tests multiple coordinate points
  - `CoordFinder Test:` - Tests CoordFinder instance methods
- **Example**: `## Point Test: Basic decimal degrees`

### Test Properties

#### Test-ID (Required)

```markdown
Test-ID: tdd-001
```

- **Format**: `Test-ID:` followed by unique identifier
- **Rules**:
  - Must be unique across all tests
  - Typically follows pattern: `tdd-category-number`
  - Used for test identification and reporting

#### Method (Required for method tests)

```markdown
Method: latitude()
```

- **Format**: `Method:` followed by method name with parentheses
- **Supports**:
  - Simple methods: `latitude()`
  - Methods with arguments: `points({rating: 0.8})`
  - Named arguments with `:` or `=`: `context(maxchars: 10)` or `context(maxchars=10)`
- **Argument parsing**:
  - Numeric: `0.8`, `10`
  - Boolean: `true`, `false`
  - String: `"value"` or `'value'`
  - Object: `{key: value}`

#### Input (Required)

```markdown
Input: 59.32894 18.06491
```

- **Format**: `Input:` followed by text to parse
- **Multi-line support**: Continue on next lines until next property
- **Whitespace**: Preserved exactly as written

#### Expected (Required)

```markdown
Expected: 59.32894
```

- **Format**: `Expected:` followed by expected value
- **Types**:
  - **Number**: `59.32894`
  - **Approximate**: `~59.329` (tolerance ±0.01)
  - **String**: `"text"` or `'text'`
  - **Boolean**: `true` or `false`
  - **Null**: `null`
  - **Object**: Properties on following lines with `- property: value`
  - **Array**: `Inratingorder:` with list items

#### Expected Object Properties

```markdown
Expected:
- property: value
- nested.property: value
- Count: 3
- Contains: "substring"
- Contains not: "excluded"
```

**Special Properties**:

- **Count**: Expected number of items (for arrays)
- **Contains**: String must contain this substring
- **Contains not**: String must NOT contain this substring
- **Bounds**: Coordinate bounds `minLat minLon maxLat maxLon`
- **Inratingorder**: Array of values in rating order (order-independent for same rating)

**Nested Properties**:
- Use dot notation: `N.value`, `refsys.name`

#### Implements (Optional)

```markdown
Implements: tdd-001, tdd-002
```

- **Format**: `Implements:` followed by comma-separated test IDs
- **Purpose**: Indicates this test implements/replaces other tests

---

## Test Execution

### Execution Flow

1. **Parse test file** → Create test suites and tests
2. **For each test**:
   - Parse input text
   - Execute method
   - Compare actual vs expected
   - Generate test result
3. **Report results** → Summary and details

### Test Types and Execution

#### Point Test

Tests a method on a single Point object.

**Execution**:
1. Parse input: `CF.pointIn(input)`
2. If no point found → FAIL
3. Execute method on point: `point.methodName(args)`
4. Compare result with expected

**Example**:
```markdown
## Point Test: Get latitude
Test-ID: tdd-lat-001
Method: latitude()
Input: 59.32894 18.06491
Expected: 59.32894
```

#### Points Test

Tests a method that returns multiple points or tests CF.pointsIn().

**Execution**:
1. Parse input: `CF.pointsIn(input)`
2. Execute method (if specified)
3. Compare results

**Example**:
```markdown
## Points Test: Find all coordinates
Test-ID: tdd-points-001
Method: pointsIn()
Input: First: 59.32 18.06, Second: 58.41 12.56
Expected:
- Count: 2
```

#### CoordFinder Test

Tests methods on a CoordFinder instance.

**Execution**:
1. Create instance: `cf = new CF()`
2. Parse input: `cf.parse(input)`
3. Execute method: `cf.methodName(args)`
4. Compare result

**Example**:
```markdown
## CoordFinder Test: Filter by rating
Test-ID: tdd-cf-001
Method: points({rating: 0.8})
Input: 59.3 18.1 and 59.32894 18.06491
Expected:
- Count: 1
```

### Method Argument Parsing

Arguments in method calls are parsed as follows:

**Syntax**: `methodName(arg1, arg2, key: value, key=value)`

**Supported formats**:
- Positional: `method(arg1, arg2)`
- Named with colon: `method(key: value)`
- Named with equals: `method(key=value)`
- Mixed: `method(arg1, key: value)`

**Argument types**:
- **Number**: `10`, `0.5`, `-5`
- **Boolean**: `true`, `false`
- **String**: `"text"`, `'text'`
- **Object**: `{key: value, key2: value2}`

**Parsing rules**:
1. Split by comma (respecting nesting)
2. For each argument:
   - If contains `:` or `=` → named argument
   - Otherwise → positional argument
3. Parse value based on type

---

## Test Framework API

### Core Classes

#### TestSuite

Container for related tests.

```javascript
function TestSuite(name) {
    this.name = name;
    this.tests = [];
}

TestSuite.prototype.addTest = function(test) {
    this.tests.push(test);
};

TestSuite.prototype.run = function() {
    var results = [];
    for (var i = 0; i < this.tests.length; i++) {
        results.push(this.tests[i].run());
    }
    return results;
};
```

#### MethodTest

Represents a single test case.

```javascript
function MethodTest(id, name, method, input, expected, expectedType, 
                    implementsTestIds, expectedContains, expectedNotContains) {
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
    // Execute test and return TestResult
};
```

#### TestResult

Outcome of test execution.

```javascript
function TestResult(test, passed, message, actual, expected) {
    this.test = test;
    this.passed = passed;
    this.message = message || "";
    this.actual = actual;
    this.expected = expected;
    this.timestamp = new Date();
}
```

### Test Execution Methods

#### _executeMethod(point)

Executes the test method on the target object.

**Parameters**:
- `point` - Point object (null for static methods)

**Returns**: Method result

**Logic**:
1. Parse method name and arguments
2. Determine target (CF, cf instance, or point)
3. Execute method with parsed arguments
4. Return result

#### _compare(actual, expected, type)

Compares actual result with expected value.

**Parameters**:
- `actual` - Actual result from method
- `expected` - Expected value from test
- `type` - Expected type ('number', 'string', 'object', etc.)

**Returns**: `{passed: boolean, message: string}`

**Comparison types**:
- `number` - Exact match
- `approximate` - Within tolerance (±0.01)
- `string` - Exact match
- `boolean` - Exact match
- `null` - Is null
- `object` - Recursive property comparison
- `contains` - String contains substrings
- `inratingorder` - Array contains all values (order-independent for same rating)

---

## Test Parser Specification

### Parser Class

```javascript
function MarkdownTestParser() {
    this.suites = [];
}

MarkdownTestParser.prototype.parse = function(markdownText) {
    // Parse markdown and return array of TestSuite objects
};

MarkdownTestParser.prototype.parseFile = function(filePath) {
    // Read file and call parse()
};
```

### Parsing Algorithm

**State machine with states**:
- `none` - Outside any test
- `test` - Inside test header, collecting properties
- `input` - Collecting input text
- `expected` - Collecting expected value

**Line-by-line processing**:

1. **Test Suite Header** (`# Title`)
   - Create new TestSuite
   - Finalize previous test if exists
   - Reset state to `none`

2. **Test Header** (`## Type: Name`)
   - Finalize previous test if exists
   - Create new test object
   - Set state to `test`

3. **Test-ID** (`Test-ID: id`)
   - Store in current test
   - Remain in `test` state

4. **Method** (`Method: method()`)
   - Parse method name and arguments
   - Store in current test
   - Remain in `test` state

5. **Input** (`Input: text`)
   - Start collecting input
   - Set state to `input`
   - Continue collecting until next property

6. **Expected** (`Expected: value` or `Expected:`)
   - Parse expected value
   - Set state to `expected`
   - If value on same line → simple value
   - If no value → collect properties on following lines

7. **Expected Properties** (`- property: value`)
   - Only in `expected` state
   - Parse property name and value
   - Handle special properties (Count, Contains, Bounds, Inratingorder)
   - Handle nested properties (dot notation)

8. **Indented List Items** (`  - value`)
   - Only after `Inratingorder:` property
   - Add to inratingorder array

### Value Parsing

#### _parseValue(str)

Parses a string value into appropriate type.

**Rules**:
1. **Approximate**: `~123.45` → `{type: 'approximate', value: 123.45}`
2. **Quoted string**: `"text"` or `'text'` → Remove quotes
   - Supports Unicode quotes: `"text"` (U+201C + U+0022)
3. **Boolean**: `true` or `false` → Boolean
4. **Null**: `null` → null
5. **Number**: Numeric string → parseFloat()
6. **Default**: Return as string

**Quote handling**:
- ASCII: `"..."` or `'...'`
- Unicode left + ASCII right: `"..."` (U+201C + U+0022)
- Unicode left + ASCII right: `'...'` (U+2018 + U+0027)
- Both Unicode: `"..."` (U+201C + U+201D)

### Method Argument Parsing

#### _parseMethodArgs(argsStr)

Parses method arguments from string.

**Input**: `"arg1, key: value, key2=value2"`

**Output**: 
```javascript
{
    positional: [arg1],
    named: {key: value, key2: value2}
}
```

**Algorithm**:
1. Split by comma (respecting nesting depth)
2. For each part:
   - Trim whitespace
   - Check for `:` or `=` (named argument)
   - Parse value using _parseValue()
3. Return object with positional and named arrays

**Nesting handling**:
- Track depth with `()`, `[]`, `{}`
- Only split on commas at depth 0

---

## Value Comparison Rules

### Number Comparison

**Exact match**:
```javascript
actual === expected
```

**Tolerance**: None (use approximate for tolerance)

### Approximate Comparison

**Format**: `~123.45`

**Tolerance**: ±0.01

**Logic**:
```javascript
Math.abs(actual - expected) <= 0.01
```

### String Comparison

**Exact match** (case-sensitive):
```javascript
actual === expected
```

**Whitespace**: Significant

### Boolean Comparison

**Exact match**:
```javascript
actual === expected
```

### Null Comparison

**Check**:
```javascript
actual === null
```

### Object Comparison

**Recursive property comparison**:

1. For each expected property:
   - Get actual value at same path
   - Compare recursively
   - If mismatch → FAIL with path

2. **Nested properties**:
   - Use dot notation: `N.value`
   - Traverse object tree

3. **Special handling**:
   - `Count` property → compare array length
   - `Bounds` property → check coordinate bounds

**Example**:
```javascript
Expected:
- N.value: 6580000
- E.value: 674000
- refsys.name: "SWEREF99TM"
```

### Array Comparison (Inratingorder)

**Purpose**: Compare arrays where order matters only for different ratings.

**Logic**:
1. Check length match
2. Convert both to sets
3. Check all expected values present in actual
4. Check no unexpected values in actual

**Example**:
```markdown
Expected:
- Inratingorder:
  - "value1"
  - "value2"
  - "value3"
```

### Contains Comparison

**String contains substring**:

```markdown
Expected:
- Contains: "substring1"
- Contains: "substring2"
- Contains not: "excluded"
```

**Logic**:
1. Check each `Contains` substring is present
2. Check each `Contains not` substring is absent
3. All must pass

---

## Examples

### Example 1: Simple Point Test

```markdown
# Point.latitude()

## Point Test: Basic decimal degrees
Test-ID: tdd-lat-001
Method: latitude()
Input: 59.32894 18.06491
Expected: 59.32894
```

**Execution**:
1. Parse: `CF.pointIn("59.32894 18.06491")`
2. Execute: `point.latitude()`
3. Compare: `59.32894 === 59.32894` → PASS

### Example 2: Approximate Value

```markdown
## Point Test: Approximate latitude
Test-ID: tdd-lat-002
Method: latitude()
Input: 59.329 18.065
Expected: ~59.329
```

**Execution**:
1. Parse: `CF.pointIn("59.329 18.065")`
2. Execute: `point.latitude()`
3. Compare: `|59.329 - 59.329| <= 0.01` → PASS

### Example 3: Object Properties

```markdown
## Point Test: Coordinate object
Test-ID: tdd-coord-001
Method: N
Input: 59.32894 18.06491
Expected:
- value: 59.32894
- axis.name: "Latitude"
```

**Execution**:
1. Parse: `CF.pointIn("59.32894 18.06491")`
2. Execute: `point.N`
3. Compare:
   - `point.N.value === 59.32894` → PASS
   - `point.N.axis.name === "Latitude"` → PASS

### Example 4: Method with Arguments

```markdown
## Point Test: Context with options
Test-ID: tdd-ctx-001
Method: context(maxchars=10, ellipse=true)
Input: The ship was at 59.32894 18.06491 yesterday
Expected:
- Contains: "ship"
- Contains: "59.32894"
```

**Execution**:
1. Parse: `CF.pointIn("The ship was at 59.32894 18.06491 yesterday")`
2. Execute: `point.context({maxchars: 10, ellipse: true})`
3. Compare:
   - Result contains "ship" → PASS
   - Result contains "59.32894" → PASS

### Example 5: Multiple Points

```markdown
## Points Test: Find all coordinates
Test-ID: tdd-points-001
Method: pointsIn()
Input: First: 59.32 18.06, Second: 58.41 12.56
Expected:
- Count: 2
```

**Execution**:
1. Parse: `CF.pointsIn("First: 59.32 18.06, Second: 58.41 12.56")`
2. Compare: `points.length === 2` → PASS

### Example 6: Rating Order

```markdown
## CoordFinder Test: Points in rating order
Test-ID: tdd-rating-001
Method: points(rating=0.5)
Input: 59.3 18.1 and 59.32894 18.06491
Expected:
- Inratingorder:
  - "59.32894 18.06491"
  - "59.3 18.1"
```

**Execution**:
1. Create: `cf = new CF()`
2. Parse: `cf.parse("59.3 18.1 and 59.32894 18.06491")`
3. Execute: `cf.points({rating: 0.5})`
4. Compare:
   - Extract originalText() from each point
   - Check both values present (order-independent for same rating)

---

## Implementation Checklist

### Parser Implementation

- [ ] Parse test suite headers (`#`)
- [ ] Parse test headers (`##`)
- [ ] Parse Test-ID
- [ ] Parse Method with arguments
- [ ] Parse Input (single and multi-line)
- [ ] Parse Expected (simple values)
- [ ] Parse Expected properties (`- property: value`)
- [ ] Parse nested properties (`- nested.prop: value`)
- [ ] Parse special properties (Count, Contains, Bounds, Inratingorder)
- [ ] Parse indented list items (`  - value`)
- [ ] Handle Unicode quotes
- [ ] Parse method arguments (positional and named)
- [ ] Handle `:` and `=` for named arguments

### Test Framework Implementation

- [ ] TestSuite class
- [ ] MethodTest class
- [ ] TestResult class
- [ ] Execute Point tests
- [ ] Execute Points tests
- [ ] Execute CoordFinder tests
- [ ] Execute static methods (pointIn, pointsIn)
- [ ] Parse method arguments
- [ ] Compare numbers (exact)
- [ ] Compare approximate values (±0.01)
- [ ] Compare strings (exact)
- [ ] Compare booleans
- [ ] Compare null
- [ ] Compare objects (recursive)
- [ ] Compare arrays (inratingorder)
- [ ] Check Contains substrings
- [ ] Check Contains not substrings
- [ ] Handle Count property
- [ ] Handle Bounds property
- [ ] Convert Point arrays to appropriate format
- [ ] Generate test results
- [ ] Report test summary

### Test Runner Implementation

- [ ] Load test file
- [ ] Parse test file
- [ ] Execute all tests
- [ ] Collect results
- [ ] Display results (pass/fail)
- [ ] Display error messages
- [ ] Calculate statistics (passed/failed/total)
- [ ] Exit with appropriate code (0 = all pass, 1 = any fail)

---

## Error Handling

### Parser Errors

**Test without suite**:
- Error: "Test found without test suite at line X"
- Action: Throw error

**Missing Test-ID**:
- Error: "Test missing Test-ID"
- Action: Skip test or generate warning

**Invalid method syntax**:
- Error: "Invalid method syntax: X"
- Action: Skip test or use as-is

### Execution Errors

**No point found**:
- Result: FAIL
- Message: "No point found in input"

**Method not found**:
- Result: FAIL
- Message: "Method 'X' not found"

**Method throws error**:
- Result: FAIL
- Message: Error message from exception

**Type mismatch**:
- Result: FAIL
- Message: "Expected X, got Y"

---

## Performance Considerations

### Parser Performance

- **Line-by-line**: O(n) where n = number of lines
- **Memory**: O(m) where m = number of tests
- **Optimization**: Use string builder for multi-line input

### Execution Performance

- **Per test**: O(1) for most tests
- **Object comparison**: O(p) where p = number of properties
- **Array comparison**: O(n) where n = array length
- **Total**: O(t) where t = number of tests

### Recommended Limits

- **Max tests per file**: 1000
- **Max input length**: 10,000 characters
- **Max expected properties**: 100
- **Max nesting depth**: 10

---

## Version History

### 1.0 (2026-01-23)
- Initial specification
- Complete test format documentation
- Execution rules
- Comparison logic
- Examples

---

## References

- Test files: `requirements/tdd-testsuites.txt`
- Implementation: `src/test-framework.js`, `src/test-parser.js`
- Test runner: `scripts/run-tdd-tests.js`

---

## License

This specification is part of the CoordFinder project and is licensed under the MIT License.
