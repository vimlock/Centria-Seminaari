"use strict";

(function (context) {

    /**
     * Represents a material slot in a mesh.
     * During rendering, every piece of geometry is rendered seperately.
     */
    context.Geometry = function(offset, count, mesh) {

        /// First index to render in the meshes indices
        this.indexOffset = offset;

        /// How many indices to render
        this.indexCount = count; 

        /// Mesh to which this geometry belongs to
        this.mesh = mesh;
    };
})(this);
