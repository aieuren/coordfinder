# CoordFinder - Kravspecifikation

Version: 5.0-beta.5  
Datum: 2026-01-12
Baserad på: Interface, TDD-tester och implementation

## Syfte

CoordFinder ska extrahera geografiska koordinater från text i olika format och koordinatsystem. Systemet ska hantera både strukturerad och ostrukturerad text, samt identifiera koordinater i URLs, dataformat och löpande text.

## Dependencies

### Proj4.js (Valfritt)

- **Krävs för:** Reprojection mellan koordinatsystem
- **Krävs INTE för:** WGS84 (latitude/longitude) som alltid stöds
- **Användning:** Om stöd för SWEREF99 TM, RT90, ETRS89, ETRS-LAEA eller ETRS-LCC behövs, måste proj4.js inkluderas
- **Installation:** `<script src="proj4.js"></script>` före CoordFinder

Utan proj4.js:

- Alla koordinater kan extraheras och identifieras
- Konvertering till WGS84 fungerar INTE för meter-baserade system
- `reprojectTo()` returnerar `null` för icke-WGS84 system

## Koordinatsystem

### WGS84 (EPSG:4326)

- Decimalgrader: -90 till 90 (latitud), -180 till 180 (longitud)
- Grader och decimalminuter (DM)
- Grader, minuter och sekunder (DMS)
- Både punkt och komma som decimalseparator
- **Proj4:** `+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees`
- **Beskrivning:** Globalt koordinatsystem

### WGS84 Northern Europe (EPSG:4326)

- Regionbegränsat område för entydig parsning
- Latitud: 49.0° till 75.0°
- Longitud: 0.0° till 32.0°
- **Proj4:** `+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees`
- **Beskrivning:** Används för att hantera tvetydiga koordinater utan explicita väderstreck runt norra Europa

### SWEREF99 TM (EPSG:3006)

- Nordvärde (N): 6100000-7700000 meter
- Östvärde (E): 200000-1000000 meter
- Minst 5 siffror per koordinat
- **Proj4:** `+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs`

### RT90 2.5 gon V (EPSG:3021)

- Nordvärde (X): 6100000-7700000 meter
- Östvärde (Y): 1200000-1900000 meter
- Minst 5 siffror per koordinat
- **Proj4:** `+proj=tmerc +lat_0=0 +lon_0=15.80827777777778 +k=1 +x_0=1500000 +y_0=0 +ellps=bessel +units=m +no_defs`

### ETRS89 (EPSG:4258)

- Europeiskt terrestriskt referenssystem
- Latitud: 34.5° till 71.05°
- Longitud: -10.67° till 31.55°
- **Proj4:** `+proj=longlat +ellps=GRS80 +no_defs`
- **Beskrivning:** Enskilt CRS för hela Europa

### ETRS-LAEA (EPSG:3035)

- ETRS89 Lambert Azimuthal Equal Area
- Bounding Box: 2426378-6293974 (N), 1528101-5446513 (E) meter
- **Proj4:** `+proj=laea +lat_0=52 +lon_0=10 +x_0=4321000 +y_0=3210000 +ellps=GRS80 +units=m +no_defs`
- **Beskrivning:** Används för statistisk kartläggning där sann arearepresentation krävs

### ETRS-LCC (EPSG:3034)

- ETRS89 Lambert Conformal Conic
- Bounding Box: 2122254-5955457 (N), 1164627-5021872 (E) meter
- **Proj4:** `+proj=lcc +lat_1=35 +lat_2=65 +lat_0=52 +lon_0=10 +x_0=4000000 +y_0=2800000 +ellps=GRS80 +units=m +no_defs`
- **Beskrivning:** Används för konform kartläggning i skalor 1:500,000 och mindre

## Format som ska stödjas

Systemet ska kunna extrahera koordinater i följande format. För fullständig täckning av alla varianter och edge cases, se TDD-testsviten.

### 1. Decimalgrader (WGS84)

Stöd för decimalgrader med flexibel formattering:

**Decimalseparator:** Punkt eller komma (`59.32894` eller `59,32894`)

**Koordinatseparator:** Mellanslag, komma, semikolon (`59.3 18.1`, `59.3, 18.1`, `59.3; 18.1`)

**Väderstreck:** N/S/E/W eller svenska Ö/V, före eller efter värde

- Efter: `59.32894 N 18.06491 E`
- Före: `N 62.45 E 17.38`
- Svenska: `N 65.58 Ö 22.14`

**Negativa värden:** För sydliga/västliga koordinater (`-35.5 149.1`)

**Precision:**

- **Med väderstreck:** Heltal tolkas som **grader i DM/DMS-format**
  - `N60 E19` → 60°00’ N, 19°00’ E (giltigt, rating påverkas inte)
  - `N57 E12` → 57°00’ N, 12°00’ E (giltigt)
- **Utan väderstreck:** Minst 1 decimal krävs för DD-format
  - `60.0 19.0` → DD-format (giltigt)
  - `60 19` → Tolkas som DM-format (60°19’), inte DD
  - `57 12` → Kan tolkas som DM (57°12’) men har låg rating (tvetydig)

### 2. Grader och minuter (DM)

Stöd för grader och decimalminuter med eller utan symboler:

**Med symboler:** `59° 19.736' N 18° 3.895' E`

**Utan symboler:** `60 30,5 19 15,25`

**Kompakt:** `5830N01245E` (DDMM-format), `6230-1545` (minustecken som separator)

**Väderstreck:** Före eller efter värde, direkt anslutande tillåts

**Validering:** Minuter 0-59.999, minst 1 decimal rekommenderas

### 3. Grader, minuter och sekunder (DMS)

Stöd för grader, minuter och sekunder med flexibel formattering:

**Med symboler:** `59° 19' 44.2" N 18° 3' 53.7" E`

**Utan symboler:** `60 30 45.5` eller med väderstreck `N60 30 45 O19 15 30`

**Kompakt:** `591944N0180354E` (DDMMSS-format)

**Validering:** Minuter och sekunder: 0 ≤ värde < 60

### 4. URL-format

Koordinater extraheras från vanliga karttjänsters URL-format:

**URL-mönster:**

- Google Maps: koordinater efter `@` eller `/place/`
- Eniro/Hitta.se: `/kartan/` följt av koordinater
- URL-parametrar: `?x=540000&y=6580000` (även omvänd ordning)

**Zoom-parametrar ignoreras:** `13.3z` ska inte tolkas som koordinat

### 5. Dataformat

**GeoJSON:** `{"coordinates": [18.06491, 59.32894]}` - Longitud först, automatisk swap

**GML:** `<gml:coordinates>18.06491,59.32894</gml:coordinates>` - Longitud först (kommaseparerad)

**WKT:** `POINT(18.06491 59.32894)` - Longitud först för WGS84

### 6. Prefix-format

Koordinater med tydliga prefix:

- Lat/Long: `Lat: 59.32894 Long: 18.06491`
- N/E: `N: 59.32894 E: 18.06491`
- X/Y: `X: 6580000, Y: 1540000`
- Svenska: `Nordlig: 7148101 Östlig: 278978`

### 7. Verbal beskrivning

Svenska verbala beskrivningar stöds:

- `Norr 59 grader 19,8 minuter Öst 18 grader 3,9 minuter`

### 8. Listor och tabeller

Koordinater extraheras från:

- Numrerade listor (radnummer ignoreras)
- Tabellformat med headers
- Flerradiga strukturer

## Negativa tester - Ska INTE matcha

Följande typer av numerisk data ska INTE identifieras som koordinater:

- **Telefonnummer:** `+46 70 123 45 67`, `070-1234567`
- **Personnummer:** `19850315-1234`
- **Datum och tid:** `2023-05-15`, `14:30:45`
- **Priser och mått:** `199.90 kr`, `15.5 km`
- **Avståndsangivelser:** `2,5' norr`, `1,8' O` (distans med riktning)
- **Listnummer:** `2) Nästa punkt`

**Tecken som indikerar avstånd (ska ignoreras efter decimaltal):**

- `'` (ASCII apostrophe, U+0027)
- `'` (right single quotation mark, U+2019)
- `´` (acute accent, U+00B4)
- `′` (prime, U+2032)
- `"`, `″`, `"`, `"` (olika quotation marks)

Se TDD-testsviten för fullständig lista av negativa testfall.

## Validering

### WGS84

- **Latitud:** -90 till 90 grader
- **Longitud:** -180 till 180 grader
- **Minuter:** 0 ≤ minuter < 60 (dvs. 59.9999… är OK, 60.0 är inte OK)
- **Sekunder:** 0 ≤ sekunder < 60 (dvs. 59.9999… är OK, 60.0 är inte OK)
- **Decimaler:** Se Precision-regler under Decimalgrader

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

## CRS-detektering

Automatisk detektering av koordinatsystem baserat på värdeintervall, antal siffror, prefix och enhet.

### Detekteringsregler

**1. WGS84/ETRS89 (grader):**

- Latitude: -90 till 90
- Longitude: -180 till 180
- Decimalvärden eller DMS-format
- ETRS89 begränsat till Europa: lat 34.5-71.05, lon -10.67-31.55

**2. WGS84 Northern Europe:**

- Latitude: 49-75
- Longitude: 0-32
- Använd när koordinater saknar väderstreck och ligger inom detta område

**3. SWEREF 99 TM:**

- N: 6100000-7700000
- E: 200000-1000000
- Sju siffror per koordinat
- Prefix: N/E eller ingen

**4. RT90 2.5 gon V:**

- X: 6100000-7700000
- Y: 1200000-1900000
- Sju siffror per koordinat
- Prefix: X/Y eller ingen
- Högre Y-värden än SWEREF (>1000000) indikerar RT90

**5. ETRS-LAEA:**

- Värden inom: 2426378-6293974, 1528101-5446513
- Lambert Azimuthal Equal Area projektion

**6. ETRS-LCC:**

- Värden inom: 2122254-5955457, 1164627-5021872
- Lambert Conformal Conic projektion

### Konflikthantering

- **SWEREF vs RT90:** Y-värde avgör (RT90 har Y > 1200000)
- **WGS84 vs ETRS89:** Båda är kompatibla inom Europa, använd WGS84 som standard

## Whitespace-hantering

### Tillåtet mellan komponenter

- Mellanslag (space, U+0020)
- Tab (U+0009)

### Normalisering (intern hantering)

- Flera mellanslag/tabs normaliseras internt till ett mellanslag vid parsning
- Detta påverkar INTE `textBefore()`, `textAfter()` eller `context()` som returnerar original-text

## Prioritetsordning

Format ska matchas i ordning från mest specifik till minst specifik:

1. **Strukturerad data** - GeoJSON, GML, WKT
1. **Verbal beskrivning** - “Norr X grader Y minuter…”
1. **Väderstreck med koordinater** - Explicita riktningar
1. **URL-format** - Koordinater i URLs
1. **Prefix-format** - Lat:/Long:, N:/E:, X:/Y:
1. **Kompakta format** - DDMMSSN, DDMMN
1. **DMS-format** - Grader, minuter, sekunder
1. **DM-format** - Grader och minuter
1. **Decimalgrader** - Grundformat
1. **Stora tal** - Meter-koordinater (SWEREF/RT90)

## Specialfall

### Automatisk swap

- GeoJSON har longitud först → swap till lat/lon
- GML coordinates har longitud först → swap
- WKT har longitud först för WGS84 → swap
- Decimalgrader swappas om en är giltig och andra inte

**Viktigt:** Efter swap representeras koordinaten internt som N/E (eller lat/lon), men `first()` och `last()` returnerar den **textuella ordningen** från originaltexten (före swap), inte den logiska ordningen.

**Exempel:**

```javascript
// WKT: "POINT(12.56789 59.32894)" - longitud först i text
point.first()  // → 12.56789 (textuellt först, fast det är longitud)
point.last()   // → 59.32894 (textuellt sist, fast det är latitud)
point.longitude() // → 12.56789 (logiskt korrekt efter swap)
point.latitude()  // → 59.32894 (logiskt korrekt efter swap)
```

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

## Koordinatparning

Individuella koordinatkomponenter ska paras ihop till kompletta koordinater:

- **Väderstreck:** N/S paras med E/W/Ö/V
- **Position:** Komponenter på samma rad prioriteras
- **Validering:** Värden måste vara inom giltiga intervall
- **Radbrytning:** Koordinatkomponenter (enskilda lat/lon-värden) på olika rader kan paras ihop, men komponenter INOM en koordinat (t.ex. grader och minuter) får inte brytas över rader

**Exempel på giltig parning över rader:**

```
N 59.32
E 18.06
```

Detta är OK - två kompletta koordinatkomponenter på olika rader.

**Exempel på ogiltig brytning:**

```
59° 19.
736' N
```

Detta är INTE OK - grader och minuter från samma koordinat får inte brytas över rader.

## Gruppering

Gruppering är en **textuell funktion**, inte en geografisk. Koordinater grupperas baserat på textstruktur.

### Grupperingsalgoritm

**Grundprincip:**

- Koordinatpar grupperas baserat på **tomma rader** i texten
- Varje grupp består av **ett eller flera koordinatpar**
- Tom rad (endast whitespace eller helt tom) separerar grupper
- Om inga tomma rader finns, hamnar alla koordinatpar i **samma grupp**

**Exempel med flera grupper:**

```
58.5 N 12.3 E
58.6 N 12.4 E

59.1 N 13.2 E
59.2 N 13.3 E
```

Detta ger **2 grupper**:

- Grupp 1: 2 koordinatpar (58.5/12.3 och 58.6/12.4)
- Grupp 2: 2 koordinatpar (59.1/13.2 och 59.2/13.3)

**Exempel utan gruppering:**

```
58.5 N 12.3 E
58.6 N 12.4 E
59.1 N 13.2 E
```

Detta ger **1 grupp** med 3 koordinatpar (inga tomma rader).

**API:**

- `CoordFinder.groupsIn(text)` - Statisk metod
- `new CoordFinder().parse(text, {grouping: true}).groups()` - Instansmetod (se Interface)
- Kan returnera olika antal punkter än `.pointsIn()` beroende på rating-tröskel

**Användningsfall:**

- Extrahera separata polylinjer eller polygoner från text
- Hantera listor där varje “sektion” (separerad av tom rad) är en logisk enhet

**Notera:**

- Gruppering kan kombineras med rating-filtrering
- Samma koordinat kan hamna i olika grupper beroende på textkontext

## Onoggrannhet och felmarginaler

### Princip

Varje koordinat har en implicit onoggrannhet baserad på antalet decimaler i den sista komponenten. En koordinat `42.45` kan vara avrundad från vilket värde som helst i intervallet `[42.445, 42.455)`. Detta gäller både den nordliga och östliga komponenten, vilket definierar en rektangulär yta av osäkerhet.

### Beräkning av onoggrannhet

**För meterbaserade system (SWEREF99 TM, RT90, ETRS-LAEA, ETRS-LCC):**

- Onoggrannhet beräknas direkt från skillnaden mellan yttersta siffrorna
- Exempel: `6580000` har onoggrannhet ±0.5 meter
- Exempel: `6580400.5` har onoggrannhet ±0.05 meter

**För gradbaserade system (WGS84, ETRS89):**

- Onoggrannhet beräknas genom att konvertera graddifferensen till meter
- Använd geodetiska beräkningar för att få avståndet i meter
- Både nordlig och östlig onoggrannhet ska beräknas separat
- Exempel: `59.32` (2 decimaler) har onoggrannhet ±0.005° vilket motsvarar:
  - Cirka ±556 meter i nord-syd-riktning (konstant)
  - Cirka ±278 meter i öst-väst-riktning (vid 59° latitud, varierar med latitud)

**Geodetisk konvertering:**

- Längdgrader ger olika meteravstånd beroende på latitud
- Vid ekvatorn: 1° longitud ≈ 111 km
- Vid 60° N: 1° longitud ≈ 55 km
- Breddgrader ger konstant meteravstånd: 1° latitud ≈ 111 km

### Formatkonvertering utan ökad onoggrannhet

När en koordinat konverteras från ett format till ett annat ska onoggrannheten inte öka.

**Regel:**
Använd **minsta möjliga antal decimaler** i målformatet som inte ökar onoggrannheten i någon dimension (nord eller öst).

**Exempel 1 - WGS84 decimalgrader till DMS:**

- Input: `59.32894` (±0.000005° ≈ ±0.56m nord, ±0.28m öst vid denna latitud)
- Output: Antal decimaler i sekunder ska väljas så att onoggrannheten ≤ 0.56m nord och ≤ 0.28m öst
- Inte fler decimaler än nödvändigt

**Exempel 2 - DMS till decimalgrader:**

- Input: `59°19'44.2"` (±0.05” ≈ ±1.5m)
- Output: Antal decimaler i decimalgrader ska ge onoggrannhet ≤ 1.5m
- `59.32894` skulle ge för hög precision, använd färre decimaler

**Exempel 3 - SWEREF99 TM till WGS84:**

- Input: `6580000, 674000` (±0.5m i båda led)
- Output: Antal decimaler ska ge ±0.5m eller grövre i båda dimensionerna
- Beräkna geodetiskt hur många decimaler som krävs

### API för onoggrannhet

Från interface (redan implementerat):

- `point.maxErrors()` - Returnerar `{N: number, E: number}` med fel i meter
- `point.maxErrorBounds()` - Returnerar `BoundingBox` som representerar felmarginalen
- `coord.maxError()` - Returnerar maximal felamplitud för en enskild koordinat

## Kvalitetsrating

### Syfte

Varje extraherad koordinat tilldelas en kvalitetsrating (0.0 - 1.0) som indikerar sannolikheten att det extraherade värdet verkligen är ett koordinatpar och inte annan numerisk information.

### Algoritm

Rating-algoritmen använder en **deduktionsbaserad approach** som startar från ett perfekt värde på 1.0 och drar av poäng baserat på avsaknad av indikatorer eller strukturella problem.

**Startvärde: 1.0**

#### 1. Avdrag för saknade formatindikatorer

|Villkor                                                                               |Avdrag|
|--------------------------------------------------------------------------------------|------|
|Saknar BÅDE formatsymboler (°’”) OCH väderstreck (N/S/E/W) OCH tekniska prefix/kontext|-0.3  |
|Saknar formatsymboler men HAR väderstreck eller prefix                                |-0.1  |
|Saknar väderstreck men HAR formatsymboler                                             |-0.1  |

**Formatsymboler:** Gradsymbol (°), minutmarkering (’), sekundmarkering (”)  
**Väderstreck:** N, S, E, W, Ö, V (och varianter)  
**Tekniska prefix/kontext:** X:, Y:, Lat:, Long:, Point(…), URL-mönster som @…z

#### 2. Avdrag för separatortyp

|Separatortyp                                          |Avdrag|
|------------------------------------------------------|------|
|Ingen separator alls mellan koordinater               |-0.2  |
|Ovanlig separator (semikolon, snedstreck, etc.)       |-0.1  |
|Vanlig separator (mellanslag, komma, radbrytning, tab)|0     |

#### 3. Avdrag för precisionsproblem

**För Decimalgrader (DD) format:**

- Färre än 3 decimaler: -0.1

**Precisionsskillnad mellan de två koordinaterna:**

- 1-2 decimalers skillnad: -0.1
- 3+ decimalers skillnad: -0.2

**EXTREM formatinkompatibilitet (pressas under 0.5-tröskeln):**

- En koordinat i DD-intervall (~±90/±180) och den andra i meter-intervall (miljoner): -0.6
- En koordinat med 5+ decimaler och den andra med 0 decimaler: -0.6

#### 4. Slutlig poäng

Resultatet klampas till intervallet [0.0, 1.0]

### Diskvalificeringsregler

Dessa villkor resulterar i omedelbar avvisning (rating = -1 eller 0) INNAN rating-algoritmen körs:

1. **Decimalgrader (DD) utan decimaler OCH utan väderstreck:** Värden utan decimaler och utan väderstreck tolkas som DM-format (grader+minuter), inte DD. Exempel: `57 12` kan tolkas som 57°12’, inte 57.0° 12.0°. Med väderstreck tolkas heltal som grader: `N57 E12` = 57°00’ N, 12°00’ E.
1. **Värden utanför alla bounding boxes:** Koordinater som inte passar inom någon definierad referenssystems bounding box
1. **Extremt olika format i samma par:** Blandar inkompatibla format (även om -0.6 extrema avdraget hanterar kantfall)

### Koordinatformattyper

- **DD (Decimalgrader):** `59.32894 18.06491`
- **DM (Grader + Minuter):** `59° 19.736' N 18° 3' 895' E`
- **DMS (Grader + Minuter + Sekunder):** `59° 19' 44.2" N 18° 3' 53.7" E`
- **Meterbaserad:** `6580000 540000` (SWEREF99, RT90, etc.)

### Standard acceptanströskel

Den typiska tröskeln för att acceptera ett koordinatpar som giltigt är **0.5**. Par med rating ≥ 0.5 anses generellt vara legitima koordinater, medan de under 0.5 troligen är falska positiva eller strukturellt ogiltiga.

### Exempel med beräkningar

#### Exempel 1: Hög trovärdighet (1.0)

**Koordinatpar:** `59° 19' 44.2" N 18° 3' 53.7" E`

**Beräkning:**

- Start: 1.0
- Har formatsymboler (°’”): 0 avdrag
- Har väderstreck (N, E): 0 avdrag
- Vanlig separator (mellanslag): 0 avdrag
- Samma precision på båda koordinaterna: 0 avdrag
- **Slutlig rating: 1.0**

**Motivering:** Komplett DMS-format med alla indikatorer närvarande. Maximal trovärdighet.

-----

#### Exempel 2: God trovärdighet (0.7)

**Koordinatpar:** `59.32894 18.06491`

**Beräkning:**

- Start: 1.0
- Saknar både formatsymboler OCH väderstreck OCH prefix: -0.3
- Vanlig separator (mellanslag): 0 avdrag
- Båda har 5 decimaler (DD-format): 0 avdrag
- Samma precision: 0 avdrag
- **Slutlig rating: 0.7**

**Motivering:** Rena decimalgrader med god precision, men saknar explicita indikatorer. Den höga precisionen (5 decimaler) och typiska koordinatvärdesintervall tyder på att dessa troligen är koordinater.

-----

#### Exempel 3: Under tröskel (0.3)

**Koordinatpar:** `E 34,6754 6580000`

**Beräkning:**

- Start: 1.0
- Saknar formatsymboler, men har väderstreck (E): -0.1
- Vanlig separator (mellanslag): 0 avdrag
- EXTREM formatinkompatibilitet (34.6754 i DD-intervall vs 6580000 i meter-intervall): -0.6
- **Slutlig rating: 0.3**

**Motivering:** Detta par blandar decimalgrader (~34) med meterkoordinater (~6.5 miljoner), vilket är strukturellt omöjligt. Den extrema formatinkompatibiliteten pressar det väl under den typiska 0.5 acceptanströskeln.

-----

#### Exempel 4: Kompakt format (0.6)

**Koordinatpar:** `591944N0180354E`

**Beräkning:**

- Start: 1.0
- Saknar formatsymboler, men har väderstreck: -0.1
- Ingen separator alls mellan koordinater: -0.2
- Kompakt struktur (inga mellanslag mellan siffror och bokstäver): -0.1
- **Slutlig rating: 0.6**

**Motivering:** Detta är ett giltigt men mycket kompakt DDDMMSS-format. Avsaknaden av separatorer och formatsymboler minskar trovärdigeten, men närvaron av väderstreck och giltig struktur håller det över 0.5-tröskeln.

-----

### Implementeringsnoteringar

1. Algoritmen opererar på koordinatpar som redan passerat bounding box-validering
1. Alla avdrag är i steg om 0.1 för enkelhetens skull
1. Algoritmen är rent mönsterbaserad (regex/strukturell) och kräver inte AI eller semantisk förståelse
1. Formatdetektering måste ske före rating-beräkning för att tillämpa korrekta precisionsregler
1. Vid osäkerhet felläser algoritmen på acceptanssidan (undviker falska negativa)

### API för kvalitetsrating

Se Interface för fullständig API-definition:

- `CoordFinder.ratingDefault = 0.5` - Standardtröskel för filtrering
- `point.rating()` - Returnerar rating för en punkt
- `points(opts)` - Filtrera punkter baserat på `opts.rating`
- `foundRatings()` - Returnerar sorterad array av alla ratings (lägst till högst)
- `ratingIndex(rating)` - Hitta index i foundRatings för given rating

**ratingIndex(rating):**
Returnerar index i `foundRatings()` för den lägsta ratingen som är ≥ given rating.

- **Parameter:** `rating` (0.0-1.0, optional, default: 0.5)
- **Returnerar:** Index för närmaste lika eller högre rating
- **Användning:** Navigera mellan rating-nivåer vid filtrering

**Exempel:**

```javascript
var ratings = cf.foundRatings();  // [0.3, 0.5, 0.7, 0.9]
cf.ratingIndex(0.6)  // → 2 (närmaste högre är 0.7)
cf.ratingIndex(0.5)  // → 1 (exakt match)
cf.ratingIndex(0.1)  // → 0 (lägre än alla)
cf.ratingIndex(1.0)  // → 3 (högre än alla)
```

## Felhantering

- Ogiltiga värden ska ignoreras
- Partiella matchningar ska ignoreras
- Fortsätt söka efter nästa koordinat vid fel
- Inga exceptions ska kastas

## Output

### Koordinatpunkt

Varje extraherad koordinat ska innehålla:

- **Nordvärde/Latitud:** Första komponenten
- **Östvärde/Longitud:** Andra komponenten
- **Koordinatsystem:** Identifierat system (WGS84, SWEREF99TM, RT90, ETRS89, etc.)
- **Kvalitetsrating:** 0.0-1.0 (trovärdighet enligt algoritm ovan)
- **Onoggrannhet:** Max fel i meter för N och E
- **Kontext:** Text före och efter koordinaten
- **Original:** Ursprunglig koordinat före reprojection

### Formattering

Koordinater ska kunna formateras med `asText(opts)` med följande optioner:

**Format:**

- `'plain'` - Som parsad (default)
- `'degrees'` - Decimalgrader (DD.DDDD)
- `'degreesandminutes'` - Grader och minuter (DD° MM.MMM’)
- `'degreesminutesandseconds'` - Grader, minuter och sekunder (DD° MM’ SS.S”)

**Direction letters:**

- `'none'` - Inga väderstreck (default)
- `'before'` - Väderstreck före: `N 59.32 E 18.06`
- `'after'` - Väderstreck efter: `59.32 N 18.06 E`

**Symbols:**

- `true` - Med symboler: `59° 19' 44"`
- `false` - Utan symboler: `59 19 44`

**Compact:**

- `false` - Med mellanslag (default): `59° 19' 44"`
- `true` - Utan mellanslag: `59°19'44"`

**Decimals:**

- **Default (inget angivet):** Automatisk precision baserad på input (‘auto’-beteende)
- `'auto'` - Använd ursprunglig precision från input (behåll onoggrannhet)
- `'meter'` - Tillräckligt många decimaler för ca 1 meters noggrannhet
- `0-10` - Specifikt antal decimaler (avrundning eller noll-paddning)

**Localized:**

- `true` - Använd lokala konventioner (komma som decimaltecken i Sverige)
- `false` - Använd internationell standard (punkt som decimaltecken)

**Exempel:**

```javascript
point.asText() 
// → "59.32894 18.06491"

point.asText({format: 'degreesandminutes'})
// → "59° 19.736' 18° 3.895'"

point.asText({format: 'degreesminutesandseconds', directionLetter: 'after'})
// → "59° 19' 44.2" N 18° 3' 53.7" E"

point.asText({directionLetter: 'before', symbols: false, decimals: 4})
// → "N 59.3289 E 18.0649"

point.asText({compact: true, symbols: true})
// → "59.32894°18.06491°"
```

### Kontext-metoder

För att få information om var i texten koordinaten hittades:

**textBefore(opts)** - Text före koordinaten

**textAfter(opts)** - Text efter koordinaten

**originalText(opts)** - Ursprunglig koordinattext

Returnerar texten från början av första koordinaten till slutet av sista koordinaten, inklusive allt däremellan (separatorer, mellanslag, newlines).

**Vad inkluderas:**

- Båda koordinaterna i sin ursprungliga form
- All text mellan koordinaterna
- Newlines om koordinaterna är på olika rader

**Exempel:**

```javascript
// Text: "Position: 58.5 N 12.3 E nearby"
point.originalText() // → "58.5 N 12.3 E"

// Text: "N: 58.5\nE: 12.3"
point.originalText() // → "58.5\nE: 12.3" (från första siffran till sista)
```

**context(opts)** - Sammanhängande kontext (före + koordinat + efter)

**Optioner för kontext-metoder:**

- `maxchars` - Max antal tecken (default: 12 för context)
- `html` - Använd HTML-formatering (default: true för context)
- `ellipse` - Ersätt utelämnade tecken med “…” (default: true för context)

**Viktigt:**

- Mellanslag räknas in i `maxchars`
- Ingen trimning görs av returnerade strängar
- Original-text returneras utan normalisering

**Exempel:**

```javascript
// Text: "The ship was at 58.5 N 12.3 E near the island"
point.textBefore({maxchars: 15})
// → "The ship was at" (inkl. avslutande mellanslag om det fanns)

point.originalText()
// → "58.5 N 12.3 E"

point.textAfter({maxchars: 10})
// → "near the i"

point.context({maxchars: 20, html: false, ellipse: true})
// → "...was at 58.5 N 12.3 E near th..."
```

### Konvertering

Koordinater ska kunna:

- Konverteras mellan koordinatsystem via `reprojectTo(refSys)`
- Formateras i olika notationer via `asText(opts)`
- Returneras som WGS84 lat/lon via `latitude()` och `longitude()`
- Bevara original via `original()`

### Gruppering

Koordinater kan grupperas textuellt:

- Baserat på textstruktur (tomma rader)
- Med bounding box för gruppen

### Kontext och loggning

För varje punkt:

- `textBefore(opts)` - Text före koordinaten
- `textAfter(opts)` - Text efter koordinaten
- `originalText(opts)` - Ursprunglig text
- `context(opts)` - Sammanhängande kontext
- `log()` - Logg över hur punkten skapades
- `asDebugText()` - Detaljerad debug-information

## Loggning och debugging

Två loggfunktioner tillhandahålls för att förstå och debugga parsing-processen.

### CoordFinder.log() - Parsing-översikt

Returnerar en svenskspråkig logg över hela parsing-processen från input-text till funna koordinatpar.

#### Syfte

Beskriva parsing-processen inklusive mellansteg, bildade koordinatpar, bortvalda resultat och oanvända koordinater.

#### Loggstruktur

Loggen följer denna sekvens:

**1. Sökning efter koordinat-liknande texter**

Om inga hittades:

```
Letade efter koordinatliknande texter...
...men hittade inga.
```

Om några hittades:

```
Letade efter koordinatliknande texter...
...och hittade [antal].
 
```

(Tom rad efter antalet)

**2. Format-hints (om identifierade)**

Om parsing-processen identifierat specifika format-indikatorer:

```
Texten innehåller frasen "<gml:" vilket tyder på formatet Geographic Markup Language, GML. 
Förutsätter därför att longitudkoordinaten kommer före latitud.
```

Eller:

```
Texten innehåller en rad som börjar med WKT, vilket tyder på formatet Well-known Text (WKT). 
Då bör longitudkoordinaten komma före latitud.
```

**3. Matchning till koordinatpar**

Försök att para ihop:

```
Försökte tolka texterna och sätta ihop dem två och två till giltiga koordinatpar...
```

Om inga par kunde skapas:

```
...men fick inte till några koordinatpar.
 
```

Om par skapades och några accepterades:

```
...och fick fram [antal] koordinatpar:
- På rad [radnr]: "[text1]" och "[text2]" kan bli [formaterad koordinat] (trovärdighet [nivå] av 10)
- På rad [radnr]: "[text1]" och på rad [radnr2]: "[text2]" kan bli [formaterad koordinat] (trovärdighet [nivå] av 10)
```

Exempel:

```
...och fick fram 2 koordinatpar:
- På rad 1: "59.123" och "18.456" kan bli N 59.123 E 18.456 (trovärdighet 8 av 10)
- På rad 3: "N 6356776" och "E 340228" kan bli N 6356776 E 340228 (trovärdighet 10 av 10)
```

Om par skapades men inga accepterades:

```
...och fick fram [antal] koordinatpar.
 
```

**4. Bortvalda koordinatpar (om tillämpligt)**

Om rating-nivå ≤ 10:

```
Sorterade bort [antal] koordinatpar som hade en trovärdighet lägre än [nivå] på en skala från 1 till 10:
- På rad [radnr]: "[text1]" och "[text2]" kan bli [formaterad koordinat] (trovärdighet [nivå] av 10)
```

Om rating-nivå > 10 (extremt hög tröskel):

```
Sorterade dock sedan bort alla [antal] hittade koordinatpar:
- På rad [radnr]: "[text1]" och "[text2]" kan bli [formaterad koordinat] (trovärdighet [nivå] av 10)
```

Exempel:

```
Sorterade bort 1 koordinatpar som hade en trovärdighet lägre än 7 på en skala från 1 till 10:
- På rad 2: "59" och "18" kan bli N 59 E 18 (trovärdighet 3 av 10)
```

**5. Oanvända koordinater (om tillämpligt)**

Om exakt 1 oanvänd koordinat:

```
En möjlig koordinattext kunde inte användas i något koordinatpar och blev därför över:
- På rad [radnr]: "[text]"
```

Om flera oanvända koordinater:

```
Det blev [antal] textbitar över som inte kunde användas till något koordinatpar:
- På rad [radnr]: "[text1]"
- På rad [radnr]: "[text2]"
```

#### Format för koordinatpar-detaljer

Varje listat koordinatpar följer mönstret:

- **Om på samma rad:** `På rad [nr]: "[första texten]" och "[andra texten]" kan bli [tolkad koordinat] (trovärdighet [nivå] av 10)`
- **Om på olika rader:** `På rad [nr1]: "[första texten]" och på rad [nr2]: "[andra texten]" kan bli [tolkad koordinat] (trovärdighet [nivå] av 10)`

Den tolkade koordinaten visas med riktningsbokstäver före koordinatvärdena (t.ex. “N 59.123 E 18.456”).

#### Specialfall

**Ingen input-text:**

```
Ingen text att leta koordinater i.
```

**Stegvis avbrytning:**
Loggen avslutas vid första relevanta negativa resultatet:

- Inga koordinat-liknande texter → Avsluta efter steg 1
- Inga koordinatpar kunde bildas → Avsluta efter steg 3

#### Terminologi

Använd konsekvent:

- “koordinatliknande texter” - för initialt funna textstycken
- “koordinatpar” - för matchade par av koordinater
- “trovärdighet” - för rating/confidence
- “textbitar” - för oanvända koordinater (plural)
- “koordinattext” - för oanvänd koordinat (singular)
- Skala “från 1 till 10” - för trovärdighet

#### Output-format

- **Format:** Flerradig textsträng med newline-separering
- **Språk:** Svenska
- **Stil:** Narrativ med “…” för att fortsätta meningar över flera rader
- **Trovärdighet:** Rating (internt 0.0-1.0) presenteras som nivå 0-10 genom `Math.round(rating * 10)`

-----

### Point.log() - Enskild punkts ursprung

Returnerar en kortfattad, svenskspråkig logg som beskriver hur en enskild punkt skapades från parsad text.

**Primärt use case:** Används av `CoordFinder.log()` för att beskriva varje funnet koordinatpar. Kan också anropas direkt på en punkt för att se dess ursprung.

#### Syfte

Beskriva varifrån punktens två koordinater kommer och hur de tolkades, i kompakt format.

#### Output-format

**Om båda koordinaterna är på samma rad:**

```
- På rad [radnr]: "[första texten]" och "[andra texten]" kan bli [tolkad koordinat] (trovärdighet [nivå] av 10)
```

Exempel:

```
- På rad 1: "59.123" och "18.456" kan bli N 59.123 E 18.456 (trovärdighet 8 av 10)
```

**Om koordinaterna är på olika rader:**

```
- På rad [radnr1]: "[första texten]" och på rad [radnr2]: "[andra texten]" kan bli [tolkad koordinat] (trovärdighet [nivå] av 10)
```

Exempel:

```
- På rad 1: "N 59.123" och på rad 3: "E 18.456" kan bli N 59.123 E 18.456 (trovärdighet 10 av 10)
```

#### Detaljerad beskrivning

**Radnummer:** Hämtas från den parsade textens radnumrering (första raden = rad 1)

**Textstycken:** Visar de ursprungliga textstyckena som tolkades, trimmed (utan inledande/avslutande mellanslag)

**Tolkad koordinat:** Visar den färdiga koordinaten i format med riktningsbokstäver före värden

- Formateras med `{directionLetter: 'before'}` som option
- Exempel: “N 59.123 E 18.456”

**Trovärdighet:** Visar punktens rating på skala 0-10

- Beräknas genom `Math.round(rating * 10)` där rating är 0.0-1.0
- Presenteras som “trovärdighet [nivå] av 10”

**Ordning:** Koordinaterna presenteras i den ordning de först hittades i texten (första koordinaten först, sista koordinaten sist)

#### Specialfall

**Tom punkt eller saknade koordinater:**  
Om punkten saknar N- eller E-koordinat, returnera tom sträng `""`.

**Samma radnummer:**  
Avgörs genom att jämföra `N.parsedFrom.lineNo` med `E.parsedFrom.lineNo`.

#### Format-specifikation

- **Format:** Enradig textsträng (ingen avslutande newline)
- **Språk:** Svenska
- **Inleds med:** Bindestreck och mellanslag “- “
- **Terminologi:**
  - “På rad [nr]” - för radnummer
  - “kan bli” - för att visa tolkad koordinat
  - “trovärdighet [nivå] av 10” - för rating

## Testning

Systemet verifieras mot en omfattande TDD-testsvit som täcker:

- Alla koordinatformat och varianter
- Alla koordinatsystem
- Kantfall och specialfall (edge cases)
- Negativa tester (ska inte matcha)
- Blandad text med störande data
- Listor och tabeller
- URLs och dataformat

**TDD-testsviten är den exekverbara specifikationen** och innehåller exakt input/output för varje testfall. REQUIREMENTS.md beskriver principer och algoritmer; testerna verifierar implementation.

Alla tester måste passera för godkänd implementation.
