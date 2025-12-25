// coordfinder.js - Coordinate Finder Implementation
// Version, author, and license are defined as CF.version, CF.author, CF.license

(function(global) {
'use strict';

// ——————————— CoordUnit ——————————— //
function CoordUnit(name) {
    this.name = name;
}
CoordUnit.prototype.toString = function() { return this.name; };
CoordUnit.Unknown = new CoordUnit("unknown");
CoordUnit.Meters = new CoordUnit("meter");
CoordUnit.Degrees = new CoordUnit("grader");

// ——————————— CoordFormat ——————————— //
function CoordFormat(name) {
    this.name = name;
}
CoordFormat.prototype.unit = function() {
    if (this === CoordFormat.Meters) return CoordUnit.Meters;
    if (this === CoordFormat.Degs || this === CoordFormat.DegsMins || 
        this === CoordFormat.Degreemins || this === CoordFormat.DegsMinsSecs) {
        return CoordUnit.Degrees;
    }
    return CoordUnit.Unknown;
};
CoordFormat.prototype.toString = function() { return this.name; };

CoordFormat.Unknown = new CoordFormat("unknown");
CoordFormat.Plain = new CoordFormat("koordinatsiffra");
CoordFormat.Degs = new CoordFormat("decimalgrader");
CoordFormat.DegsMins = new CoordFormat("grader och minuter");
CoordFormat.Degreemins = new CoordFormat("grader och minuter ihopsatta");
CoordFormat.DegsMinsSecs = new CoordFormat("grader, minuter och sekunder");
CoordFormat.Meters = new CoordFormat("meter");

// ——————————— CoordAxis ——————————— //
var CoordAxis = {
    Unknown: "Unknown",
    Northing: "Northing",
    Easting: "Easting"
};

// ——————————— CoordDirection ——————————— //
function CoordDirection(directionLetter) {
    this._directionLetter = directionLetter;
}
CoordDirection.prototype.axis = function() {
    if (this === CoordDirection.North || this === CoordDirection.South) {
        return CoordAxis.Northing;
    }
    if (this === CoordDirection.East || this === CoordDirection.West) {
        return CoordAxis.Easting;
    }
    return CoordAxis.Unknown;
};
CoordDirection.prototype.toString = function() { return this._directionLetter; };

CoordDirection.Unknown = new CoordDirection("-");
CoordDirection.North = new CoordDirection("N");
CoordDirection.South = new CoordDirection("S");
CoordDirection.East = new CoordDirection("E");
CoordDirection.West = new CoordDirection("W");

// ——————————— BoundingBox ——————————— //
function BoundingBox(Nmin, Emin, Nmax, Emax) {
    this.Nmin = Nmin;
    this.Emin = Emin;
    this.Nmax = Nmax;
    this.Emax = Emax;
}

BoundingBox.prototype.asLatLngArray = function() {
    return [
        [this.Nmin, this.Emin],
        [this.Nmin, this.Emax],
        [this.Nmax, this.Emax],
        [this.Nmax, this.Emin]
    ];
};

BoundingBox.prototype.covers = function(N, E) {
    return N >= this.Nmin && N <= this.Nmax && E >= this.Emin && E <= this.Emax;
};

BoundingBox.prototype.coversPoint = function(p) {
    var lat = p.latitude();
    var lng = p.longitude();
    return this.covers(lat, lng);
};

BoundingBox.prototype.scale = function(factorN, factorE) {
    var centerN = (this.Nmin + this.Nmax) / 2;
    var centerE = (this.Emin + this.Emax) / 2;
    var halfRangeN = (this.Nmax - this.Nmin) / 2 * factorN;
    var halfRangeE = (this.Emax - this.Emin) / 2 * factorE;
    return new BoundingBox(
        centerN - halfRangeN,
        centerE - halfRangeE,
        centerN + halfRangeN,
        centerE + halfRangeE
    );
};

BoundingBox.prototype.toString = function() {
    return "N:" + this.Nmin + "-" + this.Nmax + " E:" + this.Emin + "-" + this.Emax;
};

// ——————————— RefSys ——————————— //
function RefSys(name, code, unit, boundingBox, projDef, description) {
    this.name = name;
    this.code = code;
    this.unit = unit;
    this.bounds = boundingBox;
    this.projDef = projDef;
    this.description = description || "";
}

RefSys.prototype.contains = function(c1, c2, ordered) {
    if (!c1 || !c2) return null;
    
    var tryPair = function(cN, cE, refsys) {
        // Validate axis if known (not Unknown)
        // This prevents pairing two latitudes or two longitudes
        if (cN.axis !== CoordAxis.Unknown && cE.axis !== CoordAxis.Unknown) {
            if (cN.axis !== CoordAxis.Northing || cE.axis !== CoordAxis.Easting) {
                return null;
            }
        }
        
        if (refsys.bounds.covers(cN.value, cE.value)) {
            return {N: cN, E: cE, RefSys: refsys};
        }
        return null;
    };
    
    var result = tryPair(c1, c2, this);
    if (result) return result;
    
    if (!ordered) {
        result = tryPair(c2, c1, this);
        if (result) return result;
    }
    
    return null;
};

RefSys.Unknown = new RefSys("Unknown reference system", 0, CoordUnit.Unknown, 
    new BoundingBox(0,0,0,0), "", "(Okänt koordinatreferenssystem)");

RefSys.WGS84 = new RefSys("WGS84", 4326, CoordUnit.Degrees, 
    new BoundingBox(-90.0, -180.0, 90.0, 180.0), 
    "+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees",
    "WGS84 är ett globalt koordinatsystem");

RefSys.WGS84NorthernEurope = new RefSys("WGS84 i norra Europa", 4326, CoordUnit.Degrees, 
    new BoundingBox(49.0, 0.0, 75.0, 32.0), 
    "+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees");

RefSys.SWEREF99TM = new RefSys("SWEREF99 TM", 3006, CoordUnit.Meters, 
    new BoundingBox(6100000, 200000, 7700000, 1000000), 
    "+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");

RefSys.SWEREF99TM_Extended = new RefSys("nästan SWEREF99 TM", 3006, CoordUnit.Meters, 
    RefSys.SWEREF99TM.bounds.scale(1.1, 1.25), 
    "+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");

RefSys.RT90_25gonV = new RefSys("RT90 2.5 gon V", 3021, CoordUnit.Meters, 
    new BoundingBox(6100000, 1200000, 7700000, 1900000), 
    "+proj=tmerc +lat_0=0 +lon_0=15.80827777777778 +k=1 +x_0=1500000 +y_0=0 +ellps=bessel +units=m +no_defs");

RefSys.RT90_25gonV_Extended = new RefSys("nästan RT90 2.5 gon V", 3021, CoordUnit.Meters, 
    RefSys.RT90_25gonV.bounds.scale(1.1, 1.25), 
    "+proj=tmerc +lat_0=0 +lon_0=15.80827777777778 +k=1 +x_0=1500000 +y_0=0 +ellps=bessel +units=m +no_defs");

RefSys.ETRS89 = new RefSys("ETRS89", 4258, CoordUnit.Degrees, 
    new BoundingBox(34.5000, -10.6700, 71.0500, 31.5500), 
    "+proj=longlat +ellps=GRS80 +no_defs");

RefSys.ETRSLAEA = new RefSys("ETRS-LAEA", 3035, CoordUnit.Meters, 
    new BoundingBox(2426378.0132, 1528101.2618, 6293974.6215, 5446513.5222), 
    "+proj=laea +lat_0=52 +lon_0=10 +x_0=4321000 +y_0=3210000 +ellps=GRS80 +units=m +no_defs");

RefSys.ETRSLCC = new RefSys("ETRS-LCC", 3034, CoordUnit.Meters, 
    new BoundingBox(2122254.2378, 1164627.9290, 5955457.4541, 5021872.0731), 
    "+proj=lcc +lat_1=35 +lat_2=65 +lat_0=52 +lon_0=10 +x_0=4000000 +y_0=2800000 +ellps=GRS80 +units=m +no_defs");

RefSys.fromCoords = function(c1, c2, ordered) {
    var systems = [
        RefSys.WGS84NorthernEurope,
        RefSys.SWEREF99TM,
        RefSys.RT90_25gonV,
        RefSys.ETRS89,
        RefSys.ETRSLAEA,
        RefSys.ETRSLCC,
        RefSys.SWEREF99TM_Extended,
        RefSys.RT90_25gonV_Extended,
        RefSys.WGS84
    ];
    
    for (var i = 0; i < systems.length; i++) {
        var result = systems[i].contains(c1, c2, ordered);
        if (result) return result;
    }
    return null;
};

// ——————————— TextParser (Internal) ——————————— //
function TextParser(text) {
    this.originalText = text || "";
    this.encodedText = this._encode(text || "");
    this.lines = this.originalText.split(/\r?\n/);
    this._logEntries = [];
}

TextParser.prototype._encode = function(text) {
    // Normalize whitespace and preserve structure for parsing
    return text.replace(/\s+/g, ' ');
};

TextParser.prototype.log = function(msg) {
    this._logEntries.push(msg);
};

TextParser.prototype.getLog = function() {
    return this._logEntries.join('\n');
};

TextParser.prototype.lineNoFromIndex = function(index) {
    var pos = 0;
    for (var i = 0; i < this.lines.length; i++) {
        pos += this.lines[i].length + 1; // +1 for newline
        if (pos > index) return i;
    }
    return this.lines.length - 1;
};

TextParser.prototype.lineText = function(lineNo) {
    return this.lines[lineNo] || "";
};

// ——————————— Patterns (Internal) ——————————— //
var Patterns = {
    // Coordinate patterns (ordered by specificity)
    
    // URL formats: maps.google.com/@59.32894,18.06491 or map/59.329440/18.064510
    urlCoords: /[@\/](-?\d{1,3}\.\d+)[,\/](-?\d{1,3}\.\d+)/gi,
    
    // GeoJSON: {"coordinates": [18.06491, 59.32894]}
    geoJSON: /["']coordinates["']\s*:\s*\[\s*(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)\s*\]/gi,
    
    // GML: <gml:pos>59.32894 18.06491</gml:pos>
    gml: /<gml:pos>(-?\d{1,3}\.\d+)\s+(-?\d{1,3}\.\d+)<\/gml:pos>/gi,
    
    // GML coordinates: <gml:coordinates>18.06491,59.32894</gml:coordinates> (lon,lat order)
    gmlCoordinates: /<gml:coordinates>(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)<\/gml:coordinates>/gi,
    
    // WKT: POINT(18.06491 59.32894) or POINT(313096 6353860) for SWEREF/RT90
    wkt: /POINT\s*\(\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*\)/gi,
    
    // Verbal pair: "Norr 59 grader 19,8 minuter Öst 18 grader 3,9 minuter"
    verbalPair: /(Norr?|Nord|Syd|Söder|South|Väst|Vest|West|Öst|Øst|East|N|S|E|W|V|Ö)\s+(\d{1,3})\s+grader?\s+(\d{1,2}[,.]?\d*)\s+min[iu]tt?e?r?[.,]?\s+(Norr?|Nord|Syd|Söder|South|Väst|Vest|West|Öst|Øst|East|N|S|E|W|V|Ö)\s+(\d{1,3})\s+grader?\s+(\d{1,2}[,.]?\d*)\s+min[iu]tt?e?r?[.,]?/gi,
    
    // URL parameters: x=540000&y=6580000 or y=6580000&x=540000
    urlParams: /[?&]?([xy])\s*=\s*(-?\d+(?:\.\d+)?)\s*&\s*([xy])\s*=\s*(-?\d+(?:\.\d+)?)/gi,
    
    // Prefix formats with large numbers: N: 6504089 E: 278978 or Y: 1570600, X: 7546077
    prefixLargeNumbers: /([NEXY]|Nordlig|Östlig)\s*:\s*(-?\d{5,})[\s,;]+([NEXY]|Nordlig|Östlig)\s*:\s*(-?\d{5,})/gi,
    
    // Single prefix with large number: Nordlig: 7148101 or X: 6580000
    singlePrefixLarge: /(Nordlig|Östlig|N|E|X|Y)\s*:\s*(-?\d{5,})/gi,
    
    // Prefix formats: Lat: 59.32894 Long: 18.06491 or Latitude: / Longitude:
    prefixLatLong: /(?:Lat(?:itude)?|N)\s*:\s*(-?\d{1,3}[,.]\d+)[\s,;]+(?:Long(?:itude)?|E)\s*:\s*(-?\d{1,3}[,.]\d+)/gi,
    
    // Kompakt DMS: 591944N0180354E
    compactDMS: /(\d{6})([NSEWÖV])(\d{7})([NSEWÖV])/gi,
    
    // Very compact: 5830N01245E
    veryCompactDM: /(\d{4})([NSEWÖV])(\d{5})([NSEWÖV])/gi,
    
    // Compact DDMM with decimal: 5930.5N-01815.2E or 59 30N - 018 15E
    compactDDMM: /(\d{2})\s*(\d{2}(?:[,.]\d+)?)\s*([NSEWÖV])\s*-?\s*(\d{2,3})\s*(\d{2}(?:[,.]\d+)?)\s*([NSEWÖV])/gi,
    
    // Plain DDMM pairs: 5930 1815 or 6007 0530 (no direction letters)
    plainDDMM: /\b(\d{4})\s+(\d{4})\b/gi,
    
    // Degrees, minutes, seconds: 59°19'44.2"N or 59°19'44"N (requires seconds marker)
    degsMinsSecs: /([NSEWÖV])?\s*(\d+)\s*[°º]\s*(\d+)\s*['′´`]\s*(\d+(?:[,.]?\d+)?)\s*["″]\s*([NSEWÖV])?/gi,
    
    // Grader-minuter med minustecken: 58-30 or 6230-1545 or 5820N-1145E
    degsMinus: /([NSEWÖV])?(\d{2,4})([NSEWÖV])?-(\d{2,4})([NSEWÖV])?/gi,
    
    // Degrees and minutes: 59°19.736'N or 59°19,736'N
    degsMins: /([NSEWÖV])?\s*(\d+)\s*[°º]\s*(\d+(?:[,.]?\d+)?)\s*['′´`]?\s*([NSEWÖV])?/gi,
    
    // Decimal degrees with semicolon: 59.32894; 18.06491
    degsSemicolon: /([NSEWÖV])?\s*(\d{1,3}[,.]\d+)\s*[;]\s*([NSEWÖV])?/gi,
    
    // Decimal degrees: 59.32894 or 59,32894
    // Negative lookahead for ) to avoid matching list numbers like "2)"
    degs: /([NSEWÖV])?\s*(\d{1,3}[,.]\d+)(?!\s*\))(?:\s+([NSEWÖV])(?!\s*\d))?/gi,
    
    // Plain number (meters or large coordinates)
    plain: /([NSEWÖV])?\s*(\d{5,})\s*([NSEWÖV])?/gi
};

Patterns.allPatterns = [
    {regex: Patterns.geoJSON, format: CoordFormat.Degs, handler: 'geoJSON'},
    {regex: Patterns.gml, format: CoordFormat.Degs, handler: 'gml'},
    {regex: Patterns.gmlCoordinates, format: CoordFormat.Degs, handler: 'gmlCoordinates'},
    {regex: Patterns.wkt, format: CoordFormat.Degs, handler: 'wkt'},
    {regex: Patterns.verbalPair, format: CoordFormat.DegsMins, handler: 'verbalPair'},
    {regex: Patterns.urlCoords, format: CoordFormat.Degs, handler: 'url'},
    {regex: Patterns.urlParams, format: CoordFormat.Meters, handler: 'urlParams'},
    {regex: Patterns.prefixLargeNumbers, format: CoordFormat.Meters, handler: 'prefixLargeNumbers'},
    {regex: Patterns.singlePrefixLarge, format: CoordFormat.Meters, handler: 'singlePrefixLarge'},
    {regex: Patterns.prefixLatLong, format: CoordFormat.Degs, handler: 'prefix'},
    {regex: Patterns.compactDMS, format: CoordFormat.DegsMinsSecs, handler: 'compactDMS'},
    {regex: Patterns.veryCompactDM, format: CoordFormat.DegsMins, handler: 'veryCompactDM'},
    {regex: Patterns.compactDDMM, format: CoordFormat.DegsMins, handler: 'compactDDMM'},
    {regex: Patterns.plainDDMM, format: CoordFormat.DegsMins, handler: 'plainDDMM'},
    {regex: Patterns.degsMinsSecs, format: CoordFormat.DegsMinsSecs},
    {regex: Patterns.degsMinus, format: CoordFormat.DegsMins, handler: 'degsMinus'},
    {regex: Patterns.degsMins, format: CoordFormat.DegsMins},
    {regex: Patterns.degsSemicolon, format: CoordFormat.Degs, handler: 'semicolon'},
    {regex: Patterns.degs, format: CoordFormat.Degs},
    {regex: Patterns.plain, format: CoordFormat.Meters}
];

// ——————————— Snippet ——————————— //
function Snippet(textParser) {
    this.parser = textParser;
    this.text = "";
    this.directionLetter = "";
    this.number = 0;
    this.format = CoordFormat.Unknown;
    this.noOfDecimals = 0;
    this.encodedText = "";
    this.index = -1;
    this.lineNo = -1;
}

Snippet.prototype.textBefore = function(maxChars, showEllipse) {
    if (!this.parser) return "";
    var lineText = this.parser.lineText(this.lineNo);
    var lineStart = this.parser.originalText.indexOf(lineText);
    var relativeIndex = this.index - lineStart;
    var before = lineText.substring(0, relativeIndex).trim();
    
    if (maxChars && before.length > maxChars) {
        before = (showEllipse ? "..." : "") + before.substring(before.length - maxChars);
    }
    return before;
};

Snippet.prototype.textAfter = function(maxChars, showEllipse) {
    if (!this.parser) return "";
    var lineText = this.parser.lineText(this.lineNo);
    var lineStart = this.parser.originalText.indexOf(lineText);
    var relativeIndex = this.index - lineStart;
    var after = lineText.substring(relativeIndex + this.text.length).trim();
    
    if (maxChars && after.length > maxChars) {
        after = after.substring(0, maxChars) + (showEllipse ? "..." : "");
    }
    return after;
};

Snippet.prototype.direction = function() {
    var letter = this.directionLetter.toUpperCase();
    switch(letter) {
        case 'N': return CoordDirection.North;
        case 'S': return CoordDirection.South;
        case 'E': case 'Ö': case 'O': return CoordDirection.East;
        case 'W': case 'V': return CoordDirection.West;
        default: return CoordDirection.Unknown;
    }
};

Snippet.prototype.asDebugText = function(padding) {
    padding = padding || "";
    var lines = [];
    lines.push(padding + "Snippet:");
    lines.push(padding + "  text: '" + this.text + "'");
    lines.push(padding + "  number: " + this.number);
    lines.push(padding + "  format: " + this.format);
    lines.push(padding + "  direction: " + this.directionLetter);
    lines.push(padding + "  decimals: " + this.noOfDecimals);
    lines.push(padding + "  index: " + this.index);
    lines.push(padding + "  lineNo: " + this.lineNo);
    return lines.join('\n');
};

Snippet.parseFromText = function(encodedText, originalTextPosition, parser) {
    var bestMatch = null;
    var bestPattern = null;
    var bestIndex = -1;
    
    // Try each pattern and find the earliest match
    for (var i = 0; i < Patterns.allPatterns.length; i++) {
        var pattern = Patterns.allPatterns[i];
        var regex = new RegExp(pattern.regex.source, 'i');
        var match = regex.exec(encodedText);
        
        if (match && (bestIndex === -1 || match.index < bestIndex)) {
            bestMatch = match;
            bestPattern = pattern;
            bestIndex = match.index;
        }
    }
    
    if (!bestMatch) return null;
    
    var snippet = new Snippet(parser);
    snippet.text = bestMatch[0];
    snippet.encodedText = bestMatch[0];
    snippet.format = bestPattern.format;
    snippet.index = originalTextPosition + bestMatch.index;
    snippet.lineNo = parser ? parser.lineNoFromIndex(snippet.index) : 0;
    
    // Handle special patterns
    if (bestPattern.handler === 'geoJSON') {
        // Format: {"coordinates": [18.06491, 59.32894]} - lon, lat order!
        var lon = parseFloat(bestMatch[1]);
        var lat = parseFloat(bestMatch[2]);
        snippet.number = lat; // Return lat for first coord, lon for second
        snippet.directionLetter = "";
        snippet.noOfDecimals = (bestMatch[2].match(/\.(\d+)/) || ['',''])[1].length;
        snippet._isLonFirst = true;
        snippet._lon = lon;
        snippet._lat = lat;
        
    } else if (bestPattern.handler === 'gml') {
        // Format: <gml:pos>59.32894 18.06491</gml:pos> - lat, lon order
        var lat = parseFloat(bestMatch[1]);
        var lon = parseFloat(bestMatch[2]);
        snippet.number = lat;
        snippet.directionLetter = "";
        snippet.noOfDecimals = (bestMatch[1].match(/\.(\d+)/) || ['',''])[1].length;
        snippet._lon = lon;
        snippet._lat = lat;
        
    } else if (bestPattern.handler === 'gmlCoordinates') {
        // Format: <gml:coordinates>18.06491,59.32894</gml:coordinates> - lon, lat order
        var lon = parseFloat(bestMatch[1]);
        var lat = parseFloat(bestMatch[2]);
        snippet.number = lat;
        snippet.directionLetter = "";
        snippet.noOfDecimals = (bestMatch[2].match(/\.(\d+)/) || ['',''])[1].length;
        snippet._isLonFirst = true;
        snippet._lon = lon;
        snippet._lat = lat;
        
    } else if (bestPattern.handler === 'wkt') {
        // Format: POINT(18.06491 59.32894) - lon, lat order!
        var lon = parseFloat(bestMatch[1]);
        var lat = parseFloat(bestMatch[2]);
        snippet.number = lat;
        snippet.directionLetter = "";
        snippet.noOfDecimals = (bestMatch[2].match(/\.(\d+)/) || ['',''])[1].length;
        snippet._isLonFirst = true;
        snippet._lon = lon;
        snippet._lat = lat;
        
    } else if (bestPattern.handler === 'verbalPair') {
        // Format: "Norr 59 grader 19,8 minuter Öst 18 grader 3,9 minuter"
        // Groups: [1]=dir1, [2]=deg1, [3]=min1, [4]=dir2, [5]=deg2, [6]=min2
        var dir1 = bestMatch[1].toUpperCase();
        var deg1 = parseInt(bestMatch[2], 10);
        var min1 = parseFloat(bestMatch[3].replace(',', '.'));
        var dir2 = bestMatch[4].toUpperCase();
        var deg2 = parseInt(bestMatch[5], 10);
        var min2 = parseFloat(bestMatch[6].replace(',', '.'));
        
        // Convert to decimal degrees
        var val1 = deg1 + min1 / 60;
        var val2 = deg2 + min2 / 60;
        
        // Determine which is lat and which is lon based on direction
        var isNS1 = dir1.match(/^(N|S|NORR?|NORD|SYD|SÖDER|SOUTH)/);
        var isEW2 = dir2.match(/^(E|W|V|Ö|ØST|ÖEST|EAST|VÄST|VEST|WEST)/);
        
        if (isNS1 && isEW2) {
            // First is lat, second is lon
            snippet._lat = dir1.match(/^S/) ? -val1 : val1;
            snippet._lon = dir2.match(/^(W|V|VÄST|VEST|WEST)/) ? -val2 : val2;
        } else {
            // Fallback: assume first is lat, second is lon
            snippet._lat = val1;
            snippet._lon = val2;
        }
        
        snippet.number = snippet._lat;
        snippet.directionLetter = "";
        snippet.noOfDecimals = 5;
        
    } else if (bestPattern.handler === 'url') {
        // Format: @59.32894,18.06491 or /59.329440/18.064510
        var lat = parseFloat(bestMatch[1]);
        var lon = parseFloat(bestMatch[2]);
        snippet.number = lat;
        snippet.directionLetter = "";
        snippet.noOfDecimals = (bestMatch[1].match(/\.(\d+)/) || ['',''])[1].length;
        snippet._lon = lon;
        snippet._lat = lat;
        
    } else if (bestPattern.handler === 'prefix') {
        // Format: Lat: 59.32894 Long: 18.06491
        var lat = parseFloat(bestMatch[1].replace(',', '.'));
        var lon = parseFloat(bestMatch[2].replace(',', '.'));
        snippet.number = lat;
        snippet.directionLetter = "";
        snippet.noOfDecimals = (bestMatch[1].match(/[,.](\d+)/) || ['',''])[1].length;
        snippet._lon = lon;
        snippet._lat = lat;
        
    } else if (bestPattern.handler === 'urlParams') {
        // Format: x=540000&y=6580000 or y=6580000&x=540000
        var param1 = bestMatch[1].toLowerCase();
        var val1 = parseFloat(bestMatch[2]);
        var param2 = bestMatch[3].toLowerCase();
        var val2 = parseFloat(bestMatch[4]);
        
        var x = param1 === 'x' ? val1 : val2;
        var y = param1 === 'y' ? val1 : val2;
        
        snippet.number = y;
        snippet.directionLetter = "";
        snippet.noOfDecimals = 0;
        snippet._lon = x;
        snippet._lat = y;
        
    } else if (bestPattern.handler === 'prefixLargeNumbers') {
        // Format: N: 6504089 E: 278978 or Y: 1570600, X: 7546077
        var prefix1 = bestMatch[1].toUpperCase();
        var val1 = parseFloat(bestMatch[2]);
        var prefix2 = bestMatch[3].toUpperCase();
        var val2 = parseFloat(bestMatch[4]);
        
        // Determine which is N/Y (northing) and which is E/X (easting)
        var isNorth1 = prefix1.match(/^(N|NORDLIG)$/);
        var isEast2 = prefix2.match(/^(E|ÖSTLIG)$/);
        var isY1 = prefix1 === 'Y';
        var isX2 = prefix2 === 'X';
        
        var lat, lon;
        if (isNorth1 && isEast2) {
            lat = val1;
            lon = val2;
        } else if (isY1 && isX2) {
            lat = val2;  // X is northing in Swedish systems
            lon = val1;  // Y is easting in Swedish systems
        } else {
            // Default: first is lat, second is lon
            lat = val1;
            lon = val2;
        }
        
        snippet.number = lat;
        snippet.directionLetter = "";
        snippet.noOfDecimals = 0;
        snippet._lon = lon;
        snippet._lat = lat;
        
    } else if (bestPattern.handler === 'singlePrefixLarge') {
        // Format: Nordlig: 7148101 or X: 6580000 (single coordinate)
        var prefix = bestMatch[1].toUpperCase();
        var value = parseFloat(bestMatch[2]);
        
        snippet.number = value;
        snippet.noOfDecimals = 0;
        
        // Set direction letter to indicate axis (N for northing, E for easting)
        if (prefix.match(/^(N|NORDLIG|Y)$/)) {
            snippet.directionLetter = "N";
        } else if (prefix.match(/^(E|ÖSTLIG|X)$/)) {
            snippet.directionLetter = "E";
        } else {
            snippet.directionLetter = "";
        }
        
    } else if (bestPattern.handler === 'veryCompactDM') {
        // Format: 5830N01245E (DDMM format) - contains BOTH coordinates!
        var latStr = bestMatch[1]; // 5830
        var latDir = bestMatch[2]; // N
        var lonStr = bestMatch[3]; // 01245
        var lonDir = bestMatch[4]; // E
        
        // Parse latitude DDMM
        var latDegs = parseInt(latStr.substring(0, 2), 10);
        var latMins = parseInt(latStr.substring(2, 4), 10);
        var lat = latDegs + latMins/60;
        if (latDir === 'S') lat = -lat;
        
        // Parse longitude DDDMM (5 digits)
        var lonDegs = parseInt(lonStr.substring(0, 3), 10);
        var lonMins = parseInt(lonStr.substring(3, 5), 10);
        var lon = lonDegs + lonMins/60;
        if (lonDir === 'W') lon = -lon;
        
        snippet.number = lat;
        snippet.directionLetter = "";
        snippet.noOfDecimals = 0;
        snippet._lat = lat;
        snippet._lon = lon;
        
    } else if (bestPattern.handler === 'compactDDMM') {
        // Format: 5930.5N-01815.2E or 59 30N - 018 15E
        var latDegs = parseInt(bestMatch[1], 10);
        var latMins = parseFloat(bestMatch[2].replace(',', '.'));
        var latDir = bestMatch[3];
        var lonDegs = parseInt(bestMatch[4], 10);
        var lonMins = parseFloat(bestMatch[5].replace(',', '.'));
        var lonDir = bestMatch[6];
        
        var lat = latDegs + latMins/60;
        if (latDir === 'S' || latDir === 'Syd' || latDir === 'Söder') lat = -lat;
        
        var lon = lonDegs + lonMins/60;
        if (lonDir === 'W' || lonDir === 'V' || lonDir === 'Väst' || lonDir === 'Vest') lon = -lon;
        
        snippet.number = lat;
        snippet.directionLetter = "";
        snippet.noOfDecimals = 2;
        snippet._lat = lat;
        snippet._lon = lon;
        
    } else if (bestPattern.handler === 'plainDDMM') {
        // Format: 5930 1815 (DDMM DDMM without direction letters)
        var latStr = bestMatch[1]; // 5930
        var lonStr = bestMatch[2]; // 1815
        
        var latDegs = parseInt(latStr.substring(0, 2), 10);
        var latMins = parseInt(latStr.substring(2, 4), 10);
        var lat = latDegs + latMins/60;
        
        var lonDegs = parseInt(lonStr.substring(0, 2), 10);
        var lonMins = parseInt(lonStr.substring(2, 4), 10);
        var lon = lonDegs + lonMins/60;
        
        snippet.number = lat;
        snippet.directionLetter = "";
        snippet.noOfDecimals = 0;
        snippet._lat = lat;
        snippet._lon = lon;
        
    } else if (bestPattern.handler === 'compactDMS') {
        // Format: 591944N0180354E - contains BOTH coordinates!
        var latStr = bestMatch[1]; // 591944
        var latDir = bestMatch[2]; // N
        var lonStr = bestMatch[3]; // 0180354
        var lonDir = bestMatch[4]; // E
        
        // Parse latitude DDMMSS from 6 digits
        var latDegs = parseInt(latStr.substring(0, 2), 10);
        var latMins = parseInt(latStr.substring(2, 4), 10);
        var latSecs = parseInt(latStr.substring(4, 6), 10);
        var lat = latDegs + latMins/60 + latSecs/3600;
        if (latDir === 'S') lat = -lat;
        
        // Parse longitude DDDMMSS from 7 digits
        var lonDegs = parseInt(lonStr.substring(0, 3), 10);
        var lonMins = parseInt(lonStr.substring(3, 5), 10);
        var lonSecs = parseInt(lonStr.substring(5, 7), 10);
        var lon = lonDegs + lonMins/60 + lonSecs/3600;
        if (lonDir === 'W') lon = -lon;
        
        snippet.number = lat;
        snippet.directionLetter = "";
        snippet.noOfDecimals = 0;
        snippet._lat = lat;
        snippet._lon = lon;
        
    } else if (bestPattern.handler === 'degsMinus') {
        // Format: 58-30 or 6230-1545 or 5820N-1145E
        var dirBefore = bestMatch[1] || "";
        var part1 = bestMatch[2];
        var dirMiddle = bestMatch[3] || "";
        var part2 = bestMatch[4];
        var dirAfter = bestMatch[5] || "";
        
        snippet.directionLetter = dirBefore || dirMiddle || dirAfter;
        
        if ((part1.length === 2 || part1.length === 3) && part2.length === 2) {
            // 58-30 or 014-52 format (DD-MM or DDD-MM)
            var degs = parseInt(part1, 10);
            var mins = parseInt(part2, 10);
            snippet.number = degs + mins/60;
            snippet.noOfDecimals = 0;
        } else if (part1.length === 4 && part2.length === 4) {
            // 6230-1545 or 5820N-1145E format (DDMM-DDMM) - contains BOTH coordinates!
            var lat1 = parseInt(part1.substring(0, 2), 10);
            var lat2 = parseInt(part1.substring(2, 4), 10);
            var lat = lat1 + lat2/60;
            
            var lon1 = parseInt(part2.substring(0, 2), 10);
            var lon2 = parseInt(part2.substring(2, 4), 10);
            var lon = lon1 + lon2/60;
            
            // Apply direction from middle position if present
            if (dirMiddle) {
                var dir = new CoordDirection(dirMiddle);
                if (dir.axis() === CoordAxis.Northing) {
                    if (dir.isNegative()) lat = -lat;
                }
            }
            
            // Apply direction from after position if present
            if (dirAfter) {
                var dir = new CoordDirection(dirAfter);
                if (dir.axis() === CoordAxis.Easting) {
                    if (dir.isNegative()) lon = -lon;
                }
            }
            
            snippet.number = lat;
            snippet.directionLetter = "";
            snippet.noOfDecimals = 0;
            snippet._lat = lat;
            snippet._lon = lon;
        } else {
            // Fallback
            snippet.number = parseFloat(part1);
            snippet.noOfDecimals = 0;
        }
        
    } else if (bestPattern.handler === 'semicolon') {
        // Semicolon separator - just parse as decimal
        var dirBefore = bestMatch[1] || "";
        var dirAfter = bestMatch[3] || "";
        snippet.directionLetter = dirBefore || dirAfter;
        snippet.number = parseFloat(bestMatch[2].replace(',', '.'));
        var decimals = (bestMatch[2].match(/[,.](\d+)/) || ['',''])[1].length;
        snippet.noOfDecimals = decimals;
        
    } else {
        // Extract direction letters
        var dirBefore = bestMatch[1] || "";
        var dirAfter = bestMatch[bestMatch.length - 1] || "";
        snippet.directionLetter = dirBefore || dirAfter;
        
        // Parse number based on format
        if (bestPattern.format === CoordFormat.DegsMinsSecs) {
            var degs = parseFloat(bestMatch[2]);
            var mins = parseFloat(bestMatch[3]);
            var secs = parseFloat(bestMatch[4].replace(',', '.'));
            snippet.number = degs + mins/60 + secs/3600;
            var secDecimals = (bestMatch[4].match(/[,.](\d+)/) || ['',''])[1].length;
            snippet.noOfDecimals = secDecimals;
        } else if (bestPattern.format === CoordFormat.DegsMins) {
            var degs = parseFloat(bestMatch[2]);
            var mins = parseFloat(bestMatch[3].replace(',', '.'));
            snippet.number = degs + mins/60;
            var minDecimals = (bestMatch[3].match(/[,.](\d+)/) || ['',''])[1].length;
            snippet.noOfDecimals = minDecimals;
        } else {
            snippet.number = parseFloat(bestMatch[2].replace(',', '.'));
            var decimals = (bestMatch[2].match(/[,.](\d+)/) || ['',''])[1].length;
            snippet.noOfDecimals = decimals;
        }
    }
    
    return snippet;
};

// ——————————— Coord ——————————— //
function Coord() {
    this.value = 0.0;
    this.axis = CoordAxis.Unknown;
    this.parsedFrom = null;
    this.point = null;
    this.groupNo = 0;
    this.failReason = "";
}

Coord.fromSnippet = function(snippet) {
    if (!snippet) return null;
    
    var coord = new Coord();
    coord.parsedFrom = snippet;
    coord.value = snippet.number;
    
    var dir = snippet.direction();
    if (dir !== CoordDirection.Unknown) {
        coord.axis = dir.axis();
        if (dir === CoordDirection.South || dir === CoordDirection.West) {
            coord.value = -Math.abs(coord.value);
        }
    }
    
    return coord;
};

Coord.prototype.clone = function() {
    var c = new Coord();
    c.value = this.value;
    c.axis = this.axis;
    c.parsedFrom = this.parsedFrom;
    c.point = this.point;
    c.groupNo = this.groupNo;
    c.failReason = this.failReason;
    return c;
};

Coord.prototype.textBefore = function(maxChars) {
    return this.parsedFrom ? this.parsedFrom.textBefore(maxChars, true) : "";
};

Coord.prototype.textAfter = function(maxChars) {
    return this.parsedFrom ? this.parsedFrom.textAfter(maxChars, true) : "";
};

Coord.prototype.originalText = function() {
    return this.parsedFrom ? this.parsedFrom.text : "";
};

Coord.prototype.maxError = function() {
    if (!this.parsedFrom) return 0;
    
    var decimals = this.parsedFrom.noOfDecimals;
    var format = this.parsedFrom.format;
    
    if (format === CoordFormat.Meters) {
        return decimals > 0 ? Math.pow(10, -decimals) : 1;
    } else if (format === CoordFormat.Degs) {
        return decimals > 0 ? Math.pow(10, -decimals) : 0.1;
    } else if (format === CoordFormat.DegsMins || format === CoordFormat.Degreemins) {
        return decimals > 0 ? Math.pow(10, -decimals) / 60 : 1/60;
    } else if (format === CoordFormat.DegsMinsSecs) {
        return decimals > 0 ? Math.pow(10, -decimals) / 3600 : 1/3600;
    }
    return 0;
};

Coord.prototype.asText = function(formattingOptions) {
    var opts = formattingOptions || {};
    var val = Math.abs(this.value);
    
    if (opts.localized) {
        return val.toString().replace('.', ',');
    }
    return val.toString();
};

Coord.prototype.log = function() {
    var lines = [];
    lines.push("Coord value: " + this.value);
    lines.push("  axis: " + this.axis);
    if (this.parsedFrom) {
        lines.push("  parsed from: '" + this.parsedFrom.text + "'");
        lines.push("  format: " + this.parsedFrom.format);
    }
    return lines.join('\n');
};

Coord.prototype.asDebugText = function() {
    return this.log();
};

// ——————————— FormatOptions ——————————— //
function FormatOptions(opts) {
    this.format = 'plain';
    this.directionLetter = 'before';
    this.symbols = false;
    this.compact = false;
    this.decimals = 'auto';
    this.localized = true;
    
    this.setOptions(opts);
}

FormatOptions.prototype.setOptions = function(opts) {
    if (!opts) return;
    if (opts.format) this.format = opts.format;
    if (opts.directionLetter) this.directionLetter = opts.directionLetter;
    if (opts.symbols !== undefined) this.symbols = opts.symbols;
    if (opts.compact !== undefined) this.compact = opts.compact;
    if (opts.decimals !== undefined) this.decimals = opts.decimals;
    if (opts.localized !== undefined) this.localized = opts.localized;
};

FormatOptions.prototype.coordinateFormat = function() {
    switch(this.format) {
        case 'degrees': return CoordFormat.Degs;
        case 'degreesandminutes': return CoordFormat.DegsMins;
        case 'degreesminutesandseconds': return CoordFormat.DegsMinsSecs;
        case 'plain':
        default: return CoordFormat.Plain;
    }
};

// ——————————— Point ——————————— //
function Point(N, E, refsys) {
    this.N = N || null;
    this.E = E || null;
    this.refsys = refsys || RefSys.Unknown;
    this.reprojectedFrom = null;
    this._rating = null;
    this._ratingLog = [];
}

Point.prototype.latitude = function() {
    if (this.refsys.unit === CoordUnit.Degrees) {
        return this.N ? this.N.value : 0;
    }
    // Need to reproject to WGS84
    var wgs = this.reprojectTo(RefSys.WGS84);
    return wgs.N ? wgs.N.value : 0;
};

Point.prototype.longitude = function() {
    if (this.refsys.unit === CoordUnit.Degrees) {
        return this.E ? this.E.value : 0;
    }
    // Need to reproject to WGS84
    var wgs = this.reprojectTo(RefSys.WGS84);
    return wgs.E ? wgs.E.value : 0;
};

Point.prototype.first = function() {
    if (!this.N || !this.E) return null;
    if (!this.N.parsedFrom || !this.E.parsedFrom) return this.N;
    return this.N.parsedFrom.index < this.E.parsedFrom.index ? this.N : this.E;
};

Point.prototype.last = function() {
    if (!this.N || !this.E) return null;
    if (!this.N.parsedFrom || !this.E.parsedFrom) return this.E;
    return this.N.parsedFrom.index > this.E.parsedFrom.index ? this.N : this.E;
};

Point.prototype.original = function() {
    return this.reprojectedFrom || this;
};

Point.prototype.textBefore = function(maxChars) {
    var first = this.first();
    return first ? first.textBefore(maxChars) : "";
};

Point.prototype.textAfter = function(maxChars) {
    var last = this.last();
    return last ? last.textAfter(maxChars) : "";
};

Point.prototype.originalText = function(opts) {
    if (!this.N || !this.E) return "";
    var first = this.first();
    var last = this.last();
    if (!first.parsedFrom || !last.parsedFrom) return "";
    
    var startIdx = first.parsedFrom.index;
    var endIdx = last.parsedFrom.index + last.parsedFrom.text.length;
    
    if (first.parsedFrom.parser) {
        return first.parsedFrom.parser.originalText.substring(startIdx, endIdx);
    }
    return "";
};

Point.prototype.context = function(opts) {
    var maxChars = opts && opts.maxChars ? opts.maxChars : 50;
    var before = this.textBefore(maxChars);
    var orig = this.originalText();
    var after = this.textAfter(maxChars);
    return before + " [" + orig + "] " + after;
};

Point.prototype.asText = function(explicitOpts) {
    var opts = new FormatOptions(explicitOpts);
    var parts = [];
    
    if (!this.N || !this.E) return "";
    
    var nVal = Math.abs(this.N.value);
    var eVal = Math.abs(this.E.value);
    
    var nDir = this.N.value >= 0 ? "N" : "S";
    var eDir = this.E.value >= 0 ? "E" : "W";
    
    var space = opts.compact ? "" : " ";
    
    if (opts.directionLetter === 'before') {
        parts.push(nDir + space + nVal);
        parts.push(eDir + space + eVal);
    } else if (opts.directionLetter === 'after') {
        parts.push(nVal + space + nDir);
        parts.push(eVal + space + eDir);
    } else {
        parts.push(nVal.toString());
        parts.push(eVal.toString());
    }
    
    var result = parts.join(opts.compact ? " " : ", ");
    
    if (opts.localized) {
        result = result.replace(/\./g, ',');
    }
    
    return result;
};

Point.prototype.log = function() {
    var lines = [];
    lines.push("Point:");
    if (this.N) lines.push("  N: " + this.N.log());
    if (this.E) lines.push("  E: " + this.E.log());
    lines.push("  RefSys: " + this.refsys.name);
    lines.push("  Rating: " + this.rating());
    return lines.join('\n');
};

Point.prototype.rating = function() {
    if (this._rating !== null) return this._rating;
    return 0.5;
};

Point.prototype.ratingLog = function() {
    return this._ratingLog.join('\n');
};

Point.prototype.rate = function(grouping, hints) {
    this._ratingLog = [];
    var score = 0.5;
    
    if (!this.N || !this.E) {
        this._rating = 0;
        this._ratingLog.push("Missing coordinate");
        return this._rating;
    }
    
    // Validate coordinate ranges for WGS84
    if (this.refsys.unit === CoordUnit.Degrees) {
        var lat = this.N.value;
        var lon = this.E.value;
        
        // Latitude must be between -90 and 90
        if (Math.abs(lat) > 90) {
            this._rating = 0;
            this._ratingLog.push("Invalid latitude: " + lat + " (must be -90 to 90)");
            return this._rating;
        }
        
        // Longitude must be between -180 and 180
        if (Math.abs(lon) > 180) {
            this._rating = 0;
            this._ratingLog.push("Invalid longitude: " + lon + " (must be -180 to 180)");
            return this._rating;
        }
    }
    
    // Check if coordinates have direction letters
    if (this.N.parsedFrom && this.N.parsedFrom.directionLetter) {
        score += 0.2;
        this._ratingLog.push("+0.2 for N direction letter");
    }
    if (this.E.parsedFrom && this.E.parsedFrom.directionLetter) {
        score += 0.2;
        this._ratingLog.push("+0.2 for E direction letter");
    }
    
    // Check if coordinates are in same line
    if (this.N.parsedFrom && this.E.parsedFrom && 
        this.N.parsedFrom.lineNo === this.E.parsedFrom.lineNo) {
        score += 0.1;
        this._ratingLog.push("+0.1 for same line");
    }
    
    this._rating = Math.min(1.0, score);
    return this._rating;
};

Point.prototype.reprojectTo = function(toRefSys) {
    if (this.refsys === toRefSys) return this;
    
    // Check if proj4 is available
    if (typeof proj4 === 'undefined') {
        console.warn("proj4 not available, cannot reproject");
        return this;
    }
    
    try {
        var fromProj = proj4(this.refsys.projDef);
        var toProj = proj4(toRefSys.projDef);
        var result = proj4(fromProj, toProj, [this.E.value, this.N.value]);
        
        var newPoint = new Point();
        newPoint.E = new Coord();
        newPoint.E.value = result[0];
        newPoint.E.axis = CoordAxis.Easting;
        
        newPoint.N = new Coord();
        newPoint.N.value = result[1];
        newPoint.N.axis = CoordAxis.Northing;
        
        newPoint.refsys = toRefSys;
        newPoint.reprojectedFrom = this;
        
        return newPoint;
    } catch(e) {
        console.warn("Reprojection failed:", e);
        return this;
    }
};

Point.prototype.maxErrors = function() {
    return {
        N: this.N ? this.N.maxError() : 0,
        E: this.E ? this.E.maxError() : 0
    };
};

Point.prototype.maxErrorBounds = function() {
    var errors = this.maxErrors();
    var lat = this.latitude();
    var lng = this.longitude();
    
    // Rough conversion: 1 degree ≈ 111km
    var latError = errors.N / 111000;
    var lngError = errors.E / (111000 * Math.cos(lat * Math.PI / 180));
    
    return new BoundingBox(
        lat - latError,
        lng - lngError,
        lat + latError,
        lng + lngError
    );
};

Point.prototype.clone = function() {
    var p = new Point();
    p.N = this.N ? this.N.clone() : null;
    p.E = this.E ? this.E.clone() : null;
    p.refsys = this.refsys;
    p.reprojectedFrom = this.reprojectedFrom;
    p._rating = this._rating;
    p._ratingLog = this._ratingLog.slice();
    return p;
};

Point.prototype.setAsFound = function() {
    if (this.N && this.N.parsedFrom) {
        this.N.parsedFrom._used = true;
    }
    if (this.E && this.E.parsedFrom) {
        this.E.parsedFrom._used = true;
    }
};

Point.prototype.asDebugText = function() {
    return this.log();
};

// ——————————— CoordFinder (CF) ——————————— //
function CF(text, opts) {
    this._text = text || "";
    this._parser = null;
    this._snippets = [];
    this._coords = [];
    this._points = [];
    this._groups = [];
    this._unusedCoords = [];
    this._logEntries = [];
    this._foundRatings = null;
}

// Metadata
CF.version = "5.0-beta.3";
CF.build = "20251225-220852"; // Timestamp-based build number
CF.author = "Bernt Rane, Claude & Ona";
CF.license = "MIT";
CF.ratingDefault = 0.5;

// Static method: Get first point from text
CF.pointIn = function(text) {
    var cf = new CF();
    cf.parse(text);
    var points = cf.points();
    return points.length > 0 ? points[0] : null;
};

// Static method: Get all points from text
CF.pointsIn = function(text) {
    var cf = new CF();
    cf.parse(text);
    return cf.points();
};

// Static method: Get groups of points from text
CF.groupsIn = function(text) {
    var cf = new CF();
    cf.parse(text, {grouping: true});
    return cf.groups();
};

// Parse text to find coordinates
CF.prototype.parse = function(text, opts) {
    opts = opts || {};
    this._text = text || this._text;
    
    if (!this._text) {
        this._log("No text to parse");
        return this;
    }
    
    this._parser = new TextParser(this._text);
    this._snippets = [];
    this._coords = [];
    this._points = [];
    this._groups = [];
    this._logEntries = [];
    
    this._log("Parsing text for coordinates...");
    
    try {
        // Find all coordinate snippets
        this._findSnippets();
        
        // Convert snippets to coordinates
        this._snippetsToCoords();
        
        // Pair coordinates into points
        this._coordsToPoints();
        
        // Rate points
        for (var i = 0; i < this._points.length; i++) {
            this._points[i].rate(opts.grouping);
        }
        
        // Group points if requested
        if (opts.grouping) {
            this._groupPoints();
        }
        
        this._log("Found " + this._points.length + " potential points");
    } catch(e) {
        this._log("Error during parsing: " + e.message);
        console.error("CoordFinder parse error:", e);
    }
    
    return this;
};

CF.prototype._findSnippets = function() {
    var text = this._parser.encodedText;
    var pos = 0;
    
    while (pos < text.length) {
        var remaining = text.substring(pos);
        var snippet = Snippet.parseFromText(remaining, pos, this._parser);
        
        if (snippet) {
            this._snippets.push(snippet);
            this._log("Found snippet: " + snippet.text + " at position " + snippet.index);
            // Move past this snippet
            var relativeEnd = snippet.index - pos + snippet.text.length;
            pos += relativeEnd;
        } else {
            pos++;
        }
    }
};

CF.prototype._snippetsToCoords = function() {
    for (var i = 0; i < this._snippets.length; i++) {
        var snippet = this._snippets[i];
        // Skip snippets with both lat and lon - they'll be handled in _coordsToPoints
        if (snippet._lat !== undefined && snippet._lon !== undefined) {
            continue;
        }
        
        // Skip snippets that are part of Google Maps data parameters (!3d, !4d)
        var textBefore = snippet.textBefore(10);
        if (textBefore.match(/![34]d$/i)) {
            this._log("Skipping Google Maps data parameter: " + snippet.text);
            continue;
        }
        
        // Skip snippets that look like CSV extra columns (e.g., "0,1" or "0,2")
        // These are single-digit numbers with comma (not valid coordinates)
        if (snippet.text.match(/^\d,\d+$/)) {
            this._log("Skipping CSV column: " + snippet.text);
            continue;
        }
        
        var coord = Coord.fromSnippet(snippet);
        if (coord) {
            this._coords.push(coord);
        }
    }
    this._log("Converted " + this._coords.length + " snippets to coordinates");
};

CF.prototype._coordsToPoints = function() {
    var usedCoords = {};
    
    // First, handle special formats where both coords are in one snippet
    for (var i = 0; i < this._snippets.length; i++) {
        var snippet = this._snippets[i];
        if (!snippet) continue;
        
        // Check if this snippet contains both lat and lon
        if (snippet._lat !== undefined && snippet._lon !== undefined) {
            var lat = snippet._lat;
            var lon = snippet._lon;
            
            // Auto-correct if values are swapped (lat out of range or lon out of range)
            if (Math.abs(lat) > 90 || Math.abs(lon) > 180) {
                if (Math.abs(lon) <= 90 && Math.abs(lat) <= 180) {
                    // Swap them
                    var temp = lat;
                    lat = lon;
                    lon = temp;
                    this._log("Auto-corrected swapped lat/lon values");
                }
            }
            
            var latCoord = new Coord();
            latCoord.value = lat;
            latCoord.axis = CoordAxis.Northing;
            latCoord.parsedFrom = snippet;
            
            var lonCoord = new Coord();
            lonCoord.value = lon;
            lonCoord.axis = CoordAxis.Easting;
            lonCoord.parsedFrom = snippet;
            
            // Determine reference system from coordinate values
            var refSysResult = RefSys.fromCoords(latCoord, lonCoord, true);
            if (refSysResult) {
                var point = new Point(refSysResult.N, refSysResult.E, refSysResult.RefSys);
                refSysResult.N.point = point;
                refSysResult.E.point = point;
                
                this._points.push(point);
                this._log("Created point from combined format: " + point.asText() + " (" + refSysResult.RefSys.name + ")");
            }
            continue;
        }
    }
    
    // Try to pair remaining coordinates
    for (var i = 0; i < this._coords.length; i++) {
        if (usedCoords[i]) continue;
        
        for (var j = i + 1; j < this._coords.length; j++) {
            if (usedCoords[j]) continue;
            
            var c1 = this._coords[i];
            var c2 = this._coords[j];
            
            if (!c1 || !c2) continue;
            
            // Try to find a reference system that contains both coords
            // Use ordered=true to prevent auto-swapping (only swap for explicit formats like WKT)
            var result = RefSys.fromCoords(c1, c2, true);
            
            if (result) {
                var point = new Point(result.N, result.E, result.RefSys);
                point.N.point = point;
                point.E.point = point;
                
                this._points.push(point);
                this._log("Created point: " + point.asText());
                
                // Mark as used for this pairing
                usedCoords[i] = true;
                usedCoords[j] = true;
                break; // Stop looking for more pairs for this coordinate
            }
        }
    }
    
    // Collect unused coords
    this._unusedCoords = [];
    for (var i = 0; i < this._coords.length; i++) {
        if (!this._coords[i].point && !usedCoords[i]) {
            this._unusedCoords.push(this._coords[i]);
        }
    }
};

CF.prototype._groupPoints = function() {
    if (this._points.length === 0) return;
    
    this._groups = [];
    var currentGroup = [];
    var lastLineNo = -1;
    
    for (var i = 0; i < this._points.length; i++) {
        var point = this._points[i];
        var lineNo = point.N.parsedFrom ? point.N.parsedFrom.lineNo : -1;
        
        if (lastLineNo >= 0 && lineNo > lastLineNo + 1) {
            // Gap detected, start new group
            if (currentGroup.length > 0) {
                this._groups.push(currentGroup);
            }
            currentGroup = [];
        }
        
        currentGroup.push(point);
        lastLineNo = lineNo;
    }
    
    if (currentGroup.length > 0) {
        this._groups.push(currentGroup);
    }
};

CF.prototype._log = function(msg) {
    this._logEntries.push(msg);
    if (this._parser) {
        this._parser.log(msg);
    }
};

// Get points above rating threshold
CF.prototype.points = function(opts) {
    opts = opts || {};
    var minRating = opts.rating !== undefined ? opts.rating : CF.ratingDefault;
    
    var filtered = [];
    for (var i = 0; i < this._points.length; i++) {
        if (this._points[i].rating() >= minRating) {
            filtered.push(this._points[i]);
        }
    }
    
    return filtered;
};

// Get groups of points
CF.prototype.groups = function(opts) {
    opts = opts || {};
    var minRating = opts.rating !== undefined ? opts.rating : CF.ratingDefault;
    
    var filtered = [];
    for (var i = 0; i < this._groups.length; i++) {
        var group = [];
        for (var j = 0; j < this._groups[i].length; j++) {
            if (this._groups[i][j].rating() >= minRating) {
                group.push(this._groups[i][j]);
            }
        }
        if (group.length > 0) {
            filtered.push(group);
        }
    }
    
    return filtered;
};

// Get unused coordinates
CF.prototype.unusedCoords = function() {
    return this._unusedCoords;
};

// Get log
CF.prototype.log = function(logtext) {
    if (logtext) {
        this._log(logtext);
        return this;
    }
    return this._logEntries.join('\n');
};

// Get sorted array of found ratings
CF.prototype.foundRatings = function() {
    if (this._foundRatings) return this._foundRatings;
    
    var ratings = [];
    for (var i = 0; i < this._points.length; i++) {
        var r = this._points[i].rating();
        if (ratings.indexOf(r) === -1) {
            ratings.push(r);
        }
    }
    
    ratings.sort(function(a, b) { return b - a; });
    this._foundRatings = ratings;
    return ratings;
};

// Get index into foundRatings array
CF.prototype.ratingIndex = function(rating) {
    var ratings = this.foundRatings();
    for (var i = 0; i < ratings.length; i++) {
        if (ratings[i] <= rating) return i;
    }
    return ratings.length - 1;
};

// Export main class and aliases
global.CF = CF;
global.CoordFinder = CF;

// Export supporting classes
CF.CoordUnit = CoordUnit;
CF.CoordFormat = CoordFormat;
CF.CoordAxis = CoordAxis;
CF.CoordDirection = CoordDirection;
CF.BoundingBox = BoundingBox;
CF.RefSys = RefSys;
CF.Snippet = Snippet;
CF.Coord = Coord;
CF.FormatOptions = FormatOptions;
CF.Point = Point;

})(typeof window !== 'undefined' ? window : global);
