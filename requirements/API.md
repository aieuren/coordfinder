# CoordFinder API Documentation

Version: 5.0-beta.4

## Overview

CoordFinder provides a JavaScript API for extracting geographic coordinates from text. The library can be used in both browser and Node.js environments.

**Related Documentation:**
- [INTERFACE-COMPATIBILITY.md](INTERFACE-COMPATIBILITY.md) - Interface compatibility test results
- [REQUIREMENTS.md](REQUIREMENTS.md) - Functional requirements
- [coordfinder-interface.js](coordfinder-interface.js) - Interface definition

## Static Methods

### CF.pointIn(text)

Extract the first coordinate point from text.

**Parameters:**
- `text` (string): Text to parse

**Returns:**
- `Point` object or `null` if no coordinates found

**Example:**
```javascript
var point = CF.pointIn("Position: 59.32894 18.06491");
if (point) {
  console.log(point.latitude(), point.longitude());
}
```

### CF.pointsIn(text)

Extract all coordinate points from text.

**Parameters:**
- `text` (string): Text to parse

**Returns:**
- Array of `Point` objects (empty array if none found)

**Example:**
```javascript
var points = CF.pointsIn("Start: 59.32894 18.06491, End: 60.5 19.2");
points.forEach(function(p) {
  console.log(p.latitude(), p.longitude());
});
```

### CF.groupsIn(text)

Extract coordinate points grouped by proximity or context.

**Parameters:**
- `text` (string): Text to parse

**Returns:**
- Array of `Group` objects

**Example:**
```javascript
var groups = CF.groupsIn(text);
groups.forEach(function(g) {
  console.log("Group with", g.points.length, "points");
});
```

## Instance Methods

### new CF()

Create a new CoordFinder instance for advanced usage.

**Example:**
```javascript
var cf = new CF();
cf.parse(text);
var points = cf.points();
```

### cf.parse(text, options)

Parse text to find coordinates.

**Parameters:**
- `text` (string): Text to parse
- `options` (object, optional):
  - `grouping` (boolean): Enable grouping of points

**Returns:**
- The CF instance (for chaining)

### cf.points(options)

Get extracted points.

**Parameters:**
- `options` (object, optional):
  - `minRating` (number): Minimum quality rating (0.0-1.0)

**Returns:**
- Array of `Point` objects

### cf.groups(options)

Get grouped points.

**Parameters:**
- `options` (object, optional):
  - `minRating` (number): Minimum quality rating

**Returns:**
- Array of `Group` objects

## Point Object

Represents a geographic coordinate point.

### Properties

- `N` (number): Northing value (latitude or northing in meters)
- `E` (number): Easting value (longitude or easting in meters)
- `refsys` (RefSys): Reference system (WGS84, SWEREF99TM, RT90, etc.)

### Methods

#### point.latitude()

Get latitude in decimal degrees (WGS84).

**Returns:**
- `number`: Latitude value

**Note:** Automatically reprojects if coordinate is in different system.

#### point.longitude()

Get longitude in decimal degrees (WGS84).

**Returns:**
- `number`: Longitude value

**Note:** Automatically reprojects if coordinate is in different system.

#### point.first()

Get first component (northing/latitude).

**Returns:**
- `number`: First coordinate component in original reference system

#### point.last()

Get second component (easting/longitude).

**Returns:**
- `number`: Second coordinate component in original reference system

#### point.asText(options)

Format coordinate as text.

**Parameters:**
- `options` (object, optional):
  - `format` (string): Output format
    - `"degs"`: Decimal degrees (default)
    - `"degsMins"`: Degrees and minutes
    - `"degsMinsSecs"`: Degrees, minutes, seconds
  - `decimals` (number): Number of decimals
  - `separator` (string): Separator between components

**Returns:**
- `string`: Formatted coordinate

**Example:**
```javascript
point.asText({format: "degsMins", decimals: 3});
// "59° 19.736' N 18° 3.895' E"
```

#### point.rating()

Get quality rating for this coordinate.

**Returns:**
- `number`: Rating between 0.0 and 1.0

**Rating interpretation:**
- `1.0`: High confidence (clear coordinate format)
- `0.5`: Medium confidence (ambiguous format)
- `0.0`: Low confidence (may be other numeric data)

#### point.textBefore(maxChars)

Get text before coordinate in source.

**Parameters:**
- `maxChars` (number, optional): Maximum characters to return

**Returns:**
- `string`: Text before coordinate

#### point.textAfter(maxChars)

Get text after coordinate in source.

**Parameters:**
- `maxChars` (number, optional): Maximum characters to return

**Returns:**
- `string`: Text after coordinate

#### point.context(options)

Get context around coordinate.

**Parameters:**
- `options` (object, optional):
  - `maxChars` (number): Maximum characters before/after

**Returns:**
- `object`: `{before: string, after: string}`

#### point.reprojectTo(refSys)

Reproject coordinate to different reference system.

**Parameters:**
- `refSys` (RefSys): Target reference system

**Returns:**
- `Point`: New point in target system

**Example:**
```javascript
var wgs84Point = swerefPoint.reprojectTo(RefSys.WGS84);
```

## RefSys Object

Reference system definitions.

### Available Systems

- `RefSys.WGS84`: WGS84 (EPSG:4326)
- `RefSys.SWEREF99TM`: SWEREF 99 TM (EPSG:3006)
- `RefSys.RT90`: RT90 2.5 gon V (EPSG:3021)
- `RefSys.Unknown`: Unknown system

### Properties

- `name` (string): System name
- `epsg` (number): EPSG code
- `unit` (CoordUnit): Unit type (Degrees or Meters)
- `bbox` (BoundingBox): Valid coordinate range

## Group Object

Represents a group of related coordinate points.

### Properties

- `points` (Array): Array of `Point` objects in group
- `bbox` (BoundingBox): Bounding box containing all points

## Library Metadata

### CF.version

Library version string.

**Example:**
```javascript
console.log(CF.version); // "5.0-beta.4"
```

### CF.build

Build timestamp.

**Example:**
```javascript
console.log(CF.build); // "20251229-044455"
```

### CF.author

Author information.

### CF.license

License type (MIT).

## Usage Examples

### Basic extraction

```javascript
var text = "Ship at 59°32'N 18°04'E";
var point = CF.pointIn(text);
console.log(point.latitude(), point.longitude());
```

### Multiple coordinates

```javascript
var text = `
  Point 1: 60 30,5 19 15,25
  Point 2: 60 35,8 19 20,4
`;
var points = CF.pointsIn(text);
console.log("Found", points.length, "points");
```

### Different coordinate systems

```javascript
var text = "SWEREF: 6580000 540000";
var point = CF.pointIn(text);
console.log("System:", point.refsys.name);
console.log("WGS84:", point.latitude(), point.longitude());
```

### Quality filtering

```javascript
var cf = new CF();
cf.parse(text);
var highQuality = cf.points({minRating: 0.8});
```

### Format conversion

```javascript
var point = CF.pointIn("59.32894 18.06491");
console.log(point.asText({format: "degsMins"}));
// "59° 19.736' N 18° 3.895' E"
```

## Browser Usage

```html
<script src="coordfinder.js"></script>
<script>
  var points = CF.pointsIn(document.body.innerText);
  console.log("Found", points.length, "coordinates");
</script>
```

## Node.js Usage

```javascript
var fs = require('fs');
eval(fs.readFileSync('./coordfinder.js', 'utf8'));

var text = fs.readFileSync('data.txt', 'utf8');
var points = CF.pointsIn(text);
```

## Error Handling

The library does not throw exceptions. Invalid coordinates are silently ignored.

- `CF.pointIn()` returns `null` if no coordinates found
- `CF.pointsIn()` returns empty array if no coordinates found
- Invalid coordinate values are filtered out during parsing
- Out-of-range values are rejected based on reference system bounds
