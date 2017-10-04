/* exported Component */

"use strict";

class Component {

    constructor() {
        this.id = 0;
    }

    serializeJSON(serializer) {
        let obj = {
            id: this.id,
            type: this.constructor.name,
            properties: this._getSerializedProperties(serializer),
        };

        return obj;
    }

    _getSerializedProperties(serializer) {
        if (!this.serialize) {
            return {};
        }

        let typename = this.constructor.name;

        try {
            return this.serialize(serializer);
        }
        catch(e) {
            console.log("Can't serialize " + typename);
            console.log(e);
        }

        return {};
    }
}
