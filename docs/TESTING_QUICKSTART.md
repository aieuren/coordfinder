# Snabbstart - CoordFinder Testramverk

## 🚀 Kom igång på 2 minuter

### Steg 1: Öppna test runner

Öppna **test-runner.html** i din webbläsare.

### Steg 2: Kör tester

Klicka på **"▶️ Kör alla tester"**

### Steg 3: Se resultat

- ✅ Gröna = Godkända tester
- ❌ Röda = Misslyckade tester

**Klart!** 🎉

---

## 📝 Lägg till dina egna tester

### Öppna test-suites.js

Hitta slutet av filen och lägg till:

```javascript
// ═══════════════════════════════════════════════════════════════
// Mina tester
// ═══════════════════════════════════════════════════════════════

var minaSvit = new TestSuite('Mina tester');

// Test 1: Hitta ett koordinatpar
minaSvit.addPointTest(
    'test-1001',                    // Unikt ID
    'Min första test',              // Namn
    '58.8 och 10.9',               // Input text
    '58.800 10.900'                // Förväntat resultat
);

// Test 2: Hitta flera koordinatpar
minaSvit.addPointsTest(
    'test-1002',                    // Unikt ID
    'Flera koordinater',            // Namn
    'A: 58.8, 10.9 B: 59.0, 11.0', // Input text
    2                               // Förväntat antal
);

// Exportera
global.CoordFinderTestSuites.minaSvit = minaSvit;
```

### Uppdatera test-runner.html

Lägg till i `.suite-selector`:

```html
<label>
    <input type="checkbox" id="suite-mina" checked>
    <span>Mina tester</span>
</label>
```

Lägg till i `runSelectedTests()`:

```javascript
if (document.getElementById('suite-mina').checked) {
    runner.addSuite(CoordFinderTestSuites.minaSvit);
}
```

### Kör dina tester

Ladda om test-runner.html och klicka "Kör alla tester"!

---

## 📋 Testformat

### Point Test - Hitta ett koordinatpar

```javascript
suite.addPointTest(
    'test-id',
    'Test namn',
    'Input text',
    'lat lon'  // Med rätt antal decimaler
);
```

**Exempel:**

```javascript
// Hitta koordinat
suite.addPointTest(
    'test-001',
    'Decimal grader',
    '58.8 10.9',
    '58.800 10.900'
);

// Ska INTE hitta
suite.addPointTest(
    'test-002',
    'Ingen koordinat',
    'Bara text',
    null  // Förväntar inget resultat
);
```

### Points Test - Hitta flera koordinatpar

```javascript
suite.addPointsTest(
    'test-id',
    'Test namn',
    'Input text',
    antal  // Förväntat antal koordinatpar
);
```

**Exempel:**

```javascript
// Hitta 2 koordinatpar
suite.addPointsTest(
    'test-003',
    'Två koordinater',
    'A: 58.8, 10.9 och B: 59.0, 11.0',
    2
);

// Hitta 0 koordinatpar
suite.addPointsTest(
    'test-004',
    'Inga koordinater',
    'Text utan koordinater',
    0
);
```

---

## 🎯 Vanliga testfall

### Test 1: Grader och minuter

```javascript
suite.addPointTest(
    'test-100',
    'Grader och minuter',
    '58°54\'N 11°00\'E',
    '58.900 11.000'
);
```

### Test 2: Decimal med komma

```javascript
suite.addPointTest(
    'test-101',
    'Decimal med komma',
    '58,8 och 10,9',
    '58.800 10.900'
);
```

### Test 3: Flera format i samma text

```javascript
suite.addPointsTest(
    'test-102',
    'Blandat format',
    'Decimal: 58.8, 10.9 och DMS: 59°00\'N 11°00\'E',
    2
);
```

### Test 4: SWEREF99 TM

```javascript
suite.addPointTest(
    'test-103',
    'SWEREF99 TM',
    '6533947, 270746',
    '58.867 11.967'
);
```

### Test 5: Ska inte hitta

```javascript
suite.addPointTest(
    'test-104',
    'Utanför giltigt område',
    '95.0 200.0',
    null
);
```

---

## 💻 Kommandorad (Node.js)

```bash
# Kör alla tester
node run-tests.js --all

# Kör specifika testsviter
node run-tests.js --standard --format

# Se hjälp
node run-tests.js
```

---

## 📊 Förstå resultat

### Godkänt test ✅

```
✅ PASS [test-0031] Grader och hela minuter
```

### Misslyckat test ❌

```
❌ FAIL [test-0033] Grader och minuter med decimaler
   Point mismatch
   Expected: 58.900 11.000
   Actual:   58.901 11.001
```

### Sammanfattning

```
Results: 5 passed, 1 failed, 6 total
```

---

## 🔧 Felsökning

### Problem: Test misslyckas

**Lösning:** Testa manuellt i konsolen:

```javascript
var point = CF.pointIn('din input text');
console.log(point.latitude(), point.longitude());
```

### Problem: Inget visas

**Lösning:** Öppna webbläsarens konsol (F12) och kolla efter fel.

### Problem: Fel antal decimaler

**Lösning:** Matcha antalet decimaler i förväntat resultat:

```javascript
// 3 decimaler
'58.800 10.900'

// 6 decimaler  
'58.800000 10.900000'
```

---

## 📚 Mer information

- **TEST_FRAMEWORK.md** - Fullständig dokumentation
- **test-suites.js** - Se alla befintliga tester
- **test-runner.html** - Visuell test runner

---

## ✅ Checklista för nya tester

- [ ] Unikt test-ID (t.ex. test-1001)
- [ ] Beskrivande namn
- [ ] Korrekt input-text
- [ ] Rätt förväntat resultat
- [ ] Rätt antal decimaler
- [ ] Testat att det fungerar

---

**Lycka till med testningen!** 🎉
