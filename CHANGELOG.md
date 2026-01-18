# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- LICENSE file (MIT)
- CHANGELOG.md
- Comprehensive API documentation (docs/API.md)
- Testing guide (docs/TESTING.md)
- Interactive demo with auto-update on input change
- Format options dropdowns (directionLetter, compact, localized, symbols)
- Rating filter dropdown in demo

### Changed
- Reorganized project structure (scripts moved to scripts/)
- Updated README.md with current information
- Consolidated test files into tdd-testsuites.txt (287 tests)
- Cleaned up obsolete documentation files

### Fixed
- originalText() now preserves compact direction letter format (e.g., "60.716N 19.973E")
- originalText() preserves degree symbols (°)
- context() ellipse spacing (preserves single space before/after ellipsis)
- maxErrorBounds() floating point precision (rounded to 10 decimals)
- Coordinate pair handling in originalText()

### Removed
- Obsolete documentation files (20 files)
- dist/ directory (empty)
- test-interface-compat.js (analysis artifact)

## [5.0.0-beta.7] - 2026-01-18

### Added
- Support for inratingorder test type
- Mixed Unicode/ASCII quote pair support in test parser
- Auto-update functionality in demo page

### Changed
- Demo page improvements (rating dropdown, format options)
- Test framework enhancements

### Fixed
- Multiple originalText() and context() issues
- Test parsing for various edge cases

## [5.0.0-beta.6] - 2026-01-17

### Added
- Complete test suite (287 tests passing)
- Point.originalText() method
- Point.context() method
- Point.maxErrorBounds() method
- Rating system for coordinate quality

### Changed
- Improved coordinate parsing accuracy
- Enhanced test framework

## [5.0.0-beta.5] - 2026-01-16

### Added
- Initial TDD test suite
- Basic coordinate parsing
- Multiple coordinate system support (WGS84, SWEREF99 TM, RT90)

### Changed
- Refactored coordinate detection
- Improved format recognition

## Earlier Versions

See git history for earlier changes.

[Unreleased]: https://github.com/aieuren/coordfinder/compare/v5.0.0-beta.7...HEAD
[5.0.0-beta.7]: https://github.com/aieuren/coordfinder/compare/v5.0.0-beta.6...v5.0.0-beta.7
[5.0.0-beta.6]: https://github.com/aieuren/coordfinder/compare/v5.0.0-beta.5...v5.0.0-beta.6
[5.0.0-beta.5]: https://github.com/aieuren/coordfinder/releases/tag/v5.0.0-beta.5
