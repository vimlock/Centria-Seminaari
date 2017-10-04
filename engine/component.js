/* exported Component */

"use strict";

class Component {

    constructor() {
        this.id = 0;
    }

    serializeJSON() {
        let obj = {
            id: this.id,
            type: this.constructor.name,
            properties: this._getSerializedProperties(),
        };

        return obj;
    }

    _getSerializedProperties() {
        if (!this.serialize) {
            return {};
        }

        let typename = this.constructor.name;

        try {
            return this.serialize();
        }
        catch(e) {
            console.log("Can't serialize " + typename);
            console.log(e);
        }

        return {};
    }
}
