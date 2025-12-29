# CoordFinder - Kravspecifikation

Version: 5.0-beta.4  
Datum: 2025-12-29  
Baserad på: 118 TDD-tester och implementation

## Syfte

CoordFinder ska extrahera geografiska koordinater från text i olika format och koordinatsystem. Systemet ska hantera både strukturerad och ostrukturerad text, samt identifiera koordinater i URLs, dataformat och löpande text.

## Koordinatsystem

### WGS84 (EPSG:4326)
- Decimalgrader: -90 till 90 (latitud), -180 till 180 (longitud)
- Grader och decimalminuter (DM)
- Grader, minuter och sekunder (DMS)
- Både punkt och komma som decimalseparator

### SWEREF99 TM (EPSG:3006)
- Nordvärde (N): 6100000-7700000 meter
- Östvärde (E): 200000-1000000 meter
- Minst 5 siffror per koordinat

### RT90 2.5 gon V (EPSG:3021)
- Nordvärde (X): 6100000-7700000 meter
- Östvärde (Y): 1200000-1900000 meter
- Minst 5 siffror per koordinat

## Format som ska stödjas

### 1. Decimalgrader (WGS84)

**Grundformat:**
- `59.32894 18.06491` - Whitespace-separerad
- `59,32894 18,06491` - Komma som decimalseparator
- `59.32894; 18.06491` - Semikolon som separator
- `-35.5 149.1` - Negativa värden för S/W

**Med väderstreck:**
- `59.32894 N 18.06491 E` - Efter värde
- `N 62.45 E 17.38` - Före värde
- `N 65.58 Ö 22.14` - Svenska väderstreck (Ö för öst)
- `S 33.92 W 18.42` - Sydvästra kvadranten (negativa)

**Väderstreck:**
- N/S för latitud (nord/syd)
- E/W för longitud (öst/väst)
- Svenska: Ö/V för öst/väst
- O accepteras som alternativ för Ö

**Precision:**
- Minst 1 decimal krävs för decimalgrader
- Heltal tolkas som grader-minuter eller meter-koordinater

### 2. Grader och minuter (DM)

**Med symboler:**
- `59° 19.736' N 18° 3.895' E` - Standard DM
- `60° 30,5' N 019° 15,25' E` - Komma som decimalseparator
- `N 60° 30,5' V 019° 15,25'` - Väderstreck först

**Utan symboler:**
- `60 30,5 19 15,25` - Endast siffror och komma
- `N60 30,5 O19 15,25` - Väderstreck direkt före grader

**Kompakt:**
- `5830N01245E` - Mycket kompakt (DDMM)
- `6230-1545` - Minustecken som separator

**Validering:**
- Minuter: 0-59.999
- Minst 1 decimal rekommenderas för precision

### 3. Grader, minuter och sekunder (DMS)

**Med symboler:**
- `59° 19' 44.2" N 18° 3' 53.7" E` - Standard DMS
- `60° 30' 45.5"` - Sekundtecken kan utelämnas vid slutet
- `59°19'44"N` - Utan mellanslag

**Utan symboler:**
- `60 30 45.5` - Endast siffror
- `N60 30 45 O19 15 30` - Med väderstreck

**Kompakt:**
- `591944N0180354E` - Mycket kompakt (DDMMSS)

**Validering:**
- Minuter: 0-59
- Sekunder: 0-59.999

### 4. URL-format

**Google Maps:**
- `https://www.google.com/maps/place/59.32894,18.06491`
- `https://maps.google.com/@59.32894,18.06491,15z`
- Koordinater efter `@` eller `/place/`

**Eniro/Hitta.se:**
- `map/59.329440/18.064510`
- `https://www.hitta.se/kartan/59.32894/18.06491`

**URL-parametrar:**
- `?x=540000&y=6580000` - SWEREF/RT90
- `?y=6580000&x=540000` - Omvänd ordning

**Zoom-parametrar ska ignoreras:**
- `13.3z` ska inte tolkas som koordinat
- Negative lookahead för `z` efter decimaltal

### 5. Dataformat

**GeoJSON:**
- `{"coordinates": [18.06491, 59.32894]}` - Longitud först
- Automatisk swap till lat/lon

**GML:**
- `<gml:pos>59.32894 18.06491</gml:pos>` - Latitud först
- `<gml:coordinates>18.06491,59.32894</gml:coordinates>` - Longitud först

**WKT:**
- `POINT(18.06491 59.32894)` - Longitud först för WGS84
- `POINT(313096 6353860)` - Öst först för SWEREF/RT90

### 6. Prefix-format

**Lat/Long:**
- `Lat: 59.32894 Long: 18.06491`
- `Latitude: 61.234567 Longitude: 15.876543`
- `N: 59.32894 E: 18.06491`

**SWEREF/RT90:**
- `N: 6504089 E: 278978`
- `X: 6580000, Y: 1540000`
- `Nordlig: 7148101 Östlig: 278978`

### 7. Verbal beskrivning

**Svenska:**
- `Norr 59 grader 19,8 minuter Öst 18 grader 3,9 minuter`
- `Nord 60 grader 30 minuter Väst 19 grader 15 minuter`

### 8. Listor och tabeller

**Numrerade listor:**
- Extrahera koordinater från varje rad
- Ignorera radnummer (1., 2., etc.)

**Tabellformat:**
```
Pkt  Lat. N    Long. O
1    60 30,5   19 15,25
2    60 35,8   19 20,4
```

**Flerradiga koordinater:**
- Koordinatkomponenter får INTE brytas över rader
- Använd `[ \t]` istället för `\s` i regex för att undvika newline-matchning

## Negativa tester - Ska INTE matcha

### Telefonnummer
- `+46 70 123 45 67` - Telefonnummer
- `070-1234567` - Mobilnummer

### Personnummer
- `19850315-1234` - Personnummer

### Datum och tid
- `2023-05-15` - Datum
- `14:30:45` - Tid

### Priser och mått
- `199.90 kr` - Pris
- `15.5 km` - Avstånd med enhet

### Avståndsangivelser
- `2,5' norr` - Distans i bågminuter
- `1,8' O` - Distans med riktning
- Ska ignorera följande tecken efter decimaltal:
  - `'` (ASCII apostrophe, U+0027)
  - `'` (right single quotation mark, U+2019)
  - `´` (acute accent, U+00B4)
  - `′` (prime, U+2032)
  - `"` (quotation mark)
  - `″` (double prime, U+2033)
  - `"` och `"` (smart quotes, U+201C, U+201D)

### Listnummer
- `2) Nästa punkt` - Listnummer med parentes

### URL-parametrar utan koordinater
- `?data=123.456` - Generiska parametrar

## Validering

### WGS84
- **Latitud:** -90 till 90 grader
- **Longitud:** -180 till 180 grader
- **Minuter:** 0 till 59.999
- **Sekunder:** 0 till 59.999
- **Decimaler:** Minst 1 decimal för decimalgrader

### SWEREF99 TM
- **Nordvärde:** 6100000-7700000
- **Östvärde:** 200000-1000000
- **Format:** Minst 5 siffror

### RT90
- **Nordvärde (X):** 6100000-7700000
- **Östvärde (Y):** 1200000-1900000
- **Format:** Minst 5 siffror

### Koordinatparning
- Latitud och longitud måste paras ihop korrekt
- Automatisk swap om:
  - Latitud är giltig (-90 till 90) men longitud är utanför (-180 till 180)
  - Longitud är giltig men latitud är utanför
  - ENDAST om inga explicita väderstreck finns

## Whitespace-hantering

### Tillåtet mellan komponenter
- Mellanslag (space, U+0020)
- Tab (U+0009)
- Flera mellanslag normaliseras till ett

### INTE tillåtet
- Newline (`\n`) mellan koordinatkomponenter
- Koordinater får inte brytas över rader
- Regex använder `[ \t]` istället för `\s`

### Normalisering
- Flera mellanslag/tabs → ett mellanslag
- Newlines bevaras för att separera koordinatpar
- Encoding: `text.replace(/[ \t]+/g, ' ').replace(/\n+/g, '\n')`

## Prioritetsordning

Patterns matchas i följande ordning (högst prioritet först):

1. **GeoJSON** - Strukturerad data
2. **GML** - XML-format
3. **WKT** - Well-Known Text
4. **Verbal pair** - Utskriven form
5. **Direction pair DM** - Väderstreck med DM
6. **Direction before degs** - Väderstreck före decimalgrader
7. **Extremely compact** - N60 E19
8. **URL coords** - URLs med koordinater
9. **URL params** - x/y parametrar
10. **Large pairs** - SWEREF/RT90 par
11. **Prefix formats** - Lat:/Long:, N:/E:
12. **Compact DMS** - 591944N0180354E
13. **Compact DM** - 5830N01245E
14. **DMS formats** - Grader, minuter, sekunder
15. **DM formats** - Grader och minuter
16. **Degrees with semicolon** - Semikolon-separerad
17. **Decimal degrees** - Grundformat
18. **Plain numbers** - Stora tal (meter)

## Specialfall

### Automatisk swap
- GeoJSON har longitud först → swap till lat/lon
- GML coordinates har longitud först → swap
- WKT har longitud först för WGS84 → swap
- Decimalgrader swappas om en är giltig och andra inte

### Svenska tecken
- Ö, ö → Öst
- V, v → Väst
- O, o → Öst (alternativ stavning)

### Precision
- Olika precision accepteras (olika antal decimaler)
- Minst 1 decimal krävs för decimalgrader
- Heltal tolkas som DM-format eller meter

### Kompakta format
- Ledande nollor kan utelämnas eller inkluderas
- `019° 15'` och `19° 15'` är ekvivalenta

### Glesa format
- Extra mellanslag accepteras: `58  °  30  '  N`
- Normaliseras internt

## Implementation

### Regex-patterns
- Använd `[ \t]` för whitespace (inte `\s`)
- Negative lookahead för distance markers: `(?![ \t]*[)'´′"″\u2019\u201C\u201Dz])`
- Case-insensitive matching där relevant

### Koordinatparning
- Samla individuella komponenter (lat/lon)
- Para ihop baserat på:
  - Väderstreck (N/S med E/W/Ö/V)
  - Position i text
  - Samma rad
  - Validering av värden

### Deduplicering
- Samma koordinat kan matchas av flera patterns
- Behåll endast unika koordinater
- Jämför med epsilon för flyttal (0.00001)

### Felhantering
- Ogiltiga värden ignoreras
- Partiella matchningar ignoreras
- Fortsätt söka efter nästa koordinat

## Testning

Systemet verifieras mot 118 TDD-tester som täcker:
- Alla koordinatformat
- Alla koordinatsystem
- Kantfall och specialfall
- Negativa tester (ska inte matcha)
- Blandad text
- Listor och tabeller
- URLs och dataformat

Alla tester måste passera för godkänd implementation.

## AI-vänliga riktlinjer

### För att implementera CoordFinder:

1. **Börja med patterns** - Definiera regex för varje format enligt prioritetsordning
2. **Använd rätt whitespace** - `[ \t]` inte `\s` för att undvika newline-matchning
3. **Implementera negative lookaheads** - För distance markers och zoom-parametrar
4. **Bygg koordinatparning** - Logik för att para ihop lat/lon korrekt
5. **Validera värden** - Kontrollera att koordinater är inom giltiga intervall
6. **Hantera swap** - Automatisk swap för GeoJSON, GML, WKT och ogiltiga värden
7. **Testa inkrementellt** - Kör TDD-testerna efter varje implementation
8. **Deduplicera** - Ta bort dubbletter med epsilon-jämförelse

### Vanliga fallgropar:

- **Newline-matchning** - Använd `[ \t]` inte `\s`
- **Distance markers** - Lägg till alla Unicode-varianter i negative lookahead
- **Koordinatordning** - GeoJSON/GML/WKT har longitud först
- **Swap-logik** - Endast när inga explicita väderstreck finns
- **Precision** - Minst 1 decimal för decimalgrader
- **Parning** - Koordinater på olika rader ska inte paras ihop

### Debugging:

- Kör enskilda tester: `node run-full-tdd.js` och filtrera på Test-ID
- Kontrollera vilka patterns som matchar
- Verifiera att koordinater inte bryts över rader
- Testa med faktiska Unicode-tecken, inte escape-sekvenser

## Versionshistorik

### v5.0-beta.4 (2025-12-29)
- 118/118 tester passerar (100%)
- Fixad newline-matchning i alla patterns
- Lagt till U+2019 i negative lookahead
- Förbättrad koordinatparning
- Automatisk swap-logik
