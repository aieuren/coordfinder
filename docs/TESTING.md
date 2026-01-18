# Testing Guide

## Running Tests

### Command Line (Recommended)

```bash
npm test
```

This runs all 287 TDD tests from `requirements/tdd-testsuites.txt`.

### Test Results

Current status: **287/287 tests passing (100%)**

## Test Coverage

All coordinate formats are fully supported:

- ✅ WGS84 decimal degrees (DD.DDDDDD)
- ✅ Degrees-minutes (DD°MM.MMM')
- ✅ Degrees-minutes-seconds (DD°MM'SS.S")
- ✅ Compass directions (N, S, E, W, Ö, V)
- ✅ URL formats (Google Maps, Eniro)
- ✅ Data formats (GeoJSON, GML, WKT)
- ✅ SWEREF99 TM
- ✅ RT90 2.5 gon V
- ✅ Compact formats
- ✅ Prefix formats (Lat:, Long:, N:, E:, X:, Y:)

## Test Framework

Tests are defined in `requirements/tdd-testsuites.txt` using a Markdown-based format:

```markdown
## Point Test: Test Name
Test-ID: tdd-001
Method: latitude()
Input: 59.32894 18.06491
Expected: 59.32894
```

### Test Components

- **Test-ID**: Unique identifier for the test
- **Method**: The method being tested (e.g., `latitude()`, `asText()`)
- **Input**: The coordinate text to parse
- **Expected**: The expected result (can be a value, object, or list)

### Test Types

1. **Point Tests**: Test individual Point methods
2. **CoordFinder Tests**: Test CF instance methods
3. **Static Tests**: Test static methods like `CF.pointsIn()`

## Interactive Testing

Open `examples/demo.html` in a browser to:
- Test coordinate parsing interactively
- Try different input formats
- See output in various formats
- Filter by rating threshold

## Debugging

To debug a specific coordinate:

```javascript
var cf = new CF();
cf.parse("59.32894 18.06491");
var points = cf.points();

console.log(points[0].latitude());      // 59.32894
console.log(points[0].longitude());     // 18.06491
console.log(points[0].rating());        // Quality rating (0-1)
console.log(points[0].originalText());  // Original input text
```

## Test Files

- `requirements/tdd-testsuites.txt` - Main test suite (287 tests)
- `scripts/run-tdd-tests.js` - Node.js test runner
- `scripts/run-full-tdd.js` - Full test suite runner
- `src/test-framework.js` - Test framework implementation
- `src/test-parser.js` - Test file parser
