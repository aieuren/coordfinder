# Coordinate Pairing Analysis

## Problem Statement

When parsing numbered lists with coordinates, the parser creates incorrect pairings. For example:

```
1) 57°30'N 12°15'E
2) 57°45'N 12°30'E
3) 58°00'N 12°45'E
```

Expected: 3 points (one per line)
Actual: 5 points with incorrect cross-line pairings

## Root Causes

### 1. Missing Break Statement in Pairing Loop

**Location:** `coordfinder.js`, lines 1131-1159, method `CF.prototype._coordsToPoints`

**Issue:** After successfully pairing two coordinates, the inner loop continues instead of breaking. This allows a single coordinate to be paired with multiple other coordinates.

**Code:**
```javascript
for (var i = 0; i < this._coords.length; i++) {
    if (usedCoords[i]) continue;
    
    for (var j = i + 1; j < this._coords.length; j++) {
        if (usedCoords[j]) continue;
        
        var c1 = this._coords[i];
        var c2 = this._coords[j];
        
        if (!c1 || !c2) continue;
        
        var result = RefSys.fromCoords(c1, c2, false);
        
        if (result) {
            var point = new Point(result.N, result.E, result.RefSys);
            point.N.point = point;
            point.E.point = point;
            
            this._points.push(point);
            this._log("Created point: " + point.asText());
            
            usedCoords[i] = true;
            usedCoords[j] = true;
            // ❌ MISSING: break; statement here
        }
    }
}
```

**Consequence:** 
- Coord[0] (57.5N) pairs with Coord[1] (12.25E) ✓
- Coord[0] continues and pairs with Coord[3] (12.5E) ✗
- Coord[0] continues and pairs with Coord[5] (12.75E) ✗

### 2. No Axis Validation in RefSys.contains

**Location:** `coordfinder.js`, lines 120-139, method `RefSys.prototype.contains`

**Issue:** The method only checks if coordinate values fall within the bounding box, but doesn't verify that one coordinate is Northing and the other is Easting.

**Code:**
```javascript
RefSys.prototype.contains = function(c1, c2, ordered) {
    if (!c1 || !c2) return null;
    
    var tryPair = function(cN, cE, refsys) {
        // ❌ No check that cN.axis === CoordAxis.Northing
        // ❌ No check that cE.axis === CoordAxis.Easting
        if (refsys.bounds.covers(cN.value, cE.value)) {
            return {N: cN, E: cE, RefSys: refsys};
        }
        return null;
    };
    
    var result = tryPair(c1, c2, this);
    if (result) return result;
    
    if (!ordered) {
        result = tryPair(c2, c1, this);
        if (result) return result;
    }
    
    return null;
};
```

**Consequence:**
- Coord[0] (57.5N) can pair with Coord[2] (57.75N) because both values (57.5, 57.75) fall within WGS84NorthernEurope bounds (49-75, 0-32)
- The second latitude is incorrectly treated as a longitude
- This creates invalid points like "N 57.5, E 57.75"

## Algorithm Classification

The current algorithm is **greedy with a critical bug**:

1. **Greedy:** It processes coordinates in order and pairs the first coordinate with the first compatible coordinate it finds
2. **Buggy:** It doesn't stop after finding a match, allowing multiple pairings per coordinate
3. **No optimization:** It doesn't consider:
   - Line proximity (coordinates on the same line should be preferred)
   - Global optimization (finding the best overall pairing)
   - Axis compatibility (Northing must pair with Easting)

## Test Results

Input:
```
1) 57°30'N 12°15'E
2) 57°45'N 12°30'E
3) 58°00'N 12°45'E
```

Snippets found: 6
- Snippet 0: " 57°30'N" (line 0, N)
- Snippet 1: " 12°15'E" (line 0, E)
- Snippet 2: " 57°45'N" (line 1, N)
- Snippet 3: " 12°30'E" (line 1, E)
- Snippet 4: " 58°00'N" (line 2, N)
- Snippet 5: " 12°45'E" (line 2, E)

Points created: 5 (should be 3)
- Point 1: N 57.5 (line 0) + E 12.25 (line 0) ✓ Correct
- Point 2: N 57.5 (line 0) + E 57.75 (line 1) ✗ Wrong axis!
- Point 3: N 57.5 (line 0) + E 12.5 (line 1) ✗ Cross-line
- Point 4: N 57.5 (line 0) + E 58 (line 2) ✗ Wrong axis!
- Point 5: N 57.5 (line 0) + E 12.75 (line 2) ✗ Cross-line

## Proposed Solutions

### Solution 1: Add Break Statement (Quick Fix)

Add a `break;` statement after successful pairing:

```javascript
if (result) {
    var point = new Point(result.N, result.E, result.RefSys);
    point.N.point = point;
    point.E.point = point;
    
    this._points.push(point);
    this._log("Created point: " + point.asText());
    
    usedCoords[i] = true;
    usedCoords[j] = true;
    break; // ✓ Stop after first successful pairing
}
```

**Pros:** Simple, minimal change
**Cons:** Still greedy, doesn't optimize for line proximity

### Solution 2: Add Axis Validation (Essential Fix)

Validate axis compatibility in `RefSys.prototype.contains`:

```javascript
var tryPair = function(cN, cE, refsys) {
    // ✓ Validate axes
    if (cN.axis !== CoordAxis.Northing || cE.axis !== CoordAxis.Easting) {
        return null;
    }
    if (refsys.bounds.covers(cN.value, cE.value)) {
        return {N: cN, E: cE, RefSys: refsys};
    }
    return null;
};
```

**Pros:** Prevents invalid pairings, essential correctness fix
**Cons:** None

### Solution 3: Global Optimization with Line Proximity (Advanced)

Implement a scoring system that considers:
1. Axis compatibility (required)
2. Line proximity (same line = highest score)
3. Distance in text (closer = higher score)
4. Coordinate value proximity (for detecting outliers)

```javascript
CF.prototype._coordsToPoints = function() {
    // Build all possible pairings with scores
    var possiblePairings = [];
    
    for (var i = 0; i < this._coords.length; i++) {
        for (var j = i + 1; j < this._coords.length; j++) {
            var c1 = this._coords[i];
            var c2 = this._coords[j];
            
            var result = RefSys.fromCoords(c1, c2, false);
            if (result) {
                var score = this._scorePairing(result.N, result.E);
                possiblePairings.push({
                    i: i,
                    j: j,
                    result: result,
                    score: score
                });
            }
        }
    }
    
    // Sort by score (highest first)
    possiblePairings.sort((a, b) => b.score - a.score);
    
    // Greedily select non-overlapping pairings
    var usedCoords = {};
    for (var k = 0; k < possiblePairings.length; k++) {
        var pairing = possiblePairings[k];
        if (!usedCoords[pairing.i] && !usedCoords[pairing.j]) {
            var point = new Point(pairing.result.N, pairing.result.E, pairing.result.RefSys);
            point.N.point = point;
            point.E.point = point;
            this._points.push(point);
            usedCoords[pairing.i] = true;
            usedCoords[pairing.j] = true;
        }
    }
};

CF.prototype._scorePairing = function(coordN, coordE) {
    var score = 0.5; // Base score
    
    // Same line bonus
    if (coordN.parsedFrom && coordE.parsedFrom &&
        coordN.parsedFrom.lineNo === coordE.parsedFrom.lineNo) {
        score += 0.5;
    }
    
    // Text proximity bonus
    if (coordN.parsedFrom && coordE.parsedFrom) {
        var distance = Math.abs(coordN.parsedFrom.index - coordE.parsedFrom.index);
        if (distance < 50) score += 0.2;
        else if (distance < 100) score += 0.1;
    }
    
    return score;
};
```

**Pros:** Optimal pairings, handles complex cases
**Cons:** More complex, requires more testing

## Recommendation

Implement **both Solution 1 and Solution 2** immediately:
1. Add axis validation to prevent invalid pairings (critical)
2. Add break statement to prevent multiple pairings (critical)

Then consider Solution 3 for future enhancement to handle edge cases better.

## Related Code Locations

- **Pairing logic:** `CF.prototype._coordsToPoints` (lines 1099-1168)
- **Validation logic:** `RefSys.prototype.contains` (lines 120-139)
- **Rating logic:** `Point.prototype.rate` (lines 840-896) - already considers same-line bonus
- **Grouping logic:** `CF.prototype._groupPoints` (lines 1170-1196) - groups by line gaps
- **Axis definitions:** `CoordAxis` (lines 38-44)
- **Coordinate extraction:** `Coord.fromSnippet` (lines 594-610)
