"use strict";


(function(context) {

    context.NormalRenderer = class NormalRenderer extends Renderable {
        
        constructror() {
            this.wasCreated = false;
            this.mesh = null;
            this.material = null;
        }
        
        
        update() {
                console.error("asd");
            if (!wasCreated) {
                model = this.node.getComponent(Model);
                wasCreated = true;
                this.generateMesh(model);
            }
        }
        
        
        generateMesh(model) {
            
            // Position at offset + n, n = 0, 1, 2
            // Normal at offset + n, n = 5, 6, 7
            
            let mesh = model.mesh;
            let vertexData = mesh.vertexData;
            
            let vertexSize = mesh.vertexSize / 4;
            let vertexDataLength = vertexData.length;
            let numVertices = vertexDataLength / vertexSize;
            
            // Find offset of position and normal
            let pOffset = null;
            let nOffset = null;
            for(let i of mesh.attributes) {
                if(i.name === "position") {
                    pOffset = i.offset;
                } else if(i.name === "normal") {
                    nOffset = i.offset;
                }
            }
            
            let lineData = new Float32Array(numVertices * 6); // Original position AND original position + normalized normalvector
            let lc = 0;
            let indices = new Int16Array(numVertices * 2);
            let ic = 0;
            let offsetp, offsetn;
            
            for(let i = 0; i < vertexDataLength; i += vertexSize) {
                offsetp = pOffset;
                lineData[lc++] = vertexData[i + offsetp++];
                lineData[lc++] = vertexData[i + offsetp++];
                lineData[lc++] = vertexData[i + offsetp];
                
                offsetp = pOffset;
                offsetn = nOffset;
                lineData[lc++] = vertexData[i + offsetp++] + vertexData[i + offsetn++];
                lineData[lc++] = vertexData[i + offsetp++] + vertexData[i + offsetn++];
                lineData[lc++] = vertexData[i + offsetp] + vertexData[i + offsetn];
                
                indices[ic] = ic++;
                indices[ic] = ic++;
            }
            
            let gl = engine.gl;
            // Upload the vertices to the gpu
            let vb = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vb);
            gl.bufferData(gl.ARRAY_BUFFER, lineData, gl.STATIC_DRAW);

            // Upload the indices to the gpu
            let ib = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
            
            let nmesh = new Mesh();
            
            nmesh.vertexData = lineData;
            nmesh.indexType = gl.UNSIGNED_SHORT;
            nmesh.indexBuffer = ib;
            nmesh.vertexBuffer = vb;
            nmesh.vertexSize = 3 * 4;
            nmesh.attributes = [ new MeshAttribute("position", 0, 3) ];
            nmesh.indexCount = indices.length;
            nmesh.geometries = [ new Geometry(0, indices.length, null) ];
            nmesh.geometries[0].mesh = nmesh;
            
            this.mesh = nmesh;
            console.log(nmesh);
            
        }
        
        
        getDrawBatches() {
            
        }
        
        getRenderMaterials() {
            return [ this.material ];
        }
        
        getRenderGeometries() {
            if(this.mesh)
                return this.mesh.geometries;
        }
        
    }
    
})(this);
/*
let myModelNode = scene.addChild();

myModelNode.createComponent(Model);
myModelNode.createComponent(NormalRenderer);


myModelNode.removeComponent(NormalRenderer);
*/