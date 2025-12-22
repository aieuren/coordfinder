# Research Index: Coordinate Pairing Analysis

This directory contains comprehensive research on the coordinate pairing bugs in coordfinder.js.

## Quick Start

1. **Read this first:** `QUICK_REFERENCE.md` - 2-minute overview
2. **Understand the problem:** `RESEARCH_SUMMARY.md` - Complete analysis
3. **See the flow:** `PAIRING_FLOW_DIAGRAM.md` - Visual diagrams
4. **Deep dive:** `PAIRING_ANALYSIS.md` - Detailed technical analysis

## Files Created

### Documentation

| File | Purpose | Audience |
|------|---------|----------|
| `QUICK_REFERENCE.md` | 2-minute overview of bugs and fixes | Everyone |
| `RESEARCH_SUMMARY.md` | Complete research findings | Developers |
| `PAIRING_ANALYSIS.md` | Detailed technical analysis with solutions | Developers |
| `PAIRING_FLOW_DIAGRAM.md` | Visual flow diagrams | Visual learners |
| `RESEARCH_INDEX.md` | This file - navigation guide | Everyone |

### Tests

| File | Purpose | How to Run |
|------|---------|------------|
| `tests/test-pairing-fix.js` | Automated test suite | `node tests/test-pairing-fix.js` |
| `tests/test-numbered-list.html` | Interactive browser test | Open in browser |

### Code Annotations

Inline annotations added to `src/coordfinder.js`:
- Lines 1131-1159: Missing break statement bug
- Lines 120-139: Missing axis validation bug
- Lines 887-892: Same-line bonus (already implemented)
- Lines 1170-1196: Grouping logic (already implemented)

## Key Findings

### The Bugs

1. **Missing Break Statement** (line 1156)
   - Allows one coordinate to pair with multiple others
   - Creates 5 points instead of 3

2. **No Axis Validation** (line 124)
   - Allows two latitudes or two longitudes to pair
   - Creates invalid points like "N 57.5, E 57.75" (both are latitudes)

### The Algorithm

**Type:** Greedy (first-come-first-served)
**Optimization:** None
**Status:** Broken due to the two bugs above

### The Fixes

Both fixes are simple and low-risk:
1. Add `break;` statement (1 line)
2. Add axis validation (3 lines)

See `QUICK_REFERENCE.md` for exact code changes.

## Test Results

### Before Fix
```
Test 1: Numbered list - Expected 3, Got 5 ✗ FAIL
Test 2: Two locations - Expected 2, Got 3 ✗ FAIL
Test 3: Mixed format - Expected 3, Got 5 ✗ FAIL
```

### After Fix (Expected)
```
Test 1: Numbered list - Expected 3, Got 3 ✓ PASS
Test 2: Two locations - Expected 2, Got 2 ✓ PASS
Test 3: Mixed format - Expected 3, Got 3 ✓ PASS
```

## Implementation Plan

### Phase 1: Critical Fixes (Immediate)
- [ ] Add break statement (1 line)
- [ ] Add axis validation (3 lines)
- [ ] Run test suite
- [ ] Verify all tests pass

### Phase 2: Enhancements (Short-term)
- [ ] Add warning logs for cross-line pairings
- [ ] Enhance rating to penalize cross-line pairings
- [ ] Add more unit tests

### Phase 3: Optimization (Long-term)
- [ ] Implement global optimization with scoring
- [ ] Add line proximity preference
- [ ] Support configuration options

## Related Code

### Main Components

```
src/coordfinder.js
├── CF.prototype._coordsToPoints (lines 1099-1168)
│   └── Main pairing loop (HAS BUG 1)
│
├── RefSys.prototype.contains (lines 120-139)
│   └── Pairing validation (HAS BUG 2)
│
├── Point.prototype.rate (lines 840-896)
│   └── Rating with same-line bonus
│
└── CF.prototype._groupPoints (lines 1170-1196)
    └── Grouping by line gaps
```

### Data Flow

```
Text Input
    ↓
_findSnippets() → Snippets with line numbers
    ↓
_snippetsToCoords() → Coordinates with axis info
    ↓
_coordsToPoints() → Points (BUGGY HERE)
    ↓
Point.rate() → Rated points
    ↓
_groupPoints() → Grouped points
```

## Questions & Answers

### Q: Is the algorithm greedy or optimized?
**A:** Greedy (first-come-first-served), but broken due to bugs.

### Q: Does it consider line proximity?
**A:** No, not during pairing. Only in rating (after pairing) and grouping (after rating).

### Q: Why does it create 5 points instead of 3?
**A:** Bug 1 (missing break) allows coord[0] to pair with coords [1, 3, 5] instead of just [1].

### Q: Why does it pair two latitudes together?
**A:** Bug 2 (no axis check) only validates bounding box, not axis type.

### Q: How hard is it to fix?
**A:** Very easy - just 4 lines of code total.

### Q: Will the fix break anything?
**A:** No, it will only prevent invalid pairings. Valid pairings will still work.

## Contact & Support

For questions about this research:
1. Read the documentation files above
2. Check the code annotations in `src/coordfinder.js`
3. Run the test suite to see examples

## Version History

- **2024-12-22:** Initial research completed
  - Identified two critical bugs
  - Created comprehensive documentation
  - Developed test suite
  - Proposed fixes and enhancements
