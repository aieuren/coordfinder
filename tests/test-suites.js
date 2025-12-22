// test-suites.js - Test Suites for CoordFinder
// Contains all test suites with Point Tests and Points Tests

(function(global) {
'use strict';

// Require test framework
if (typeof TestFramework === 'undefined') {
    throw new Error('TestFramework not loaded. Include test-framework.js first.');
}

var TestSuite = TestFramework.TestSuite;

// ═══════════════════════════════════════════════════════════════════════════
// Standardtester
// ═══════════════════════════════════════════════════════════════════════════

var standardTests = new TestSuite('Standardtester');

// ─────────────────────────────────────────────────────────────────────────
// Point Test: Grader och hela minuter
// ─────────────────────────────────────────────────────────────────────────
standardTests.addPointTest(
    'test-0031',
    'Grader och hela minuter',
    '57-43N 11-58E',
    '57.717 11.967'
);

// ─────────────────────────────────────────────────────────────────────────
// Point Test: Decimal grader med komma
// ─────────────────────────────────────────────────────────────────────────
standardTests.addPointTest(
    'test-0032',
    'Decimal grader med komma',
    '58,8 och 10,9',
    '58.800 10.900'
);

// ─────────────────────────────────────────────────────────────────────────
// Point Test: Grader och minuter med decimaler
// ─────────────────────────────────────────────────────────────────────────
standardTests.addPointTest(
    'test-0033',
    'Grader och minuter med decimaler',
    '58°54,0\'N, 011°00,0\'E',
    '58.900 11.000'
);

// ─────────────────────────────────────────────────────────────────────────
// Points Test: Exempeltext med flera koordinatpar
// ─────────────────────────────────────────────────────────────────────────
standardTests.addPointsTest(
    'test-0043',
    'Exempeltext med flera koordinatpar',
    'Båten var ute vid 58.8 och 10,9 och syntes både från fyren på 58°54,0\'N, 011°00,0\'E och från Valfjället 6533947, 270746',
    3
);

// ─────────────────────────────────────────────────────────────────────────
// Point Test: Endast latitud (ska inte hitta)
// ─────────────────────────────────────────────────────────────────────────
standardTests.addPointTest(
    'test-0034',
    'Endast latitud (ska inte hitta)',
    'Positionen är 58.8 grader nord',
    null
);

// ─────────────────────────────────────────────────────────────────────────
// Points Test: Ingen koordinat i text
// ─────────────────────────────────────────────────────────────────────────
standardTests.addPointsTest(
    'test-0044',
    'Ingen koordinat i text',
    'Detta är en text utan några koordinater alls.',
    0
);

// ═══════════════════════════════════════════════════════════════════════════
// Format-tester
// ═══════════════════════════════════════════════════════════════════════════

var formatTests = new TestSuite('Format-tester');

// ─────────────────────────────────────────────────────────────────────────
// Point Test: Grader minuter sekunder
// ─────────────────────────────────────────────────────────────────────────
formatTests.addPointTest(
    'test-0101',
    'Grader minuter sekunder',
    '58°54\'30"N, 11°00\'15"E',
    '58.908 11.004'
);

// ─────────────────────────────────────────────────────────────────────────
// Point Test: Decimal grader med punkt
// ─────────────────────────────────────────────────────────────────────────
formatTests.addPointTest(
    'test-0102',
    'Decimal grader med punkt',
    '58.912345 11.123456',
    '58.912 11.123'
);

// ─────────────────────────────────────────────────────────────────────────
// Point Test: Riktningsbokstäver efter
// ─────────────────────────────────────────────────────────────────────────
formatTests.addPointTest(
    'test-0103',
    'Riktningsbokstäver efter',
    '58.8N 10.9E',
    '58.800 10.900'
);

// ─────────────────────────────────────────────────────────────────────────
// Point Test: Riktningsbokstäver före
// ─────────────────────────────────────────────────────────────────────────
formatTests.addPointTest(
    'test-0104',
    'Riktningsbokstäver före',
    'N58.8 E10.9',
    '58.800 10.900'
);

// ─────────────────────────────────────────────────────────────────────────
// Point Test: Blandat format i samma text
// ─────────────────────────────────────────────────────────────────────────
formatTests.addPointsTest(
    'test-0105',
    'Blandat format i samma text',
    'Punkt A: 58.8, 10.9 och Punkt B: 59°00\'N 11°00\'E',
    2
);

// ═══════════════════════════════════════════════════════════════════════════
// SWEREF99 TM tester
// ═══════════════════════════════════════════════════════════════════════════

var swerefTests = new TestSuite('SWEREF99 TM tester');

// ─────────────────────────────────────────────────────────────────────────
// Point Test: SWEREF99 TM koordinater
// ─────────────────────────────────────────────────────────────────────────
swerefTests.addPointTest(
    'test-0201',
    'SWEREF99 TM koordinater',
    '6533947, 270746',
    '58.867 11.967'
);

// ─────────────────────────────────────────────────────────────────────────
// Points Test: Blandade WGS84 och SWEREF99
// ─────────────────────────────────────────────────────────────────────────
swerefTests.addPointsTest(
    'test-0202',
    'Blandade WGS84 och SWEREF99',
    'WGS84: 58.8, 10.9 och SWEREF99: 6533947, 270746',
    2
);

// ═══════════════════════════════════════════════════════════════════════════
// Kant-fall och fel-tester
// ═══════════════════════════════════════════════════════════════════════════

var edgeCaseTests = new TestSuite('Kant-fall och fel-tester');

// ─────────────────────────────────────────────────────────────────────────
// Point Test: Koordinater utanför giltigt område
// ─────────────────────────────────────────────────────────────────────────
edgeCaseTests.addPointTest(
    'test-0301',
    'Koordinater utanför giltigt område',
    '95.0 200.0',
    null
);

// ─────────────────────────────────────────────────────────────────────────
// Point Test: Negativa koordinater
// ─────────────────────────────────────────────────────────────────────────
edgeCaseTests.addPointTest(
    'test-0302',
    'Negativa koordinater (södra halvklotet)',
    '45°S 10°E',
    '-45.000 10.000'
);

// ─────────────────────────────────────────────────────────────────────────
// Points Test: Tom sträng
// ─────────────────────────────────────────────────────────────────────────
edgeCaseTests.addPointsTest(
    'test-0303',
    'Tom sträng',
    '',
    0
);

// ─────────────────────────────────────────────────────────────────────────
// Points Test: Endast siffror utan kontext
// ─────────────────────────────────────────────────────────────────────────
edgeCaseTests.addPointsTest(
    'test-0304',
    'Endast siffror utan kontext',
    '123 456 789',
    0
);

// ─────────────────────────────────────────────────────────────────────────
// Point Test: Extra whitespace
// ─────────────────────────────────────────────────────────────────────────
edgeCaseTests.addPointTest(
    'test-0305',
    'Extra whitespace',
    '  58.8    10.9  ',
    '58.800 10.900'
);

// ═══════════════════════════════════════════════════════════════════════════
// Export test suites
// ═══════════════════════════════════════════════════════════════════════════

global.CoordFinderTestSuites = {
    standardTests: standardTests,
    formatTests: formatTests,
    swerefTests: swerefTests,
    edgeCaseTests: edgeCaseTests,
    
    // Get all suites as array
    all: function() {
        return [standardTests, formatTests, swerefTests, edgeCaseTests];
    }
};

})(typeof window !== 'undefined' ? window : global);
