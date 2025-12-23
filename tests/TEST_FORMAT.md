# Test File Format

Test files use Markdown format with specific structure for defining coordinate parsing tests.

## Test Types

### Point Test
Tests that expect exactly one coordinate pair.

```markdown
## Point Test: Test name
Test-ID: tdd-001
Input: "59.32894 18.06491"
Expected:
- Coords: 59.32894 18.06491
```

### Points Test
Tests that expect zero or more coordinate pairs.

```markdown
## Points Test: Test name
Test-ID: tdd-016
Input: "Lat: 60.12345\nLong: 19.54321"
Expected:
- Count: 1
```

## Expected Fields

### Count (required for Points Test)
Number of coordinate pairs expected to be found.

```markdown
Expected:
- Count: 3
```

Use `Count: 0` for negative tests (should not match).

### Coords (optional)
Exact coordinates expected. Validates both count AND coordinate values.

**Single point:**
```markdown
Expected:
- Count: 1
- Coords: 58.50 12.75
```

**Multiple points:**
```markdown
Expected:
- Count: 2
- Coords: 58.50 12.75
- Coords: 59.00 13.00
```

### CRS (optional)
Expected Coordinate Reference System. Validates that parser identified correct CRS.

```markdown
Expected:
- Count: 1
- CRS: SWEREF99TM
```

**Valid CRS values:**
- `WGS84` - World Geodetic System 1984 (decimal degrees)
- `SWEREF99TM` - Swedish reference system
- `RT90` - Swedish RT90 system

**CRS matching:** Case-insensitive, ignores spaces. "RT90" matches "RT90 2.5 gon V".

## Complete Examples

### Basic decimal coordinates
```markdown
## Point Test: Enkel decimalform
Test-ID: tdd-001
Input: "59.32894 18.06491"
Expected:
- Coords: 59.32894 18.06491
```

### SWEREF with CRS validation
```markdown
## Points Test: SWEREF 99 TM grundformat
Test-ID: tdd-018
Input: "6580000 540000"
Expected:
- Count: 1
- CRS: SWEREF99TM
```

### Multiple points with coordinates
```markdown
## Points Test: Numrerad lista
Test-ID: tdd-017
Input: "1) 57°30'N 12°15'E\n2) 57°45'N 12°30'E\n3) 58°00'N 12°45'E"
Expected:
- Count: 3
- Coords: 57.50 12.25
- Coords: 57.75 12.50
- Coords: 58.00 12.75
```

### Negative test (should not match)
```markdown
## Points Test: Telefonnummer ska inte matcha
Test-ID: tdd-032
Input: "Ring 08-123 45 67"
Expected:
- Count: 0
```

## Notes

- Input must be quoted with `"` if on same line as `Input:`
- Coordinates format: `latitude longitude` (space-separated)
- Use `\n` for line breaks in input strings
- Test-ID should be unique across all test files
- Suite names (headers with `===`) are used for grouping in output
