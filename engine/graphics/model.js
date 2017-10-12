/* global Renderable, Mesh, Material */
"use strict";

(function (context) {
    /**
     * Model component.
     */
    context.Model = class Model extends Renderable {

        constructor()  {
            super();

            /// Mesh to use for rendering.
            this.mesh = null;
            this.meshName = null;

            /// Material to use for meshes geometries.
            /// Material 0 will be used for geometry 0, material 1 for geometry 1, and so forth.
            /// 
            /// If the material is missing, renderers default material will be used.
            this.materials = [];
            this.materialNames = [];
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

        get materialName() {
            return this.materialNames.length > 0 ? this.materialNames[0] : null;
        }

        set materialName(value) {
            this.materialNames[0] = value;
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

        getRenderGeometries() {
            return this.mesh ? this.mesh.geometries : null;
        }

        getRenderMaterials() {
            return this.materials;
        }

        serialize(serializer) {
            return {
                mesh: serializer.resourceRef(Mesh, this.meshName),
                materials: serializer.resourceRefArray(Material, this.materialNames),
            };
        }

        deserialize(deserializer, src) {
            this.mesh = deserializer.resourceRef(Mesh, src.mesh);
            this.meshName = deserializer.resourceRefName(src.mesh);

            this.materials = deserializer.resourceRefArray(Material, src.materials);
            this.materialNames = deserializer.resourceRefArrayNames(src.materials);
        }
    };

})(this);
