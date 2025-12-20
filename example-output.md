# CoordFinder Example Output

## Input Text

```
Report: 
"The ship was seen drifting about 200 meters west of the island at 58.8 and 10,9. Nothing seen around it.

Observation made at 10 minutes past 14 from the lighthouse at 58°54,0'N, 011 00,0 E."
```

## Expected Results

### Coordinates Found

The parser should identify these coordinate patterns:

1. **58.8** - Decimal degrees (latitude)
2. **10,9** - Decimal degrees with comma separator (longitude)
3. **58°54,0'N** - Degrees and minutes with direction letter (latitude)
4. **011 00,0 E** - Degrees and minutes with direction letter (longitude)

### Coordinate Pairs

The parser should create these coordinate pairs:

**Point 1:**
- Coordinates: 58.8, 10.9
- Format: Decimal degrees
- Reference System: WGS84 Northern Europe
- Rating: ~0.6 (no direction letters, but valid range)
- Context: "...island at [58.8 and 10,9] . Nothing..."

**Point 2:**
- Coordinates: 58°54.0'N, 11°00.0'E
- Decimal equivalent: 58.9°N, 11.0°E
- Format: Degrees and minutes
- Reference System: WGS84 Northern Europe
- Rating: ~0.9 (has direction letters, same line)
- Context: "...lighthouse at [58°54,0'N, 011 00,0 E] ."

### Features Demonstrated

1. **Multiple formats**: Handles both decimal degrees and degrees+minutes
2. **Comma as decimal separator**: Correctly parses "10,9" and "54,0"
3. **Direction letters**: Recognizes N, E direction indicators
4. **Leading zeros**: Handles "011" correctly
5. **Rating system**: Higher rating for coordinates with direction letters
6. **Context extraction**: Shows surrounding text for each coordinate pair

## Usage Examples

```javascript
// Get all points
var points = CF.pointsIn(text);
// Returns: 2 points

// Get first point only
var first = CF.pointIn(text);
// Returns: Point at 58.8, 10.9

// Get high-confidence points only
var cf = new CF();
cf.parse(text);
var highConfidence = cf.points({rating: 0.8});
// Returns: 1 point (the one with direction letters)

// Format output
points[0].asText({format: 'plain'});
// Returns: "58,8, 10,9" (localized)

points[1].asText({format: 'degrees', directionLetter: 'after'});
// Returns: "58,9 N, 11,0 E"
```

## Implementation Notes

The implementation:
- Uses regex patterns to identify coordinate formats
- Tries to pair coordinates into valid points
- Validates against reference system bounding boxes
- Rates coordinate pairs based on confidence factors
- Preserves original text and context for each coordinate
