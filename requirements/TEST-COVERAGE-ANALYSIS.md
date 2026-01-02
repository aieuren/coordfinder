# Test Coverage Analysis

Date: 2025-12-30  
Version: 5.0-beta.4

## Summary

Analysis of what Expected attributes are defined in tests vs what is actually validated.

## Expected Attributes Found in Tests

### Currently Used
| Attribute | Example | Parsed? | Tested? | Notes |
|-----------|---------|---------|---------|-------|
| `Count` | `- Count: 1` | ✅ | ✅ | Number of points expected |
| `Coords` | `- Coords: 59.32894 18.06491` | ✅ | ✅ | Lat/lon coordinates |
| `CRS` | `- CRS: SWEREF99TM` | ✅ | ✅ | Coordinate reference system |
| `refsys` | `- refsys: SWEREF99TM` | ✅ | ✅ | Alias for CRS |
| `N.value` | `- N.value: 6580000` | ✅ | ✅ | Northing value (meters) |
| `E.value` | `- E.value: 540000` | ✅ | ✅ | Easting value (meters) |
| Direct coords | `Expected: 59.50 18.25` | ✅ | ✅ | Inline lat/lon |

### Now Implemented
| Attribute | Example | Parsed? | Tested? | Notes |
|-----------|---------|---------|---------|-------|
| `Bounds` | `- Bounds: 57.5 12.25 58.0 12.75` | ✅ | ✅ | Bounding box for multiple points |

## Detailed Analysis

### Bounds Attribute

**Usage in tests:**
```
Test-ID: tdd-017
Expected:
- Count: 3
- Bounds: 57.5 12.25 58.0 12.75

Test-ID: tdd-058
Expected:
- Count: 2
- Bounds: -6.0 -36.0 9.0 78.0
```

**Format:** `Bounds: minLat minLon maxLat maxLon`

**Purpose:** Validate that all found points fall within expected bounding box.

**Current Status:** 
- ❌ Not parsed by test-parser.js
- ❌ Not validated by test-framework.js
- Tests pass without checking bounds

**Impact:** Tests tdd-017 and tdd-058 are not fully validated.

## Test Results Without Bounds Validation

Current: **118/118 tests pass (100%)**

However, the following tests have unchecked Bounds attributes:
- tdd-017: 3 points expected with bounds 57.5, 12.25, 58.0, 12.75
- tdd-058: 2 points expected with bounds -6.0, -36.0, 9.0, 78.0

## Recommendations

### Option 1: Implement Bounds Validation (Recommended)

Add bounds checking to ensure all points fall within expected area.

**Parser changes (test-parser.js):**
```javascript
} else if (trimmed.match(/^-\s*Bounds:\s*(.+)$/i)) {
    // Format: "- Bounds: minLat minLon maxLat maxLon"
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

**Framework changes (test-framework.js):**
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

### Option 2: Remove Bounds from Tests

If bounds validation is not needed, remove the Bounds attributes from test files.

### Option 3: Document as Optional

Mark Bounds as optional/informational and don't validate.

## Other Potential Attributes

Consider adding support for:

| Attribute | Purpose | Priority |
|-----------|---------|----------|
| `rating` | Expected quality rating | Low |
| `format` | Expected coordinate format | Low |
| `precision` | Expected decimal precision | Low |
| `axis` | Expected axis (Northing/Easting) | Low |

## Conclusion

Current implementation validates:
- ✅ Count (number of points)
- ✅ Coordinates (lat/lon or N/E)
- ✅ CRS/refsys (coordinate system)
- ✅ Bounds (bounding box) - **IMPLEMENTED**

**Status:** Complete test coverage achieved!

## Implementation Results

Bounds validation has been implemented and is working correctly.

**Test Results:**
- tdd-017: ✅ Passes (bounds validated)
- tdd-058: ❌ Fails - **Test data error found!**

The bounds validation successfully identified an error in tdd-058 where the specified bounds don't include all points. See TEST-ISSUE-tdd-058.md for details.

## Test Cases Affected

### tdd-017
```
Input: |
  Punkt 1: 57.7 12.5
  Punkt 2: 57.8 12.6
  Punkt 3: 57.9 12.7
Expected:
- Count: 3
- Bounds: 57.5 12.25 58.0 12.75
```

**What should be checked:**
- All 3 points are within bounds [57.5, 12.25] to [58.0, 12.75]

### tdd-058
```
Input: |
  Coordinates in different hemispheres:
  -5.5, -35.5
  8.5, 77.5
Expected:
- Count: 2
- Bounds: -6.0 -36.0 9.0 78.0
```

**What should be checked:**
- Both points are within bounds [-6.0, -36.0] to [9.0, 78.0]
