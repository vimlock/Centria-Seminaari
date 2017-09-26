
(function() {

    function decToHexPadded(dec)
    {
        let tmp = dec.toString(16);
        return tmp.length < 2 ? '0' + tmp : tmp;
    }

    this.Color = class
    {
        constructor(r, g, b, a)
        {
            this.r = r;
            this.g = g;
            this.b = b;
            this.a = a;
        }

        static fromArray(a) {
            return new Color(a[0], a[1], a[2], a[3]);
        }

        toArray() {
            return [this.r, this.g, this.b, this.a ];
        }

        toHex() {
            return [this.r * 255, this.g * 255, this.b * 255, this.a * 255];
        }

        toHexString() {
            return this.toHex().map(decToHexPadded).join("");
        }

        static get black() {
            return new Color(0.0, 0.0, 0.0, 1.0);
        }

        static get white() {
            return new Color(1.0, 1.0, 1.0, 1.0)
        }

        static get red() {
            return new Color(1.0, 0.0, 0.0, 1.0);
        }

        static get green() {
            return new Color(0.0, 1.0, 0.0, 1.0);
        }

        static get blue() {
            return new Color(0.0, 0.0, 1.0, 1.0);
        }

        static get yellow() {
            return new Color(1.0, 1.0, 0.0, 1.0);
        }

        static get cyan() {
            return new Color(0.0, 1.0, 1.0, 1.0);
        }

        static get magenta() {
            return new Color(1.0, 0.0, 1.0, 1.0);
        }
    }
})();
