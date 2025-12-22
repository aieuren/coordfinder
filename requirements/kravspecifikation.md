# Kravspecifikation - Koordinatparser

## 1. Översikt

Mjukvaran ska kunna extrahera geografiska koordinater från text i olika format och koordinatreferenssystem (CRS).

## 2. Koordinatsystem som ska stödjas

Följande koordinatreferenssystem (CRS) ska stödjas:

1. **WGS84** (EPSG:4326) - Globalt lat/lon-system
1. **WGS84 Northern Europe** (EPSG:4326) - Regionbegränsat för entydig parsning
1. **SWEREF 99 TM** (EPSG:3006) - Svenskt nationellt system
1. **RT90 2.5 gon V** (EPSG:3021) - Äldre svenskt system
1. **ETRS89** (EPSG:4258) - Europeiskt lat/lon-system
1. **ETRS-LAEA** (EPSG:3035) - Europeisk projektion (equal area)
1. **ETRS-LCC** (EPSG:3034) - Europeisk projektion (conformal)

Detaljerade specifikationer för varje CRS finns i bilaga A.

## 3. WGS84 Inputformat som ska stödjas

### 3.1 Decimalgrader

**Format:** DD.DDDDD

**Exempel:**

- `59.32894 18.06491`
- `59,32894 18,06491` (komma som decimaltecken)
- `59.32894; 18.06491` (semikolon som separator)

**Krav:**

- Både punkt och komma som decimaltecken
- Mellanslag, komma eller semikolon som separator mellan lat/long
- Minst 2 decimaler för rimlig precision (kan konfigureras)

### 3.2 Grader och decimalminuter

**Format:** DD° MM.MMM’

**Exempel:**

- `59° 19.736' N 18° 3.895' E`
- `59 19.736 N 18 3.895 E`
- `5919.736N 01803.895E` (kompakt)

**Krav:**

- Gradtecken (°, º, deg) är valfritt
- Minuttecken (’, ′) är valfritt
- Väderstreck (N/S/E/W eller Ö/V) före eller efter värde

### 3.3 Grader, minuter och sekunder

**Format:** DD° MM’ SS.S”

**Exempel:**

- `59° 19' 44.2" N 18° 3' 53.7" E`
- `59 19 44.2 N 18 3 53.7 E`
- `591944N0180354E` (kompakt NMEA-stil)

**Krav:**

- Gradtecken, minuttecken och sekundtecken (”, ″) är valfria
- Stödja både spatierad och kompakt notation

### 3.4 Gradminuter (DDMM)

**Format:** DDMM (utan separator)

**Exempel:**

- `5919N01804E`
- `5919-01804` (med minustecken som separator)

**Krav:**

- Minustecken kan användas som separator mellan komponenter
- Väderstreck kan anges

## 4. Väderstreck och kvadranter

### 4.1 Stödda väderstreck

- **Engelska:** N, S, E, W (North, South, East, West)
- **Svenska:** N, S, Ö, O, V (Nord, Syd, Öst, Väst)

### 4.2 Positionering

- Före värdet: `N 59.32 E 18.06`
- Efter värdet: `59.32 N 18.06 E`
- Direkt anslutande: `59.32N 18.06E`

### 4.3 Negativa koordinater

- Minustecken: `-33.92 -18.42` (syd/väst)
- Väderstreck S och W ska ge negativa värden

## 5. Specialformat och notationer

### 5.1 URL-format

**Stöd för vanliga karttjänster:**

- Google Maps: `maps.google.com/.../@59.32894,18.06491`
- Eniro: `eniro.se/map/59.32894/18.06491`
- Hitta.se: `hitta.se/kartan/...lat=59.32894&lng=18.06491`

### 5.2 Dataformat

**GeoJSON:**

```json
{"coordinates": [18.06491, 59.32894]}
```

*Notera: Longitude först i GeoJSON*

**GML (Geography Markup Language):**

```xml
<gml:pos>59.32894 18.06491</gml:pos>
```

**WKT (Well-Known Text):**

```
POINT(18.06491 59.32894)
```

*Notera: Longitude först i WKT*

### 5.3 Prefix och labels

- `Lat: 59.32894 Long: 18.06491`
- `Latitude: 59.32894, Longitude: 18.06491`
- `N: 6580000, E: 540000` (för SWEREF/RT90)
- `X: 6580000, Y: 1540000` (för RT90)

## 6. SWEREF 99 TM format

### 6.1 Grundformat

**Exempel:**

- `6580000 540000`
- `N 6580000 E 540000`
- `6580000 x 540000` (x som separator)

### 6.2 Validering

- N-värde: 6100000 - 7700000 meter
- E-värde: 200000 - 1000000 meter
- Sju siffror för vardera koordinat
- EPSG: 3006

## 7. RT90 format

### 7.1 Grundformat

**Exempel:**

- `6580000 1540000`
- `X: 6580000, Y: 1540000`

### 7.2 Validering

- X-värde: 6100000 - 7700000 meter
- Y-värde: 1200000 - 1900000 meter
- Sju siffror för vardera koordinat
- EPSG: 3021 (RT90 2.5 gon V)

## 8. Textbehandling

### 8.1 Extraktion från löptext

Parsern ska kunna hitta koordinater i:

- Löpande text: “Fartyget befann sig vid 58°45’N 17°30’E”
- Numrerade listor: “1) 59°30’N 18°15’E”
- Flerradiga format med separata rader för lat/long
- Blandad text med annan numerisk information

### 8.2 Whitespace-hantering

- Hantera variabel mängd whitespace
- Mycket kompakta format: `5830N01245E`
- Mycket glesa format: `58  °  30  '  N    12  °  45  '  E`

### 8.3 Flertaliga resultat

När flera koordinatpar finns i texten:

- Returnera lista med alla funna koordinater
- Bevara ordning
- Möjlighet att beräkna bounding box

## 9. Onoggrannhet och formatkonvertering

### 9.1 Onoggrannhet från avrundning

Varje koordinat har en implicit onoggrannhet baserad på antalet decimaler i den sista komponenten.

**Princip:**
En koordinat `42.45` kan vara avrundad från vilket värde som helst i intervallet `[42.445, 42.455)`. Detta gäller både den nordliga och östliga komponenten, vilket definierar en rektangulär yta av osäkerhet.

**Beräkning av onoggrannhet:**

För **meterbaserade system** (SWEREF99 TM, RT90):

- Onoggrannhet beräknas direkt från skillnaden mellan yttersta siffrorna
- Exempel: `6580000` har onoggrannhet ±0.5 meter
- Exempel: `6580400.5` har onoggrannhet ±0.05 meter

För **gradbaserade system** (WGS84, ETRS89):

- Onoggrannhet beräknas genom att konvertera graddifferensen till meter
- Använd geodetiska beräkningar för att få avståndet i meter
- Både nordlig och östlig onoggrannhet ska beräknas separat
- Exempel: `59.32` har onoggrannhet ±0.005° vilket motsvarar olika meteravstånd i nord-syd respektive öst-väst

**Geografisk kompetens krävs:**
För att konvertera grader till meter måste systemet:

- Använda geodetisk beräkning (t.ex. Haversine eller Vincenty)
- Ta hänsyn till att längdgrader ger olika meteravstånd beroende på latitud
- Beräkna separat för nord-syd (latitud) och öst-väst (longitud)

### 9.2 Formatkonvertering utan ökad onoggrannhet

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
- `59.32894` skulle ge för hög precision (±0.56m < 1.5m), använd färre decimaler

**Exempel 3 - SWEREF99 TM till WGS84:**

- Input: `6580000, 674000` (±0.5m i båda led)
- Output: Antal decimaler ska ge ±0.5m eller grövre i båda dimensionerna
- Beräkna geodetiskt hur många decimaler som krävs

### 9.3 Rapportering av onoggrannhet

För varje extraherad koordinat ska systemet kunna rapportera:

- Onoggrannhet i meter för nordlig dimension
- Onoggrannhet i meter för östlig dimension

## 10. Validering och felhantering

### 10.1 Intervallkontroll WGS84

**Måste avvisas:**

- Latitude < -90° eller > 90°
- Longitude < -180° eller > 180°
- Minuter < 0 eller ≥ 60
- Sekunder < 0 eller ≥ 60

### 10.2 Precision

- Minst 2 decimaler rekommenderas för decimalgrader (annars låg precision)

### 10.3 Falska positiva

**Ska INTE tolkas som koordinater:**

- Telefonnummer: `08-123 45 67`
- Datum: `2024-01-15`
- Föreskriftsreferenser: `FIFS 2024:15`
- Organisationsnummer
- Andra numeriska sekvenser

### 10.4 CRS-detektering

Automatisk detektering av koordinatsystem baserat på:

- Värdeintervall (bounding box)
- Antal siffror
- Prefixnotation (Lat/Long vs N/E eller X/Y)
- Enhet (grader vs meter)

**Detekteringsregler:**

1. **WGS84/ETRS89** (grader):
- Latitude: -90 till 90
- Longitude: -180 till 180
- Decimalvärden eller DMS-format
- ETRS89 begränsat till Europa: lat 34.5-71.05, lon -10.67-31.55
1. **WGS84 Northern Europe**:
- Latitude: 49-75
- Longitude: 0-32
- Använd när koordinater saknar väderstreck och ligger inom detta område
1. **SWEREF 99 TM**:
- N: 6100000-7700000
- E: 200000-1000000
- Sju siffror per koordinat
- Prefix: N/E eller ingen
1. **RT90 2.5 gon V**:
- X: 6100000-7700000
- Y: 1200000-1900000
- Sju siffror per koordinat
- Prefix: X/Y eller ingen
- Högre Y-värden än SWEREF (>1000000) indikerar RT90
1. **ETRS-LAEA**:
- Värden inom: 2426378-6293974, 1528101-5446513
- Lambert Azimuthal Equal Area projektion
1. **ETRS-LCC**:
- Värden inom: 2122254-5955457, 1164627-5021872
- Lambert Conformal Conic projektion

**Konflikthantering:**

- SWEREF vs RT90: Y-värde avgör (RT90 har Y > 1200000)
- WGS84 vs ETRS89: Båda är kompatibla inom Europa, använd WGS84 som standard

## 11. Kvalitetsrating för extraherade koordinater

### 11.1 Syfte

Varje extraherad koordinat ska tilldelas en kvalitetsrating (0.0 - 1.0) som indikerar sannolikheten att det extraherade värdet verkligen är ett koordinatpar och inte annan numerisk information.

### 11.2 Rating-skala

**Rating 1.0 - Hög trovärdighet:**

- Koordinaten har tydliga särdrag som entydigt indikerar geografisk position
- Exempel: `57.71556 11.97315`, `57°42'57.6" 11°58'12.9"`
- Mycket osannolikt att det är något annat än koordinater

**Rating 0.5 - Måttlig trovärdighet:**

- Koordinaten har viss struktur som tyder på geografisk position
- Kan potentiellt vara annan numerisk data
- Exempel: `57.72° 11.97°`, `57°42,961' 011°58,215'`, `57 ̊ 43.0 11 ̊ 58.2`
- Troligt men inte säkert att det är koordinater

**Rating 0.0 - Låg trovärdighet:**

- Koordinaten saknar tydliga särdrag
- Hög risk att det är annan numerisk information
- Exempel: `57 12`, `N57 E12`, `57 E12`
- Kan vara koordinater men kan lika gärna vara annat

### 11.3 Faktorer som ökar trovärdighet

- Väderstreckstecken (N/S/E/W/Ö/V)
- Grad-, minut- och sekundtecken (°, ’, “)
- Decimaler i koordinatvärden
- Standardiserade dataformat (GeoJSON, WKT, GML)
- Tydliga separatorer mellan komponenter
- Prefix som “Lat:”, “Long:”, “N:”, “E:”

### 11.4 Faktorer som minskar trovärdighet

- Bara heltalsvärden utan notation
- Saknade komponentmarkörer
- Tvetydiga separatorer
- Värden som kan tolkas som annat (datum, telefonnummer, etc.)
- Osäker koordinatordning

-----

## Bilaga A - Detaljerade CRS-specifikationer

### A.1 WGS84 (World Geodetic System 1984)

**EPSG-kod:** 4326  
**Enhet:** Grader (Degrees)  
**Bounding Box:** -90.0, -180.0, 90.0, 180.0 (lat_min, lon_min, lat_max, lon_max)  
**Proj4-definition:** `+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees`  
**Beskrivning:** WGS84 är ett globalt koordinatsystem

**Globalt omfång:**

- Latitude: -90.0° till +90.0°
- Longitude: -180.0° till +180.0°

### A.2 WGS84 Northern Europe (specialfall)

**EPSG-kod:** 4326 (samma som WGS84)  
**Enhet:** Grader (Degrees)  
**Bounding Box:** 49.0, 0.0, 75.0, 32.0  
**Proj4-definition:** `+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees`  
**Beskrivning:** Begränsat område för att tillåta entydig parsning av koordinater utan väderstreckstecken runt norra Europa

**Geografiskt omfång:**

- Latitude: 49.0° till 75.0°
- Longitude: 0.0° till 32.0°

**Användning:** Detta begränsade område används för att hantera tvetydiga koordinater utan explicita väderstreck (N/S/E/W). Koordinater inom detta område kan antas tillhöra norra Europa.

### A.3 SWEREF 99 TM (Swedish Reference Frame)

**EPSG-kod:** 3006  
**Enhet:** Meter  
**Bounding Box:** 6100000, 200000, 7700000, 1000000 (N_min, E_min, N_max, E_max)  
**Proj4-definition:** `+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs`

**Giltigt omfång:**

- N (Nord): 6100000 - 7700000 meter
- E (East): 200000 - 1000000 meter

### A.4 RT90 2.5 gon V (Rikets Nät 1990)

**EPSG-kod:** 3021  
**Enhet:** Meter  
**Bounding Box:** 6100000, 1200000, 7700000, 1900000 (X_min, Y_min, X_max, Y_max)  
**Proj4-definition:** `+proj=tmerc +lat_0=0 +lon_0=15.80827777777778 +k=1 +x_0=1500000 +y_0=0 +ellps=bessel +units=m +no_defs`

**Giltigt omfång:**

- X (Nord): 6100000 - 7700000 meter
- Y (Öst): 1200000 - 1900000 meter

### A.5 ETRS89 (European Terrestrial Reference System 1989)

**EPSG-kod:** 4258  
**Enhet:** Grader (Degrees)  
**Bounding Box:** 34.5000, -10.6700, 71.0500, 31.5500 (lat_min, lon_min, lat_max, lon_max)  
**Proj4-definition:** `+proj=longlat +ellps=GRS80 +no_defs`  
**Scope:** Enskilt CRS för hela Europa. Används för statistisk kartläggning i alla skalor och andra syften där sann arearepresentation krävs.

**Geografiskt omfång:**

- Latitude: 34.5000° till 71.0500°
- Longitude: -10.6700° till 31.5500°

### A.6 ETRS-LAEA (ETRS89 Lambert Azimuthal Equal Area)

**EPSG-kod:** 3035  
**Enhet:** Meter  
**Bounding Box:** 2426378.0132, 1528101.2618, 6293974.6215, 5446513.5222  
**Proj4-definition:** `+proj=laea +lat_0=52 +lon_0=10 +x_0=4321000 +y_0=3210000 +ellps=GRS80 +units=m +no_defs`  
**Scope:** Enskilt CRS för hela Europa. Används för statistisk kartläggning i alla skalor och andra syften där sann arearepresentation krävs.

### A.7 ETRS-LCC (ETRS89 Lambert Conformal Conic)

**EPSG-kod:** 3034  
**Enhet:** Meter  
**Bounding Box:** 2122254.2378, 1164627.9290, 5955457.4541, 5021872.0731  
**Proj4-definition:** `+proj=lcc +lat_1=35 +lat_2=65 +lat_0=52 +lon_0=10 +x_0=4000000 +y_0=2800000 +ellps=GRS80 +units=m +no_defs`  
**Scope:** Enskilt CRS för hela Europa. Används för konform kartläggning i skalor 1:500,000 och mindre.