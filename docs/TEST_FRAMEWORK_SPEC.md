# Test Framework Specification

Version: 2.0  
Date: 2026-01-23

This document specifies the test file format and expected behavior for CoordFinder's test framework. It focuses on what tests should do, not how to implement them.

## Table of Contents

1. [Overview](#overview)
2. [Test File Format](#test-file-format)
3. [Test Types](#test-types)
4. [Test Execution Behavior](#test-execution-behavior)
5. [Value Comparison Rules](#value-comparison-rules)
6. [Examples](#examples)

---

## Overview

### Purpose

The test framework parses Markdown-formatted test files and executes tests against CoordFinder. Tests verify that coordinate parsing, transformation, and output formatting work correctly.

### Test Types

The framework supports three types of tests:

1. **Point Test** - Tests methods on a single Point object
2. **CoordFinder Test** - Tests methods on a CoordFinder instance  
3. **BoundingBox Test** - Tests methods on a BoundingBox object

### Test Flow

1. Parse test file (Markdown format)
2. For each test:
   - Parse input text to find coordinates
   - Execute the specified method
   - Compare actual result with expected value
   - Report pass/fail
3. Generate summary statistics

---

## Test File Format

### File Structure

Test files are Markdown documents with this structure:

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
  - `CoordFinder Test:` - Tests CoordFinder instance methods
  - `BoundingBox Test:` - Tests BoundingBox methods
- **Example**: `## Point Test: Basic decimal degrees`

### Test Properties

#### Test-ID (Required)

```markdown
Test-ID: tdd-001
```

- **Format**: `Test-ID:` followed by unique identifier
- **Must be unique** across all tests
- **Naming convention**: `tdd-category-number`

#### Method (Required)

```markdown
Method: latitude()
```

- **Format**: `Method:` followed by method name with parentheses
- **With arguments**: `Method: points({rating: 0.8})`
- **Named arguments**: Use `:` or `=`
  - `context(maxchars: 10)` 
  - `context(maxchars=10)`

#### Input (Required)

```markdown
Input: 59.32894 18.06491
```

- **Format**: `Input:` followed by text to parse
- **Multi-line**: Continue on next lines until next property
- **Whitespace**: Preserved exactly as written

#### Expected (Required)

```markdown
Expected: 59.32894
```

**Simple values**:
- **Number**: `59.32894`
- **Approximate**: `~59.329` (tolerance ±0.01)
- **String**: `"text"` (with quotes)
- **Boolean**: `true` or `false`
- **Null**: `null`

**Object properties**:
```markdown
Expected:
- property: value
- nested.property: value
```

**Special properties**:
- **Count**: Expected number of items
  ```markdown
  Expected:
  - Count: 3
  ```

- **Contains**: String must contain substring
  ```markdown
  Expected:
  - Contains: "substring"
  - Contains not: "excluded"
  ```

- **Bounds**: Coordinate bounds (minLat minLon maxLat maxLon)
  ```markdown
  Expected:
  - Bounds: 58.0 17.0 60.0 19.0
  ```

- **Inratingorder**: Array of values (order-independent for same rating)
  ```markdown
  Expected:
  - Inratingorder:
    - "value1"
    - "value2"
  ```

---

## Test Types

### Point Test

Tests a method on a single Point object.

**Format**:
```markdown
## Point Test: Test Name
Test-ID: unique-id
Method: methodName()
Input: coordinate text
Expected: expected value
```

**Behavior**:
- Parse input to find first coordinate point
- If no point found → test fails
- Execute method on the point
- Compare result with expected value

**Example**:
```markdown
## Point Test: Get latitude
Test-ID: tdd-lat-001
Method: latitude()
Input: 59.32894 18.06491
Expected: 59.32894
```

### CoordFinder Test

Tests methods on a CoordFinder instance.

**Format**:
```markdown
## CoordFinder Test: Test Name
Test-ID: unique-id
Method: methodName()
Input: text with coordinates
Expected: expected value
```

**Behavior**:
- Create CoordFinder instance
- Parse input text
- Execute method on instance
- Compare result with expected value

**Common methods**:
- `points()` - Get all points (default rating ≥ 0.5)
- `points({rating: 0.8})` - Get points with rating ≥ 0.8
- `foundRatings()` - Get list of unique ratings
- `groups()` - Get coordinate groups
- `log()` - Get parse log

**Example**:
```markdown
## CoordFinder Test: Filter by rating
Test-ID: tdd-cf-001
Method: points({rating: 0.8})
Input: 59.3 18.1 and 59.32894 18.06491
Expected:
- Count: 1
```

### BoundingBox Test

Tests methods on a BoundingBox object.

**Format**:
```markdown
## BoundingBox Test: Test Name
Test-ID: unique-id
Method: methodName()
Input: minLat minLon maxLat maxLon
Expected: expected value
```

**Behavior**:
- Create BoundingBox from input coordinates
- Execute method on bounding box
- Compare result with expected value

**Common methods**:
- `covers()` - Check if point is inside
- `coversPoint()` - Check if Point object is inside
- `asLatLngArray()` - Get as array [minLat, minLon, maxLat, maxLon]

**Example**:
```markdown
## BoundingBox Test: Check if point is inside
Test-ID: tdd-bbox-001
Method: covers()
Input: 58.0 17.0 60.0 19.0
Expected: true
```

---

## Test Execution Behavior

### Method Arguments

Methods can have arguments specified in the test.

**Argument types**:
- **Number**: `10`, `0.5`, `-5`
- **Boolean**: `true`, `false`
- **String**: `"text"` or `'text'`
- **Object**: `{key: value}`

**Named arguments** (both formats supported):
- Colon: `method(maxchars: 10)`
- Equals: `method(maxchars=10)`

**Multiple arguments**:
```markdown
Method: asText(format=degrees, symbols=true)
Method: context(maxchars: 10, ellipse: true)
```

### Execution Order

Tests execute in the order they appear in the file. Each test is independent - no state is shared between tests.

### Test Results

Each test produces one of two outcomes:

- **PASS** ✅ - Actual result matches expected value
- **FAIL** ❌ - Actual result differs from expected value

Failed tests include:
- Expected value
- Actual value
- Explanation of mismatch

---

## Value Comparison Rules

### Number Comparison

**Exact match**:
```markdown
Expected: 59.32894
```
- Actual must equal expected exactly
- No tolerance

### Approximate Comparison

**Format**: `~value`

```markdown
Expected: ~59.329
```
- **Tolerance**: ±0.01
- Actual must be within 0.01 of expected
- Used for floating-point calculations

### String Comparison

**Exact match** (case-sensitive):
```markdown
Expected: "N59.32894 E18.06491"
```
- Actual must match expected exactly
- Whitespace is significant
- Case-sensitive

**Quote handling**:
- ASCII quotes: `"text"` or `'text'`
- Unicode quotes: `"text"` (U+201C + U+0022)
- Mixed quotes supported

### Boolean Comparison

**Exact match**:
```markdown
Expected: true
```
- Actual must be exactly `true` or `false`

### Null Comparison

**Check for null**:
```markdown
Expected: null
```
- Actual must be `null`

### Object Comparison

**Property-by-property comparison**:

```markdown
Expected:
- property1: value1
- property2: value2
- nested.property: value3
```

**Rules**:
- Each expected property must exist in actual
- Each property value must match (recursively)
- Nested properties use dot notation
- Extra properties in actual are ignored

**Example**:
```markdown
Expected:
- N.value: 59.32894
- E.value: 18.06491
- refsys.name: "WGS84"
```

### Array Comparison (Inratingorder)

**Order-independent for same rating**:

```markdown
Expected:
- Inratingorder:
  - "value1"
  - "value2"
  - "value3"
```

**Rules**:
- All expected values must be present in actual
- No unexpected values in actual
- Order doesn't matter for items with same rating
- Used for testing rating-sorted results

### Contains Comparison

**Substring matching**:

```markdown
Expected:
- Contains: "substring1"
- Contains: "substring2"
- Contains not: "excluded"
```

**Rules**:
- Each `Contains` substring must be present
- Each `Contains not` substring must be absent
- All conditions must pass

### Count Comparison

**Array length**:

```markdown
Expected:
- Count: 3
```

**Rules**:
- Actual must be an array
- Array length must equal expected count

### Bounds Comparison

**Coordinate bounds check**:

```markdown
Expected:
- Bounds: 58.0 17.0 60.0 19.0
```

**Rules**:
- Format: `minLat minLon maxLat maxLon`
- All points must be within bounds
- Detects meters vs degrees automatically
  - Values > 1000 → meters (SWEREF/RT90)
  - Values < 360 → degrees (WGS84)

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

**What happens**:
1. Parse input → finds point at 59.32894, 18.06491
2. Execute `point.latitude()`
3. Compare: `59.32894 === 59.32894` → PASS

### Example 2: Approximate Value

```markdown
## Point Test: Approximate latitude
Test-ID: tdd-lat-002
Method: latitude()
Input: 59.329 18.065
Expected: ~59.329
```

**What happens**:
1. Parse input → finds point
2. Execute `point.latitude()`
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

**What happens**:
1. Parse input → finds point
2. Execute `point.N` (returns coordinate object)
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

**What happens**:
1. Parse input → finds point
2. Execute `point.context({maxchars: 10, ellipse: true})`
3. Compare:
   - Result contains "ship" → PASS
   - Result contains "59.32894" → PASS

### Example 5: Multiple Points

```markdown
## CoordFinder Test: Find all coordinates
Test-ID: tdd-points-001
Method: points()
Input: First: 59.32 18.06, Second: 58.41 12.56
Expected:
- Count: 2
```

**What happens**:
1. Create CoordFinder instance
2. Parse input → finds 2 points
3. Execute `cf.points()`
4. Compare: `points.length === 2` → PASS

### Example 6: Rating Filter

```markdown
## CoordFinder Test: High quality only
Test-ID: tdd-rating-001
Method: points({rating: 0.8})
Input: 59.3 18.1 and 59.32894 18.06491
Expected:
- Count: 1
```

**What happens**:
1. Create CoordFinder instance
2. Parse input → finds 2 points (one low precision, one high)
3. Execute `cf.points({rating: 0.8})`
4. Compare: Only high-precision point returned → PASS

### Example 7: BoundingBox Test

```markdown
## BoundingBox Test: Point inside box
Test-ID: tdd-bbox-001
Method: covers()
Input: 58.0 17.0 60.0 19.0
Expected: true
```

**What happens**:
1. Create BoundingBox(58.0, 17.0, 60.0, 19.0)
2. Execute `bbox.covers()` (checks if test point is inside)
3. Compare: `true === true` → PASS

---

## Test File Example

Complete example showing multiple test types:

```markdown
# Point.latitude()

## Point Test: Decimal degrees
Test-ID: tdd-lat-001
Method: latitude()
Input: 59.32894 18.06491
Expected: 59.32894

## Point Test: Degrees-minutes
Test-ID: tdd-lat-002
Method: latitude()
Input: 59°19.736' 18°3.895'
Expected: ~59.329

# CoordFinder.points()

## CoordFinder Test: Filter by rating
Test-ID: tdd-cf-001
Method: points({rating: 0.8})
Input: 59.3 18.1 and 59.32894 18.06491
Expected:
- Count: 1

## CoordFinder Test: All points
Test-ID: tdd-cf-002
Method: points()
Input: 59.3 18.1 and 59.32894 18.06491
Expected:
- Count: 2

# BoundingBox.covers()

## BoundingBox Test: Point inside
Test-ID: tdd-bbox-001
Method: covers()
Input: 58.0 17.0 60.0 19.0
Expected: true
```

---

## Summary

### Key Points

1. **Three test types**: Point, CoordFinder, BoundingBox
2. **Markdown format**: Human-readable, easy to write
3. **Flexible comparisons**: Numbers, strings, objects, arrays
4. **Method arguments**: Named or positional
5. **Special properties**: Count, Contains, Bounds, Inratingorder

### Test File Location

- Main test suite: `requirements/tdd-testsuites.txt`
- 287 tests covering all coordinate formats and methods

### Running Tests

```bash
npm test
```

Runs all tests and reports pass/fail statistics.

---

## Version History

### 2.0 (2026-01-23)
- Simplified specification - removed implementation details
- Added BoundingBox test type
- Focused on format and behavior
- Removed parser implementation details
- Removed performance considerations

### 1.0 (2026-01-23)
- Initial specification with implementation details

---

## References

- Test files: `requirements/tdd-testsuites.txt`
- Test runner: `scripts/run-tdd-tests.js`
- API documentation: `docs/API.md`

---

## License

This specification is part of the CoordFinder project and is licensed under the MIT License.
