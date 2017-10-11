/* global Color, Resource */
"use strict";

(function(context) {
    context.Material = class Material extends Resource {
        constructor() {
            super();

            /// Tint of the diffuse color.
            this.diffuseColor = Color.white;

            /// Tint of the specular color.
            /// HOX! The alpha value will be used as the specular hardness.
            this.specularColor = Color.white;

            /// Used to control rendering order.
            /// Transparent materials are rendered after opaque geometry.
            this.opaque = true;

            /// Which faces to cull during rendering
            this.cullFaces = true;

            /// Should this material use Z rejection?
            this.depthTest = true;

            /// Should this material write to Z buffer?
            this.depthWrite = true;

            /// How this material should be blended?
            this.blendMode = "replace"; // add/alpha/multiply/replace

            /// Should the renderer be allowed use instancing when rendering?
            this.allowInstancing = true;

            /// Should the material receive reflections from environment?
            this.allowReflections = true;

            /// Which shader to use?
            this.shader = null;
            this.drawType = "triangles"; // points|triangles

            /// Texture mapping.
            this.textures = new Map();

            /// Custom uniforms to use.
            /// Possible values are
            //
            /// float number
            /// vec2 [number, number]
            /// vec3 [number, number, number]
            /// vec4 [number, number, number, number]
            this.shaderUniforms = new Map();

            /// List of shader defines to pass for shader
            /// You should not access this directly.
            this.defines = new Map();
        }

        /**
         * Enables a preprocessing directive for the shader
         *
         * Note that you should not set builtin defines like INSTANCING.
         *
         * @param name {string} Name of the define.
         * @param value {string|null} Optional value to map the define as.
         */
        enableDefine(name, value=null) {
            this.defines.set(name, value);
        }

        /**
         * Disables a preprocessing directive for the shader.
         * Note that this won't disable builtin defines like INSTANCING.
         */
        disableDefine(name) {
            this.defines.delete(name);
        }

        /**
         * Utility function to enable an array  of defines.
         * Downside is the defines cant have values.
         *
         * @param names {Array.<string>} Array of defines to enable.
         */
        enableDefines(names) {
            for (let name of names) {
                this.enableDefine(name);
            }
        }

        /**
         * Utility function to disable an array of defines.
         *
         * @param names {Array.<string>} Array of defines to disable.
         */
        disableDefines(names) {
            for (let name of names) {
                this.disableDefine(name);
            }
        }
    };

})(this);
