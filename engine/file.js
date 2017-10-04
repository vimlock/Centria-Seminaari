/* exported TextFile, JSONFile */
/* global Resource */

"use strict";

/**
 * Contains the contents of a text file.
 */
class TextFile extends Resource {
    constructor(contents) {
        super();

        this.contents = contents;
    }

    static parse(data, _sourceUrl) {
        return new TextFile(data);
    }
}

/**
 * Almost same as TextFile but the contents are a parsed JSON object
 * from the contents of the file.
 */
class JSONFile extends Resource {
    constructor(contents) {
        super();

        this.contents = contents;
    }

    static parse(data, _sourceUrl) {
        return new JSONFile(JSON.parse(data));
    }
}
