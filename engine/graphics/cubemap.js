/* global engine, Resource */
/* exported CubeMap */

"use strict";

(function(context) {

    function makeCheckerTexture(color1, color2, resolution, checkerSize=4) {
        let col1Pixels = color1.toHex();
        let col2Pixels = color2.toHex();

        let pixels = new Uint8Array(resolution * resolution * 4);

        for (let i = 0; i < resolution; ++i) {
            for (let k = 0; k < resolution; ++k) {

                let offset = i * resolution + k;

                let x = Math.round(i / checkerSize);
                let y = Math.round(k / checkerSize);

                let c = (x + y) % 2 === 0 ? col1Pixels : col2Pixels;

                for (let n = 0; n < 4; ++n) {
                    pixels[offset * 4 + n] = c[n];
                }
            }
        }

        return pixels;
    }

    class CubeMap extends Resource {
        constructor(glTexture, resolution) {
            super();

            this._glTexture = glTexture;
            this._glContext = engine.gl;
            this._resolution = resolution;
        }

        static parse(_data, _sourceUrl) {
            throw new Error("Not implemented");
        }

        /**
         * Creates a new empty cubemap
         *
         * @param resolution {number} Width and heigth of the cubemap faces.
         * @returns {CubeMap}
         */
        static create(resolution) {
            let gl = engine.gl;

            let t = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, t);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

            for (let i = 0; i < 6; ++i) {
                gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGBA, 
                    resolution, resolution, 0, gl.RGBA, gl.UNSIGNED_BYTE, null
                ); 
            }

            return new CubeMap(t, resolution);
        }

        static createFromPixels(resolution, pixels) {
            let gl = engine.gl;

            let t = gl.createTexture();

            gl.bindTexture(gl.TEXTURE_CUBE_MAP, t);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

            for (let i = 0; i < 6; ++i) {
                gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGBA, 
                    resolution, resolution, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels
                ); 
            }

            return new CubeMap(t, resolution);
        }
    }

    context.CubeMap = CubeMap;
    context.makeCheckerTexture = makeCheckerTexture;

})(this);
