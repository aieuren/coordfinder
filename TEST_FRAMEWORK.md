# CoordFinder Test Framework

Ett komplett testramverk för att testa CoordFinder-biblioteket med stöd för både enskilda koordinatpar och flera koordinatpar i text.

## 📁 Filer

- **test-framework.js** - Testramverkets kärnfunktionalitet
- **test-suites.js** - Testsviter med alla tester
- **test-runner.html** - Visuell test runner för webbläsare
- **TEST_FRAMEWORK.md** - Denna dokumentation

## 🎯 Testtyper

### Point Test
Testar att hitta (eller inte hitta) ett enskilt koordinatpar.

**Format:**
```javascript
suite.addPointTest(
    'test-id',           // Unikt test-ID
    'Test namn',         // Beskrivande namn
    'Input text',        // Text att parsa
    'lat lon'            // Förväntat resultat (eller null)
);
```

**Exempel:**
```javascript
suite.addPointTest(
    'test-0031',
    'Grader och hela minuter',
    '57-43N 11-58E',
    '57.717 11.967'
);
```

### Points Test
Testar att hitta rätt antal koordinatpar i en text.

**Format:**
```javascript
suite.addPointsTest(
    'test-id',           // Unikt test-ID
    'Test namn',         // Beskrivande namn
    'Input text',        // Text att parsa
    antal                // Förväntat antal koordinatpar
);
```

**Exempel:**
```javascript
suite.addPointsTest(
    'test-0043',
    'Exempeltext med flera koordinatpar',
    'Båten var ute vid 58.8 och 10,9 och syntes från fyren på 58°54,0\'N',
    2
);
```

## 📝 Skapa testsviter

### Grundläggande struktur

```javascript
// Skapa en ny testsvit
var minTestSvit = new TestFramework.TestSuite('Mitt testnamn');

// Lägg till Point Tests
minTestSvit.addPointTest(
    'test-001',
    'Test av decimal grader',
    '58.8 10.9',
    '58.800 10.900'
);

// Lägg till Points Tests
minTestSvit.addPointsTest(
    'test-002',
    'Test av flera koordinater',
    'Punkt A: 58.8, 10.9 och Punkt B: 59.0, 11.0',
    2
);
```

### Exempel på komplett testsvit

```javascript
// ═══════════════════════════════════════════════════════════════
// Mina tester
// ═══════════════════════════════════════════════════════════════

var minaSvit = new TestFramework.TestSuite('Mina tester');

// ─────────────────────────────────────────────────────────────
// Point Test: Grundläggande decimal
// ─────────────────────────────────────────────────────────────
minaSvit.addPointTest(
    'test-100',
    'Grundläggande decimal',
    '58.8 och 10.9',
    '58.800 10.900'
);

// ─────────────────────────────────────────────────────────────
// Point Test: Ska inte hitta
// ─────────────────────────────────────────────────────────────
minaSvit.addPointTest(
    'test-101',
    'Ingen koordinat',
    'Detta är bara text',
    null  // Förväntar sig inget resultat
);

// ─────────────────────────────────────────────────────────────
// Points Test: Flera koordinater
// ─────────────────────────────────────────────────────────────
minaSvit.addPointsTest(
    'test-102',
    'Tre koordinatpar',
    'A: 58.8, 10.9 B: 59.0, 11.0 C: 59.5, 11.5',
    3
);
```

## 🚀 Köra tester

### I webbläsare (Rekommenderat)

1. Öppna **test-runner.html** i webbläsare
2. Välj vilka testsviter du vill köra
3. Klicka "Kör alla tester" eller "Kör valda"
4. Se resultat visuellt med färgkodning

### Programmatiskt (JavaScript)

```javascript
// Ladda bibliotek
// <script src="coordfinder.js"></script>
// <script src="test-framework.js"></script>
// <script src="test-suites.js"></script>

// Skapa test runner
var runner = new TestFramework.TestRunner();

// Lägg till testsviter
runner.addSuite(CoordFinderTestSuites.standardTests);
runner.addSuite(CoordFinderTestSuites.formatTests);

// Kör tester
var result = runner.run();

// Visa resultat
console.log(result.toString());

// Eller som HTML
document.getElementById('results').innerHTML = result.toHTML();
```

### I Node.js

```javascript
require('./coordfinder.js');
require('./test-framework.js');
require('./test-suites.js');

var runner = new TestFramework.TestRunner();
runner.addSuite(CoordFinderTestSuites.standardTests);

var result = runner.run();
console.log(result.toString());
```

## 📊 Resultat

### Konsol-output

```
═══════════════════════════════════════════════════
Test Suite: Standardtester
═══════════════════════════════════════════════════

✅ PASS [test-0031] Grader och hela minuter
✅ PASS [test-0032] Decimal grader med komma
❌ FAIL [test-0033] Grader och minuter med decimaler
   Point mismatch
   Expected: 58.900 11.000
   Actual:   58.901 11.001

───────────────────────────────────────────────────
Results: 2 passed, 1 failed, 3 total
❌ 1 TEST(S) FAILED
═══════════════════════════════════════════════════
```

### HTML-output

Visuell presentation med:
- ✅ Gröna kort för godkända tester
- ❌ Röda kort för misslyckade tester
- Detaljerad felmeddelande för misslyckade tester
- Sammanfattning per testsvit
- Total sammanfattning för alla tester

## 🎨 Anpassa testsviter

### Lägg till i test-suites.js

```javascript
// ═══════════════════════════════════════════════════════════════
// Min nya testsvit
// ═══════════════════════════════════════════════════════════════

var minNyaSvit = new TestSuite('Min nya testsvit');

minNyaSvit.addPointTest(
    'test-500',
    'Mitt test',
    'Min input',
    'förväntat resultat'
);

// Exportera
global.CoordFinderTestSuites.minNyaSvit = minNyaSvit;

// Lägg till i all()-funktionen
global.CoordFinderTestSuites.all = function() {
    return [
        standardTests, 
        formatTests, 
        swerefTests, 
        edgeCaseTests,
        minNyaSvit  // Lägg till här
    ];
};
```

### Lägg till i test-runner.html

```html
<!-- I .suite-selector -->
<label>
    <input type="checkbox" id="suite-min" checked>
    <span>Min nya testsvit</span>
</label>
```

```javascript
// I runSelectedTests()
if (document.getElementById('suite-min').checked) {
    runner.addSuite(CoordFinderTestSuites.minNyaSvit);
}
```

## 📋 Befintliga testsviter

### Standardtester
- Grader och hela minuter
- Decimal grader med komma
- Grader och minuter med decimaler
- Exempeltext med flera koordinatpar
- Endast latitud (ska inte hitta)
- Ingen koordinat i text

### Format-tester
- Grader minuter sekunder
- Decimal grader med punkt
- Riktningsbokstäver efter
- Riktningsbokstäver före
- Blandat format i samma text

### SWEREF99 TM tester
- SWEREF99 TM koordinater
- Blandade WGS84 och SWEREF99

### Kant-fall och fel-tester
- Koordinater utanför giltigt område
- Negativa koordinater
- Tom sträng
- Endast siffror utan kontext
- Extra whitespace

## 🔧 API-referens

### TestSuite

```javascript
var suite = new TestFramework.TestSuite('Namn');

// Lägg till Point Test
suite.addPointTest(id, name, input, expected);

// Lägg till Points Test
suite.addPointsTest(id, name, input, expectedCount);

// Kör testsvit
var result = suite.run();
```

### TestRunner

```javascript
var runner = new TestFramework.TestRunner();

// Lägg till testsvit
runner.addSuite(suite);

// Kör alla testsviter
var result = runner.run();
```

### TestResult

```javascript
result.passed      // boolean
result.message     // string
result.actual      // actual value
result.expected    // expected value
result.toString()  // formatted string
```

### TestSuiteResult

```javascript
result.passed      // number of passed tests
result.failed      // number of failed tests
result.total       // total number of tests
result.toString()  // formatted string
result.toHTML()    // HTML representation
```

### TestRunnerResult

```javascript
result.totalPassed  // total passed across all suites
result.totalFailed  // total failed across all suites
result.totalTests   // total tests across all suites
result.toString()   // formatted string
result.toHTML()     // HTML representation
```

## 💡 Tips

### Decimaler i förväntat resultat

Antalet decimaler i förväntat resultat bestämmer precisionen:

```javascript
// 3 decimaler
'58.800 10.900'

// 6 decimaler
'58.800000 10.900000'

// Inga decimaler
'59 11'
```

### Testa att inget hittas

Använd `null` som förväntat resultat:

```javascript
suite.addPointTest(
    'test-001',
    'Ska inte hitta',
    'Bara text utan koordinater',
    null
);
```

### Testa noll koordinater

Använd `0` som förväntat antal:

```javascript
suite.addPointsTest(
    'test-002',
    'Inga koordinater',
    'Text utan koordinater',
    0
);
```

## 🐛 Felsökning

### Test misslyckas oväntat

1. Kontrollera att input-texten är korrekt
2. Verifiera förväntat resultat med rätt antal decimaler
3. Testa manuellt: `CF.pointIn('din input text')`
4. Kontrollera att CoordFinder är korrekt laddad

### Inget resultat visas

1. Kontrollera att alla script-filer är laddade i rätt ordning:
   - coordfinder.js
   - test-framework.js
   - test-suites.js
2. Öppna webbläsarens konsol för felmeddelanden

### HTML-runner fungerar inte

1. Öppna webbläsarens utvecklarverktyg (F12)
2. Kontrollera Console för JavaScript-fel
3. Verifiera att alla filer finns i samma katalog

## 📚 Exempel på användning

Se **test-runner.html** för ett komplett exempel på hur testramverket används i praktiken.

---

**Version:** 1.0  
**Kompatibel med:** CoordFinder 4.3
