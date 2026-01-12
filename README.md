# CoordFinder

A JavaScript library for extracting and parsing geographic coordinates from text in various formats and coordinate reference systems.

## 🚀 Quick Start

**Try it live:** [https://aieuren.github.io/coordfinder/](https://aieuren.github.io/coordfinder/)

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
├── src/                    # Source code
│   ├── coordfinder.js      # Main library (1718 lines)
│   ├── test-framework.js   # Test framework
│   └── test-parser.js      # Markdown test parser
├── tests/                  # Test files and runners
│   ├── test-runner-md.html # Main test runner (Markdown-based)
│   └── verification-test-runner.html  # Verification runner
├── examples/               # Examples and demos
│   ├── demo.html           # Interactive demo
│   └── demo-simple.js      # Simple usage example
├── docs/                   # Documentation
│   ├── START_HERE.md       # Start here!
│   ├── QUICKSTART.md       # Quick start guide
│   ├── IMPLEMENTATION.md   # Technical details
│   ├── TEST_FRAMEWORK.md   # Testing guide
│   └── MARKDOWN_TESTS.md   # Test format
├── requirements/           # Requirements and specifications
│   ├── kravspecifikation.md
│   └── test-suites-tdd.txt # 80 TDD tests
├── index.html              # Demo page
├── TESTING_STATUS.md       # Current test status (100% pass)
└── README.md               # This file
```

## 🧪 Testing

Run the complete TDD test suite (80 tests):

```bash
npm test
```

**Current status:** ✅ 80/80 tests passing (100%)

This runs all tests from `requirements/test-suites-tdd.txt` and must pass before any commit.

**Test in browser:**
- [Verification Test Runner](https://aieuren.github.io/coordfinder/tests/verification-test-runner.html) - Load and run test suites
- [TDD Complete](https://aieuren.github.io/coordfinder/tdd-complete.html) - 23 embedded tests

**Current status:** 35/36 tests passing (97%)

## 📖 Documentation

- **[Quick Start Guide](docs/QUICKSTART.md)** - Get started in 5 minutes
- **[Full Documentation](docs/README.md)** - Complete API reference
- **[Implementation Details](docs/IMPLEMENTATION.md)** - Technical architecture
- **[Test Framework](docs/TEST_FRAMEWORK.md)** - Testing documentation

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

## 🎯 Examples

See [examples/](examples/) directory for:
- Interactive demo
- Simple usage examples
- Expected output examples

## 📝 Requirements

See [requirements/](requirements/) directory for:
- Formal requirements specification
- TDD test suite
- Interface definition

## 🤝 Contributing

This project follows Test-Driven Development (TDD). See [docs/TDD_PROGRESS.md](docs/TDD_PROGRESS.md) for implementation status.

## 📄 License

MIT License

## 🔗 Links

- **🌐 Live Demo:** https://aieuren.github.io/coordfinder/
- **💻 Repository:** https://github.com/aieuren/coordfinder
- **📖 Documentation:** https://aieuren.github.io/coordfinder/docs/README.md
- **🎮 Interactive Demo:** https://aieuren.github.io/coordfinder/examples/demo.html
- **🧪 Test Runner:** https://aieuren.github.io/coordfinder/tests/verification-test-runner.html
- **Version:** 5.0-beta.6
- **Author:** Bernt Rane, Claude & Ona

**Note:** Version and build are defined in `src/coordfinder.js` as `CF.version` and `CF.build`. Test pages display these to verify GitHub Pages deployment.

**Build number:** Automatically updated by `./update-build.sh` script. The build number (timestamp format YYYYMMDD-HHMMSS) helps verify that GitHub Pages has deployed the latest version.
