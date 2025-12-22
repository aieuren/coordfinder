# Standardtester

## Point Test: Grader och hela minuter
Test-ID: test-0031
Input:
57-43N 11-58E
Expected:
57.717 11.967

## Point Test: Decimal grader med komma
Test-ID: test-0032
Input:
58,8 och 10,9
Expected:
58.800 10.900

## Point Test: Grader och minuter med decimaler
Test-ID: test-0033
Input:
58°54,0'N, 011°00,0'E
Expected:
58.900 11.000

## Points Test: Exempeltext
Test-ID: test-0043
Input:
"Båten var ute vid 58.8 och 10,9 och syntes både från fyren på 58°54,0'N, 011°00,0'E och från Valfjället 6533947, 270746"
Expected:
- Count: 3

## Point Test: Endast latitud (ska inte hitta)
Test-ID: test-0034
Input:
Positionen är 58.8 grader nord
Expected:
null

## Points Test: Ingen koordinat i text
Test-ID: test-0044
Input:
Detta är en text utan några koordinater alls.
Expected:
- Count: 0

# Format-tester

## Point Test: Grader minuter sekunder
Test-ID: test-0101
Input:
58°54'30"N, 11°00'15"E
Expected:
58.908 11.004

## Point Test: Decimal grader med punkt
Test-ID: test-0102
Input:
58.912345 11.123456
Expected:
58.912 11.123

## Point Test: Riktningsbokstäver efter
Test-ID: test-0103
Input:
58.8N 10.9E
Expected:
58.800 10.900

## Point Test: Riktningsbokstäver före
Test-ID: test-0104
Input:
N58.8 E10.9
Expected:
58.800 10.900

## Points Test: Blandat format i samma text
Test-ID: test-0105
Input:
Punkt A: 58.8, 10.9 och Punkt B: 59°00'N 11°00'E
Expected:
- Count: 2

# SWEREF99 TM tester

## Point Test: SWEREF99 TM koordinater
Test-ID: test-0201
Input:
6533947, 270746
Expected:
58.867 11.967

## Points Test: Blandade WGS84 och SWEREF99
Test-ID: test-0202
Input:
WGS84: 58.8, 10.9 och SWEREF99: 6533947, 270746
Expected:
- Count: 2

# Kant-fall och fel-tester

## Point Test: Koordinater utanför giltigt område
Test-ID: test-0301
Input:
95.0 200.0
Expected:
null

## Point Test: Negativa koordinater
Test-ID: test-0302
Input:
45°S 10°E
Expected:
-45.000 10.000

## Points Test: Tom sträng
Test-ID: test-0303
Input:

Expected:
- Count: 0

## Points Test: Endast siffror utan kontext
Test-ID: test-0304
Input:
123 456 789
Expected:
- Count: 0

## Point Test: Extra whitespace
Test-ID: test-0305
Input:
  58.8    10.9  
Expected:
58.800 10.900
