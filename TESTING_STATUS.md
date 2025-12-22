# Testing Status

## ⚠️ Important Note

The TDD test suite has been **implemented but not fully verified**. 

## 🧪 How to Test

### Browser Testing (Recommended)

Open these files in your browser to test:

1. **test-now.html** - Quick TDD test runner
2. **tests/debug-test.html** - Debug output
3. **tests/tdd-runner.html** - Full TDD suite
4. **tests/verification-test-runner.html** - For large test suites

### What Was Implemented

All coordinate formats from the TDD test suite:

- ✅ Basic decimal formats
- ✅ Degrees and minutes
- ✅ Compass directions
- ✅ Minus separator
- ✅ URL formats (Google Maps, Eniro)
- ✅ Data formats (GeoJSON, GML, WKT)
- ✅ Prefix formats (Lat: Long:)
- ✅ Compact formats
- ✅ Sparse formats

### Known Potential Issues

Some formats may not work correctly due to:

1. **Pattern matching order** - More specific patterns should come first
2. **Coordinate pairing** - Special formats (GeoJSON, WKT) need special handling
3. **Regex escaping** - Some special characters may need escaping
4. **Decimal separator** - Comma vs period handling

### How to Report Issues

If you find failing tests:

1. Open the test runner in browser
2. Note which test ID fails (e.g., tdd-006)
3. Note the input and expected vs actual output
4. Report back with this information

### Next Steps

1. **Run tests in browser** - Use test-now.html or tests/tdd-runner.html
2. **Identify failures** - Note which tests fail
3. **Fix iteratively** - Fix one test at a time
4. **Verify** - Re-run tests after each fix

## 📊 Test Files

- `test-now.html` - Quick test of 20 TDD tests
- `tests/tdd-runner.html` - Full TDD suite
- `tests/debug-test.html` - Debug output
- `tests/verification-test-runner.html` - Large test suite runner
- `run-tdd-tests.js` - Node.js test runner (requires Node.js)

## 🎯 Testing Workflow

```bash
# In browser:
1. Open test-now.html
2. Check console for results
3. Report failures

# With Node.js (if available):
node run-tdd-tests.js
```

## 📝 Test Format

Tests follow this format:
```
Test-ID: tdd-001
Input: "59.32894 18.06491"
Expected: 59.32894 18.06491
```

If a test fails, you'll see:
```
✗ tdd-001: Enkel decimalform
  Expected: 59.32894, 18.06491
  Got:      59.32895, 18.06490
```

## 🔧 Debugging

To debug a specific format:

1. Open browser console
2. Run: `CF.pointIn("your test input")`
3. Check: `point.latitude()` and `point.longitude()`
4. Compare with expected values

Example:
```javascript
var point = CF.pointIn("59.32894 18.06491");
console.log(point.latitude(), point.longitude());
// Should output: 59.32894 18.06491
```
