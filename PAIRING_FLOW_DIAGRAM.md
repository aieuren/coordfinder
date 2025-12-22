# Coordinate Pairing Flow Diagram

## Current (Buggy) Algorithm Flow

```
Input Text:
┌─────────────────────────┐
│ 1) 57°30'N 12°15'E     │ Line 0
│ 2) 57°45'N 12°30'E     │ Line 1
│ 3) 58°00'N 12°45'E     │ Line 2
└─────────────────────────┘

Step 1: Parse Snippets
┌──────────────────────────────────────────────────────────┐
│ [0] 57°30'N → 57.5  (line 0, axis: Northing)           │
│ [1] 12°15'E → 12.25 (line 0, axis: Easting)            │
│ [2] 57°45'N → 57.75 (line 1, axis: Northing)           │
│ [3] 12°30'E → 12.5  (line 1, axis: Easting)            │
│ [4] 58°00'N → 58.0  (line 2, axis: Northing)           │
│ [5] 12°45'E → 12.75 (line 2, axis: Easting)            │
└──────────────────────────────────────────────────────────┘

Step 2: Pairing Loop (BUGGY)
┌─────────────────────────────────────────────────────────────┐
│ i=0: coord[0] = 57.5N (line 0)                             │
│   j=1: coord[1] = 12.25E (line 0)                          │
│     ✓ Can pair (N + E, both in bounds)                     │
│     → Point 1: N 57.5, E 12.25 ✓ CORRECT                   │
│     → Mark [0] and [1] as used                             │
│     ❌ BUG: No break! Loop continues...                     │
│                                                             │
│   j=2: coord[2] = 57.75N (line 1)                          │
│     ✗ Cannot pair (both Northing)... wait, NO!             │
│     ❌ BUG: No axis check! bounds.covers(57.5, 57.75) = ✓  │
│     → Point 2: N 57.5, E 57.75 ✗ WRONG AXIS!               │
│     → Mark [0] and [2] as used                             │
│     ❌ BUG: No break! Loop continues...                     │
│                                                             │
│   j=3: coord[3] = 12.5E (line 1)                           │
│     ✓ Can pair (N + E, both in bounds)                     │
│     → Point 3: N 57.5, E 12.5 ✗ CROSS-LINE!                │
│     → Mark [0] and [3] as used                             │
│     ❌ BUG: No break! Loop continues...                     │
│                                                             │
│   j=4: coord[4] = 58.0N (line 2)                           │
│     ❌ BUG: No axis check! bounds.covers(57.5, 58.0) = ✓   │
│     → Point 4: N 57.5, E 58.0 ✗ WRONG AXIS!                │
│     → Mark [0] and [4] as used                             │
│     ❌ BUG: No break! Loop continues...                     │
│                                                             │
│   j=5: coord[5] = 12.75E (line 2)                          │
│     ✓ Can pair (N + E, both in bounds)                     │
│     → Point 5: N 57.5, E 12.75 ✗ CROSS-LINE!               │
│     → Mark [0] and [5] as used                             │
│                                                             │
│ i=1: SKIP (already used)                                   │
│ i=2: SKIP (already used)                                   │
│ i=3: SKIP (already used)                                   │
│ i=4: SKIP (already used)                                   │
│ i=5: SKIP (already used)                                   │
└─────────────────────────────────────────────────────────────┘

Result: 5 points (3 incorrect)
```

## Fixed Algorithm Flow (With Break + Axis Check)

```
Step 2: Pairing Loop (FIXED)
┌─────────────────────────────────────────────────────────────┐
│ i=0: coord[0] = 57.5N (line 0)                             │
│   j=1: coord[1] = 12.25E (line 0)                          │
│     ✓ Axis check: N + E ✓                                  │
│     ✓ Bounds check: (57.5, 12.25) in bounds ✓              │
│     → Point 1: N 57.5, E 12.25 ✓ CORRECT                   │
│     → Mark [0] and [1] as used                             │
│     ✓ BREAK! Exit inner loop                               │
│                                                             │
│ i=1: SKIP (already used)                                   │
│                                                             │
│ i=2: coord[2] = 57.75N (line 1)                            │
│   j=3: coord[3] = 12.5E (line 1)                           │
│     ✓ Axis check: N + E ✓                                  │
│     ✓ Bounds check: (57.75, 12.5) in bounds ✓              │
│     → Point 2: N 57.75, E 12.5 ✓ CORRECT                   │
│     → Mark [2] and [3] as used                             │
│     ✓ BREAK! Exit inner loop                               │
│                                                             │
│ i=3: SKIP (already used)                                   │
│                                                             │
│ i=4: coord[4] = 58.0N (line 2)                             │
│   j=5: coord[5] = 12.75E (line 2)                          │
│     ✓ Axis check: N + E ✓                                  │
│     ✓ Bounds check: (58.0, 12.75) in bounds ✓              │
│     → Point 3: N 58.0, E 12.75 ✓ CORRECT                   │
│     → Mark [4] and [5] as used                             │
│     ✓ BREAK! Exit inner loop                               │
│                                                             │
│ i=5: SKIP (already used)                                   │
└─────────────────────────────────────────────────────────────┘

Result: 3 points (all correct)
```

## Optimized Algorithm Flow (With Scoring)

```
Step 2a: Generate All Possible Pairings
┌─────────────────────────────────────────────────────────────┐
│ Pairing [0,1]: N 57.5 (line 0) + E 12.25 (line 0)         │
│   Score: 1.0 (base 0.5 + same line 0.5)                   │
│                                                             │
│ Pairing [0,3]: N 57.5 (line 0) + E 12.5 (line 1)          │
│   Score: 0.5 (base only, different lines)                 │
│                                                             │
│ Pairing [0,5]: N 57.5 (line 0) + E 12.75 (line 2)         │
│   Score: 0.5 (base only, different lines)                 │
│                                                             │
│ Pairing [2,1]: N 57.75 (line 1) + E 12.25 (line 0)        │
│   Score: 0.5 (base only, different lines)                 │
│                                                             │
│ Pairing [2,3]: N 57.75 (line 1) + E 12.5 (line 1)         │
│   Score: 1.0 (base 0.5 + same line 0.5)                   │
│                                                             │
│ Pairing [2,5]: N 57.75 (line 1) + E 12.75 (line 2)        │
│   Score: 0.5 (base only, different lines)                 │
│                                                             │
│ Pairing [4,1]: N 58.0 (line 2) + E 12.25 (line 0)         │
│   Score: 0.5 (base only, different lines)                 │
│                                                             │
│ Pairing [4,3]: N 58.0 (line 2) + E 12.5 (line 1)          │
│   Score: 0.5 (base only, different lines)                 │
│                                                             │
│ Pairing [4,5]: N 58.0 (line 2) + E 12.75 (line 2)         │
│   Score: 1.0 (base 0.5 + same line 0.5)                   │
└─────────────────────────────────────────────────────────────┘

Step 2b: Sort by Score (Descending)
┌─────────────────────────────────────────────────────────────┐
│ 1. [0,1]: Score 1.0 ← Same line                            │
│ 2. [2,3]: Score 1.0 ← Same line                            │
│ 3. [4,5]: Score 1.0 ← Same line                            │
│ 4. [0,3]: Score 0.5                                        │
│ 5. [0,5]: Score 0.5                                        │
│ 6. [2,1]: Score 0.5                                        │
│ 7. [2,5]: Score 0.5                                        │
│ 8. [4,1]: Score 0.5                                        │
│ 9. [4,3]: Score 0.5                                        │
└─────────────────────────────────────────────────────────────┘

Step 2c: Greedy Selection (Non-Overlapping)
┌─────────────────────────────────────────────────────────────┐
│ Select [0,1]: Score 1.0                                    │
│   → Point 1: N 57.5, E 12.25 ✓                            │
│   → Mark [0] and [1] as used                               │
│                                                             │
│ Select [2,3]: Score 1.0                                    │
│   → Point 2: N 57.75, E 12.5 ✓                            │
│   → Mark [2] and [3] as used                               │
│                                                             │
│ Select [4,5]: Score 1.0                                    │
│   → Point 3: N 58.0, E 12.75 ✓                            │
│   → Mark [4] and [5] as used                               │
│                                                             │
│ Skip [0,3]: [0] already used                               │
│ Skip [0,5]: [0] already used                               │
│ Skip [2,1]: [2] and [1] already used                       │
│ Skip [2,5]: [2] already used                               │
│ Skip [4,1]: [4] and [1] already used                       │
│ Skip [4,3]: [4] and [3] already used                       │
└─────────────────────────────────────────────────────────────┘

Result: 3 points (all correct, all same-line)
```

## Key Differences

| Aspect | Current (Buggy) | Fixed (Break + Axis) | Optimized (Scoring) |
|--------|----------------|---------------------|---------------------|
| **Algorithm Type** | Greedy (broken) | Greedy | Greedy with scoring |
| **Axis Validation** | ❌ No | ✓ Yes | ✓ Yes |
| **Break After Match** | ❌ No | ✓ Yes | N/A (different approach) |
| **Line Proximity** | ❌ Ignored | ❌ Ignored | ✓ Prioritized |
| **Result Quality** | 5 points (3 wrong) | 3 points (all correct) | 3 points (all correct, optimal) |
| **Complexity** | O(n²) | O(n²) | O(n² log n) |

## Recommendation

1. **Immediate:** Implement "Fixed" version (break + axis check)
2. **Future:** Consider "Optimized" version for complex cases with ambiguous pairings
