/* global engine, Geometry, buildTestMesh */
"use strict";

(function(context) {

    context.MeshAttributeNames = [
        "position", "color", "texCoord", "normal", "tangent"
    ];

    /**
     * Descibes contents of a vertex buffer.
     */
    context.MeshAttribute = function(name, offset, size) {

        // One of MeshAttributeNames defined above.
        //
        // Used to determine what is the role of this attribute and
        // to which index to bind it.
        this.name = name;

        // Offset, in components, inside the vertex buffer.
        this.offset = offset;

        // How many components this attribute has?
        //
        // Position, normal, and tangent should always have 3.
        // Color might have 1-4.
        // TexCoord should have 2
        this.size = size;
    };


    /**
     * Collection of vertices and indices uploaded to the GPU.
     */
    context.Mesh = class Mesh {
        constructor() {
            this.indexBuffer = null;
            this.vertexBuffer = null;

            // Describes the contents of the vertex buffer
            this.attributes = [];
            this.vertexSize = 0;

            this.indexCount = 0;
            this.indexType = null;

            this.geometries = [];
        }

        /**
         * Construct a new Mesh from given data.
         *
         * @param vertices {Array|Float32Array} Interleaved vertex data.
         * @param indices {Array|Uint16Array} Indices, must be 16-bit.
         * @param attributes {Array.<MeshAttribute>} Vertex data attributes.
         * @param geometries {Array.<Geometry>|undefined} Geometries of the mesh, if omitted
         *                   single geometry is created which uses all of the indices.
         *
         *  @returns {Mesh}
         */
        static fromData(vertices, indices, attributes, geometries) {

            // Check that the mesh attributes are sensible.
            // TODO: check that the component count is sensible
            // TODO: check that components dont overlap eachother
            if (!Mesh.getMeshAttrByName(attributes, "position")) {
                console.log("no positon defined in the mesh attributes");
                return null;
            }

            //Construct a single geometry if the caller omitted the geometries.
            if (!geometries || geometries.length == 0) {
                geometries = [
                    new Geometry(0, indices.length, null)
                ];
            }

            let gl = engine.gl;

            // Upload the vertices to the gpu
            let vb = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vb);
            gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

            // Upload the indices to the gpu
            let ib = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

            let mesh = new Mesh();

            mesh.indexType = gl.UNSIGNED_SHORT;
            mesh.indexBuffer = ib;
            mesh.vertexBuffer = vb;
            mesh.vertexSize = Mesh.calculateVertexSize(attributes);
            mesh.attributes = attributes;
            mesh.indexCount = indices.length;
            mesh.geometries = geometries;

            for (let g of mesh.geometries) {
                g.mesh = mesh;
            }

            return mesh;
        }

        /**
         * Utility function to get a MeshAttribute by name
         * Returns null if Mesh does not have that attribute.
         *
         * @param attrs {Array.<MeshAttribute>} Attributes to seek from.
         * @param name {string} name to search for.
         *
         * @returns {MeshAttribute|null}
         */
        static getMeshAttrByName(attrs, name) {
            for (let attr of attrs) {
                if (attr.name === name) {
                    return attr;
                }
            }

            return null;
        }

        /**
         * Utility function calculate the size of a single vertex from a mesh attribute list.
         *
         * @param attrs {Array.<MeshAttribute> The Mesh attributes to search from.
         *
         */
        static calculateVertexSize(attrs) {
            return attrs.reduce(function(acc, attr) {
                return acc + attr.size * 4;
            }, 0);
        }

        static parse(data, sourceUrl) {
            return Mesh.fromOBJ(data, sourceUrl);
        }

        static fromOBJ(data, sourceUrl) {

            /// Parse the mesh data
            let vertices   = data.slice(data.indexOf('v '),  data.indexOf('vt '));
            let textCoords = data.slice(data.indexOf('vt '), data.indexOf('vn '));
            let normals    = data.slice(data.indexOf('vn '), data.indexOf('f '));
            let indices    = data.slice(data.indexOf('f '),  data.length);
            
            vertices   = vertices.match(/-?\d\.\d*/g).map(parseFloat);
            textCoords = textCoords.match(/\d\.\d*/g).map(parseFloat);
            normals    = normals.match(/-?\d\.\d*/g).map(parseFloat);
            indices    = indices.match(/\d+/g).map(function(num) { return parseInt(num, 10) - 1 });
            
            
            /** HOX: Temporarily fill textCoords with color */
            /** Remove the next 4 lines to use texture coordinates normally */
            let len = textCoords.length / 2;
            textCoords.length = 0;
            while(len--)
                textCoords.push(...[ 0.0, 1.0, 0.0 ]);
            
            
            let v = [], c = [], n = [], ind = [];
            let ilen = indices.length;
            let count = 0;

            while(count < ilen) {
                ind.push(count / 3);
                v.push(vertices[indices[count] * 3 + 0],
                       vertices[indices[count] * 3 + 1],
                       vertices[indices[count] * 3 + 2]);
                count++;
                c.push(textCoords[indices[count] * 3 + 0],
                       textCoords[indices[count] * 3 + 1],
                       textCoords[indices[count] * 3 + 2]);
                count++;
                n.push(normals[indices[count] * 3 + 0],
                       normals[indices[count] * 3 + 1],
                       normals[indices[count] * 3 + 2]);
                count++;
            }
            
            return buildTestMesh(v, c, n, ind);
        }

        static fromJSON(data, sourceUrl) {
        }

    };
})(this);
