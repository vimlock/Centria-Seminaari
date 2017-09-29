"use strict";

(function (context) {
    /**
     * Model component.
     */
    context.Model = class Model {

        constructor()  {
            /// Mesh to use for rendering.
            this.mesh = null;

            /// Material to use for meshes geometries.
            /// Material 0 will be used for geometry 0, material 1 for geometry 1, and so forth.
            /// 
            /// If the material is missing, renderers default material will be used.
            this.materials = [];
        }

        get material() {
            if (this.materials.length > 0)
                return this.materials[0];
            else
                return null;
        }

        set material(value) {
            this.materials[0] = value;
        }

        getMaterial(index) {
            if (index < this.materials.length) {
                return this.materials[index];
            }
            else {
                return null;
            }
        }
    };
})(this);
