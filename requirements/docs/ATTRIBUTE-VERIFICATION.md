# Expected Attribute Verification

Date: 2026-01-02  
Version: 5.0-beta.4

## Summary

Verification that all Expected attributes in test files are actually validated by the test framework.

## Attributes Found in Tests

### Complete List

```bash
$ grep "^- " requirements/test-suites-tdd.txt | sed 's/^- //' | cut -d: -f1 | sort -u
Bounds
CRS
Count
E.value
N.value
refsys
```

**Note:** `Coords` attribute has been removed from test files. Direct coordinate format is now used instead (e.g., `Expected: 59.32894 18.06491`).

## Verification Status

| Attribute | Parsed? | Validated? | Location | Notes |
|-----------|---------|------------|----------|-------|
| `Count` | ✅ | ✅ | test-framework.js:122 | Number of points expected |
| Direct coords | ✅ | ✅ | test-framework.js:136 | Format: `Expected: lat lon` |
| `N.value` | ✅ | ✅ | test-framework.js:142 | Northing value (meters) |
| `E.value` | ✅ | ✅ | test-framework.js:142 | Easting value (meters) |
| `CRS` | ✅ | ✅ | test-framework.js:185 | Coordinate reference system |
| `refsys` | ✅ | ✅ | test-framework.js:185 | Alias for CRS |
| `Bounds` | ✅ | ✅ | test-framework.js:201 | Bounding box validation |

## Detailed Verification

### 1. Count ✅

**Parser:** test-parser.js
```javascript
if (trimmed.match(/^-?\s*Count:\s*(\d+)$/i)) {
    currentTest.count = parseInt(RegExp.$1, 10);
}
```

**Validator:** test-framework.js:122
```javascript
// Check count
if (actualCount !== this.expectedCount) {
    var msg = "Expected " + this.expectedCount + " point(s), found " + actualCount;
    return new TestResult(this, false, msg, actualCount, this.expectedCount);
}
```

**Status:** ✅ Fully validated

---

### 2. Direct Coordinates ✅

**Format:** `Expected: lat lon` (no attribute prefix)

**Parser:** test-parser.js
```javascript
} else if (!trimmed.match(/^-/)) {
    // Direct format: "59.50 18.25"
    var parts = trimmed.split(/\s+/);
    if (parts.length >= 2) {
        if (!currentTest.coords) currentTest.coords = [];
        currentTest.coords.push({
            lat: parseFloat(parts[0]),
            lon: parseFloat(parts[1])
        });
    }
}
```

**Validator:** test-framework.js:136-180
```javascript
// Check coordinates if specified
if (this.expectedCoords && this.expectedCoords.length > 0) {
    for (var i = 0; i < this.expectedCoords.length && i < points.length; i++) {
        var expected = this.expectedCoords[i];
        var actual = points[i];
        
        // Compare lat/lon with proper rounding
        if (expected.lat !== undefined && expected.lon !== undefined) {
            var latDecimals = this._getDecimalPlaces(expected.lat);
            var lonDecimals = this._getDecimalPlaces(expected.lon);
            
            var actualLat = this._roundToDecimals(actual.latitude(), latDecimals);
            var actualLon = this._roundToDecimals(actual.longitude(), lonDecimals);
            var expectedLat = this._roundToDecimals(expected.lat, latDecimals);
            var expectedLon = this._roundToDecimals(expected.lon, lonDecimals);
            
            if (actualLat !== expectedLat || actualLon !== expectedLon) {
                // Report mismatch
            }
        }
    }
}
```

**Status:** ✅ Fully validated with decimal precision matching

---

### 3. N.value and E.value ✅

**Parser:** test-parser.js
```javascript
} else if (trimmed.match(/^-\s*N\.value:\s*(.+)$/i)) {
    if (!currentTest.coords) currentTest.coords = [];
    if (currentTest.coords.length === 0) currentTest.coords.push({});
    currentTest.coords[0].N = parseFloat(RegExp.$1.trim());
} else if (trimmed.match(/^-\s*E\.value:\s*(.+)$/i)) {
    if (!currentTest.coords) currentTest.coords = [];
    if (currentTest.coords.length === 0) currentTest.coords.push({});
    currentTest.coords[0].E = parseFloat(RegExp.$1.trim());
}
```

**Validator:** test-framework.js:142-158
```javascript
// Check if expected uses N/E (meter coordinates) or lat/lon (degree coordinates)
if (expected.N !== undefined && expected.E !== undefined) {
    // Meter coordinates - compare N and E values directly
    var actualN = actual.N.value;
    var actualE = actual.E.value;
    
    // Determine decimal places
    var nDecimals = this._getDecimalPlaces(expected.N);
    var eDecimals = this._getDecimalPlaces(expected.E);
    
    // Round to same decimal places
    var roundedActualN = this._roundToDecimals(actualN, nDecimals);
    var roundedActualE = this._roundToDecimals(actualE, eDecimals);
    var roundedExpectedN = this._roundToDecimals(expected.N, nDecimals);
    var roundedExpectedE = this._roundToDecimals(expected.E, eDecimals);
    
    if (roundedActualN !== roundedExpectedN || roundedActualE !== roundedExpectedE) {
        // Report mismatch
    }
}
```

**Status:** ✅ Fully validated with decimal precision matching

---

### 4. CRS and refsys ✅

**Parser:** test-parser.js
```javascript
} else if (trimmed.match(/^-\s*CRS:\s*(.+)$/i)) {
    currentTest.crs = RegExp.$1.trim();
} else if (trimmed.match(/^-\s*refsys:\s*(.+)$/i)) {
    currentTest.crs = RegExp.$1.trim();  // Both map to same field
}
```

**Validator:** test-framework.js:185-198
```javascript
// Check CRS if specified
if (this.expectedCRS && points.length > 0) {
    var actualCRS = points[0].refsys.name;
    // Normalize for comparison: remove spaces, dots, underscores, lowercase
    var normalizedActual = actualCRS.replace(/[\s._]+/g, '').toLowerCase();
    var normalizedExpected = this.expectedCRS.replace(/[\s._]+/g, '').toLowerCase();
    
    // Check if expected is contained in actual (allows "RT90" to match "RT90 2.5 gon V")
    if (normalizedActual.indexOf(normalizedExpected) === -1) {
        var msg = "CRS mismatch\n";
        msg += "   Expected: " + this.expectedCRS + "\n";
        msg += "   Actual:   " + actualCRS;
        return new TestResult(this, false, msg, actualCRS, this.expectedCRS);
    }
}
```

**Status:** ✅ Fully validated with normalization for flexible matching

**Normalization rules:**
- Removes spaces, dots, underscores
- Case-insensitive comparison
- Substring matching (allows "RT90" to match "RT90 2.5 gon V")

**Examples:**
- `RT90_25gonV` matches `RT90 2.5 gon V` ✅
- `SWEREF99TM` matches `SWEREF99 TM` ✅
- `WGS84` matches `WGS84` ✅

---

### 5. Bounds ✅

**Parser:** test-parser.js
```javascript
} else if (trimmed.match(/^-\s*Bounds:\s*(.+)$/i)) {
    var boundsStr = RegExp.$1.trim();
    var parts = boundsStr.split(/\s+/);
    if (parts.length >= 4) {
        currentTest.bounds = {
            minLat: parseFloat(parts[0]),
            minLon: parseFloat(parts[1]),
            maxLat: parseFloat(parts[2]),
            maxLon: parseFloat(parts[3])
        };
    }
}
```

**Validator:** test-framework.js:201-215
```javascript
// Check bounds if specified
if (this.expectedBounds && points.length > 0) {
    for (var i = 0; i < points.length; i++) {
        var p = points[i];
        var lat = p.latitude();
        var lon = p.longitude();
        
        if (lat < this.expectedBounds.minLat || lat > this.expectedBounds.maxLat ||
            lon < this.expectedBounds.minLon || lon > this.expectedBounds.maxLon) {
            var msg = "Point " + (i + 1) + " outside expected bounds\n";
            msg += "   Point: " + lat.toFixed(4) + ", " + lon.toFixed(4) + "\n";
            msg += "   Bounds: [" + this.expectedBounds.minLat + ", " + 
                   this.expectedBounds.minLon + "] to [" + 
                   this.expectedBounds.maxLat + ", " + this.expectedBounds.maxLon + "]";
            return new TestResult(this, false, msg);
        }
    }
}
```

**Status:** ✅ Fully validated

**Format:** `Bounds: minLat minLon maxLat maxLon`

**Validation:** All points must fall within the specified bounding box

---

## Test Coverage Summary

### All Attributes Validated ✅

Every attribute that appears in Expected sections is:
1. **Parsed** by test-parser.js
2. **Validated** by test-framework.js
3. **Reported** on mismatch with clear error messages

**Note:** The `Coords:` attribute has been removed. Direct coordinate format is now used:
- Old: `Expected:\n- Coords: 59.32894 18.06491`
- New: `Expected: 59.32894 18.06491`

### Validation Features

1. **Decimal Precision Matching**
   - Coordinates are rounded to match expected precision
   - Example: Expected `59.32894` (5 decimals) → actual rounded to 5 decimals

2. **Flexible CRS Matching**
   - Normalized comparison (spaces, dots, underscores removed)
   - Case-insensitive
   - Substring matching for variations

3. **Comprehensive Error Messages**
   - Shows expected vs actual values
   - Includes coordinate precision
   - Clear indication of what failed

### Example Test Validation

```
Test-ID: tdd-059
Input: "Nordlig: 6580000 Östlig: 540000"
Expected:
- N.value: 6580000
- E.value: 540000
- refsys: SWEREF99TM
```

**Validation steps:**
1. ✅ Parse input → find 1 point
2. ✅ Check N.value: 6580000 = 6580000
3. ✅ Check E.value: 540000 = 540000
4. ✅ Check refsys: "SWEREF99TM" matches "SWEREF99 TM"

## Conclusion

**All Expected attributes are fully validated.** ✅

The test framework provides:
- Complete coverage of all test attributes
- Precise validation with appropriate tolerance
- Clear error reporting
- Flexible matching where appropriate (CRS names)

No attributes are ignored or skipped during test execution.
