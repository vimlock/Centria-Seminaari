"use strict";

(function(context) {

    context.Quaternion = class
    {
        constructor(w, x, y, z) {
            this.w = w;
            this.x = x;
            this.y = y;
            this.z = z;
        }

        toArray() {
            return [ this.w, this.x, this.y, this.z ];
        }

        toMat4() {
            // TODO
        }

        static fromArray(a) {
            return new Quaternion(a[0], a[1], a[2], a[3]);
        }

        static fromEulers(x, y, z) {
            // TODO
        }

        static get identity() {
            return new Quaternion(1.0, 0.0, 0.0, 0.0);
        }
    }
})(this);
