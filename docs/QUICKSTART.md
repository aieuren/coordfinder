# CoordFinder Quickstart Guide

## Installation

```bash
npm install coordfinder
```

Or include directly in HTML:

```html
<script src="src/coordfinder.js"></script>
```

## Basic Usage

### Find a Single Coordinate

```javascript
var point = CF.pointIn("59.32894 18.06491");
console.log(point.latitude());  // 59.32894
console.log(point.longitude()); // 18.06491
console.log(point.crs.name);    // "WGS84"
```

### Find Multiple Coordinates

```javascript
var points = CF.pointsIn("First: 59.32894 18.06491, Second: 62.39113 17.30654");
console.log(points.length); // 2
points.forEach(function(p) {
    console.log(p.latitude(), p.longitude());
});
```

### Get Uncertainty Information

```javascript
var point = CF.pointIn("59.32894 18.06491");
var uncertainty = point.uncertaintyMeters();
console.log(uncertainty.north); // Uncertainty in meters (north)
console.log(uncertainty.east);  // Uncertainty in meters (east)
```

## Supported Formats

### WGS84 Coordinates

```javascript
CF.pointIn("59.32894 18.06491")           // Decimal degrees
CF.pointIn("59° 19.736' N 18° 3.895' E")  // Degrees-minutes
CF.pointIn("59° 19' 44\" N 18° 3' 54\" E") // Degrees-minutes-seconds
CF.pointIn("N 59.32894 E 18.06491")       // With compass directions
```

### Swedish Grid Systems

```javascript
CF.pointIn("6580000, 674000")             // SWEREF99 TM
CF.pointIn("6480082, 1372031")            // RT90 2.5 gon V
CF.pointIn("N: 6580000 E: 674000")        // With prefixes
```

### URL Formats

```javascript
CF.pointIn("https://www.google.com/maps/@59.32894,18.06491")
CF.pointIn("map/59.329440/18.064510")
```

### Data Formats

```javascript
CF.pointIn('{"coordinates": [18.06491, 59.32894]}')  // GeoJSON
CF.pointIn('<gml:pos>59.32894 18.06491</gml:pos>')   // GML
CF.pointIn('POINT(18.06491 59.32894)')               // WKT
```

## Running Tests

### Command Line

```bash
npm test
```

### Browser

Open `tests/test-runner-md.html` in your browser.

## Advanced Usage

### Custom Parsing Options

```javascript
var cf = new CF();
cf.parse("Your text with coordinates", {
    grouping: true  // Group nearby coordinates
});

var points = cf.points();
var groups = cf.groups();
```

### Access Raw Snippets

```javascript
var cf = new CF();
cf.parse("59.32894 18.06491");

var snippets = cf._snippets;  // Raw parsed snippets
var coords = cf._coords;      // Individual coordinates
```

## API Reference

### Main Functions

- `CF.pointIn(text)` - Find first coordinate in text
- `CF.pointsIn(text)` - Find all coordinates in text
- `CF.groupsIn(text)` - Find grouped coordinates

### Point Object

- `point.latitude()` - Get latitude
- `point.longitude()` - Get longitude
- `point.crs` - Coordinate reference system
- `point.uncertaintyMeters()` - Get uncertainty in meters
- `point.asText()` - Format as text

## Examples

See `examples/demo.html` for interactive examples.

## Documentation

- [Full Documentation](README.md)
- [Test Framework](TEST_FRAMEWORK.md)
- [Implementation Details](IMPLEMENTATION.md)

## Support

- GitHub: https://github.com/aieuren/coordfinder
- Issues: https://github.com/aieuren/coordfinder/issues
