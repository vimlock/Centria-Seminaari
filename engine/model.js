"use strict";

(function (context) {
    /**
     * Model component.
     */
    context.Model = function() {

        /// Mesh to use for rendering.
        this.mesh = null;

        /// Material to use for meshes geometries.
        /// Material 0 will be used for geometry 0, material 1 for geometry 1, and so forth.
        /// 
        /// If the material is missing, renderers default material will be used.
        this.materials = [];
    };
})(this);
