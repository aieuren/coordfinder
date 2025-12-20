# CoordFinder Quick Start

## Installation

Simply include the `coordfinder.js` file in your HTML:

```html
<script src="coordfinder.js"></script>
```

Or in Node.js:

```javascript
require('./coordfinder.js');
```

## 5-Minute Tutorial

### 1. Find First Coordinate

```javascript
var text = "The location is at 58.8 and 10,9";
var point = CF.pointIn(text);

console.log(point.latitude());   // 58.8
console.log(point.longitude());  // 10.9
```

### 2. Find All Coordinates

```javascript
var text = "First point: 58.8, 10.9. Second point: 59°N, 11°E";
var points = CF.pointsIn(text);

console.log("Found " + points.length + " points");
// Output: Found 2 points
```

### 3. Format Output

```javascript
var point = CF.pointIn("Location: 58°54'N, 11°00'E");

// Different formats
point.asText({format: 'plain'});
// Output: "58,9, 11,0"

point.asText({format: 'degrees', directionLetter: 'after'});
// Output: "58,9 N, 11,0 E"

point.asText({localized: false});
// Output: "58.9, 11.0"
```

### 4. Get Context

```javascript
var text = "The ship was at 58.8 and 10,9 near the island";
var point = CF.pointIn(text);

console.log(point.context({maxChars: 20}));
// Output: "...was at [58.8 and 10,9] near..."
```

### 5. Filter by Confidence

```javascript
var cf = new CF();
cf.parse(text);

// Get only high-confidence coordinates
var goodPoints = cf.points({rating: 0.8});

// Check rating
goodPoints.forEach(function(p) {
    console.log("Rating: " + p.rating());
});
```

## Common Patterns

### Parse Maritime Report

```javascript
var report = `
Position report:
Ship A: 58°54'N, 011°00'E
Ship B: 59.1, 10.8
`;

var points = CF.pointsIn(report);
points.forEach(function(p, i) {
    console.log("Ship " + (i+1) + ": " + 
                p.latitude() + ", " + 
                p.longitude());
});
```

### Handle Multiple Formats

```javascript
var mixed = `
Decimal: 58.8, 10.9
Degrees: 58°54'N, 11°00'E
DMS: 58°54'30"N, 11°00'15"E
`;

var points = CF.pointsIn(mixed);
// All formats are automatically detected
```

### Group Coordinates

```javascript
var text = `
Group 1:
Point A: 58.8, 10.9
Point B: 58.9, 11.0

Group 2:
Point C: 59.0, 11.1
`;

var groups = CF.groupsIn(text);
console.log("Found " + groups.length + " groups");
// Output: Found 2 groups
```

## Testing Your Implementation

Open `test-coordfinder.html` in your browser to see a complete test suite with:
- Multiple coordinate formats
- Rating system demonstration
- Context extraction
- Different output formats
- Parse logging

## Next Steps

- Read `README.md` for complete API documentation
- Check `example-output.md` for expected behavior
- Review `IMPLEMENTATION.md` for technical details

## Common Issues

**Q: Coordinates not found?**
- Check if format is supported (see README.md)
- Verify coordinates are within valid ranges
- Use `cf.log()` to see parse details

**Q: Wrong coordinate pairs?**
- Check ratings with `point.rating()`
- Use higher rating threshold: `cf.points({rating: 0.8})`
- Review context with `point.context()`

**Q: Need to reproject coordinates?**
- Include proj4js library
- Use `point.reprojectTo(CF.RefSys.SWEREF99TM)`

## Support

For issues or questions, review the implementation files:
- `coordfinder.js` - Source code
- `README.md` - API reference
- `IMPLEMENTATION.md` - Technical details
