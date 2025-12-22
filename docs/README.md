# CoordFinder - JavaScript Coordinate Parser

A JavaScript library for extracting and parsing coordinate pairs from text in various formats.

## Features

- Parses multiple coordinate formats:
  - Decimal degrees (e.g., `58.8`, `10,9`)
  - Degrees and minutes (e.g., `58°54,0'N`)
  - Degrees, minutes, and seconds (e.g., `58°54'30"N`)
  - Meter-based coordinates (SWEREF99TM, RT90, etc.)

- Supports multiple reference systems:
  - WGS84 (global and Northern Europe)
  - SWEREF99 TM
  - RT90 2.5 gon V
  - ETRS89, ETRS-LAEA, ETRS-LCC

- Features:
  - Automatic coordinate system detection
  - Coordinate reprojection (requires proj4js)
  - Rating system for coordinate confidence
  - Context extraction (text before/after coordinates)
  - Grouping of coordinates by text structure
  - Multiple output formats

## Usage

### Basic Usage

```javascript
// Get first coordinate pair from text
var point = CF.pointIn(text);
console.log(point.latitude(), point.longitude());

// Get all coordinate pairs
var points = CF.pointsIn(text);
points.forEach(function(p) {
    console.log(p.asText());
});

// Get grouped coordinates
var groups = CF.groupsIn(text);
```

### Advanced Usage

```javascript
// Create instance for detailed control
var cf = new CF();
cf.parse(text, {grouping: true});

// Get points above rating threshold
var points = cf.points({rating: 0.7});

// Get parse log
console.log(cf.log());

// Get unused coordinates
var unused = cf.unusedCoords();
```

### Output Formatting

```javascript
var point = CF.pointIn(text);

// Different formats
point.asText({format: 'plain'});                    // "58.9 10.9"
point.asText({format: 'degrees'});                  // "N 58.9, E 10.9"
point.asText({directionLetter: 'after'});           // "58.9 N, 10.9 E"
point.asText({compact: true});                      // "N58.9 E10.9"
point.asText({localized: false});                   // Use period as decimal separator
```

## Example

```javascript
var text = `Report: 
"The ship was seen drifting about 200 meters west of the island at 58.8 and 10,9. Nothing seen around it.

Observation made at 10 minutes past 14 from the lighthouse at 58°54,0'N, 011 00,0 E."`;

var points = CF.pointsIn(text);
console.log("Found " + points.length + " coordinate pairs");

points.forEach(function(point) {
    console.log("Coordinates: " + point.asText());
    console.log("Lat/Lng: " + point.latitude() + ", " + point.longitude());
    console.log("Rating: " + point.rating());
    console.log("Context: " + point.context({maxChars: 30}));
});
```

## API Reference

### Static Methods

- `CF.pointIn(text)` - Returns first Point found or null
- `CF.pointsIn(text)` - Returns array of all Points found
- `CF.groupsIn(text)` - Returns array of Point groups

### Instance Methods

- `parse(text, opts)` - Parse text for coordinates
- `points(opts)` - Get Points above rating threshold
- `groups(opts)` - Get grouped Points
- `unusedCoords()` - Get coordinates that weren't paired
- `log()` - Get parsing log
- `foundRatings()` - Get array of found ratings
- `ratingIndex(rating)` - Get index for a rating value

### Point Methods

- `latitude()` - Get WGS84 latitude
- `longitude()` - Get WGS84 longitude
- `asText(opts)` - Format as text
- `rating()` - Get confidence rating (0-1)
- `reprojectTo(refSys)` - Reproject to another system
- `context(opts)` - Get surrounding text
- `originalText()` - Get original coordinate text

## Testing

Open `test-coordfinder.html` in a web browser to run the test suite.

## Dependencies

- proj4js (optional, for coordinate reprojection)

## License

MIT License
