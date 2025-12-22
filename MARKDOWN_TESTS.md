# Markdown Test Format

Skriv dina CoordFinder-tester i Markdown-format för enkel läsbarhet och underhåll.

## 📝 Format

### Testsvit

Använd `#` för att definiera en testsvit:

```markdown
# Standardtester
```

### Point Test

Testar att hitta (eller inte hitta) ett enskilt koordinatpar:

```markdown
## Point Test: Beskrivande namn
Test-ID: test-0001
Input:
Din input-text här
Expected:
lat lon
```

**Exempel:**

```markdown
## Point Test: Grader och hela minuter
Test-ID: test-0031
Input:
57-43N 11-58E
Expected:
57.717 11.967
```

### Points Test

Testar att hitta rätt antal koordinatpar:

```markdown
## Points Test: Beskrivande namn
Test-ID: test-0002
Input:
Din input-text här
Expected:
- Count: 3
```

**Exempel:**

```markdown
## Points Test: Exempeltext
Test-ID: test-0043
Input:
"Båten var ute vid 58.8 och 10,9 och syntes från fyren på 58°54,0'N"
Expected:
- Count: 2
```

## 🎯 Komplett exempel

```markdown
# Mina tester

## Point Test: Decimal grader
Test-ID: test-1001
Input:
58.8 och 10.9
Expected:
58.800 10.900

## Point Test: Ska inte hitta
Test-ID: test-1002
Input:
Bara text utan koordinater
Expected:
null

## Points Test: Flera koordinater
Test-ID: test-1003
Input:
Punkt A: 58.8, 10.9 och Punkt B: 59.0, 11.0
Expected:
- Count: 2

# Fler tester

## Point Test: SWEREF99
Test-ID: test-2001
Input:
6533947, 270746
Expected:
58.867 11.967
```

## 📋 Regler

### Test-ID
- **Måste vara unikt** inom filen
- Format: `test-XXXX` (rekommenderat)
- Exempel: `test-0001`, `test-1234`

### Input
- Kan vara flera rader
- Citattecken är valfria
- Whitespace bevaras

### Expected (Point Test)
- Format: `lat lon` med mellanslag
- Antal decimaler bestämmer precision
- Använd `null` eller `-` för "ska inte hitta"

**Exempel:**
```markdown
Expected:
58.800 10.900
```

```markdown
Expected:
null
```

### Expected (Points Test)
- Format: `- Count: N`
- N = förväntat antal koordinatpar
- Kan vara 0

**Exempel:**
```markdown
Expected:
- Count: 3
```

```markdown
Expected:
- Count: 0
```

## 🚀 Användning

### I webbläsare

1. Öppna **test-runner-md.html**
2. Klicka "Välj test-fil (.md)"
3. Välj din Markdown-fil
4. Klicka "Kör tester"

Eller:

1. Öppna **test-runner-md.html**
2. Klicka "Ladda tests.md" (för exempel-tester)
3. Klicka "Kör tester"

### Med Node.js

```bash
node convert-tests.js tests.md
```

Detta skapar `tests-generated.js` som kan användas med `run-tests.js`.

## 💡 Tips

### Organisera tester

Använd flera testsviter för att gruppera relaterade tester:

```markdown
# Grundläggande tester
## Point Test: ...
## Point Test: ...

# Avancerade tester
## Point Test: ...
## Points Test: ...

# Edge cases
## Point Test: ...
```

### Kommentarer

Använd vanliga Markdown-kommentarer:

```markdown
<!-- Detta är en kommentar som ignoreras -->

## Point Test: Mitt test
Test-ID: test-0001
Input:
58.8 10.9
Expected:
58.800 10.900
```

### Multiline input

Input kan sträcka sig över flera rader:

```markdown
Input:
Första raden
Andra raden
Tredje raden
Expected:
...
```

### Citattecken

Citattecken i input är valfria och tas bort automatiskt:

```markdown
Input:
"Text med citattecken"
```

Blir samma som:

```markdown
Input:
Text med citattecken
```

## 🔍 Exempel på testfall

### Test 1: Grundläggande decimal

```markdown
## Point Test: Grundläggande decimal
Test-ID: test-0001
Input:
58.8 och 10.9
Expected:
58.800 10.900
```

### Test 2: Grader och minuter

```markdown
## Point Test: Grader och minuter
Test-ID: test-0002
Input:
58°54'N 11°00'E
Expected:
58.900 11.000
```

### Test 3: Ska inte hitta

```markdown
## Point Test: Ingen koordinat
Test-ID: test-0003
Input:
Detta är bara text
Expected:
null
```

### Test 4: Flera koordinater

```markdown
## Points Test: Tre koordinatpar
Test-ID: test-0004
Input:
A: 58.8, 10.9
B: 59.0, 11.0
C: 59.5, 11.5
Expected:
- Count: 3
```

### Test 5: Inga koordinater

```markdown
## Points Test: Tom text
Test-ID: test-0005
Input:
Ingen koordinat här
Expected:
- Count: 0
```

## 🐛 Felsökning

### Problem: Test hittas inte

**Orsak:** Saknar Test-ID eller felaktigt format

**Lösning:** Kontrollera att varje test har:
```markdown
## Point Test: Namn
Test-ID: test-XXXX
Input:
...
Expected:
...
```

### Problem: Fel resultat

**Orsak:** Fel antal decimaler i Expected

**Lösning:** Matcha antalet decimaler:
```markdown
Expected:
58.800 10.900  ← 3 decimaler
```

### Problem: Parser-fel

**Orsak:** Felaktig syntax

**Lösning:** Kontrollera:
- `##` före testnamn
- `Test-ID:` på egen rad
- `Input:` på egen rad
- `Expected:` på egen rad
- Tom rad mellan tester

## 📚 Fullständigt exempel

Se **tests.md** för ett komplett exempel med alla testtyper.

## 🔄 Konvertera till JavaScript

Om du vill ha JavaScript-filer istället:

```bash
node convert-tests.js tests.md
```

Detta skapar `tests-generated.js` som kan användas direkt.

---

**Format-version:** 1.0  
**Kompatibel med:** CoordFinder 4.3
