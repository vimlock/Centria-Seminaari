"use strict";

(function (context) {

    context.ShaderSource = class {
        constructor(name, source) {
            this.name = name;
            this.source = source;
        }
    };

    context.buildShaderKey = function(name, defines) {
        let defineStrs = [];

        defines.forEach(function(val, key) {
            if (val === null) {
                defineStrs.push(key);
            }
            else {
                defineStrs.push(key + "=" + val);
            }
        });

        return name + "(" + defineStrs.join(";") + ")";
    };

    /**
     * HOX! Do not modify any of these values except lastUse, after the shader has been cached.
     * it will break the cache system.
     */
    context.ShaderProgram = class {
        constructor() {
            this.source = null;
            this.program = null;

            this.defines = new Map();
            this.key = null;

            // Time since last use, used to remove unneeded shaders
            this.lastUse = -1.0;
        }

        /**
         * Should be called after defines or name is modified
         */
        updateKey() {
            this.key = context.buildShaderKey(this.source.name, this.defines);
        }
    };

})(this);
