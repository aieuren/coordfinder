// Test to verify the pairing fix
// This test demonstrates the bug and validates the fix

const fs = require('fs');
const vm = require('vm');

// Load coordfinder.js
const cfCode = fs.readFileSync('./src/coordfinder.js', 'utf8');
const context = {
    console: console,
    global: {},
    window: undefined
};
vm.createContext(context);
vm.runInContext(cfCode, context);
const CF = context.global.CF;

// Test cases
const testCases = [
    {
        name: "Numbered list with coordinates",
        input: `1) 57°30'N 12°15'E
2) 57°45'N 12°30'E
3) 58°00'N 12°45'E`,
        expected: 3,
        description: "Each line should produce one point"
    },
    {
        name: "Simple two-line coordinates",
        input: `Location A: 59°20'N 18°05'E
Location B: 60°10'N 17°50'E`,
        expected: 2,
        description: "Two locations, two points"
    },
    {
        name: "Mixed format coordinates",
        input: `Start: 57.5 N, 12.25 E
Middle: 57.75 N, 12.5 E
End: 58.0 N, 12.75 E`,
        expected: 3,
        description: "Decimal format with direction letters"
    }
];

console.log("=== Coordinate Pairing Test Suite ===\n");

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

testCases.forEach((testCase, index) => {
    totalTests++;
    console.log(`Test ${index + 1}: ${testCase.name}`);
    console.log(`Input:\n${testCase.input}`);
    console.log(`Expected: ${testCase.expected} points`);
    
    const cf = new CF();
    cf.parse(testCase.input);
    const points = cf.points();
    
    console.log(`Actual: ${points.length} points`);
    
    // Check if test passed
    const passed = points.length === testCase.expected;
    
    if (passed) {
        console.log("✓ PASS");
        passedTests++;
    } else {
        console.log("✗ FAIL");
        failedTests++;
        
        // Show details of what went wrong
        console.log("\nDetails:");
        points.forEach((p, i) => {
            const nLine = p.N.parsedFrom ? p.N.parsedFrom.lineNo : -1;
            const eLine = p.E.parsedFrom ? p.E.parsedFrom.lineNo : -1;
            const sameLine = nLine === eLine;
            const nAxis = p.N.axis;
            const eAxis = p.E.axis;
            const correctAxes = nAxis === 'Northing' && eAxis === 'Easting';
            
            console.log(`  Point ${i+1}: ${p.asText()}`);
            console.log(`    N: ${p.N.value} (line ${nLine}, axis: ${nAxis})`);
            console.log(`    E: ${p.E.value} (line ${eLine}, axis: ${eAxis})`);
            
            if (!sameLine) {
                console.log(`    ⚠️  Coordinates from different lines!`);
            }
            if (!correctAxes) {
                console.log(`    ⚠️  Incorrect axes! Should be Northing + Easting`);
            }
        });
    }
    
    console.log();
});

console.log("=== Summary ===");
console.log(`Total tests: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);

if (failedTests > 0) {
    console.log("\n⚠️  Some tests failed. The pairing algorithm needs to be fixed.");
    console.log("See PAIRING_ANALYSIS.md for details on the bugs and fixes.");
    process.exit(1);
} else {
    console.log("\n✓ All tests passed!");
    process.exit(0);
}
