"use strict";

(function(context) {

    context.MeshAttributeNames = [
        "position", "color", "texCoord", "normal", "tangent"
    ];

    context.MeshAttribute = function() {

        // One of MeshAttributeNames defined above.
        this.name = null;

        // Offset, in bytes, inside the vertex buffer.
        this.offset = 0;

        // How many components this attribute has?
        // Position, normal, and tangent should always have 3.
        // Color might have 1-4.
        // TexCoord should have 2
        this.size = 0;
    };

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
