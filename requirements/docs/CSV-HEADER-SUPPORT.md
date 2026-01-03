# CSV Header Support

Date: 2026-01-02  
Version: 5.0-beta.4

## Summary

Implemented CSV header detection to correctly parse coordinate data with X,Y column headers.

## Problem

CSV files with X,Y headers were not being parsed correctly:

```csv
X,Y,Z,id
-35.5,-5.2,0,3
77.5,8.3,0,4
```

In cartographic convention:
- **X = Easting (longitude)**
- **Y = Northing (latitude)**

But CoordFinder was parsing comma-separated values in standard lat,lon order, ignoring the header.

## Solution

### 1. CSV Header Detection

Added `_detectCSVHeader()` method to TextParser that:
- Checks if first line contains X and Y columns (case-insensitive)
- Records column indices
- Determines if swapping is needed

```javascript
TextParser.prototype._detectCSVHeader = function() {
    var firstLine = this.lines[0].trim();
    var columns = firstLine.split(',').map(function(col) {
        return col.trim().toUpperCase();
    });
    
    var xIndex = -1;
    var yIndex = -1;
    
    for (var i = 0; i < columns.length; i++) {
        if (columns[i] === 'X') xIndex = i;
        if (columns[i] === 'Y') yIndex = i;
    }
    
    if (xIndex !== -1 && yIndex !== -1) {
        return {
            xIndex: xIndex,
            yIndex: yIndex,
            swapNeeded: xIndex < yIndex  // X before Y needs swap to lat,lon
        };
    }
    
    return null;
};
```

### 2. Column Mapping Logic

**Standard coordinate order:** lat, lon (Y, X in cartographic terms)

**CSV with X,Y header:**
- First value = X (longitude)
- Second value = Y (latitude)
- **Swap needed** to get lat,lon order

**CSV with Y,X header:**
- First value = Y (latitude)
- Second value = X (longitude)
- **No swap needed** - already in lat,lon order

### 3. Apply Mapping During Pairing

Modified coordinate pairing logic in `_coordsToPoints()`:

```javascript
// Check if these coords are from a CSV line with X,Y header
var csvSwapNeeded = false;
if (c1.parsedFrom && c1.parsedFrom.parser && c1.parsedFrom.parser.csvColumnMapping) {
    var mapping = c1.parsedFrom.parser.csvColumnMapping;
    // Check if both coords are on the same line (line after header)
    if (c1.parsedFrom.lineNo === c2.parsedFrom.lineNo && c1.parsedFrom.lineNo > 0) {
        csvSwapNeeded = mapping.swapNeeded;
    }
}

// If CSV swap is needed, swap the coords before pairing
var coord1 = csvSwapNeeded ? c2 : c1;
var coord2 = csvSwapNeeded ? c1 : c2;
```

### 4. Test Parser Fix

Fixed multi-line input quote removal in test-parser.js:

```javascript
// Remove surrounding quotes from input if present (for multi-line inputs)
if (test.input) {
    var input = test.input.trim();
    if ((input[0] === '"' && input[input.length - 1] === '"') ||
        (input[0] === "'" && input[input.length - 1] === "'")) {
        test.input = input.substring(1, input.length - 1);
    }
}
```

## Test Results

All CSV tests now pass:

### tdd-057a: X,Y,Z,id format
```csv
X,Y,Z,id
18.06491,59.32894,0,1
19.54321,60.12345,0,2
```
**Result:** ✅ Correctly parsed as lon,lat → lat=59.32894, lon=18.06491

### tdd-057b: X,Y,id format
```csv
X,Y,id
18.06491,59.32894,1
19.54321,60.12345,2
```
**Result:** ✅ Correctly parsed as lon,lat → lat=59.32894, lon=18.06491

### tdd-057c: Y,X,id format
```csv
Y,X,id
59.32894,18.06491,1
60.12345,19.54321,2
```
**Result:** ✅ Correctly parsed as lat,lon → lat=59.32894, lon=18.06491

### tdd-058: Negative coordinates with X,Y,Z,id
```csv
X,Y,Z,id
-35.5,-5.2,0,3
77.5,8.3,0,4
```
**Result:** ✅ Correctly parsed as lon,lat → lat=-5.2, lon=-35.5

## Implementation Details

### Files Modified

1. **src/coordfinder.js**
   - Added `csvColumnMapping` to TextParser constructor
   - Added `_detectCSVHeader()` method
   - Modified coordinate pairing logic to apply CSV mapping

2. **src/test-parser.js**
   - Fixed multi-line input quote removal

### Supported Formats

- `X,Y` - X (lon) before Y (lat) - swap needed
- `Y,X` - Y (lat) before X (lon) - no swap
- `X,Y,Z` - Extra columns ignored
- `X,Y,id` - Extra columns ignored
- Case-insensitive column names

### Limitations

- Only detects X and Y columns (not Lat/Lon, Latitude/Longitude, etc.)
- Assumes first line is header if it contains X and Y
- Only applies to comma-separated values on same line
- Does not support other delimiters (tab, semicolon)

## Future Enhancements

Potential improvements:
- Support for Lat/Lon, Latitude/Longitude column names
- Support for other delimiters (tab, semicolon)
- Support for quoted CSV values
- Support for header detection with other column names (N/E, North/East, etc.)

## Conclusion

CSV header support successfully implemented. All 120 tests pass (100%).

The implementation correctly handles:
- X,Y column order (swap to lat,lon)
- Y,X column order (no swap)
- Negative coordinates
- Extra columns
- Multi-line CSV data
