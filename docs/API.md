# CoordFinder API Documentation

## Quick Start

```javascript
// Simple usage - get all coordinates
var points = CF.pointsIn("Ship at 59.32894 18.06491");

// Advanced usage - with options
var cf = new CF();
cf.parse("Ship at 59.32894 18.06491");
var highQuality = cf.points({rating: 0.8});
```

## Static Methods

### CF.pointsIn(text)

Parse text and return all coordinate points with default rating threshold (0.5).

**Parameters:**
- `text` (string): Text containing coordinates

**Returns:** Array of Point objects

**Example:**
```javascript
var points = CF.pointsIn("N59.32894 E18.06491");
// Returns: [Point]
```

### CF.pointIn(text)

Parse text and return the first coordinate point found.

**Parameters:**
- `text` (string): Text containing coordinates

**Returns:** Point object or null

**Example:**
```javascript
var point = CF.pointIn("59.32894 18.06491");
console.log(point.latitude());  // 59.32894
```

## CoordFinder Instance

### new CF()

Create a new CoordFinder instance for parsing coordinates.

**Example:**
```javascript
var cf = new CF();
cf.parse("Multiple coords: 59.32 18.06 and 58.41 12.56");
var points = cf.points();
```

### cf.parse(text)

Parse text to find coordinates.

**Parameters:**
- `text` (string): Text to parse

**Returns:** void (results accessed via other methods)

### cf.points(options)

Get parsed coordinate points.

**Parameters:**
- `options` (object, optional):
  - `rating` (number): Minimum quality rating (0-1), default: 0.5

**Returns:** Array of Point objects sorted by rating (highest first)

**Example:**
```javascript
var allPoints = cf.points();              // rating >= 0.5
var highQuality = cf.points({rating: 0.8}); // rating >= 0.8
```

### cf.foundRatings()

Get list of unique rating values found.

**Returns:** Array of numbers

### cf.ratingIndex(rating)

Get points grouped by rating level.

**Parameters:**
- `rating` (number): Rating threshold

**Returns:** Array of Point objects

### cf.groups(options)

Get coordinate groups (coordinates close together).

**Parameters:**
- `options` (object, optional):
  - `rating` (number): Minimum quality rating

**Returns:** Array of point groups

## Point Object

### Coordinate Access

#### point.latitude()

Get latitude in WGS84 decimal degrees.

**Returns:** number

#### point.longitude()

Get longitude in WGS84 decimal degrees.

**Returns:** number

#### point.N

Northing coordinate object with:
- `value` (number): Coordinate value
- `axis` (CoordAxis): Axis type
- `parsedFrom` (Snippet): Parse information

#### point.E

Easting coordinate object (same structure as N).

### Coordinate System

#### point.refsys

Reference system object:
- `RefSys.WGS84` - WGS84 (lat/lon)
- `RefSys.SWEREF99TM` - SWEREF99 TM
- `RefSys.RT90` - RT90 2.5 gon V

#### point.reprojectTo(refsys)

Reproject point to another coordinate system.

**Parameters:**
- `refsys` (RefSys): Target reference system

**Returns:** New Point object

**Example:**
```javascript
var wgs = point.reprojectTo(RefSys.WGS84);
var sweref = point.reprojectTo(RefSys.SWEREF99TM);
```

### Quality & Context

#### point.rating()

Get quality rating (0-1) based on coordinate precision and format.

**Returns:** number

**Rating levels:**
- 1.0: Exact coordinates with high precision
- 0.9: High precision (5+ decimals)
- 0.8: Good precision (3-4 decimals)
- 0.7: Medium precision (1-2 decimals)
- 0.6: Low precision (whole numbers)
- 0.5: Minimal precision

#### point.ratingLog()

Get human-readable explanation of rating.

**Returns:** string

#### point.originalText(options)

Get original text that was parsed.

**Parameters:**
- `options` (object, optional):
  - `maxchars` (number): Maximum characters to include
  - `ellipse` (boolean): Add "..." when truncated, default: true if maxchars > 0
  - `html` (boolean): Format with HTML tags

**Returns:** string

**Example:**
```javascript
point.originalText();                    // "59.32894 18.06491"
point.originalText({maxchars: 10});      // "...94 18.06491"
point.originalText({html: true});        // "<b>59.32894</b> <b>18.06491</b>"
```

#### point.context(options)

Get coordinate with surrounding context.

**Parameters:**
- `options` (object, optional):
  - `maxchars` (number): Maximum context characters, default: 12
  - `ellipse` (boolean): Add "..." when truncated, default: true
  - `html` (boolean): Format with HTML tags

**Returns:** string

**Example:**
```javascript
// Input: "Ship at 59.32894 18.06491 here"
point.context();  // "Ship at [59.32894 18.06491] here"
```

#### point.textBefore(options)

Get text before coordinate.

**Parameters:**
- `options` (object, optional):
  - `maxchars` (number): Maximum characters
  - `ellipse` (boolean): Add "..." when truncated

**Returns:** string

#### point.textAfter(options)

Get text after coordinate.

**Parameters:** Same as textBefore

**Returns:** string

### Output Formatting

#### point.asText(options)

Format coordinate as text.

**Parameters:**
- `options` (object, optional):
  - `format` (string): Output format
    - `'plain'` (default): Simple decimal format
    - `'degrees'`: Decimal degrees with symbols
    - `'degreesandminutes'`: Degrees and minutes
    - `'degreesminutesandseconds'`: Degrees, minutes, seconds
  - `directionLetter` (string): Direction letter placement
    - `null` (default): No direction letters
    - `'before'`: N59.32894 E18.06491
    - `'after'`: 59.32894N 18.06491E
    - `'none'`: No direction letters
  - `compact` (boolean): Compact format, default: false
  - `localized` (boolean): Use comma as decimal separator, default: true
  - `symbols` (boolean): Use degree symbols, default: false
  - `decimals` (number|string): Decimal places, default: 'auto'

**Returns:** string

**Examples:**
```javascript
point.asText();                                    // "59.32894 18.06491"
point.asText({format: 'degrees'});                 // "59.32894° 18.06491°"
point.asText({directionLetter: 'before'});         // "N59.32894 E18.06491"
point.asText({format: 'degreesandminutes'});       // "59°19.736' 18°3.895'"
point.asText({compact: true});                     // "59.3289418.06491"
point.asText({localized: false});                  // "59.32894 18.06491"
```

### Precision & Uncertainty

#### point.maxErrors()

Get maximum coordinate errors in meters.

**Returns:** Object with `N` and `E` properties (meters)

**Example:**
```javascript
var errors = point.maxErrors();
console.log(errors.N);  // e.g., 11.1 meters
console.log(errors.E);  // e.g., 8.5 meters
```

#### point.maxErrorBounds()

Get bounding box representing maximum coordinate uncertainty.

**Returns:** BoundingBox object

**Example:**
```javascript
var bounds = point.maxErrorBounds();
console.log(bounds.minLat, bounds.minLon);
console.log(bounds.maxLat, bounds.maxLon);
```

### Order & Position

#### point.first()

Get first coordinate (N or E) based on parse order.

**Returns:** Coordinate object (N or E)

#### point.last()

Get last coordinate based on parse order.

**Returns:** Coordinate object (N or E)

#### point.original()

Get coordinate in original reference system (before reprojection).

**Returns:** Point object or null

## Constants

### RefSys (Reference Systems)

- `RefSys.WGS84` - WGS84 (latitude/longitude)
- `RefSys.SWEREF99TM` - SWEREF99 TM (Swedish grid)
- `RefSys.RT90` - RT90 2.5 gon V (Swedish grid)
- `RefSys.Unknown` - Unknown reference system

### CoordFormat

- `CoordFormat.Plain` - Plain numbers
- `CoordFormat.Degs` - Decimal degrees
- `CoordFormat.DegsMins` - Degrees and minutes
- `CoordFormat.DegsMinsSecs` - Degrees, minutes, seconds
- `CoordFormat.Meters` - Meter-based coordinates

### Default Values

- `CF.ratingDefault` - Default rating threshold: 0.5
- `CF.version` - Library version
- `CF.build` - Build number

## Examples

### Basic Parsing

```javascript
// Parse single coordinate
var point = CF.pointIn("59.32894 18.06491");
console.log(point.latitude(), point.longitude());

// Parse multiple coordinates
var points = CF.pointsIn("First: 59.32 18.06, Second: 58.41 12.56");
points.forEach(p => console.log(p.asText()));
```

### Quality Filtering

```javascript
var cf = new CF();
cf.parse("Approximate: 59.3 18.1, Precise: 59.32894 18.06491");

var all = cf.points();              // All points (rating >= 0.5)
var precise = cf.points({rating: 0.8}); // Only high quality

console.log(all.length);      // 2
console.log(precise.length);  // 1
```

### Format Conversion

```javascript
var point = CF.pointIn("59.32894 18.06491");

console.log(point.asText());
// "59.32894 18.06491"

console.log(point.asText({format: 'degreesandminutes'}));
// "59°19.736' 18°3.895'"

console.log(point.asText({directionLetter: 'before'}));
// "N59.32894 E18.06491"
```

### Coordinate System Conversion

```javascript
var wgsPoint = CF.pointIn("59.32894 18.06491");
var swerefPoint = wgsPoint.reprojectTo(RefSys.SWEREF99TM);

console.log(swerefPoint.N.value);  // ~6580000
console.log(swerefPoint.E.value);  // ~674000
```

### Context Extraction

```javascript
var text = "The ship was located at 59.32894 18.06491 yesterday";
var point = CF.pointIn(text);

console.log(point.originalText());
// "59.32894 18.06491"

console.log(point.context());
// "...located at [59.32894 18.06491] yesterday"

console.log(point.textBefore({maxchars: 10}));
// "...cated at"
```
