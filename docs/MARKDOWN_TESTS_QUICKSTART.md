# Snabbstart - Markdown-tester

## 🚀 Kom igång på 3 minuter

### Steg 1: Skapa test-fil

Skapa en fil `mina-tester.md`:

```markdown
# Mina tester

## Point Test: Grundläggande test
Test-ID: test-1001
Input:
58.8 och 10.9
Expected:
58.800 10.900

## Points Test: Flera koordinater
Test-ID: test-1002
Input:
A: 58.8, 10.9 och B: 59.0, 11.0
Expected:
- Count: 2
```

### Steg 2: Kör tester

**I webbläsare:**
1. Öppna `test-runner-md.html`
2. Klicka "Välj test-fil (.md)"
3. Välj `mina-tester.md`
4. Klicka "Kör tester"

**Eller prova exempel:**
1. Öppna `test-runner-md.html`
2. Klicka "Ladda tests.md"
3. Klicka "Kör tester"

### Steg 3: Se resultat

- ✅ Gröna = Godkända
- ❌ Röda = Misslyckade

**Klart!** 🎉

---

## 📝 Testformat

### Point Test (hitta ett koordinatpar)

```markdown
## Point Test: Beskrivning
Test-ID: test-XXXX
Input:
Din text här
Expected:
lat lon
```

### Points Test (hitta flera koordinatpar)

```markdown
## Points Test: Beskrivning
Test-ID: test-XXXX
Input:
Din text här
Expected:
- Count: 3
```

---

## 💡 Vanliga exempel

### Exempel 1: Decimal grader

```markdown
## Point Test: Decimal grader
Test-ID: test-0001
Input:
58.8 10.9
Expected:
58.800 10.900
```

### Exempel 2: Grader och minuter

```markdown
## Point Test: Grader och minuter
Test-ID: test-0002
Input:
58°54'N 11°00'E
Expected:
58.900 11.000
```

### Exempel 3: Ska INTE hitta

```markdown
## Point Test: Ingen koordinat
Test-ID: test-0003
Input:
Bara text
Expected:
null
```

### Exempel 4: Flera koordinater

```markdown
## Points Test: Tre koordinater
Test-ID: test-0004
Input:
A: 58.8, 10.9
B: 59.0, 11.0
C: 59.5, 11.5
Expected:
- Count: 3
```

---

## 🎯 Struktur

```markdown
# Testsvit 1

## Point Test: Test 1
Test-ID: test-0001
Input:
...
Expected:
...

## Point Test: Test 2
Test-ID: test-0002
Input:
...
Expected:
...

# Testsvit 2

## Points Test: Test 3
Test-ID: test-0003
Input:
...
Expected:
- Count: 2
```

---

## ✅ Checklista

- [ ] Unikt Test-ID för varje test
- [ ] `Input:` på egen rad
- [ ] `Expected:` på egen rad
- [ ] Rätt antal decimaler i Expected
- [ ] Tom rad mellan tester

---

## 🔧 Tips

### Decimaler

Antalet decimaler i Expected bestämmer precisionen:

```markdown
Expected:
58.800 10.900  ← 3 decimaler
```

```markdown
Expected:
58.800000 10.900000  ← 6 decimaler
```

### Null-värden

För "ska inte hitta":

```markdown
Expected:
null
```

Eller:

```markdown
Expected:
-
```

### Multiline input

Input kan vara flera rader:

```markdown
Input:
Första raden
Andra raden
Tredje raden
Expected:
...
```

---

## 📚 Mer information

- **MARKDOWN_TESTS.md** - Fullständig dokumentation
- **tests.md** - Komplett exempel
- **test-runner-md.html** - Visuell test runner

---

**Lycka till!** 🎉
