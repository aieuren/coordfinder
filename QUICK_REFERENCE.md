# Quick Reference: Coordinate Pairing Bugs

## The Problem in 30 Seconds

```
Input:  1) 57°30'N 12°15'E
        2) 57°45'N 12°30'E
        3) 58°00'N 12°45'E

Expected: 3 points (one per line)
Actual:   5 points (3 wrong)
```

## The Two Bugs

### Bug 1: Missing Break
**Location:** `src/coordfinder.js:1156`
```javascript
if (result) {
    usedCoords[i] = true;
    usedCoords[j] = true;
    // ❌ Missing: break;
}
```
**Effect:** One coordinate pairs with ALL compatible coordinates

### Bug 2: No Axis Check
**Location:** `src/coordfinder.js:124`
```javascript
var tryPair = function(cN, cE, refsys) {
    // ❌ Missing: axis validation
    if (refsys.bounds.covers(cN.value, cE.value)) {
        return {N: cN, E: cE, RefSys: refsys};
    }
}
```
**Effect:** Two latitudes can pair together (57.5N + 57.75N)

## The Fixes

### Fix 1: Add Break (1 line)
```javascript
if (result) {
    usedCoords[i] = true;
    usedCoords[j] = true;
    break;  // ← ADD THIS
}
```

### Fix 2: Add Axis Check (3 lines)
```javascript
var tryPair = function(cN, cE, refsys) {
    // ← ADD THESE 3 LINES
    if (cN.axis !== CoordAxis.Northing || cE.axis !== CoordAxis.Easting) {
        return null;
    }
    
    if (refsys.bounds.covers(cN.value, cE.value)) {
        return {N: cN, E: cE, RefSys: refsys};
    }
}
```

## Test It

```bash
# Before fix: 3 tests fail
node tests/test-pairing-fix.js

# After fix: 3 tests pass
node tests/test-pairing-fix.js
```

## Algorithm Type

**Current:** Greedy (broken)
- Processes coordinates in order
- Takes first match (but doesn't stop!)
- No optimization

**After Fix:** Greedy (correct)
- Processes coordinates in order
- Takes first match (and stops)
- No optimization (but correct)

**Future:** Greedy with scoring
- Considers all pairings
- Scores by line proximity
- Selects best non-overlapping set

## More Info

- Full analysis: `PAIRING_ANALYSIS.md`
- Flow diagrams: `PAIRING_FLOW_DIAGRAM.md`
- Complete summary: `RESEARCH_SUMMARY.md`
