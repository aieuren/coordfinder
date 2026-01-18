# CoordFinder

A JavaScript library for extracting and parsing geographic coordinates from text in various formats and coordinate reference systems.

## 🚀 Quick Start

**Try it live:** [Interactive Demo](https://aieuren.github.io/coordfinder/examples/demo.html)

```html
<script src="src/coordfinder.js"></script>
<script>
    var point = CF.pointIn("Ship at 59.32894, 18.06491");
    console.log(point.latitude(), point.longitude());
</script>
```

## 📁 Project Structure

```
coordfinder/
├── src/                        # Source code
│   ├── coordfinder.js          # Main library
│   ├── test-framework.js       # Test framework
│   └── test-parser.js          # Test parser
├── examples/                   # Examples and demos
│   └── demo.html               # Interactive demo
├── docs/                       # Documentation
│   ├── API.md                  # API reference
│   └── TESTING.md              # Testing guide
├── requirements/               # Test specifications
│   └── tdd-testsuites.txt      # 287 TDD tests
├── index.html                  # Project homepage
└── README.md                   # This file
```

## 🧪 Testing

Run the complete test suite:

```bash
npm test
```

**Current status:** ✅ 287/287 tests passing (100%)

See [docs/TESTING.md](docs/TESTING.md) for more details.

## 📖 Documentation

- **[API Reference](docs/API.md)** - Complete API documentation
- **[Testing Guide](docs/TESTING.md)** - How to run and write tests
- **[Interactive Demo](examples/demo.html)** - Try it in your browser

## ✨ Features

- **Multiple coordinate formats:**
  - Decimal degrees: `59.32894 18.06491`
  - Degrees and minutes: `59°19.736'N 18°3.895'E`
  - Degrees, minutes, seconds: `59°19'44"N 18°3'54"E`
  - Compact formats: `591944N0180354E`
  - URL formats: Google Maps, Eniro
  - Data formats: GeoJSON, GML, WKT

- **Multiple coordinate systems:**
  - WGS84 (global and Northern Europe)
  - SWEREF99 TM
  - RT90 2.5 gon V
  - ETRS89, ETRS-LAEA, ETRS-LCC

- **Smart parsing:**
  - Handles comma and period as decimal separators
  - Recognizes direction letters (N/S/E/W/Ö/V)
  - Validates coordinate ranges
  - Rates coordinate confidence (0.0-1.0)

## 🧪 Testing

Open test runners in your browser:

- **[tests/test-runner.html](tests/test-runner.html)** - Main test suite
- **[tests/tdd-runner.html](tests/tdd-runner.html)** - TDD tests
- **[tests/verification-test-runner.html](tests/verification-test-runner.html)** - Large test suites

## 🎯 Usage Examples

### Basic Parsing

```javascript
// Parse single coordinate
var point = CF.pointIn("59.32894 18.06491");
console.log(point.latitude(), point.longitude());

// Parse multiple coordinates
var points = CF.pointsIn("First: 59.32 18.06, Second: 58.41 12.56");
```

### Quality Filtering

```javascript
var cf = new CF();
cf.parse("Approximate: 59.3 18.1, Precise: 59.32894 18.06491");

var all = cf.points();              // All points (rating >= 0.5)
var precise = cf.points({rating: 0.8}); // Only high quality
```

### Format Conversion

```javascript
var point = CF.pointIn("59.32894 18.06491");

point.asText();
// "59.32894 18.06491"

point.asText({format: 'degreesandminutes'});
// "59°19.736' 18°3.895'"

point.asText({directionLetter: 'before'});
// "N59.32894 E18.06491"
```

See [docs/API.md](docs/API.md) for complete API documentation.

## 🔗 Links

- **🌐 Live Demo:** https://aieuren.github.io/coordfinder/examples/demo.html
- **💻 Repository:** https://github.com/aieuren/coordfinder
- **📖 API Docs:** [docs/API.md](docs/API.md)
- **Version:** 5.0-beta.7
- **Author:** Bernt Rane, Claude & Ona
