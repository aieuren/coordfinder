# Test Files

## Active Test Suite

**`../requirements/test-suites-tdd.txt`** - Primary test suite (36 TDD tests)
- Used by: `verification-test-runner.html`, `run-full-tdd.js`, `npm test`
- Status: 35/36 passing (97%)
- Failing: tdd-026 (WKT POINT with negative coordinates)
- This is the canonical test suite for the project

## Legacy Test Files

**`tests.md`** - Old test format
- Used by: `test-runner-md.html` (legacy test runner)
- Status: Deprecated, kept for reference
- Not used in CI/CD

## Test Runners

**Active:**
- `verification-test-runner.html` - Main browser test runner (loads any .md/.txt file)
- `../run-full-tdd.js` - Node.js test runner (runs TDD suite)

**Legacy:**
- `test-runner-md.html` - Old test runner for tests.md
- Other test-*.html files - Various experimental runners

## Recommendation

Use `verification-test-runner.html` with `test-suites-tdd.txt` for all testing.
