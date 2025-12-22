/**
 * CoordFinder Interface
 * 
 * A module definition describing the public API for CoordFinder.
 * This is not actual code but a description of the interface that
 * the implementation should expose to users.
 * 
 * @version 4.3
 * @author Bernt Rane
 * @license MIT
 */

// Module loading mechanism that supports AMD, CommonJS, and global variable
(function(definition) {
    if (typeof define == 'function' && typeof define.amd == 'object') {
        // Support AMD (e.g. requireJS)
        define(['proj4'], definition);
    } else if (typeof module != 'undefined') {
        // commonJS (e.g. nodeJS)
        module.exports = definition(require('proj4'));
    } else {
        // Global name usage
        this['CoordFinder'] = definition(this.proj4);
    }
}(function(proj4) {
    
    /**
     * Main class for searching coordinates in text
     * 
     * @constructor
     * @param {string} [text] - Text to analyze (optional)
     * @param {Object} [opts] - Options for analysis (optional)
     * @param {boolean} [opts.grouping] - Whether to group points
     */
    function CoordFinder(text, opts) {
        // Implementation details...
    }
    
    /**
     * Version number for the module
     * @type {string}
     */
    CoordFinder.version = "4.3";
    
    /**
     * Default value for point rating
     * @type {number}
     */
    CoordFinder.ratingDefault = 0.5;
    
    /**
     * Find the first coordinate pair in a text
     * 
     * @static
     * @param {string} text - Text to search
     * @returns {CoordFinder.Point|null} First found point or null
     */
    CoordFinder.pointIn = function(text) {
        // Implementation details...
    };
    
    /**
     * Find all coordinate pairs in a text
     * 
     * @static
     * @param {string} text - Text to search
     * @returns {Array<CoordFinder.Point>} Array of found points
     */
    CoordFinder.pointsIn = function(text) {
        // Implementation details...
    };
    
    /**
     * Find groups of coordinate pairs in a text
     * 
     * @static
     * @param {string} text - Text to search
     * @returns {Array<Array<CoordFinder.Point>>} Array of point groups
     */
    CoordFinder.groupsIn = function(text) {
        // Implementation details...
    };
    
    /**
     * Parse a text to find coordinates
     * 
     * @param {string} text - Text to search
     * @param {Object} [opts] - Options for analysis
     * @param {boolean} [opts.grouping] - Whether to group points
     * @returns {CoordFinder} this for method chaining
     */
    CoordFinder.prototype.parse = function(text, opts) {
        // Implementation details...
        return this;
    };
    
    /**
     * Get found points above a certain rating threshold
     * 
     * @param {Object} [opts] - Options for filtering
     * @param {number} [opts.rating] - Rating threshold (0-1), default: CoordFinder.ratingDefault
     * @returns {Array<CoordFinder.Point>} Filtered points
     */
    CoordFinder.prototype.points = function(opts) {
        // Implementation details...
    };
    
    /**
     * Get groups of points
     * 
     * @param {Object} [opts] - Options for filtering
     * @param {number} [opts.rating] - Rating threshold (0-1)
     * @returns {Array<Array<CoordFinder.Point>>} Groups of points
     */
    CoordFinder.prototype.groups = function(opts) {
        // Implementation details...
    };
    
    /**
     * Get log from the latest analysis
     * 
     * @returns {string} Log text
     */
    CoordFinder.prototype.log = function() {
        // Implementation details...
    };
    
    /**
     * Get a sorted array of all ratings found in the latest analysis
     * 
     * @returns {Array<number>} Ratings from 0 to 1
     */
    CoordFinder.prototype.foundRatings = function() {
        // Implementation details...
    };
    
    /**
     * Find index in foundRatings for a given rating
     * 
     * @param {number} [rating] - Rating to find index for
     * @returns {number} Index in the foundRatings array
     */
    CoordFinder.prototype.ratingIndex = function(rating) {
        // Implementation details...
    };
    
    // --------------------------------------------------------
    // Point - Class for coordinate pairs
    // --------------------------------------------------------
    
    /**
     * Represents a coordinate pair (point)
     * 
     * @constructor
     * @param {CoordFinder.Coord} N - Northern coordinate
     * @param {CoordFinder.Coord} E - Eastern coordinate
     * @param {CoordFinder.RefSys} [refsys] - Reference system
     */
    CoordFinder.Point = function(N, E, refsys) {
        this.N = N;
        this.E = E;
        this.refsys = refsys || CoordFinder.RefSys.Unknown;
    };
    
    /**
     * Get WGS84 latitude
     * @returns {number} Latitude in WGS84
     */
    CoordFinder.Point.prototype.latitude = function() {
        // Implementation details...
    };
    
    /**
     * Get WGS84 longitude
     * @returns {number} Longitude in WGS84
     */
    CoordFinder.Point.prototype.longitude = function() {
        // Implementation details...
    };
    
    /**
     * Get the coordinate that was first found in the text
     * @returns {CoordFinder.Coord} First coordinate
     */
    CoordFinder.Point.prototype.first = function() {
        // Implementation details...
    };
    
    /**
     * Get the coordinate that was last found in the text
     * @returns {CoordFinder.Coord} Last coordinate
     */
    CoordFinder.Point.prototype.last = function() {
        // Implementation details...
    };
    
    /**
     * Get the point in its original form (before reprojection)
     * @returns {CoordFinder.Point} Original point
     */
    CoordFinder.Point.prototype.original = function() {
        // Implementation details...
    };
    
    /**
     * Get text preceding the coordinate
     * @param {Object} [opts] - Options for text retrieval
     * @param {number} [opts.maxchars] - Max number of characters
     * @param {boolean} [opts.html] - Whether to use HTML formatting
     * @returns {string} Text before the coordinate
     */
    CoordFinder.Point.prototype.textBefore = function(opts) {
        // Implementation details...
    };
    
    /**
     * Get text following the coordinate
     * @param {Object} [opts] - Options for text retrieval
     * @param {number} [opts.maxchars] - Max number of characters
     * @param {boolean} [opts.html] - Whether to use HTML formatting
     * @returns {string} Text after the coordinate
     */
    CoordFinder.Point.prototype.textAfter = function(opts) {
        // Implementation details...
    };
    
    /**
     * Get original text where the coordinate was found
     * @param {Object} [opts] - Options for text retrieval
     * @param {number} [opts.maxchars] - Max number of characters
     * @param {boolean} [opts.ellipse] - Whether to replace omitted characters with "..."
     * @param {boolean} [opts.html] - Whether to use HTML formatting
     * @returns {string} Original text
     */
    CoordFinder.Point.prototype.originalText = function(opts) {
        // Implementation details...
    };
    
    /**
     * Get context (text before and after the coordinate)
     * @param {Object} [opts] - Options for context retrieval
     * @param {number} [opts.maxchars] - Max number of characters, default: 12
     * @param {boolean} [opts.ellipse] - Whether to replace omitted characters with "...", default: true
     * @param {boolean} [opts.html] - Whether to use HTML formatting, default: true
     * @returns {string} Context
     */
    CoordFinder.Point.prototype.context = function(opts) {
        // Implementation details...
    };
    
    /**
     * Format the point as text
     * @param {Object} [opts] - Formatting options
     * @param {string} [opts.format] - Format: 'plain', 'degrees', 'degreesandminutes', 'degreesminutesandseconds'
     * @param {string} [opts.directionLetter] - Placement of direction letters: 'none', 'before', 'after'
     * @param {boolean} [opts.symbols] - Whether to use degree symbols, etc.
     * @param {boolean} [opts.compact] - Whether to use compact format without spaces
     * @param {string|number} [opts.decimals] - Number of decimals: 'auto', 'meter', 0-10
     * @param {boolean} [opts.localized] - Whether to use localized format
     * @returns {string} Formatted text
     */
    CoordFinder.Point.prototype.asText = function(opts) {
        // Implementation details...
    };
    
    /**
     * Get log text on how the point was created
     * @returns {string} Log text
     */
    CoordFinder.Point.prototype.log = function() {
        // Implementation details...
    };
    
    /**
     * Get the point's rating
     * @returns {number} Rating from 0 to 1
     */
    CoordFinder.Point.prototype.rating = function() {
        // Implementation details...
    };
    
    /**
     * Transform the point to another reference system
     * @param {CoordFinder.RefSys} toRefSys - Target reference system
     * @returns {CoordFinder.Point|null} Transformed point or null
     */
    CoordFinder.Point.prototype.reprojectTo = function(toRefSys) {
        // Implementation details...
    };
    
    /**
     * Get maximum error amounts in meters
     * @returns {Object} Object with N and E error values
     */
    CoordFinder.Point.prototype.maxErrors = function() {
        // Implementation details...
    };
    
    /**
     * Get errors in the form of a BoundingBox
     * @returns {CoordFinder.BoundingBox} Error bounds
     */
    CoordFinder.Point.prototype.maxErrorBounds = function() {
        // Implementation details...
    };
    
    /**
     * Format the point as debug text
     * @returns {string} Debug text
     */
    CoordFinder.Point.prototype.asDebugText = function() {
        // Implementation details...
    };
    
    // --------------------------------------------------------
    // Coord - Class for a single coordinate
    // --------------------------------------------------------
    
    /**
     * Represents a single coordinate
     * 
     * @constructor
     */
    CoordFinder.Coord = function() {
        this.value = 0.0;  // Numerical value (negative for west/south)
        this.axis = CoordFinder.CoordAxis.Unknown;  // Coordinate axis
        this.parsedFrom = {  // Information about parsing
            format: "",
            noOfDecimals: 0,
            directionLetter: ""
        };
    };
    
    /**
     * Get original text
     * @returns {string} Original text
     */
    CoordFinder.Coord.prototype.originalText = function() {
        // Implementation details...
    };
    
    /**
     * Get maximum error amount
     * @returns {number} Maximum error amount
     */
    CoordFinder.Coord.prototype.maxError = function() {
        // Implementation details...
    };
    
    // --------------------------------------------------------
    // CoordUnit - Constants for coordinate units
    // --------------------------------------------------------
    
    /**
     * Constants for coordinate units
     */
    CoordFinder.CoordUnit = {
        Unknown: "unknown",
        Meters: "meter",
        Degrees: "degrees"
    };
    
    // --------------------------------------------------------
    // CoordAxis - Constants for coordinate axes
    // --------------------------------------------------------
    
    /**
     * Constants for coordinate axes
     */
    CoordFinder.CoordAxis = {
        Unknown: "Unknown",
        Northing: "Northing", // North/south
        Easting: "Easting"    // East/west
    };
    
    // --------------------------------------------------------
    // BoundingBox - Class for geographic areas
    // --------------------------------------------------------
    
    /**
     * Represents a geographic area
     * 
     * @constructor
     * @param {number} Nmin - Minimum northern coordinate
     * @param {number} Emin - Minimum eastern coordinate
     * @param {number} Nmax - Maximum northern coordinate
     * @param {number} Emax - Maximum eastern coordinate
     */
    CoordFinder.BoundingBox = function(Nmin, Emin, Nmax, Emax) {
        this.Nmin = Nmin;
        this.Emin = Emin;
        this.Nmax = Nmax;
        this.Emax = Emax;
    };
    
    /**
     * Return BoundingBox as array of [N,E] points
     * @returns {Array} Array of coordinates
     */
    CoordFinder.BoundingBox.prototype.asLatLngArray = function() {
        // Implementation details...
    };
    
    /**
     * Check if coordinates are within the box
     * @param {CoordFinder.Coord} N - Northern coordinate
     * @param {CoordFinder.Coord} E - Eastern coordinate
     * @returns {boolean} True if coordinates are within the box
     */
    CoordFinder.BoundingBox.prototype.covers = function(N, E) {
        // Implementation details...
    };
    
    /**
     * Check if a point is within the box
     * @param {CoordFinder.Point} p - Point to check
     * @returns {boolean} True if the point is within the box
     */
    CoordFinder.BoundingBox.prototype.coversPoint = function(p) {
        // Implementation details...
    };
    
    // --------------------------------------------------------
    // RefSys - Class for coordinate reference systems
    // --------------------------------------------------------
    
    /**
     * Represents a coordinate reference system
     * 
     * @constructor
     * @param {string} name - System name
     * @param {number} code - EPSG code
     * @param {CoordFinder.CoordUnit} unit - Unit
     * @param {CoordFinder.BoundingBox} boundingBox - Area
     * @param {string} projDef - Proj4 definition
     * @param {string} [description] - Description
     */
    CoordFinder.RefSys = function(name, code, unit, boundingBox, projDef, description) {
        this.name = name;
        this.code = code;
        this.unit = unit;
        this.bounds = boundingBox;
        this.projDef = projDef;
        this.description = description || "";
    };
    
    // Constants for RefSys
    CoordFinder.RefSys.Unknown = new CoordFinder.RefSys(
        "Unknown reference system", 
        0, 
        CoordFinder.CoordUnit.Unknown, 
        new CoordFinder.BoundingBox(0, 0, 0, 0), 
        "", 
        "(Unknown coordinate reference system)"
    );
    
    CoordFinder.RefSys.WGS84 = new CoordFinder.RefSys(
        "WGS84", 
        4326, 
        CoordFinder.CoordUnit.Degrees, 
        new CoordFinder.BoundingBox(-90.0, -180.0, 90.0, 180.0), 
        "+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees",
        "WGS84 is a global coordinate system"
    );
    
    CoordFinder.RefSys.WGS84NorthernEurope = new CoordFinder.RefSys(
        "WGS84 in northern Europe", 
        4326, 
        CoordFinder.CoordUnit.Degrees, 
        new CoordFinder.BoundingBox(49.0, 0.0, 75.0, 32.0), 
        "+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees"
    );
    
    CoordFinder.RefSys.SWEREF99TM = new CoordFinder.RefSys(
        "SWEREF99 TM", 
        3006, 
        CoordFinder.CoordUnit.Meters, 
        new CoordFinder.BoundingBox(6100000, 200000, 7700000, 1000000), 
        "+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"
    );
    
    CoordFinder.RefSys.SWEREF99TM_Extended = new CoordFinder.RefSys(
        "\"almost SWEREF99 TM\"", 
        3006, 
        CoordFinder.CoordUnit.Meters, 
        new CoordFinder.BoundingBox(6000000, 150000, 7800000, 1050000), 
        "+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"
    );
    
    CoordFinder.RefSys.RT90_25gonV = new CoordFinder.RefSys(
        "RT90 2.5 gon V", 
        3021, 
        CoordFinder.CoordUnit.Meters, 
        new CoordFinder.BoundingBox(6100000, 1200000, 7700000, 1900000), 
        "+proj=tmerc +lat_0=0 +lon_0=15.80827777777778 +k=1 +x_0=1500000 +y_0=0 +ellps=bessel +units=m +no_defs"
    );
    
    CoordFinder.RefSys.RT90_25gonV_Extended = new CoordFinder.RefSys(
        "\"almost RT90 2.5 gon V\"", 
        3021, 
        CoordFinder.CoordUnit.Meters, 
        new CoordFinder.BoundingBox(6000000, 1150000, 7800000, 1950000), 
        "+proj=tmerc +lat_0=0 +lon_0=15.80827777777778 +k=1 +x_0=1500000 +y_0=0 +ellps=bessel +units=m +no_defs"
    );
    
    CoordFinder.RefSys.ETRS89 = new CoordFinder.RefSys(
        "ETRS89", 
        4258, 
        CoordFinder.CoordUnit.Degrees, 
        new CoordFinder.BoundingBox(35.0, -10.0, 75.0, 30.0), 
        "+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs"
    );
    
    CoordFinder.RefSys.ETRSLCC = new CoordFinder.RefSys(
        "ETRS-LCC", 
        3034, 
        CoordFinder.CoordUnit.Meters, 
        new CoordFinder.BoundingBox(1500000, 1000000, 7500000, 6500000), 
        "+proj=lcc +lat_1=35 +lat_2=65 +lat_0=52 +lon_0=10 +x_0=4000000 +y_0=2800000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"
    );
    
    CoordFinder.RefSys.ETRSLAEA = new CoordFinder.RefSys(
        "ETRS-LAEA", 
        3035, 
        CoordFinder.CoordUnit.Meters, 
        new CoordFinder.BoundingBox(1000000, 1000000, 7000000, 7000000), 
        "+proj=laea +lat_0=52 +lon_0=10 +x_0=4321000 +y_0=3210000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"
    );
    
    // --------------------------------------------------------
    // STR - Utility methods for text formatting
    // --------------------------------------------------------
    
    CoordFinder.STR = {
        /**
         * Format a float value with proper decimals
         * @param {number} value - Value to format
         * @param {number} decimals - Number of decimals
         * @param {boolean} [localized] - Whether to use localized format (comma)
         * @returns {string} Formatted value
         */
        prettyFloat: function(value, decimals, localized) {
            // Implementation details...
        },
        
        /**
         * Format an integer with proper digits
         * @param {number} value - Value to format
         * @param {number} [digits] - Minimum number of digits
         * @returns {string} Formatted value
         */
        prettyInteger: function(value, digits) {
            // Implementation details...
        }
    };
    
    // --------------------------------------------------------
    // TextParser - For encoding/decoding text
    // --------------------------------------------------------
    
    CoordFinder.TextParser = {
        /**
         * Encode text for internal processing
         * @param {string} text - Text to encode
         * @returns {string} Encoded text
         */
        Encode: function(text) {
            // Implementation details...
        },
        
        /**
         * Decode processed text back to original form
         * @param {string} text - Text to decode
         * @returns {string} Decoded text
         */
        Decode: function(text) {
            // Implementation details...
        }
    };
    
    return CoordFinder;
}));