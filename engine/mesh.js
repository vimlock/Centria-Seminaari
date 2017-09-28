"use strict";

(function(context) {

    context.MeshAttributeNames = [
        "position", "color", "texCoord", "normal", "tangent"
    ];

    /**
     * Descibes contents of a vertex buffer.
     */
    context.MeshAttribute = function() {

        // One of MeshAttributeNames defined above.
        //
        // Used to determine what is the role of this attribute and
        // to which index to bind it.
        this.name = null;

        // Offset, in bytes, inside the vertex buffer.
        this.offset = 0;

        // How many components this attribute has?
        //
        // Position, normal, and tangent should always have 3.
        // Color might have 1-4.
        // TexCoord should have 2
        this.size = 0;
    };

    /**
     * Collection of vertices and indices uploaded to the GPU.
     */
    context.Mesh = class {
        constructor() {
            this.indexBuffer = null;
            this.vertexBuffer = null;

            // Describes the contents of the vertex buffer
            this.attributes = [];

            this.vertexCount = 0;
            this.indexCount = 0;

            this.geometries = [];
        }

        /**
         * Utility function to get a MeshAttribute from a Mesh.
         *
         * Returns null if Mesh does not have that attribute.
         */
        getMeshAttribute(name) {
            for (let attr of this.attributes) {
                if (attr.name === name) {
                    return attr;
                }
            }

            return null;
        }
    };
})(this);
