/**
 * CoordFinder - Coordinate Parser and Converter
 * 
 * @version 5.0-beta.7
 * @author Bernt Rane, Claude & Ona
 * @license MIT
 * @description Parses and converts coordinates between different formats and reference systems.
 *              Supports WGS84, SWEREF99, RT90, and various coordinate formats.
 * @repository https://github.com/aieuren/coordfinder
 */

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

// ——————————— Geodetic Utilities ——————————— //
var GeoUtils = {
    // Earth radius in meters (mean radius)
    EARTH_RADIUS: 6371000,
    
    /**
     * Convert degrees to radians
     */
    toRadians: function(degrees) {
        return degrees * Math.PI / 180;
    },
    
    /**
     * Convert radians to degrees
     */
    toDegrees: function(radians) {
        return radians * 180 / Math.PI;
    },
    
    /**
     * Calculate distance in meters between two points using Haversine formula
     * @param {number} lat1 - Latitude of first point in degrees
     * @param {number} lon1 - Longitude of first point in degrees
     * @param {number} lat2 - Latitude of second point in degrees
     * @param {number} lon2 - Longitude of second point in degrees
     * @returns {number} Distance in meters
     */
    haversineDistance: function(lat1, lon1, lat2, lon2) {
        var dLat = this.toRadians(lat2 - lat1);
        var dLon = this.toRadians(lon2 - lon1);
        var lat1Rad = this.toRadians(lat1);
        var lat2Rad = this.toRadians(lat2);
        
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.sin(dLon / 2) * Math.sin(dLon / 2) * 
                Math.cos(lat1Rad) * Math.cos(lat2Rad);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return this.EARTH_RADIUS * c;
    },
    
    /**
     * Calculate meters per degree of latitude at given latitude
     * Latitude degrees are approximately constant: ~111,320 meters per degree
     * @param {number} lat - Latitude in degrees
     * @returns {number} Meters per degree of latitude
     */
    metersPerDegreeLat: function(lat) {
        // Latitude degrees are nearly constant, approximately 111,320 meters per degree
        // More precise: 111132.92 - 559.82 * cos(2 * lat) + 1.175 * cos(4 * lat)
        var latRad = this.toRadians(lat);
        return 111132.92 - 559.82 * Math.cos(2 * latRad) + 1.175 * Math.cos(4 * latRad);
    },
    
    /**
     * Calculate meters per degree of longitude at given latitude
     * Longitude degrees vary with latitude: cos(lat) * 111,320 meters
     * @param {number} lat - Latitude in degrees
     * @returns {number} Meters per degree of longitude
     */
    metersPerDegreeLon: function(lat) {
        var latRad = this.toRadians(lat);
        // At equator: ~111,320 meters per degree
        // At poles: 0 meters per degree
        return Math.cos(latRad) * 111320;
    },
    
    /**
     * Convert degree uncertainty to meters for latitude
     * @param {number} degreeError - Uncertainty in degrees
     * @param {number} lat - Latitude in degrees
     * @returns {number} Uncertainty in meters
     */
    degreeErrorToMetersLat: function(degreeError, lat) {
        return degreeError * this.metersPerDegreeLat(lat);
    },
    
    /**
     * Convert degree uncertainty to meters for longitude
     * @param {number} degreeError - Uncertainty in degrees
     * @param {number} lat - Latitude in degrees (needed for longitude calculation)
     * @returns {number} Uncertainty in meters
     */
    degreeErrorToMetersLon: function(degreeError, lat) {
        return degreeError * this.metersPerDegreeLon(lat);
    }
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
function RefSys(name, code, unit, boundingBox, projDef, description, canonicalName) {
    this.name = name;
    this.code = code;
    this.unit = unit;
    this.bounds = boundingBox;
    this.projDef = projDef;
    this.description = description || "";
    this.canonicalName = canonicalName || name;  // Canonical name for test comparison
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
    "WGS84 är ett globalt koordinatsystem",
    "WGS84");

RefSys.WGS84NorthernEurope = new RefSys("WGS84 i norra Europa", 4326, CoordUnit.Degrees, 
    new BoundingBox(49.0, 0.0, 75.0, 32.0), 
    "+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees",
    "",
    "WGS84");

RefSys.SWEREF99TM = new RefSys("SWEREF99 TM", 3006, CoordUnit.Meters, 
    new BoundingBox(6100000, 200000, 7700000, 1000000), 
    "+proj=tmerc +lat_0=0 +lon_0=15 +k=0.9996 +x_0=500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
    "",
    "SWEREF99TM");

RefSys.RT90_25gonV = new RefSys("RT90 2.5 gon V", 3021, CoordUnit.Meters, 
    new BoundingBox(6100000, 1200000, 7700000, 1900000), 
    "+proj=tmerc +lat_0=0 +lon_0=15.8082777777778 +k=1 +x_0=1500000 +y_0=0 +ellps=bessel +towgs84=414.1,41.3,603.1,-0.855,2.141,-7.023,0 +units=m +no_defs",
    "",
    "RT90_25gonV");

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
    this.csvColumnMapping = this._detectCSVHeader();
}

TextParser.prototype._encode = function(text) {
    // URL-decode if text contains URL-encoded characters
    if (text.indexOf('%') !== -1) {
        try {
            // Try to decode, but keep original if decoding fails
            var decoded = decodeURIComponent(text);
            text = decoded;
        } catch (e) {
            // Keep original text if decoding fails
        }
    }
    
    // Remove quotes around coordinate-like patterns in URLs
    // Pattern: "DD.DDD DD.DDD" -> DD.DDD DD.DDD
    text = text.replace(/"(\d{1,3}\.\d+\s+\d{1,3}\.\d+)"/g, '$1');
    
    // Normalize whitespace but preserve newlines for coordinate separation
    // Replace multiple spaces with single space, but keep tabs and newlines
    // (tabs are important for maintaining correct text positions)
    text = text.replace(/  +/g, ' ').replace(/\n+/g, '\n');
    
    // Note: List number removal disabled to preserve text indices
    // List numbers are filtered out during coordinate pairing instead
    
    return text;
};

TextParser.prototype._detectCSVHeader = function() {
    // Check if first line looks like a CSV header with X,Y columns
    if (this.lines.length === 0) return null;
    
    var firstLine = this.lines[0].trim();
    
    // Split by comma and check for X, Y columns (case-insensitive)
    var columns = firstLine.split(',').map(function(col) {
        return col.trim().toUpperCase();
    });
    
    var xIndex = -1;
    var yIndex = -1;
    
    for (var i = 0; i < columns.length; i++) {
        if (columns[i] === 'X') xIndex = i;
        if (columns[i] === 'Y') yIndex = i;
    }
    
    // If we found both X and Y columns, return mapping
    // X = longitude (E), Y = latitude (N)
    // Standard coordinate order is lat,lon (Y,X)
    // So if X comes before Y in CSV, we need to swap to get lat,lon order
    if (xIndex !== -1 && yIndex !== -1) {
        return {
            xIndex: xIndex,
            yIndex: yIndex,
            swapNeeded: xIndex < yIndex  // If X comes before Y, swap to get lat,lon order
        };
    }
    
    return null;
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
        var nextPos = pos + this.lines[i].length + 1; // +1 for newline
        // If index is before the next line starts, it's on this line
        if (index < nextPos - 1 || (i === this.lines.length - 1)) {
            return i;
        }
        pos = nextPos;
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
    
    // Direction pair with symbols: N 60° 30,5' V 019° 15,25' or S 35° 30' V 70° 40'
    directionPairDM: /([NSEWÖV])[ \t]+(\d{1,3})[ \t]*[°º][ \t]*(\d{1,2}(?:[,.]?\d+)?)[ \t]*['′´`]?[ \t]+([NSEWÖV])[ \t]+(\d{1,3})[ \t]*[°º][ \t]*(\d{1,2}(?:[,.]?\d+)?)[ \t]*['′´`]?/gi,
    
    // Extremely compact with direction: N60 E19 or S35 W70 or N 58 E 19 (with optional space after direction)
    extremelyCompact: /\b([NSEWÖV])[ \t]*(\d{1,3})[ \t]+([NSEWÖV])[ \t]*(\d{1,3})\b/gi,
    
    // Direction before decimal degrees: E19.5 N60.5 or N60.5 E19.5 or N 56.5 E 12.0
    // Include optional leading separator to match earlier than degs pattern
    directionBeforeDegs: /(?:^|[,;\[\]~!@= \t\n\r])([NSEWÖV])[ \t]*(-?\d{1,3}[,.]\d+)[ \t]+([NSEWÖV])[ \t]*(-?\d{1,3}[,.]\d+)\b/gi,
    
    // URL parameters: x=540000&y=6580000 or y=6580000&x=540000
    urlParams: /[?&]?([xy])\s*=\s*(-?\d+(?:\.\d+)?)\s*&\s*([xy])\s*=\s*(-?\d+(?:\.\d+)?)/gi,
    
    // URL parameters with WGS84 coordinates: c=58.123,12.345 or g=59.234,13.456
    urlParamsWGS84: /[?&]([cg])\s*=\s*(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)/gi,
    
    // Large number pairs (RT90/SWEREF): 6480082.101, 1372031.843 or 6550000,123 350000,456 or 6480082 1372031 or 6550000 x 450000
    // Accepts decimal point or comma (max 3 decimals), and comma+space/semicolon/'x'/whitespace as separator
    // Leading whitespace included to match before plain pattern
    largePairs: /[ \t]*(\d{6,}(?:[,.]\d{1,3})?)[ \t]*(?:,[ \t]+|;[ \t]*|x[ \t]*|[ \t]+)(\d{6,}(?:[,.]\d{1,3})?)\b/gi,
    
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
    // Use [ \t] to avoid matching across newlines
    compactDDMM: /(\d{2})[ \t]*(\d{2}(?:[,.]\d+)?)[ \t]*([NSEWÖV])[ \t]*-?[ \t]*(\d{2,3})[ \t]*(\d{2}(?:[,.]\d+)?)[ \t]*([NSEWÖV])/gi,
    
    // Plain DDMM pairs: 5930 1815 or 6007 0530 (no direction letters)
    plainDDMM: /\b(\d{4})\s+(\d{4})\b/gi,
    
    // Degrees, minutes, seconds: 59°19'44.2"N or 59°19'44"N or 60°30'45.5" (seconds marker optional at end)
    // Use [ \t] to avoid matching across newlines
    degsMinsSecs: /([NSEWÖV])?[ \t]*(\d+)[ \t]*[°º][ \t]*(\d+)[ \t]*['′´`\u2019][ \t]*(\d+(?:[,.]?\d+)?)[ \t]*["″\u201D]?[ \t]*([NSEWÖV])?(?![a-zåäöA-ZÅÄÖ])/gi,
    
    // Grader-minuter med minustecken: 58-30 or 58-45,5N or 58-45.5N or 6230-1545 or 5820N-1145E
    degsMinus: /([NSEWÖV])?(\d{2,4})([NSEWÖV])?-(\d{1,2}(?:[,.]?\d+)?)([NSEWÖV])?/gi,
    
    // Degrees and minutes: 59°19.736'N or 59°19,736'N
    // Use [ \t] to avoid matching across newlines
    degsMins: /([NSEWÖV])?[ \t]*(\d+)[ \t]*[°º\u030A][ \t]*(\d+(?:[,.]?\d+)?)[ \t]*['′´`\u2019]?[ \t]*([NSEWÖV])?/gi,
    
    // Degrees and minutes without degree symbol: 60 30,5 or 019 15,25 or N60 30,5
    degsMinsPlain: /\b([NSEWÖVO])?(\d{2,3})[ \t]+(\d{1,2}[,.]\d+)\b/gi,
    
    // Degrees, minutes, seconds with direction letters but no symbols: N60 30 45 O19 15 30
    degsMinsSecsWithDir: /\b([NSEWÖVO])(\d{2,3})\s+(\d{1,2})\s+(\d{1,2}(?:[,.]\d+)?)\b/gi,
    
    // Degrees, minutes, seconds without symbols: 60 30 45.5 or 019 15 30.2 or 60 30 45
    // Use [ \t] instead of \s to avoid matching across newlines
    degsMinsSecsPlain: /\b(\d{2,3})[ \t]+(\d{1,2})[ \t]+(\d{1,2}(?:[,.]\d+)?)\b/gi,
    
    // Decimal degrees with semicolon: 59.32894; 18.06491
    degsSemicolon: /([NSEWÖV])?\s*(\d{1,3}[,.]\d+)\s*[;]\s*([NSEWÖV])?/gi,
    
    // Decimal degrees: 59.32894 or 59,32894 or -35.5 (negative for south/west)
    // Negative lookahead for ) to avoid matching list numbers like "2)"
    // Negative lookahead for ' ´ ′ " ″ \u201C \u201D to avoid matching DM/DMS like "30.5'" or "18.3""
    // Negative lookahead for z to avoid matching zoom parameters like "13.3z"
    // Allow comma, semicolon, brackets, URL chars (~!@=), or whitespace before number
    // Direction letter must not be followed by another letter (avoids "Ska", "Viktig", etc.)
    // Direction letter before number must be preceded by word boundary, whitespace, or newline
    // Direction letter after number must not be followed by digit (to allow "N58" to be parsed separately)
    degs: /(?:^|[,;\[\]~!@= \t\n\r])([NSEWÖV])?[ \t]*(-?\d{1,3}[,.]\d+)(?![ \t]*[)'´′"″\u2019\u201C\u201Dz])(?:[ \t]+([NSEWÖV])(?![a-zåäöA-ZÅÄÖ])(?!\d))?/gi,
    
    // Plain number (meters or large coordinates)
    // Use [ \t] to avoid matching across newlines
    // Direction letter before number must be preceded by word boundary, whitespace, or newline
    // Supports optional decimals (max 3 decimal places)
    plain: /(?:^|[ \t\n\r])([NSEWÖV])?[ \t]*(\d{5,}(?:[,.]\d{1,3})?)[ \t]*([NSEWÖV])?/gi
};

Patterns.allPatterns = [
    {regex: Patterns.geoJSON, format: CoordFormat.Degs, handler: 'geoJSON'},
    {regex: Patterns.gml, format: CoordFormat.Degs, handler: 'gml'},
    {regex: Patterns.gmlCoordinates, format: CoordFormat.Degs, handler: 'gmlCoordinates'},
    {regex: Patterns.wkt, format: CoordFormat.Degs, handler: 'wkt'},
    {regex: Patterns.verbalPair, format: CoordFormat.DegsMins, handler: 'verbalPair'},
    {regex: Patterns.directionPairDM, format: CoordFormat.DegsMins, handler: 'directionPairDM'},
    {regex: Patterns.directionBeforeDegs, format: CoordFormat.Degs, handler: 'directionBeforeDegs'},
    {regex: Patterns.extremelyCompact, format: CoordFormat.Degs, handler: 'extremelyCompact'},
    {regex: Patterns.urlCoords, format: CoordFormat.Degs, handler: 'url'},
    {regex: Patterns.urlParams, format: CoordFormat.Meters, handler: 'urlParams'},
    {regex: Patterns.urlParamsWGS84, format: CoordFormat.Degs, handler: 'urlParamsWGS84'},
    {regex: Patterns.largePairs, format: CoordFormat.Meters, handler: 'largePairs'},
    {regex: Patterns.prefixLargeNumbers, format: CoordFormat.Meters, handler: 'prefixLargeNumbers'},
    {regex: Patterns.singlePrefixLarge, format: CoordFormat.Meters, handler: 'singlePrefixLarge'},
    {regex: Patterns.prefixLatLong, format: CoordFormat.Degs, handler: 'prefix'},
    {regex: Patterns.compactDMS, format: CoordFormat.DegsMinsSecs, handler: 'compactDMS'},
    {regex: Patterns.veryCompactDM, format: CoordFormat.DegsMins, handler: 'veryCompactDM'},
    {regex: Patterns.compactDDMM, format: CoordFormat.DegsMins, handler: 'compactDDMM'},
    {regex: Patterns.plainDDMM, format: CoordFormat.DegsMins, handler: 'plainDDMM'},
    {regex: Patterns.degsMinsSecs, format: CoordFormat.DegsMinsSecs},
    {regex: Patterns.degsMinsSecsWithDir, format: CoordFormat.DegsMinsSecs, handler: 'degsMinsSecsWithDir'},
    {regex: Patterns.degsMinsSecsPlain, format: CoordFormat.DegsMinsSecs, handler: 'degsMinsSecsPlain'},
    {regex: Patterns.degsMinus, format: CoordFormat.DegsMins, handler: 'degsMinus'},
    {regex: Patterns.degsMins, format: CoordFormat.DegsMins},
    {regex: Patterns.degsMinsPlain, format: CoordFormat.DegsMins, handler: 'degsMinsPlain'},
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
    
    // Include whitespace at start of snippet if present
    var endIndex = relativeIndex;
    if (this.text && this.text.length > 0 && /\s/.test(this.text[0])) {
        endIndex++;
    }
    
    var before = lineText.substring(0, endIndex);
    
    if (maxChars && before.length > maxChars) {
        // Take last maxChars characters, ellipsis is extra
        before = before.substring(before.length - maxChars);
        // Trim leading space if present
        before = before.trimStart();
        if (showEllipse) {
            before = "..." + before;
        }
    }
    return before;
};

Snippet.prototype.textAfter = function(maxChars, showEllipse) {
    if (!this.parser) return "";
    var lineText = this.parser.lineText(this.lineNo);
    var lineStart = this.parser.originalText.indexOf(lineText);
    var relativeIndex = this.index - lineStart;
    var after = lineText.substring(relativeIndex + this.text.length);
    
    if (maxChars && after.length > maxChars) {
        // Take first maxChars characters, ellipsis is extra
        after = after.substring(0, maxChars);
        // Trim trailing space if present
        after = after.trimEnd();
        if (showEllipse) {
            after = after + "...";
        }
    }
    // Don't trim - preserve leading whitespace
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
    
    // Adjust index and text to skip leading separators (whitespace, commas, semicolons, brackets, URL chars) in match
    var leadingSeparators = bestMatch[0].match(/^[,;\[\]~!@= \s\n\r]*/)[0].length;
    snippet.text = bestMatch[0].substring(leadingSeparators);
    snippet.encodedText = snippet.text;
    snippet.format = bestPattern.format;
    
    // Calculate initial index
    var initialIndex = originalTextPosition + bestMatch.index + leadingSeparators;
    
    // Continue skipping any additional whitespace/newlines in original text
    // (pattern may not have matched all consecutive whitespace)
    if (parser && parser.originalText) {
        while (initialIndex < parser.originalText.length && 
               /[\s\n\r]/.test(parser.originalText[initialIndex])) {
            initialIndex++;
        }
    }
    
    snippet.index = initialIndex;
    snippet._skipLength = bestMatch[0].length; // Store match length for skipping invalid matches
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
        
    } else if (bestPattern.handler === 'directionPairDM') {
        // Format: N 60° 30,5' V 019° 15,25' or S 35° 30' V 70° 40'
        // Groups: [1]=dir1, [2]=deg1, [3]=min1, [4]=dir2, [5]=deg2, [6]=min2
        var dir1 = bestMatch[1].toUpperCase();
        var deg1 = parseInt(bestMatch[2], 10);
        var min1 = parseFloat(bestMatch[3].replace(',', '.'));
        var dir2 = bestMatch[4].toUpperCase();
        var deg2 = parseInt(bestMatch[5], 10);
        var min2 = parseFloat(bestMatch[6].replace(',', '.'));
        
        // Validate minutes
        if (min1 >= 60 || min2 >= 60) {
            snippet._invalid = true; // Mark as invalid to skip entire match
            return snippet;
        }
        
        // Convert to decimal degrees
        var val1 = deg1 + min1 / 60;
        var val2 = deg2 + min2 / 60;
        
        // Apply direction signs
        var isNS1 = dir1.match(/^[NS]/);
        var isEW2 = dir2.match(/^[EWVÖ]/);
        
        if (isNS1 && isEW2) {
            // First is lat, second is lon
            snippet._lat = dir1 === 'S' ? -val1 : val1;
            snippet._lon = (dir2 === 'W' || dir2 === 'V') ? -val2 : val2;
        } else {
            // Fallback: assume first is lat, second is lon
            snippet._lat = val1;
            snippet._lon = val2;
        }
        
        snippet.number = snippet._lat;
        snippet.directionLetter = "";
        
        // Calculate decimals from minutes
        var minDecimals = Math.max(
            (bestMatch[3].match(/[,.](\d+)/) || ['',''])[1].length,
            (bestMatch[6].match(/[,.](\d+)/) || ['',''])[1].length
        );
        snippet.noOfDecimals = minDecimals > 0 ? Math.ceil(2 + minDecimals * 1.778) : 3;
        
    } else if (bestPattern.handler === 'directionBeforeDegs') {
        // Format: E19.5 N60.5 or N60.5 E19.5
        // Groups: [1]=dir1, [2]=deg1, [3]=dir2, [4]=deg2
        var dir1 = bestMatch[1].toUpperCase();
        var deg1 = parseFloat(bestMatch[2].replace(',', '.'));
        var dir2 = bestMatch[3].toUpperCase();
        var deg2 = parseFloat(bestMatch[4].replace(',', '.'));
        
        // Apply direction signs and determine which is lat/lon
        var isNS1 = dir1.match(/^[NS]/);
        var isEW2 = dir2.match(/^[EWVÖ]/);
        var isEW1 = dir1.match(/^[EWVÖ]/);
        var isNS2 = dir2.match(/^[NS]/);
        
        if (isNS1 && isEW2) {
            // First is lat, second is lon
            snippet._lat = dir1 === 'S' ? -deg1 : deg1;
            snippet._lon = (dir2 === 'W' || dir2 === 'V') ? -deg2 : deg2;
            snippet.directionLetter = dir1 + dir2;
        } else if (isEW1 && isNS2) {
            // First is lon, second is lat
            snippet._lat = dir2 === 'S' ? -deg2 : deg2;
            snippet._lon = (dir1 === 'W' || dir1 === 'V') ? -deg1 : deg1;
            snippet.directionLetter = dir2 + dir1;
        } else {
            // Fallback: assume first is lat, second is lon
            snippet._lat = deg1;
            snippet._lon = deg2;
            snippet.directionLetter = dir1 + dir2;
        }
        
        snippet.number = snippet._lat;
        snippet._hasExplicitDirections = true; // Mark as having explicit direction letters
        var decimals1 = (bestMatch[2].match(/[,.](\\d+)/) || ['',''])[1].length;
        var decimals2 = (bestMatch[4].match(/[,.](\\d+)/) || ['',''])[1].length;
        snippet.noOfDecimals = Math.max(decimals1, decimals2);
        
    } else if (bestPattern.handler === 'extremelyCompact') {
        // Format: N60 E19 or S35 W70
        // Groups: [1]=dir1, [2]=deg1, [3]=dir2, [4]=deg2
        var dir1 = bestMatch[1].toUpperCase();
        var deg1 = parseInt(bestMatch[2], 10);
        var dir2 = bestMatch[3].toUpperCase();
        var deg2 = parseInt(bestMatch[4], 10);
        
        // Apply direction signs
        var isNS1 = dir1.match(/^[NS]/);
        var isEW2 = dir2.match(/^[EWVÖ]/);
        var isEW1 = dir1.match(/^[EWVÖ]/);
        var isNS2 = dir2.match(/^[NS]/);
        
        if (isNS1 && isEW2) {
            // First is lat, second is lon
            snippet._lat = dir1 === 'S' ? -deg1 : deg1;
            snippet._lon = (dir2 === 'W' || dir2 === 'V') ? -deg2 : deg2;
            snippet.directionLetter = dir1 + dir2;
        } else if (isEW1 && isNS2) {
            // First is lon, second is lat
            snippet._lat = dir2 === 'S' ? -deg2 : deg2;
            snippet._lon = (dir1 === 'W' || dir1 === 'V') ? -deg1 : deg1;
            snippet.directionLetter = dir2 + dir1;
        } else {
            // Fallback: assume first is lat, second is lon
            snippet._lat = deg1;
            snippet._lon = deg2;
            snippet.directionLetter = dir1 + dir2;
        }
        
        snippet.number = snippet._lat;
        snippet._hasExplicitDirections = true; // Mark as having explicit direction letters
        snippet.noOfDecimals = 0;
        
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
        
    } else if (bestPattern.handler === 'urlParamsWGS84') {
        // Format: c=58.123,12.345 or g=59.234,13.456 (WGS84 coordinates in URL)
        var lat = parseFloat(bestMatch[2]);
        var lon = parseFloat(bestMatch[3]);
        
        snippet.number = lat;
        snippet.directionLetter = "";
        snippet.noOfDecimals = Math.max(
            (bestMatch[2].match(/\.(\d+)/) || ['',''])[1].length,
            (bestMatch[3].match(/\.(\d+)/) || ['',''])[1].length
        );
        snippet._lat = lat;
        snippet._lon = lon;
        
    } else if (bestPattern.handler === 'largePairs') {
        // Format: Could be either X,Y or Y,X order - test both against bounding boxes
        // Convert decimal comma to point
        var val1 = parseFloat(bestMatch[1].replace(',', '.'));
        var val2 = parseFloat(bestMatch[2].replace(',', '.'));
        
        snippet.number = val1;
        snippet.directionLetter = "";
        snippet.noOfDecimals = Math.max(
            (bestMatch[1].match(/[,.](\d+)/) || ['',''])[1].length,
            (bestMatch[2].match(/[,.](\d+)/) || ['',''])[1].length
        );
        snippet._lat = val1;  // Tentative - will test both orders
        snippet._lon = val2;
        snippet._ambiguousOrder = true;  // Flag to test both X,Y and Y,X
        
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
        
        // Validate minutes
        if (latMins >= 60 || lonMins >= 60) {
            snippet._invalid = true; // Mark as invalid to skip entire match
            return snippet;
        }
        
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
        
    } else if (bestPattern.handler === 'degsMinsPlain') {
        // Format: 60 30,5 or 019 15,25 or N60 30,5 (DD MM.M with optional direction)
        var dir = bestMatch[1] || "";
        var degs = parseInt(bestMatch[2], 10);
        var mins = parseFloat(bestMatch[3].replace(',', '.'));
        
        // Validate minutes
        if (mins >= 60) {
            snippet._invalid = true; // Mark as invalid to skip entire match
            return snippet;
        }
        
        var value = degs + mins/60;
        
        snippet.number = value;
        snippet.directionLetter = dir;
        
        // Calculate decimals: minutes with N decimals -> DD with ~N+2 decimals
        var minDecimals = (bestMatch[3].match(/[,.](\d+)/) || ['',''])[1].length;
        snippet.noOfDecimals = minDecimals > 0 ? Math.ceil(2 + minDecimals * 1.778) : 3;
        
    } else if (bestPattern.handler === 'degsMinsSecsWithDir') {
        // Format: N60 30 45 or O19 15 30 (DD MM SS with direction letter but no symbols)
        var dir = bestMatch[1];
        var degs = parseInt(bestMatch[2], 10);
        var mins = parseInt(bestMatch[3], 10);
        var secs = parseFloat(bestMatch[4].replace(',', '.'));
        
        // Validate minutes and seconds
        if (mins >= 60 || secs >= 60) {
            snippet._invalid = true; // Mark as invalid to skip entire match
            return snippet;
        }
        
        var value = degs + mins/60 + secs/3600;
        
        snippet.number = value;
        snippet.directionLetter = dir;
        
        // Calculate decimals: seconds with N decimals -> DD with ~N+4 decimals
        var secDecimals = (bestMatch[4].match(/[,.](\d+)/) || ['',''])[1].length;
        snippet.noOfDecimals = secDecimals > 0 ? Math.ceil(4 + secDecimals) : 4;
        
    } else if (bestPattern.handler === 'degsMinsSecsPlain') {
        // Format: 60 30 45.5 or 019 15 30.2 or 60 30 45 (DD MM SS.S without symbols)
        var degs = parseInt(bestMatch[1], 10);
        var mins = parseInt(bestMatch[2], 10);
        var secs = parseFloat(bestMatch[3].replace(',', '.'));
        
        // Validate minutes and seconds
        if (mins >= 60 || secs >= 60) {
            snippet._invalid = true;
            // Skip past first number to allow finding other patterns
            // For "60 19 60.4", skip to after "60 " (length of first group + space)
            snippet._skipLength = bestMatch[1].length + 1;
            return snippet;
        }
        
        // Check if this looks like a list number followed by coordinates
        // Pattern: small number (1-99) at start of line followed by larger coordinate
        if (degs < 100 && mins > degs) {
            var lineNo = parser ? parser.lineNoFromIndex(originalTextPosition + bestMatch.index) : -1;
            if (lineNo >= 0 && parser && parser.lines) {
                var lineText = parser.lines[lineNo];
                var lineStart = parser.originalText.split(/\r?\n/).slice(0, lineNo).join('\n').length;
                if (lineNo > 0) lineStart++;
                var posInLine = originalTextPosition + bestMatch.index - lineStart;
                // If at start of line (allowing for whitespace), treat as list number
                if (posInLine <= 3) {
                    snippet._invalid = true;
                    snippet._skipLength = bestMatch[1].length + 1;
                    return snippet;
                }
            }
        }
        
        var value = degs + mins/60 + secs/3600;
        
        snippet.number = value;
        snippet.directionLetter = "";
        
        // Calculate decimals: seconds with N decimals -> DD with ~N+4 decimals
        var secDecimals = (bestMatch[3].match(/[,.](\d+)/) || ['',''])[1].length;
        snippet.noOfDecimals = secDecimals > 0 ? Math.ceil(4 + secDecimals) : 4;
        
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
        snippet.directionLetter = latDir + lonDir;
        snippet.noOfDecimals = 0;
        snippet._lat = lat;
        snippet._lon = lon;
        
    } else if (bestPattern.handler === 'degsMinus') {
        // Format: 58-30 or 58-45,5N or 58-45.5N or 6230-1545 or 5820N-1145E
        var dirBefore = bestMatch[1] || "";
        var part1 = bestMatch[2];
        var dirMiddle = bestMatch[3] || "";
        var part2 = bestMatch[4];
        var dirAfter = bestMatch[5] || "";
        
        snippet.directionLetter = dirBefore || dirMiddle || dirAfter;
        
        if ((part1.length === 2 || part1.length === 3) && part2.length >= 2 && part2.length <= 5) {
            // 58-30 or 014-52 or 58-45,5 or 58-45.5 format (DD-MM or DDD-MM with optional decimals)
            var degs = parseInt(part1, 10);
            var mins = parseFloat(part2.replace(',', '.'));
            var decimalValue = degs + mins/60;
            
            // Determine decimal places based on minutes precision
            var minsDecimals = 0;
            var match = part2.match(/[,.](\d+)/);
            if (match) {
                minsDecimals = match[1].length;
            }
            // Calculate decimals: minutes with N decimals -> DD with ~N+2 decimals
            var targetDecimals = minsDecimals > 0 ? minsDecimals + 2 : 3;
            snippet.number = parseFloat(decimalValue.toFixed(targetDecimals));
            snippet.noOfDecimals = targetDecimals;
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
            
            // Validate minutes and seconds
            if (mins >= 60 || secs >= 60) {
                snippet._invalid = true; // Mark as invalid to skip entire match
                return snippet;
            }
            
            snippet.number = degs + mins/60 + secs/3600;
            var secDecimals = (bestMatch[4].match(/[,.](\d+)/) || ['',''])[1].length;
            snippet.noOfDecimals = secDecimals;
        } else if (bestPattern.format === CoordFormat.DegsMins) {
            var degs = parseFloat(bestMatch[2]);
            var mins = parseFloat(bestMatch[3].replace(',', '.'));
            
            // Validate minutes
            if (mins >= 60) {
                snippet._invalid = true; // Mark as invalid to skip entire match
                return snippet;
            }
            
            snippet.number = degs + mins/60;
            var minDecimals = (bestMatch[3].match(/[,.](\d+)/) || ['',''])[1].length;
            snippet.noOfDecimals = minDecimals;
        } else {
            snippet.number = parseFloat(bestMatch[2].replace(',', '.'));
            var decimals = (bestMatch[2].match(/[,.](\d+)/) || ['',''])[1].length;
            snippet.noOfDecimals = decimals;
            
            // Validate minimum 1 decimal for decimal degrees (not for meters/RT90/SWEREF)
            if (bestPattern.format === CoordFormat.Degs && decimals < 1) {
                snippet._invalid = true;
                return snippet;
            }
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

/**
 * Get uncertainty in the original unit (degrees or meters)
 * This is the raw uncertainty before conversion to meters
 */
Coord.prototype.maxError = function() {
    if (!this.parsedFrom) return 0;
    
    var decimals = this.parsedFrom.noOfDecimals;
    var format = this.parsedFrom.format;
    
    if (format === CoordFormat.Meters) {
        // For meter-based systems: uncertainty is ±0.5 * 10^(-decimals)
        return decimals > 0 ? 0.5 * Math.pow(10, -decimals) : 0.5;
    } else if (format === CoordFormat.Degs) {
        // For decimal degrees: uncertainty is ±0.5 * 10^(-decimals) degrees
        return decimals > 0 ? 0.5 * Math.pow(10, -decimals) : 0.05;
    } else if (format === CoordFormat.DegsMins || format === CoordFormat.Degreemins) {
        // For degrees-minutes: uncertainty in minutes, convert to degrees
        var minuteError = decimals > 0 ? 0.5 * Math.pow(10, -decimals) : 0.5;
        return minuteError / 60;
    } else if (format === CoordFormat.DegsMinsSecs) {
        // For degrees-minutes-seconds: uncertainty in seconds, convert to degrees
        var secondError = decimals > 0 ? 0.5 * Math.pow(10, -decimals) : 0.5;
        return secondError / 3600;
    }
    return 0;
};

/**
 * Get uncertainty in meters
 * For meter-based systems: direct from decimals
 * For degree-based systems: convert using geodetic calculations
 * @param {number} refLat - Reference latitude for degree-to-meter conversion (optional)
 * @returns {number} Uncertainty in meters
 */
Coord.prototype.uncertaintyMeters = function(refLat) {
    if (!this.parsedFrom) return 0;
    
    var format = this.parsedFrom.format;
    var error = this.maxError();
    
    if (format === CoordFormat.Meters) {
        // Already in meters
        return error;
    } else if (format.unit() === CoordUnit.Degrees) {
        // Convert degree error to meters
        // Need reference latitude for accurate conversion
        var lat = refLat !== undefined ? refLat : this.value;
        
        if (this.axis === CoordAxis.Northing) {
            // Latitude: use metersPerDegreeLat
            return GeoUtils.degreeErrorToMetersLat(error, lat);
        } else if (this.axis === CoordAxis.Easting) {
            // Longitude: use metersPerDegreeLon (depends on latitude)
            return GeoUtils.degreeErrorToMetersLon(error, lat);
        } else {
            // Unknown axis: use average
            return GeoUtils.degreeErrorToMetersLat(error, lat);
        }
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
    this.directionLetter = null;  // null means no direction letters
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
    
    // Set axis if not already set
    if (this.N && this.N.axis === CoordAxis.Unknown) {
        this.N.axis = CoordAxis.Northing;
    }
    if (this.E && this.E.axis === CoordAxis.Unknown) {
        this.E.axis = CoordAxis.Easting;
    }
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
    // If indices are equal (parsed as pair), check if lon-first format (GML, WKT)
    if (this.N.parsedFrom.index === this.E.parsedFrom.index) {
        if (this.N.parsedFrom._isLonFirst) {
            return this.E;  // Lon (E) comes first in GML/WKT
        }
        return this.N;  // Normal lat-lon order
    }
    return this.N.parsedFrom.index < this.E.parsedFrom.index ? this.N : this.E;
};

Point.prototype.last = function() {
    if (!this.N || !this.E) return null;
    if (!this.N.parsedFrom || !this.E.parsedFrom) return this.E;
    // If indices are equal (parsed as pair), check if lon-first format (GML, WKT)
    if (this.N.parsedFrom.index === this.E.parsedFrom.index) {
        if (this.N.parsedFrom._isLonFirst) {
            return this.N;  // Lat (N) comes last in GML/WKT
        }
        return this.E;  // Normal lat-lon order
    }
    return this.N.parsedFrom.index > this.E.parsedFrom.index ? this.N : this.E;
};

Point.prototype.original = function() {
    return this.reprojectedFrom || this;
};

Point.prototype.textBefore = function(opts) {
    var first = this.first();
    if (!first) return "";
    
    // Handle both number (legacy) and options object
    var maxChars = typeof opts === 'number' ? opts : (opts && opts.maxchars);
    var showEllipse = opts && opts.ellipse !== false; // default true
    
    return first.textBefore(maxChars, showEllipse);
};

Point.prototype.textAfter = function(opts) {
    var last = this.last();
    if (!last) return "";
    
    // Handle both number (legacy) and options object
    var maxChars = typeof opts === 'number' ? opts : (opts && opts.maxchars);
    var showEllipse = opts && opts.ellipse !== false; // default true
    
    return last.textAfter(maxChars, showEllipse);
};

Point.prototype.originalText = function(opts) {
    opts = opts || {};
    var maxChars = opts.maxchars || opts.maxChars || 0;
    var ellipse = opts.ellipse !== undefined ? opts.ellipse : false;
    var html = opts.html || false;
    
    if (!this.N || !this.E) return "";
    
    // Get parsedFrom for both coordinates
    var nParsed = this.N.parsedFrom;
    var eParsed = this.E.parsedFrom;
    
    if (!nParsed || !eParsed || !nParsed.parser) return "";
    
    var originalText = nParsed.parser.originalText;
    
    // Extract coordinate values (without prefix/labels)
    var getCoordStart = function(parsed) {
        var text = parsed.text;
        var index = parsed.index;
        
        // Look for prefix patterns like "N:", "Latitude:", "E:", "Longitude:", "n:", etc.
        var prefixMatch = text.match(/^([A-ZÅÄÖa-zåäö]+)\s*:\s*/);
        if (prefixMatch) {
            return index + prefixMatch[0].length;
        }
        
        return index;
    };
    
    var nStart = getCoordStart(nParsed);
    var nEnd = nParsed.index + nParsed.text.length;
    
    var eStart = getCoordStart(eParsed);
    var eEnd = eParsed.index + eParsed.text.length;
    
    // Check if both coordinates are from the same snippet (coordinate pair)
    if (nParsed.index === eParsed.index && nParsed.text === eParsed.text) {
        // Coordinate pair - extract individual values
        var pairText = nParsed.text;
        var separatorMatch = null;
        
        // Try different patterns:
        // 1. With separator: "X: 6550000 Y: 1350000" or "6550000, 385000"
        separatorMatch = pairText.match(/(?:[A-ZÅÄÖa-zåäö]+\s*:\s*)?(\d+(?:[,.]\d+)?)\s*[,;\s]+\s*(?:[A-ZÅÄÖa-zåäö]+\s*:\s*)?(\d+(?:[,.]\d+)?)/);
        
        // 2. Compact with direction letters: "601230N0193015E"
        if (!separatorMatch) {
            separatorMatch = pairText.match(/(\d+[NSEWÖV])(\d+[NSEWÖV])/);
        }
        
        if (separatorMatch) {
            var firstCoord = separatorMatch[1];
            var secondCoord = separatorMatch[2];
            
            if (maxChars === 0) {
                // Default: replace separator with space
                var result = firstCoord + " " + secondCoord;
                if (html) {
                    result = "<b>" + firstCoord + "</b><i> </i><b>" + secondCoord + "</b>";
                }
                return result;
            }
            // With maxChars > 0, include context before/after
            // Fall through to normal handling
        }
    }
    
    // Use snippet boundaries but remove prefix from start
    var firstStart, firstEnd, firstCoord, secondStart, secondEnd, secondCoord;
    if (nStart < eStart) {
        firstStart = nStart;
        firstEnd = nEnd;
        secondStart = eStart;
        secondEnd = eEnd;
    } else {
        firstStart = eStart;
        firstEnd = eEnd;
        secondStart = nStart;
        secondEnd = nEnd;
    }
    
    // Extract coordinate texts from original
    firstCoord = originalText.substring(firstStart, firstEnd);
    secondCoord = originalText.substring(secondStart, secondEnd);
    
    // Extract parts
    var textBefore = originalText.substring(0, firstStart);
    var textBetween = originalText.substring(firstEnd, secondStart);
    var textAfter = originalText.substring(secondEnd);
    
    // Handle based on maxChars
    if (maxChars === 0) {
        // Default: only coordinates with space between
        var result = firstCoord + " " + secondCoord;
        if (html) {
            result = "<b>" + firstCoord + "</b><i> </i><b>" + secondCoord + "</b>";
        }
        return result;
    }
    
    // maxChars > 0: include context, truncate each part separately
    // Note: maxChars does NOT include the "..." - it's the amount of text to keep
    var truncateBefore = function(text, max, addEllipse) {
        if (text.length <= max) return text;
        // Keep last 'max' characters
        var truncated = text.substring(text.length - max);
        return addEllipse ? "..." + truncated : truncated;
    };
    
    var truncateBetween = function(text, max, addEllipse) {
        if (text.length <= max) return text;
        // Keep 'max' characters total (half from start, half from end)
        var halfMax = Math.floor(max / 2);
        var firstPart = text.substring(0, halfMax);
        var lastPart = text.substring(text.length - halfMax);
        return addEllipse ? firstPart + "..." + lastPart : firstPart + lastPart;
    };
    
    var truncateAfter = function(text, max, addEllipse) {
        if (text.length <= max) return text;
        // Keep first 'max' characters
        var truncated = text.substring(0, max);
        return addEllipse ? truncated + "..." : truncated;
    };
    
    // Truncate each part
    var before = truncateBefore(textBefore, maxChars, ellipse);
    var between = truncateBetween(textBetween, maxChars, ellipse);
    var after = truncateAfter(textAfter, maxChars, ellipse);
    
    // Combine
    var result = before + firstCoord + between + secondCoord + after;
    
    if (html) {
        result = "<i>" + before + "</i><b>" + firstCoord + "</b><i>" + between + "</i><b>" + secondCoord + "</b><i>" + after + "</i>";
    }
    
    return result;
};

Point.prototype.context = function(opts) {
    opts = opts || {};
    var maxChars = opts.maxchars || opts.maxChars || 50;
    var ellipse = opts.ellipse !== false; // default true
    
    var before = this.textBefore({maxchars: maxChars, ellipse: ellipse});
    var orig = this.originalText();
    var after = this.textAfter({maxchars: maxChars, ellipse: ellipse});
    
    return before + " [" + orig + "] " + after;
};

Point.prototype.asText = function(explicitOpts) {
    var opts = new FormatOptions(explicitOpts);
    
    if (!this.N || !this.E) return "";
    
    // Get lat/lon values (convert to WGS84 if needed)
    var lat, lon;
    if (this.refsys.unit === CoordUnit.Degrees) {
        lat = this.N.value;
        lon = this.E.value;
    } else {
        var wgs = this.reprojectTo(RefSys.WGS84);
        lat = wgs.N.value;
        lon = wgs.E.value;
    }
    
    // Format lat/lon as strings with proper decimals
    var latStr, lonStr;
    if (opts.decimals !== 'auto' && typeof opts.decimals === 'number') {
        latStr = lat.toFixed(opts.decimals);
        lonStr = lon.toFixed(opts.decimals);
    } else {
        latStr = lat.toString();
        lonStr = lon.toString();
    }
    
    var format = opts.format || 'plain';
    
    // Handle direction letters for plain/degrees format
    if ((format === 'plain' || format === 'degrees') && opts.directionLetter) {
        var nVal = Math.abs(lat);
        var eVal = Math.abs(lon);
        var nDir = lat >= 0 ? "N" : "S";
        var eDir = lon >= 0 ? "E" : "W";
        
        var nValStr, eValStr;
        if (opts.decimals !== 'auto' && typeof opts.decimals === 'number') {
            nValStr = nVal.toFixed(opts.decimals);
            eValStr = eVal.toFixed(opts.decimals);
        } else {
            nValStr = nVal.toString();
            eValStr = eVal.toString();
        }
        
        if (format === 'degrees' && opts.symbols) {
            nValStr += "°";
            eValStr += "°";
        }
        
        if (opts.directionLetter === 'before') {
            return nDir + " " + nValStr + " " + eDir + " " + eValStr;
        } else if (opts.directionLetter === 'after') {
            return nValStr + " " + nDir + " " + eValStr + " " + eDir;
        }
    }
    
    // Format based on requested format
    switch(format.toLowerCase()) {
        case 'plain':
            return latStr + " " + lonStr;
        
        case 'degrees':
            if (opts.symbols) {
                return latStr + "° " + lonStr + "°";
            } else {
                return latStr + " " + lonStr;
            }
        
        case 'degreesandminutes':
        case 'dm':
            return this._formatDM(lat, lon, opts);
        
        case 'degreesminutesandseconds':
        case 'dms':
            return this._formatDMS(lat, lon, opts);
        
        case 'sweref99tm':
            var sweref = this.reprojectTo(RefSys.SWEREF99TM);
            return Math.round(sweref.N.value) + " " + Math.round(sweref.E.value);
        
        case 'rt90':
            var rt90 = this.reprojectTo(RefSys.RT90_25gonV);
            return Math.round(rt90.N.value) + " " + Math.round(rt90.E.value);
        
        default:
            return lat + " " + lon;
    }
};

Point.prototype._formatDM = function(lat, lon, opts) {
    var latAbs = Math.abs(lat);
    var lonAbs = Math.abs(lon);
    
    var latDeg = Math.floor(latAbs);
    var latMin = (latAbs - latDeg) * 60;
    
    var lonDeg = Math.floor(lonAbs);
    var lonMin = (lonAbs - lonDeg) * 60;
    
    var latDir = lat >= 0 ? "N" : "S";
    var lonDir = lon >= 0 ? "E" : "W";
    
    var minSymbol = "\u2019";  // Use fancy quote U+2019 (RIGHT SINGLE QUOTATION MARK)
    
    var result;
    if (opts.symbols) {
        if (opts.compact) {
            // Compact format: no spaces
            if (opts.directionLetter === 'before') {
                result = latDir + latDeg + "°" + latMin.toFixed(3) + minSymbol + 
                         lonDir + lonDeg + "°" + lonMin.toFixed(3) + minSymbol;
            } else if (opts.directionLetter === 'after') {
                result = latDeg + "°" + latMin.toFixed(3) + minSymbol + latDir + 
                         lonDeg + "°" + lonMin.toFixed(3) + minSymbol + lonDir;
            } else {
                // No direction letters
                result = latDeg + "°" + latMin.toFixed(3) + minSymbol + 
                         lonDeg + "°" + lonMin.toFixed(3) + minSymbol;
            }
        } else {
            // Normal format with spaces
            if (opts.directionLetter === 'before') {
                result = latDir + " " + latDeg + "° " + latMin.toFixed(3) + minSymbol + " " + 
                         lonDir + " " + lonDeg + "° " + lonMin.toFixed(3) + minSymbol;
            } else if (opts.directionLetter === 'after') {
                result = latDeg + "° " + latMin.toFixed(3) + minSymbol + " " + latDir + " " + 
                         lonDeg + "° " + lonMin.toFixed(3) + minSymbol + " " + lonDir;
            } else {
                // No direction letters
                result = latDeg + "° " + latMin.toFixed(3) + minSymbol + " " + 
                         lonDeg + "° " + lonMin.toFixed(3) + minSymbol;
            }
        }
    } else {
        result = latDeg + " " + latMin.toFixed(3) + " " + latDir + " " + 
                 lonDeg + " " + lonMin.toFixed(3) + " " + lonDir;
    }
    
    return result;
};

Point.prototype._formatDMS = function(lat, lon, opts) {
    var latAbs = Math.abs(lat);
    var lonAbs = Math.abs(lon);
    
    var latDeg = Math.floor(latAbs);
    var latMinDec = (latAbs - latDeg) * 60;
    var latMin = Math.floor(latMinDec);
    var latSec = (latMinDec - latMin) * 60;
    
    var lonDeg = Math.floor(lonAbs);
    var lonMinDec = (lonAbs - lonDeg) * 60;
    var lonMin = Math.floor(lonMinDec);
    var lonSec = (lonMinDec - lonMin) * 60;
    
    var latDir = lat >= 0 ? "N" : "S";
    var lonDir = lon >= 0 ? "E" : "W";
    
    var minSymbol = "\u2019";  // Use fancy quote U+2019 (RIGHT SINGLE QUOTATION MARK)
    var secSymbol = "\u201D";  // Use fancy quote U+201D (RIGHT DOUBLE QUOTATION MARK)
    
    var result;
    if (opts.symbols) {
        if (opts.compact) {
            // Compact format: no spaces
            if (opts.directionLetter === 'before') {
                result = latDir + latDeg + "°" + latMin + minSymbol + latSec.toFixed(1) + secSymbol + 
                         lonDir + lonDeg + "°" + lonMin + minSymbol + lonSec.toFixed(1) + secSymbol;
            } else if (opts.directionLetter === 'after') {
                result = latDeg + "°" + latMin + minSymbol + latSec.toFixed(1) + secSymbol + latDir + 
                         lonDeg + "°" + lonMin + minSymbol + lonSec.toFixed(1) + secSymbol + lonDir;
            } else {
                // No direction letters
                result = latDeg + "°" + latMin + minSymbol + latSec.toFixed(1) + secSymbol + 
                         lonDeg + "°" + lonMin + minSymbol + lonSec.toFixed(1) + secSymbol;
            }
        } else {
            // Normal format with spaces
            if (opts.directionLetter === 'before') {
                result = latDir + " " + latDeg + "° " + latMin + minSymbol + " " + latSec.toFixed(1) + secSymbol + " " + 
                         lonDir + " " + lonDeg + "° " + lonMin + minSymbol + " " + lonSec.toFixed(1) + secSymbol;
            } else if (opts.directionLetter === 'after') {
                result = latDeg + "° " + latMin + minSymbol + " " + latSec.toFixed(1) + secSymbol + " " + latDir + " " + 
                         lonDeg + "° " + lonMin + minSymbol + " " + lonSec.toFixed(1) + secSymbol + " " + lonDir;
            } else {
                // No direction letters
                result = latDeg + "° " + latMin + minSymbol + " " + latSec.toFixed(1) + secSymbol + " " + 
                         lonDeg + "° " + lonMin + minSymbol + " " + lonSec.toFixed(1) + secSymbol;
            }
        }
    } else {
        result = latDeg + " " + latMin + " " + latSec.toFixed(1) + " " + latDir + " " + 
                 lonDeg + " " + lonMin + " " + lonSec.toFixed(1) + " " + lonDir;
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

Point.prototype._hasFormatSymbols = function() {
    // Check for degree, minute, second symbols in original text
    if (!this.N.parsedFrom || !this.E.parsedFrom) return false;
    var text = this.N.parsedFrom.text + ' ' + this.E.parsedFrom.text;
    return /[°º'′´`"″\u2019\u201D]/.test(text);
};

Point.prototype._hasDirectionLetters = function() {
    var hasN = this.N.parsedFrom && this.N.parsedFrom.directionLetter &&
               /[NSEWÖV]/i.test(this.N.parsedFrom.directionLetter);
    var hasE = this.E.parsedFrom && this.E.parsedFrom.directionLetter &&
               /[NSEWÖV]/i.test(this.E.parsedFrom.directionLetter);
    return hasN || hasE;
};

Point.prototype._hasTechnicalContext = function() {
    // Check for technical prefixes or URL patterns
    if (!this.N.parsedFrom || !this.E.parsedFrom) return false;
    var parser = this.N.parsedFrom.parser;
    if (!parser) return false;
    
    var text = parser.originalText;
    // Check for prefixes like X:, Y:, Lat:, Long:, Point(, @...z
    return /\b(X|Y|Lat|Long|Latitude|Longitude|N|E|Point)\s*[:(\[]/.test(text) ||
           /@\d+[.,]\d+[.,]\d+z/.test(text);
};

Point.prototype._evaluateSeparator = function() {
    if (!this.N.parsedFrom || !this.E.parsedFrom) return 0;
    
    var nIndex = this.N.parsedFrom.index;
    var eIndex = this.E.parsedFrom.index;
    var nText = this.N.parsedFrom.text;
    
    // Get text between coordinates
    var parser = this.N.parsedFrom.parser;
    if (!parser) return 0;
    
    // Calculate end of N coordinate (trimming trailing whitespace from snippet)
    var nEnd = nIndex + nText.trimEnd().length;
    var between = parser.originalText.substring(nEnd, eIndex);
    
    // No separator or only whitespace
    if (between.length === 0 || /^\s*$/.test(between)) {
        return 0; // Whitespace or no separator is normal
    }
    
    // Unusual separator (semicolon, slash, etc.)
    if (/[;\/\\|]/.test(between)) {
        return 0.1;
    }
    
    return 0; // Normal separator (space, comma, newline, tab)
};

Point.prototype._evaluatePrecision = function() {
    if (!this.N.parsedFrom || !this.E.parsedFrom) return 0;
    
    var nDecimals = this.N.parsedFrom.noOfDecimals || 0;
    var eDecimals = this.E.parsedFrom.noOfDecimals || 0;
    var penalty = 0;
    
    // För Decimalgrader: färre än 3 decimaler (låg precision)
    if (this.refsys.unit === CoordUnit.Degrees) {
        var format = this.N.parsedFrom.format;
        if (format === CoordFormat.Degs) {
            if (nDecimals < 3 || eDecimals < 3) {
                penalty += 0.1;
            }
        }
    }
    
    // Precisionsskillnad mellan koordinaterna (endast extrema skillnader)
    var diff = Math.abs(nDecimals - eDecimals);
    if (diff >= 7) {
        penalty += 0.2;
    }
    
    // EXTREM formatinkompatibilitet
    var nValue = Math.abs(this.N.value);
    var eValue = Math.abs(this.E.value);
    
    // En i DD-intervall, en i meter-intervall
    var nIsDD = nValue <= 180;
    var eIsDD = eValue <= 180;
    var nIsMeter = nValue > 10000;
    var eIsMeter = eValue > 10000;
    
    if ((nIsDD && eIsMeter) || (nIsMeter && eIsDD)) {
        penalty += 0.6;
    }
    
    // En med 5+ decimaler, en med 0 decimaler
    if ((nDecimals >= 5 && eDecimals === 0) || (eDecimals >= 5 && nDecimals === 0)) {
        penalty += 0.6;
    }
    
    return penalty;
};

Point.prototype.rate = function(grouping, hints) {
    this._ratingLog = [];
    var score = 1.0; // Start from perfect score
    
    if (!this.N || !this.E) {
        this._rating = 0;
        this._ratingLog.push("Missing coordinate");
        return this._rating;
    }
    
    // Diskvalificeringsregler
    if (this.refsys.unit === CoordUnit.Degrees) {
        var lat = this.N.value;
        var lon = this.E.value;
        
        // Validate coordinate ranges
        if (Math.abs(lat) > 90 || Math.abs(lon) > 180) {
            this._rating = 0;
            this._ratingLog.push("Värden utanför alla bounding boxes");
            return this._rating;
        }
        
        // Decimalgrader utan decimaler OCH utan väderstreck
        var nDecimals = this.N.parsedFrom ? this.N.parsedFrom.noOfDecimals : 0;
        var eDecimals = this.E.parsedFrom ? this.E.parsedFrom.noOfDecimals : 0;
        var hasDirectionN = this.N.parsedFrom && this.N.parsedFrom.directionLetter && 
                           /[NSEWÖV]/i.test(this.N.parsedFrom.directionLetter);
        var hasDirectionE = this.E.parsedFrom && this.E.parsedFrom.directionLetter &&
                           /[NSEWÖV]/i.test(this.E.parsedFrom.directionLetter);
        
        // Check if format is inherently valid without decimals (DMS, DDMM, etc.)
        var nFormat = this.N.parsedFrom ? this.N.parsedFrom.format.name : '';
        var eFormat = this.E.parsedFrom ? this.E.parsedFrom.format.name : '';
        var isStructuredFormat = /minuter|sekunder/i.test(nFormat) || /minuter|sekunder/i.test(eFormat);
        
        if (nDecimals === 0 && eDecimals === 0 && !hasDirectionN && !hasDirectionE && !isStructuredFormat) {
            this._rating = 0;
            this._ratingLog.push("Decimalgrader utan decimaler OCH utan väderstreck");
            return this._rating;
        }
    }
    
    // 1. Avdrag för saknade formatindikatorer
    var hasFormatSymbols = this._hasFormatSymbols();
    var hasDirectionLetters = this._hasDirectionLetters();
    var hasTechnicalContext = this._hasTechnicalContext();
    
    if (!hasFormatSymbols && !hasDirectionLetters && !hasTechnicalContext) {
        score -= 0.3;
        this._ratingLog.push("-0.3 saknar formatsymboler, väderstreck och teknisk kontext");
    } else if (!hasFormatSymbols && (hasDirectionLetters || hasTechnicalContext)) {
        score -= 0.1;
        this._ratingLog.push("-0.1 saknar formatsymboler");
    } else if (!hasDirectionLetters && hasFormatSymbols) {
        score -= 0.1;
        this._ratingLog.push("-0.1 saknar väderstreck");
    }
    
    // 2. Avdrag för separatortyp
    var separatorPenalty = this._evaluateSeparator();
    score -= separatorPenalty;
    if (separatorPenalty > 0) {
        this._ratingLog.push("-" + separatorPenalty + " för separator");
    }
    
    // 3. Avdrag för precisionsproblem
    var precisionPenalty = this._evaluatePrecision();
    score -= precisionPenalty;
    if (precisionPenalty > 0) {
        this._ratingLog.push("-" + precisionPenalty + " för precision");
    }
    
    // Klamp till [0.0, 1.0]
    this._rating = Math.max(0.0, Math.min(1.0, score));
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
        
        // Round to appropriate precision based on original coordinate precision
        // to avoid increasing uncertainty (per requirements)
        var nDecimals = (this.N.parsedFrom && this.N.parsedFrom.noOfDecimals) || 0;
        var eDecimals = (this.E.parsedFrom && this.E.parsedFrom.noOfDecimals) || 0;
        var maxDecimals = Math.max(nDecimals, eDecimals);
        
        // For meter-based systems, use same decimal precision as input
        // For degree-based systems, calculate appropriate precision
        var roundTo = maxDecimals;
        if (toRefSys.unit === CoordUnit.Meters && this.refsys.unit === CoordUnit.Meters) {
            // Meter to meter: keep same precision
            roundTo = maxDecimals;
        } else if (toRefSys.unit === CoordUnit.Degrees && this.refsys.unit === CoordUnit.Meters) {
            // Meter to degrees: need more decimals for same precision
            roundTo = Math.max(5, maxDecimals);
        } else if (toRefSys.unit === CoordUnit.Meters && this.refsys.unit === CoordUnit.Degrees) {
            // Degrees to meters: can use fewer decimals
            roundTo = Math.max(0, maxDecimals - 5);
        }
        
        var factor = Math.pow(10, roundTo);
        
        var newPoint = new Point();
        newPoint.E = new Coord();
        newPoint.E.value = Math.round(result[0] * factor) / factor;
        newPoint.E.axis = CoordAxis.Easting;
        
        newPoint.N = new Coord();
        newPoint.N.value = Math.round(result[1] * factor) / factor;
        newPoint.N.axis = CoordAxis.Northing;
        
        newPoint.refsys = toRefSys;
        newPoint.reprojectedFrom = this;
        
        return newPoint;
    } catch(e) {
        console.warn("Reprojection failed:", e);
        return this;
    }
};

/**
 * Get uncertainty in original units (degrees or meters)
 */
Point.prototype.maxErrors = function() {
    // Return uncertainty in meters (per kravspec 9.3)
    var uncertainty = this.uncertaintyMeters();
    return {
        N: uncertainty.north,
        E: uncertainty.east
    };
};

/**
 * Get uncertainty in meters for both dimensions
 * Per kravspec 9.3: Report uncertainty in meters for north and east
 */
Point.prototype.uncertaintyMeters = function() {
    if (!this.N || !this.E) {
        return { north: 0, east: 0 };
    }
    
    var lat = this.latitude();
    
    // For degree-based systems with Unknown axis, we need to handle specially
    if (this.refsys && this.refsys.unit === CoordUnit.Degrees) {
        var nError = this.N.maxError();
        var eError = this.E.maxError();
        
        // N is latitude (north-south), E is longitude (east-west)
        return {
            north: GeoUtils.degreeErrorToMetersLat(nError, lat),
            east: GeoUtils.degreeErrorToMetersLon(eError, lat)
        };
    } else {
        // For meter-based systems, use the standard method
        return {
            north: this.N.uncertaintyMeters(lat),
            east: this.E.uncertaintyMeters(lat)
        };
    }
};

/**
 * Get bounding box representing uncertainty
 * Uses geodetic calculations for accurate conversion
 */
Point.prototype.maxErrorBounds = function() {
    var lat = this.latitude();
    var lng = this.longitude();
    
    // maxErrors() returns errors in meters, convert to degrees
    var errors = this.maxErrors();
    
    // Convert meter errors to degree errors using geodetic functions
    var latError = errors.N / GeoUtils.metersPerDegreeLat(lat);
    var lngError = errors.E / GeoUtils.metersPerDegreeLon(lat);
    
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
    return "DEPRECATED";
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
    
    // Auto-parse if text is provided
    if (text) {
        this.parse(text, opts);
    }
}

// Metadata
CF.version = "5.0-beta.7";
CF.build = "20260116-165449"; // Auto-updated by update-build.sh
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
    
    // Pre-process: Remove CRS names that contain direction letters
    // e.g., "RT90 2.5 gon V" -> "RT90 2.5 gon" to avoid "V" being parsed as West
    // Also handle "gon V:" with colon
    this._text = this._text.replace(/\bgon\s+[VW]\b:?/gi, 'gon');
    
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
            if (snippet._invalid) {
                // Skip invalid match - use _skipLength if set, otherwise skip 1 character
                this._log("Skipped invalid snippet: " + snippet.text + " at position " + snippet.index);
                var skipAmount = snippet._skipLength || 1;
                pos += skipAmount;
            } else {
                this._snippets.push(snippet);
                this._log("Found snippet: " + snippet.text + " at position " + snippet.index);
                // Move past this snippet
                var relativeEnd = snippet.index - pos + snippet.text.length;
                pos += relativeEnd;
            }
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
        
        // Skip snippets that look like list numbers
        // Pattern: 1-2 digit number at start of line, followed by space and coordinate-like pattern
        if (snippet.parsedFrom && snippet.parsedFrom.parser) {
            var lineNo = snippet.parsedFrom.lineNo;
            var lineText = snippet.parsedFrom.parser.lines[lineNo];
            var snippetPos = snippet.parsedFrom.index;
            var lineStart = snippet.parsedFrom.parser.originalText.split(/\r?\n/).slice(0, lineNo).join('\n').length;
            if (lineNo > 0) lineStart++; // Account for newline
            var posInLine = snippetPos - lineStart;
            
            // If snippet is at start of line and is a small number (1-99)
            if (posInLine <= 3 && snippet.text.match(/^\d{1,2}$/)) {
                var num = parseInt(snippet.text, 10);
                // Check if there's a coordinate-like pattern after this number
                var afterSnippet = lineText.substring(posInLine + snippet.text.length);
                if (num < 100 && afterSnippet.match(/^\s+\d{2,3}\s+\d+[,.]\d+/)) {
                    this._log("Skipping list number: " + snippet.text);
                    continue;
                }
            }
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
            // Only for WGS84-like coordinates without explicit direction letters
            if (!snippet._hasExplicitDirections && (Math.abs(lat) > 90 || Math.abs(lon) > 180)) {
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
            latCoord.axis = snippet._ambiguousOrder ? CoordAxis.Unknown : CoordAxis.Northing;
            latCoord.parsedFrom = snippet;
            
            var lonCoord = new Coord();
            lonCoord.value = lon;
            lonCoord.axis = snippet._ambiguousOrder ? CoordAxis.Unknown : CoordAxis.Easting;
            lonCoord.parsedFrom = snippet;
            
            // Preserve direction letters for rating system
            if (snippet._directionLetter1) {
                // Create a pseudo-snippet for N with direction letter
                var nSnippet = Object.create(snippet);
                nSnippet.directionLetter = snippet._directionLetter1;
                latCoord.parsedFrom = nSnippet;
            }
            if (snippet._directionLetter2) {
                // Create a pseudo-snippet for E with direction letter
                var eSnippet = Object.create(snippet);
                eSnippet.directionLetter = snippet._directionLetter2;
                lonCoord.parsedFrom = eSnippet;
            }
            
            // Determine reference system from coordinate values
            // If ambiguous order, allow testing both X,Y and Y,X
            var ordered = !snippet._ambiguousOrder;
            var refSysResult = RefSys.fromCoords(latCoord, lonCoord, ordered);
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
            
            // Only pair coordinates that are adjacent (no other coords between them)
            // This prevents pairing coords that are far apart in the text
            var hasCoordsBetween = false;
            for (var k = i + 1; k < j; k++) {
                if (!usedCoords[k] && this._coords[k]) {
                    hasCoordsBetween = true;
                    break;
                }
            }
            if (hasCoordsBetween) continue;
            
            // Don't pair coordinates from different lines unless they're part of a multi-line format
            var c1Line = c1.parsedFrom ? c1.parsedFrom.lineNo : -1;
            var c2Line = c2.parsedFrom ? c2.parsedFrom.lineNo : -1;
            if (c1Line !== c2Line && c1Line >= 0 && c2Line >= 0) {
                // Allow pairing across consecutive lines only (for lat/lon on separate lines)
                if (Math.abs(c1Line - c2Line) > 1) continue;
                
                // Check if there's text between them suggesting they're separate
                var parser = c1.parsedFrom ? c1.parsedFrom.parser : null;
                if (parser && parser.lines && c2Line === c1Line + 1) {
                    var lineText = parser.lines[c1Line];
                    var nextLineText = parser.lines[c2Line];
                    
                    // Count commas that separate values (not decimal commas)
                    // A separator comma is followed by optional space and then a non-decimal digit pattern
                    // Decimal comma: "30,5" - comma between single digits
                    // Separator comma: "30,5 19" or "value1,value2" - comma with space or multiple digits after
                    var c1SepCommas = (lineText.match(/,\s*(?=\d{2,}|\D)/g) || []).length;
                    var c2SepCommas = (nextLineText.match(/,\s*(?=\d{2,}|\D)/g) || []).length;
                    
                    // If both lines have multiple separator commas, they're likely separate CSV rows
                    if (c1SepCommas >= 2 && c2SepCommas >= 2) continue;
                }
            }
            
            // Check if these coords are from a CSV line with X,Y header
            var csvSwapNeeded = false;
            if (c1.parsedFrom && c1.parsedFrom.parser && c1.parsedFrom.parser.csvColumnMapping) {
                var mapping = c1.parsedFrom.parser.csvColumnMapping;
                // Check if both coords are on the same line (line after header)
                if (c1.parsedFrom.lineNo === c2.parsedFrom.lineNo && c1.parsedFrom.lineNo > 0) {
                    csvSwapNeeded = mapping.swapNeeded;
                    this._log("CSV header detected: " + (csvSwapNeeded ? "Y,X order" : "X,Y order"));
                }
            }
            
            // If CSV swap is needed, swap the coords before pairing
            var coord1 = csvSwapNeeded ? c2 : c1;
            var coord2 = csvSwapNeeded ? c1 : c2;
            
            // Try to find a reference system that contains both coords
            // Allow auto-swapping only if neither coordinate has explicit axis (no direction letters)
            var hasExplicitAxis = (coord1.axis !== CoordAxis.Unknown) || (coord2.axis !== CoordAxis.Unknown);
            var result = RefSys.fromCoords(coord1, coord2, hasExplicitAxis);
            
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
            // Check if there's an empty line between lastLineNo and lineNo
            var hasEmptyLine = false;
            var parser = point.N.parsedFrom ? point.N.parsedFrom.parser : null;
            if (parser && parser.lines) {
                for (var j = lastLineNo + 1; j < lineNo; j++) {
                    if (parser.lines[j].trim() === '') {
                        hasEmptyLine = true;
                        break;
                    }
                }
            }
            
            if (hasEmptyLine) {
                // Empty line detected, start new group
                if (currentGroup.length > 0) {
                    this._groups.push(currentGroup);
                }
                currentGroup = [];
            }
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
    
    // Group points if not already done
    if (this._groups.length === 0 && this._points.length > 0) {
        this._groupPoints();
    }
    
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
    return "DEPRECATED";
};

CF.prototype.asDebugText = function() {
    return "DEPRECATED";
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
    
    // Sort lägst till högst (ascending)
    ratings.sort(function(a, b) { return a - b; });
    this._foundRatings = ratings;
    return ratings;
};

// Get index into foundRatings array
// Returns index of lowest rating that is >= given rating
CF.prototype.ratingIndex = function(rating) {
    var ratings = this.foundRatings();
    
    // If no rating provided, use default
    if (rating === undefined || rating === null) {
        rating = CF.ratingDefault;
    }
    
    // Find first rating >= given rating (since sorted ascending)
    for (var i = 0; i < ratings.length; i++) {
        if (ratings[i] >= rating) return i;
    }
    
    // If all ratings are lower, return last index
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
CF.GeoUtils = GeoUtils;

})(typeof window !== 'undefined' ? window : global);
