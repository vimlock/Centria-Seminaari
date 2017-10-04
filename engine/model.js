/* global Component, Mesh, Serialize */
"use strict";

(function (context) {
    /**
     * Model component.
     */
    context.Model = class Model extends Component {

        constructor()  {
            super();

            /// Mesh to use for rendering.
            this.mesh = null;

            /// Material to use for meshes geometries.
            /// Material 0 will be used for geometry 0, material 1 for geometry 1, and so forth.
            /// 
            /// If the material is missing, renderers default material will be used.
            this.materials = [];
        }

        /**
         * Shorthand for this.materials[0];
         */
        get material() {
            if (this.materials.length > 0)
                return this.materials[0];
            else
                return null;
        }

        /**
         * Shorthand for this.materials[0] = value;
         */
        set material(value) {
            this.materials[0] = value;
        }

        /**
         * Safely gets a material by given index.
         *
         * If the index does not exist, null is returned.
         */
        getMaterial(index) {
            if (index < this.materials.length) {
                return this.materials[index];
            }
            else {
                return null;
            }
        }

        serialize() {
            return {
                mesh: Serialize.resource(this.mesh),
                materials: Serialize.resourceArray(this.materials),
            };
        }

        deserialize(s) {
            this.mesh = s.resource(Mesh);
            this.materials =  s.resourceArray(Mesh);
        }
    };

})(this);
