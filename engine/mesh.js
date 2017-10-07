/* global engine, Geometry, Resource */
"use strict";

(function(context) {

    context.MeshAttributeNames = [
        "position", "color", "texCoord", "normal", "tangent", "bitangent"
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
    context.Mesh = class Mesh extends Resource {
        constructor() {
            super();

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
            } else {
                geometries = geometries.map(function(g) {
                    return new Geometry(g.offset, g.indCount, null)
                });
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

        static parse(data, _sourceUrl) {
            return Mesh.fromOBJ(data);
        }

        static fromOBJ(data) {

            /// Parse the mesh data
            let vertices   = data.match(/v (?:-?\d\.\d+\s){3}/g).join("");
            let textCoords = data.match(/vt (?:\d\.\d+\s){2}/g).join("");
            let normals    = data.match(/vn (?:-?\d\.\d+\s){3}/g).join("");
            let indices    = data.match(/f (?:\d+\/\d+\/\d+\s){3}|(?:usemtl (?:\w+)\s)/g);
            
            // console.log(vertices);
            // console.log(textCoords);
            // console.log(normals);
            // console.log(indices);
            
            indices.splice(0, 1);
            let geometries = [];
            let offset = 0;
            let iCount = 0;
            for(let i = 0; i < indices.length; i++) {
                iCount++;
                if(/usemtl (?:\w+)\s/.test(indices[i])) {
                    geometries.push({ offset: offset, indCount: (iCount - 1) * 3 });
                    indices.splice(i, 1);
                    offset = i;
                    iCount = 0;
                    i--;
                }
            }
            geometries.push({ offset: offset === 0 ? offset : offset + 1, indCount: iCount * 3 });
            indices = indices.join("");
            
            vertices   = vertices.match(/-?\d\.\d*/g).map(parseFloat);
            textCoords = textCoords.match(/\d\.\d*/g).map(parseFloat);
            normals    = normals.match(/-?\d\.\d*/g).map(parseFloat);
            indices    = indices.match(/\d+/g).map(function(num) { return parseInt(num, 10) - 1; });

            let v = [], t = [], n = [], ind = [];
            let ilen = indices.length;
            let count = 0;

            while(count < ilen) {
                ind.push(count / 3);
                v.push(vertices[indices[count] * 3 + 0],
                    vertices[indices[count] * 3 + 1],
                    vertices[indices[count] * 3 + 2]);
                count++;
                t.push(textCoords[indices[count] * 2 + 0],
                    1.0 -  textCoords[indices[count] * 2 + 1]);
                count++;
                n.push(normals[indices[count] * 3 + 0],
                    normals[indices[count] * 3 + 1],
                    normals[indices[count] * 3 + 2]);
                count++;
            }

            let tan = [], bitan = [];
            let vAmount = v.length;
            for(let i = 0; i < vAmount; i+=9) {

                let v1 = [ v[i + 0], v[i + 1], v[i + 2] ];
                let v2 = [ v[i + 3], v[i + 4], v[i + 5] ];
                let v3 = [ v[i + 6], v[i + 7], v[i + 8] ];
                
				let uvi = i / 3 * 2;
				let uv1 = [ t[uvi + 0], t[uvi + 1] ];
				let uv2 = [ t[uvi + 2], t[uvi + 3] ];
				let uv3 = [ t[uvi + 4], t[uvi + 5] ];
				
				let x1 = v2[0] - v1[0];
				let x2 = v3[0] - v1[0];
				let y1 = v2[1] - v1[1];
				let y2 = v3[1] - v1[1];
				let z1 = v2[2] - v1[2];
				let z2 = v3[2] - v1[2];

				let s1 = uv2[0] - uv1[0];
				let s2 = uv3[0] - uv1[0];
				let t1 = uv2[1] - uv1[1];
				let t2 = uv3[1] - uv1[1];

				let r = 1.0 / (s1 * t2 - s2 * t1);
				let sdir = vec3.normalize([(t2 * x1 - t1 * x2) * r, (t2 * y1 - t1 * y2) * r, (t2 * z1 - t1 * z2) * r]);
				let tdir = vec3.normalize([(s1 * x2 - s2 * x1) * r, (s1 * y2 - s2 * y1) * r, (s1 * z2 - s2 * z1) * r]);
                
				tan.push(...sdir, ...sdir, ...sdir);
				bitan.push(...tdir, ...tdir, ...tdir);
				
            }
			
            return Mesh.buildMesh(v, t, n, ind, tan, bitan, geometries);
        }

        /**
         * Horrible copy pasted hack from buildTestMesh()
         *
         * TODO: Handle the vertex buffer creation inside the fromObj method.
         *
         *     There's no point in first copying the positions, normals, texcoords, etc.
         *     into an array and then interleaving them, when you can build an interleaved
         *     vertex data array directly.
         *
         *
         * Oh lord forgive me for I have sinned...
         */ 
        static buildMesh(positions, uvs, normals, indices, tangents, bitangents, geometries) {

            if ((positions.length % 3) != 0) {
                console.log("Vertex attribute lengths not multiply of 3");
                return null;
            }

            let vCount = indices.length;
            let vSize = 14; // sizeof(position) + sizeof(texcoord) + sizeof(normal) + sizeOf(tangent) + sizeOf(bitangent)

            let vBuff = new Float32Array(vCount * vSize);

            for (let i = 0; i < vCount; ++i) {
                let offset = i * vSize;
                
                vBuff[offset + 0] = positions[i * 3 + 0];
                vBuff[offset + 1] = positions[i * 3 + 1];
                vBuff[offset + 2] = positions[i * 3 + 2];

                vBuff[offset + 3] = uvs[i * 2 + 0];
                vBuff[offset + 4] = uvs[i * 2 + 1];

                vBuff[offset + 5] = normals[i * 3 + 0];
                vBuff[offset + 6] = normals[i * 3 + 1];
                vBuff[offset + 7] = normals[i * 3 + 2];

                vBuff[offset + 8] = tangents[i * 3 + 0];
                vBuff[offset + 9] = tangents[i * 3 + 1];
                vBuff[offset + 10] = tangents[i * 3 + 2];

                vBuff[offset + 11] = bitangents[i * 3 + 0];
                vBuff[offset + 12] = bitangents[i * 3 + 1];
                vBuff[offset + 13] = bitangents[i * 3 + 2];
            }

            let iBuff = new Uint16Array(indices);

            let attrs = [
                new context.MeshAttribute("position", 0, 3),
                new context.MeshAttribute("texCoord", 3, 2),
                new context.MeshAttribute("normal", 5, 3),
                new context.MeshAttribute("tangent", 8, 3),
                new context.MeshAttribute("bitangent", 11, 3)
            ];
			
            return Mesh.fromData(vBuff, iBuff, attrs, geometries);
		}

    };
})(this);
