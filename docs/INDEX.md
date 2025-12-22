# CoordFinder - Complete Implementation

## 📁 Files Overview

### Core Implementation
- **coordfinder.js** (1030 lines) - Main library implementation

### Demonstrations
- **demo.html** - Interactive browser demo with buttons and visual output
- **demo-simple.js** - Command-line demo (requires Node.js)
- **test-coordfinder.html** - Full test suite in browser
- **test-coordfinder.js** - Test suite for Node.js

### Documentation
- **README.md** - User guide and API reference
- **QUICKSTART.md** - 5-minute tutorial
- **IMPLEMENTATION.md** - Technical architecture details
- **example-output.md** - Expected behavior examples
- **INDEX.md** - This file

## 🚀 Quick Start

### Option 1: Browser Demo (Recommended)
Open `demo.html` in any modern web browser to see an interactive demonstration.

### Option 2: Command Line (Requires Node.js)
```bash
node demo-simple.js
```

### Option 3: Include in Your Project
```html
<script src="coordfinder.js"></script>
<script>
    var points = CF.pointsIn('Ship at 58.8 and 10,9');
    console.log(points[0].latitude(), points[0].longitude());
</script>
```

## 📝 Example Code

```javascript
var text = 'The ship was at 58.8 and 10,9. Lighthouse at 58°54,0\'N, 011 00,0 E.';

// Simple usage
var points = CF.pointsIn(text);
// Returns 2 coordinate pairs

// With details
var cf = new CF();
cf.parse(text);
var highConfidence = cf.points({rating: 0.8});
console.log(cf.log()); // See parse details
```

## 🎯 What It Does

The library extracts coordinate pairs from text in various formats:

### Input Examples
```
58.8 and 10,9                    → Decimal degrees
58°54,0'N, 011 00,0 E           → Degrees and minutes
58°54'30"N, 11°00'15"E          → Degrees, minutes, seconds
6100000, 200000                  → Meter coordinates (SWEREF99TM)
```

### Output
Each coordinate pair becomes a `Point` object with:
- Latitude/longitude in WGS84
- Confidence rating (0.0 to 1.0)
- Original text and context
- Multiple output formats
- Reference system information

## 📊 Features

✅ **Multiple Formats**: Decimal degrees, DMS, meters
✅ **9 Reference Systems**: WGS84, SWEREF99TM, RT90, ETRS89, etc.
✅ **Smart Parsing**: Handles comma/period decimals, direction letters
✅ **Confidence Ratings**: Scores each coordinate pair
✅ **Context Preservation**: Shows surrounding text
✅ **Flexible Output**: Multiple formatting options
✅ **Grouping**: Separates coordinate groups by structure
✅ **Reprojection**: Transform between coordinate systems (with proj4js)

## 🔍 API Overview

### Static Methods (Quick Access)
```javascript
CF.pointIn(text)      // First point
CF.pointsIn(text)     // All points
CF.groupsIn(text)     // Grouped points
```

### Instance Methods (Detailed Control)
```javascript
var cf = new CF();
cf.parse(text, opts);
cf.points(opts);      // Filtered by rating
cf.groups(opts);      // Grouped and filtered
cf.unusedCoords();    // Unpaired coordinates
cf.log();             // Parse log
```

### Point Methods
```javascript
point.latitude()      // WGS84 latitude
point.longitude()     // WGS84 longitude
point.asText(opts)    // Formatted output
point.rating()        // Confidence score
point.context(opts)   // Surrounding text
point.reprojectTo(rs) // Transform coordinates
```

## 📖 Documentation Guide

1. **New to CoordFinder?** → Start with `QUICKSTART.md`
2. **Need API details?** → See `README.md`
3. **Want technical info?** → Read `IMPLEMENTATION.md`
4. **See examples?** → Check `example-output.md`
5. **Try it out?** → Open `demo.html` in browser

## 🧪 Testing

### Browser Testing
1. Open `demo.html` for interactive demo
2. Open `test-coordfinder.html` for full test suite

### Command Line Testing
```bash
node demo-simple.js        # Simple demonstration
node test-coordfinder.js   # Full test suite
```

## 🎨 Example Output

For the text:
```
"The ship was at 58.8 and 10,9. Lighthouse at 58°54,0'N, 011 00,0 E."
```

The library finds:
- **Point 1**: 58.8, 10.9 (rating: 0.6)
- **Point 2**: 58.9, 11.0 (rating: 0.9)

Higher rating = more confidence (has direction letters, same line, etc.)

## 🔧 Integration

### HTML
```html
<script src="coordfinder.js"></script>
<script>
    var points = CF.pointsIn(document.body.textContent);
    // Process points...
</script>
```

### Node.js
```javascript
require('./coordfinder.js');
var points = CF.pointsIn(textData);
```

### With proj4js (for reprojection)
```html
<script src="proj4.js"></script>
<script src="coordfinder.js"></script>
<script>
    var point = CF.pointIn(text);
    var sweref = point.reprojectTo(CF.RefSys.SWEREF99TM);
</script>
```

## 📋 Supported Reference Systems

1. **WGS84** - Global lat/long
2. **WGS84 Northern Europe** - Restricted bounds for better parsing
3. **SWEREF99 TM** - Swedish reference system
4. **RT90 2.5 gon V** - Legacy Swedish system
5. **ETRS89** - European Terrestrial Reference System
6. **ETRS-LAEA** - Lambert Azimuthal Equal Area
7. **ETRS-LCC** - Lambert Conformal Conic

Plus extended versions of SWEREF99 TM and RT90 for edge cases.

## 🎓 Learning Path

1. **5 minutes**: Run `demo.html` in browser
2. **10 minutes**: Read `QUICKSTART.md`
3. **20 minutes**: Try examples from `README.md`
4. **30 minutes**: Explore `IMPLEMENTATION.md`
5. **1 hour**: Integrate into your project

## 💡 Common Use Cases

### Maritime Reports
```javascript
var report = "Ship position: 58°54'N, 11°00'E";
var point = CF.pointIn(report);
```

### GPS Logs
```javascript
var log = "Waypoint 1: 58.8, 10.9\nWaypoint 2: 59.0, 11.1";
var points = CF.pointsIn(log);
```

### Mixed Formats
```javascript
var mixed = "Decimal: 58.8, 10.9 or DMS: 58°54'30\"N";
var points = CF.pointsIn(mixed); // Handles both
```

### Quality Control
```javascript
var cf = new CF();
cf.parse(text);
var trusted = cf.points({rating: 0.8}); // Only high confidence
```

## 🐛 Troubleshooting

**No coordinates found?**
- Check format is supported
- Verify coordinates are in valid ranges
- Use `cf.log()` to see parse details

**Wrong pairings?**
- Check `point.rating()` values
- Use higher threshold: `cf.points({rating: 0.8})`
- Review `point.context()` for context

**Need different format?**
- See `point.asText()` options in README.md
- Customize with FormatOptions

## 📦 What's Included

```
coordfinder.js              - Main library (1030 lines)
demo.html                   - Interactive demo
demo-simple.js              - CLI demo
test-coordfinder.html       - Browser tests
test-coordfinder.js         - Node.js tests
README.md                   - User documentation
QUICKSTART.md               - Quick tutorial
IMPLEMENTATION.md           - Technical details
example-output.md           - Example results
INDEX.md                    - This overview
```

## 🎯 Next Steps

1. Open `demo.html` in your browser
2. Try the example code with your own text
3. Read the documentation for advanced features
4. Integrate into your project

---

**Version**: 5.0-beta.2  
**License**: MIT  
**Author**: Bernt Rane
