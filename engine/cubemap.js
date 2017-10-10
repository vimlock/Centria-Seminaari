/* global engine, Resource */
/* exported CubeMap */

"use strict";

(function(context) {
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

        static fromTextures(textures) {
            let gl = engine.gl;

            if (textures.length !== 6) {
                console.log("Invalid cubemap texture count");
                return null;
            }

            let t = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, t);

            for (let i = 0; i < 6; ++i) {
                gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGB, gl.UNSIGNED_BYTE, textures[i]);
            }

            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

            return new CubeMap(t, textures);
        }
    }

    context.CubeMap = CubeMap;
})(this);
