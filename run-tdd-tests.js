// Run TDD tests from tdd-basics.txt

const fs = require('fs');

// Load coordfinder
eval(fs.readFileSync('src/coordfinder.js', 'utf-8'));

// Load test framework and parser
eval(fs.readFileSync('src/test-framework.js', 'utf-8'));
eval(fs.readFileSync('src/test-parser.js', 'utf-8'));

console.log('Running TDD tests from tdd-basics.txt...\n');

try {
    const parser = new MarkdownTestParser();
    const suites = parser.parseFile('requirements/tdd-basics.txt');
    
    const runner = new TestFramework.TestRunner();
    for (let i = 0; i < suites.length; i++) {
        runner.addSuite(suites[i]);
    }
    
    const result = runner.run();
    
    // Show summary by suite
    console.log('='.repeat(70));
    console.log('SUMMARY BY SUITE:');
    console.log('='.repeat(70));
    
    const verbose = process.argv.includes('--verbose');
    
    for (let i = 0; i < result.suiteResults.length; i++) {
        const sr = result.suiteResults[i];
        const status = sr.failed === 0 ? '✅' : '❌';
        const pct = Math.round((sr.passed / sr.total) * 100);
        console.log(status + ' ' + sr.suite.name + ': ' + sr.passed + '/' + sr.total + ' (' + pct + '%)');
        
        // Show failed tests if verbose or if suite has failures
        if ((verbose || sr.failed > 0) && sr.results && sr.results.length > 0) {
            for (let j = 0; j < sr.results.length; j++) {
                const tr = sr.results[j];
                if (!tr.passed) {
                    console.log('  ❌ ' + (tr.test.testId || tr.test.id) + ': ' + tr.test.name);
                    // Avoid circular reference errors in JSON.stringify
                    try {
                        console.log('     Expected: ' + JSON.stringify(tr.test.expected));
                    } catch(e) {
                        console.log('     Expected: ' + String(tr.test.expected));
                    }
                    try {
                        console.log('     Got: ' + JSON.stringify(tr.actual));
                    } catch(e) {
                        console.log('     Got: ' + String(tr.actual));
                    }
                    if (tr.message) console.log('     ' + tr.message);
                }
            }
        }
    }
    
    console.log('\n' + '='.repeat(70));
    const totalPct = Math.round((result.totalPassed / result.totalTests) * 100);
    console.log('TOTAL: ' + result.totalPassed + '/' + result.totalTests + ' (' + totalPct + '%) passed');
    console.log('='.repeat(70));
    
} catch(e) {
    console.error('❌ Test execution failed:', e.message);
    console.error(e.stack);
    process.exit(1);
}
