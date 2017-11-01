/* global buildShaderKey, Color, EnvironmentMap, Light, Material, Renderable, ShaderProgram, mat4, vec3 */
/* global CubeMap, makeCheckerTexture */
"use strict";

(function(context) {

    const MAX_LIGHTS = 4;

    /// If batch size does not exceed this limit, non-instanced draw calls will be used.
    /// This is because instancing has some overhead to it.
    const MIN_INSTANCES_PER_BATCH = 5;

    /// How many instances can be drawn in a single instanced draw call.
    const MAX_INSTANCES_PER_BATCH = 256;

    const SHADER_VERSION = "#version 300 es";

    /// Custom code that is prepended to every shader.
    /// Not used by anything right now, but could be usefull.
    const SHADER_PREAMBLE = "";

    /**
     * Converts a draw type string into appropriate WebGL draw type enum.
     *
     * If invalid string is given, gl.TRIANGLES is returned.
     */
    function GetDrawType(gl, material) {
        switch (material.drawType) {
        case "points":
            return gl.POINTS;
        case "lines":
            return gl.LINES;
        case "wireframe":
        default:
            return gl.TRIANGLES;
        }
    }

    function GetTextureSlotIndex(name) {
        switch (name) {
        case "diffuseMap":  return 0;
        case "specularMap": return 1;
        case "normalMap":   return 2;
        case "heightMap":   return 3;
        case "ambientMap":  return 4;
        case "emissionMap": return 5;
        case "environmentMap": return 6;
        default:
            return null;
        }
    }

    function GetTextureSlotEnum(gl, index) {
        // TODO: Can we just gl.TEXTURE0 + index? Might be undefined behaviour.
        switch(index) {
        case 0: return gl.TEXTURE0;
        case 1: return gl.TEXTURE1;
        case 2: return gl.TEXTURE2;
        case 3: return gl.TEXTURE3;
        case 4: return gl.TEXTURE4;
        case 5: return gl.TEXTURE5;
        case 6: return gl.TEXTURE6;
        case 7: return gl.TEXTURE7;
        }
    }


    /**
     * Holds the geometries which are collected from the scene
     * during rendering.
     */
    function GeometryBatch(geometry, envMap, material) {
        this.geometry = geometry;
        this.envMap = envMap;
        this.material = material;
        this.transforms = [];
    }

    /**
     * Holds the collected lights which are collected from the
     * scene during rendering.
     */
    function LightBatch(transform, light) {
        this.transform = transform;
        this.light = light;
        this.priority = -1.0;
    }

    /**
     * High-level rendering system.
     */
    context.Renderer = class {

        constructor(glContext) {
            /// The material we'll use if none is assigned to a model
            this.defaultMaterial = new Material();

            /// Accumulated rendering statistics
            this.performance = {};

            this.resetPerformance();

            /// WebGL rendering context
            this.glContext = glContext;

            this.shaderCache = new Map();

            this.activeMaterial = null;
            this.activeMesh = null;
            this.activeShader = null;

            this.defaultCubeMap = CubeMap.createFromPixels(64, makeCheckerTexture(Color.cyan, Color.black, 64));

            this.enableInstancing = true;
            this.enableReflections = true;

            if (this.enableInstancing) {
                this._createInstancingBuffer();
            }
        }

        /**
         * Draws a scene to the default viewport
         *
         * If shaderOverride is defined, it will used instead of the
         * materials own shader.
         *
         * @param scene {Scene} The Scene to use for rendering .
         * @param renderView {RenderView} The window into the scene.
         * @param shaderOverride {ShaderSource} Shader to override materials own shader with.
         */
        renderScene(scene, renderView, shaderOverride) {
            // Prepare scene for rendering
            
            let lights = [];
            
            // Opaque and transparent materials should be kept separate
            // for correct alpha blending and depth sorting.
            let opaqueGeomBatches = [];
            let transparentGeomBatches = [];

            let environmentMaps;

            // Look up the environment maps
            //
            // We need to do this before picking up the geometries
            // because environment maps are assigned during the scene
            // traversal below.
            if (this.enableReflections) {
                environmentMaps = scene.getAllComponents(EnvironmentMap);
            }
            else {
                environmentMaps = [];
            }

            // Traverse trought the scene and pick up Lights and Renderables
            let renderer = this;
            scene.walkEnabled(function(node) {
                for (let comp of node.components) {
                    if (comp instanceof Light) {
                        renderer._queueLight(lights, comp, node.worldTransform);
                    }

                    if (comp instanceof Renderable) {
                        renderer._queueRenderable(opaqueGeomBatches, transparentGeomBatches,
                            environmentMaps, comp);
                    }
                }
            });

            // Calculate light priorities for culling
            let camPosition = renderView.position;

            for (let l of lights) {
                l.priority = vec3.distanceSquared(mat4.getTranslation(l.transform), camPosition) * l.intensity;
            }

            this._cullLights(lights, MAX_LIGHTS);

            let gl = this.glContext;

            gl.clearColor( ...scene.background.toArray());
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            // TODO: Cull batches by bounding box or some other volume

            // TODO: Sort opaque batches front-to-back
            // TODO: Sort transparent batches back-to-front
            
            this.performance.numLights += lights.length;
            
            this._renderPass(scene, renderView, lights, opaqueGeomBatches, shaderOverride);
            this._renderPass(scene, renderView, lights, transparentGeomBatches, shaderOverride);
        }

        renderDebugLines(renderView, debugRenderer) {

            if (debugRenderer._nextVertexIndex <= 0) {
                return;
            }

            // Setup drawing state
            let shader = this._getShaderProgram(debugRenderer._shader);
            if (!shader) {
                return;
            }

            this._bindShader(shader);
            if (!this.activeShader) {
                return;
            }


            debugRenderer.updateBuffers();

            this._bindRenderView(renderView);

            let gl = this.glContext;

            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.enable(gl.BLEND);
            gl.enable(gl.DEPTH_TEST);
            gl.disable(gl.CULL_FACE);
            gl.depthMask(false);

            gl.bindBuffer(gl.ARRAY_BUFFER, debugRenderer._vbo);
            gl.vertexAttribPointer(0, 3, gl.FLOAT, false, debugRenderer._vertexSize * 4, 0);
            gl.vertexAttribPointer(1, 4, gl.FLOAT, false, debugRenderer._vertexSize * 4, 3 * 4);

            // Draw faces
            if (debugRenderer._nextFaceIndex > 0) {
                gl.uniform4f(shader.uniformLocations["debugTint"], 1.0, 1.0, 1.0, 0.05);

                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, debugRenderer._faceIb);
                gl.drawElements(gl.TRIANGLES, debugRenderer._nextFaceIndex, gl.UNSIGNED_SHORT, 0);
            }
            
            // Draw lines
            if (debugRenderer._nextLineIndex > 0) {
                gl.uniform4f(shader.uniformLocations["debugTint"], 1.0, 1.0, 1.0, 1.0);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, debugRenderer._lineIb);
                gl.drawElements(gl.LINES, debugRenderer._nextLineIndex, gl.UNSIGNED_SHORT, 0);
            }
        }

        /**
         * Renders a scene to a cubemap
         *
         * @param cubemap {CubeMap} 
         * @param scene {Scene}
         * @param views {Array.<RenderView> views to use for rendering.
         *     Should be ordered as +x, -x, +y, -y, +z, -z
         */
        renderCubeMap(cubemap, scene, views) {
            if (!cubemap) {
                console.log("Can't render cubemap without target");
                return;
            }

            if (!views || views.length !== 6) {
                console.log("Can't render cubemap without 6 views");
                return;
            }

            let gl = this.glContext;

            let fb = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

            let rb = gl.createRenderbuffer();
            gl.bindRenderbuffer(gl.RENDERBUFFER, rb);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, cubemap._resolution, cubemap._resolution );

            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rb);

            gl.viewport(0, 0, cubemap._resolution, cubemap._resolution);

            for (let i = 0; i < 6; ++i) {
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubemap._glTexture);
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, cubemap._glTexture, 0);

                this.renderScene(scene, views[i]);
                console.log("Render cubemap face " + i);
            }

            gl.bindRenderbuffer(gl.RENDERBUFFER, null);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);

            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        }

        /**
         * Queues all geometries from a renderable for rendering.
         *
         * @param opaque Batches to use if material is opaque.
         * @param transparent Batches to use if material is transparent.
         * @param envMaps Array of environment maps.
         * @param renderable The renderable to queue.
         */
        _queueRenderable(opaque, transparent, envMaps, renderable) {

            let materials = renderable.getRenderMaterials();
            let geometries = renderable.getRenderGeometries();

            if (!materials || !geometries)
                return;

            this.performance.numModels++;

            let envMap = null;
            if (this.enableReflections) {

                // Use static environment map if available, otherwise pick the closest one.
                if (renderable.staticEnvironmentMap) {
                    envMap = renderable.environmentMap;
                }
                else {
                    let pos = renderable.node.worldPosition;
                    let best = null;

                    for (let i of envMaps) {
                        let dist = vec3.lengthSquared(pos, i.node.worldPosition);

                        if (envMap === null || dist < best) {
                            envMap = i;
                            best = dist;
                        }
                    }
                }
            }

            let worldTransform = renderable.node.worldTransform; 

            for (let i = 0; i < geometries.length; ++i) {
                let geom = geometries[i];
                let mat = materials[i] || this.defaultMaterial;

                if (!geom || !mat) {
                    continue;
                }

                if (mat.opaque) {
                    this._queueGeometry(opaque, envMap, geom, mat, worldTransform);
                }
                else {
                    this._queueGeometry(transparent, envMap, geom, mat, worldTransform);
                }
            }
        }

        /**
         * Add a geometry to a batch.
         *
         * If a batch with the same material-geometry combination does not exist,
         * it will be created.
         */
        _queueGeometry(batches, envMap, geometry, material, transform) {

            let batch = null;

            // Find an existing batch for the geometry and material.
            //
            // This could be a bit slow with large scenes, O(n).
            // But it's not the bottleneck right now.
            for (let i of batches) {
                if (i.geometry === geometry && i.material === material && i.envMap === envMap) {
                    batch = i;
                    break;
                }
            }

            // If no batch exists, create a new one.
            if (batch === null) {
                batch = new GeometryBatch(geometry, envMap, material);
                batches.push(batch);
            }

            // Add the geometry to the batch
            batch.transforms.push(transform);
        }

        /**
         * Add light to a batch
         */
        _queueLight(batches, light, transform) {
            batches.push(new LightBatch(transform, light));
        }

        /**
         * Limits the number of batches to maxBatches.
         *
         * @param lightBatches {Array.<Light>} The Lights which are to be culled.
         * @param maxLights Light limit.
         */
        _cullLights(lights, maxLights) {

            // Some sanity checking, shaders wont supports any more than this
            if (maxLights > 8)
                maxLights = 8;

            // Do we have to do anything?
            if (lights.length < maxLights) {
                return;
            }

            lights.sort(function(a, b) {
                return a.priority - b.priority;
            });

            lights.length = maxLights;
        }

        /**
         * Renders given geometries to the default viewport using the
         * given lights and renderView.
         *
         * If shaderOverride is defined, it will used instead of the
         * materials own shader.
         *
         * @param scene {Scene} Scene to render.
         * @param renderView {RenderView} RenderView to use
         * @param lights {Array.<LightBatch> Lights to use
         * @param batches {Array.<GeometryBatch> Geometries to use.
         * @param shaderOverride {ShaderSource} Shader to override materials own shader with.
         */
        _renderPass(scene, renderView, lights, batches, _shaderOverride) {
            // TODO: pick the closest and most brighest lights and upload them as uniforms

            // TODO: Maybe add instancing support? Might be out of scope
            // TODO: Sort the batches by material before rendering
            
            this.activeMaterial = null;
            this.activeShader = null;
            this.activeMesh = null;
            
            let gl = this.glContext;

            gl.enable(gl.DEPTH_TEST);
            gl.enable(gl.CULL_FACE);
            gl.enable(gl.DITHER);

            gl.depthMask(true);
            gl.frontFace(gl.CW);

            this.performance.batches += batches.length;
            
            for (let batch of batches) {
                
                let geo = batch.geometry;
                let mesh = batch.geometry.mesh;
                let mat = batch.material;
                let env = batch.envMap;

                let drawType = GetDrawType(gl, mat);

                if (!mat) {
                    console.log("batch without material");
                    continue;
                }

                if (!geo) {
                    console.log("batch without geometry");
                    continue;
                }

                let instanced = this.enableInstancing && mat.allowInstancing
                     && batch.transforms.length > MIN_INSTANCES_PER_BATCH;

                // Add instancing define for the shader if we're using instancing.
                if (instanced) {
                    this._bindMaterial(mat, new Map([...mat.defines, ["INSTANCING", null]]));
                }
                else {
                    this._bindMaterial(mat, mat.defines);
                }

                // If the material binding failed we can't render.
                //
                // Only way the material binding can fails it that if the materials
                // shader failed to compile, or does not exist. In this case we don't have
                // an active shader.
                if (!this.activeShader) {
                    continue;
                }

                this._bindMesh(mesh);
                this._bindRenderView(renderView);
                this._bindScene(scene);
                this._bindLights(lights);

                // Did the mesh fail to bind?
                if (!this.activeMesh)
                    continue;

                // Some sanity checking, the WebGL driver might do this on its own
                // but never hurts to be sure.
                if (this.activeMesh.indexCount < geo.indexOffset + geo.indexCount) {
                    console.log("Geometry indices out of range");
                    console.log(mesh);
                    console.log(geo);
                    debugger;
                }

                this.performance.vertices += geo.indexCount * batch.transforms.length;

                // Bind environment maps for reflections
                if (env) {
                    this._bindCubeMap("environmentMap", env.cubemap);
                }

                if (instanced) {
                    this._drawInstanced(drawType, batch, geo.indexCount, mesh.indexType, geo.indexOffset);
                }
                else {
                    this._drawIndividual(drawType, batch, geo.indexCount, mesh.indexType, geo.indexOffset);
                }

                // For some reason, this reaaally stalls the rendering, uncomment for debugging
                // purposes only.

                /*
                let err = gl.getError();
                if (err) {

                    let errstr = ({
                        [gl.INVALID_ENUM]: "Invalid enum",
                        [gl.INVALID_VALUE]: "Invalid value",
                        [gl.INVALID_OPERATION]: "Invalid operation",
                        [gl.INVALID_FRAMEBUFFER_OPERATION]: "Invalid framebuffer operation",
                        [gl.OUT_OF_MEMORY]: "Out of memory",
                        [gl.CONTEXT_LOST_WEBGL]: "Context lost"
                    })[err];

                    console.log("Error rendering geometry " + errstr);
                    console.log(mesh);
                    console.log(geo);
                    debugger;
                }
                */
            }
        }

        /**
         * Renders a batch using indivual draw calls.
         * This function expects that materials, meshes, etc. are set up correctly.
         *
         * @param batch {Array.<GeometryBatch>}
         */
        _drawIndividual(drawType, batch, indexCount, indexType, indexOffset) {
            let gl = this.glContext;

            for (let t of batch.transforms) {
                this._bindTransform(t);

                gl.drawElements(drawType, indexCount, indexType, indexOffset * 2);

                this.performance.numDrawCalls++;
            }
        }

        /**
         * Renders a batch using instanced draw calls.
         * This function expects that materials, meshes, etc. are set up correctly.
         *
         * @param batch {Array.<GeometryBatch>}
         */
        _drawInstanced(drawType, batch, indexCount, indexType, indexOffset) {
            let gl = this.glContext;

            // Buffer which we can use to hold matrices, should have room for
            // MAX_INSTANCES_PER_BATCH matrices.
            let matrices = this.instancingMatrices;

            let numTransforms = batch.transforms.length;
            let instanceNum = 0;

            // Get the offset of the per instance model matrix
            //
            // First row the iInstanceModelMatrix is attribOffset + 0
            // Second row is iInstanceModelMatrix is attribOffset + 1
            // and so forth.
            let attribOffset = this.activeShader.attribLocations.instanceModelMatrix;

            gl.bindBuffer(gl.ARRAY_BUFFER, this.instancingBuffer);

            // Enable the instancing attributes and setup instancing divisor
            for (let n = 0; n < 4; n++) {
                gl.enableVertexAttribArray(attribOffset + n);
                gl.vertexAttribDivisor(attribOffset + n, 1);
                gl.vertexAttribPointer(attribOffset + n, 4, gl.FLOAT, false, 16 * 4, n * 16);
            }

            for (let index = 0; index < batch.transforms.length; ++index) {
                let transform = batch.transforms[index];

                // Concatenate the matrices into a buffer
                let offset = instanceNum * 16;
                for (let k = 0; k < 16; k++) {
                    matrices[offset + k] = transform[k];
                }

                instanceNum++;

                // Clear batch if this was the last one or the batch is full
                if (instanceNum >= MAX_INSTANCES_PER_BATCH || instanceNum >= numTransforms) {

                    // Upload the updated transform buffer to the GPU 
                    let sub = matrices.subarray(0, instanceNum * 16);
                    gl.bufferSubData(gl.ARRAY_BUFFER, 0, sub);

                    // Finally, it's draw time.
                    gl.drawElementsInstanced(drawType, indexCount, indexType, indexOffset * 2, instanceNum);

                    this.performance.numDrawCalls++;
                    instanceNum = 0;
                }
            }

            // Disable the divisors or otherwise they will mess with other draw calls.
            for (let n = 0; n < 4; n++) {
                gl.vertexAttribDivisor(attribOffset + n, 0);
            }
        }

        /**
         * Should be called after binding the shader.
         * Sets the lighting uniforms in the shader.
         */
        _bindLights(lights) {

            let gl = this.glContext;
            let uniforms = this.activeShader.lightUniformLocations;

            this.performance.bindLights++;

            for (let i = 0; i < MAX_LIGHTS; ++i) {
                if (i < lights.length) {
                    let light = lights[i].light;
                    let t = lights[i].transform;

                    gl.uniform3fv(uniforms[i].position, mat4.getTranslation(t));
                    gl.uniform4fv(uniforms[i].color, light.color.toArray());
                    gl.uniform1f(uniforms[i].range, light.range);
                }
                else {
                    gl.uniform3fv(uniforms[i].position, vec3.zero);
                    gl.uniform4fv(uniforms[i].color, Color.black.toArray());
                    gl.uniform1f(uniforms[i].range, 0.0);
                }
            }
        }

        /**
         * Should be called after binding the shader.
         * Sets the view uniforms in the shader.
         */
        _bindRenderView(renderView) {
            let uniforms = this.activeShader.uniformLocations;
            let gl = this.glContext;

            this.renderView = renderView;

            gl.uniformMatrix4fv(uniforms.viewMatrix, false, renderView.viewMatrix);
            gl.uniformMatrix4fv(uniforms.projectionMatrix, false, renderView.projectionMatrix);
            gl.uniformMatrix4fv(uniforms.inverseViewMatrix, false, renderView.inverseViewMatrix);
            gl.uniformMatrix4fv(uniforms.viewProjectionMatrix, false, renderView.viewProjectionMatrix);

            gl.uniform3fv(uniforms.viewForward, renderView.forward);
            gl.uniform3fv(uniforms.viewPosition, renderView.position);
        }

        /**
         * Should be called after binding the shader.
         * Sets the scene wide uniforms
         */
        _bindScene(scene) {
            let uniforms = this.activeShader.uniformLocations;
            let gl = this.glContext;

            gl.uniform4fv(uniforms.ambientColor, scene.ambientColor.toArray());

            let fogColor = scene.fogColor.toArray();

            gl.uniform3f(uniforms.fogColor, fogColor[0], fogColor[1], fogColor[2]);
            gl.uniform2f(uniforms.fogParams, scene.fogStart, scene.fogStart + scene.fogDistance);
        }

        /**
         * Should be called after binding the shader.
         * Sets the transform uniforms in the shader.
         */
        _bindTransform(transform) {
            let uniforms = this.activeShader.uniformLocations;
            let gl = this.glContext;

            this.performance.bindTransform++;

            let m = mat4.multiply(this.renderView.viewMatrix, transform);

            gl.uniformMatrix4fv(uniforms.modelViewMatrix, false, m);
            gl.uniformMatrix4fv(uniforms.modelMatrix, false, transform);
        }

        /**
         * Setups a mesh for rendering.
         */
        _bindMesh(mesh) {
            if (mesh === this.activeMesh) {
                return;
            }

            this.performance.bindMesh++;
            this.activeMesh = mesh;

            let gl = this.glContext;

            gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertexBuffer);

            let attribOffsets = this.activeShader.attribLocations;

            // Just to be sure...
            for (let i = 0; i < 10; i++) {
                gl.disableVertexAttribArray(i);
            }

            mesh.attributes.forEach(function(attrib) {
                let index = attribOffsets[attrib.name];

                if (!(index === undefined || index < 0)) {
                    gl.vertexAttribPointer(index, attrib.size, gl.FLOAT, false,
                        mesh.vertexSize,
                        4 * attrib.offset
                    );
                    gl.enableVertexAttribArray(index);
                }
            });

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
        }

        /**
         * Setups a texture for rendering
         */
        _bindTexture(name, texture) {
            this.performance.bindTexture++;

            let gl = this.glContext;
            let textureLocations = this.activeShader.textureLocations;

            let index = GetTextureSlotIndex(name);
            if (index === null) {
                return;
            }
            gl.activeTexture(GetTextureSlotEnum(gl, index));
            gl.bindTexture(gl.TEXTURE_2D, texture.glTexture);
            gl.uniform1i(textureLocations[name], index);
        }

        /**
         * Setups a cube map for rendering.
         */
        _bindCubeMap(name, texture) {
            this.performance.bindTexture++;

            let gl = this.glContext;
            let textureLocations = this.activeShader.textureLocations;

            let index = GetTextureSlotIndex(name);
            if (index === null) {
                return;
            }

            let tmp = texture ? texture._glTexture : null;
            if (!tmp && this.defaultCubeMap) {
                tmp = this.defaultCubeMap._glTexture;
            }

            gl.activeTexture(GetTextureSlotEnum(gl, index));
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, tmp);
            gl.uniform1i(textureLocations[name], index);
        }

        /**
         * Setups a material for rendering
         */
        _bindMaterial(material, defines) {

            // Even tough we have the same material, we might have a different shader variation
            let shader = this._getShaderProgram(material.shader, defines);

            if (material === this.activeMaterial && shader == this.activeShader) {
                return;
            }

            this.performance.bindMaterial++;
            this.activeMaterial = material;

            this._bindShader(shader);
            if (!this.activeShader) {
                return;
            }

            let uniforms = this.activeShader.uniformLocations;
            let gl = this.glContext;

            gl.uniform4fv(uniforms.diffuseColor, material.diffuseColor.toArray());
            gl.uniform4fv(uniforms.specularColor, material.specularColor.toArray());

            for (let [name, texture] of material.textures.entries()) {
                this._bindTexture(name, texture);
            }

            if (material.depthTest) {
                gl.enable(gl.DEPTH_TEST);
            }
            else {
                gl.disable(gl.DEPTH_TEST);
            }

            if (material.depthWrite) {
                gl.depthMask(true);
            }
            else {
                gl.depthMask(false);
            }

            if (material.cullFaces) {
                gl.enable(gl.CULL_FACE);
            }
            else {
                gl.disable(gl.CULL_FACE);
            }

            if (material.blendMode === "alpha") {
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            }
            else if (material.blendMode === "add") {
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
            }
            else if (material.blendMode === "multiply") {
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.DST_COLOR, gl.ONE_MINUS_SRC_ALPHA);
            }
            else {
                gl.disable(gl.BLEND);
            }
        }

        _bindShader(shaderProgram) {
            if (shaderProgram === this.activeShader) {
                return;
            }

            this.performance.bindShader++;

            if (shaderProgram && shaderProgram.program) {
                this.activeShader = shaderProgram;
                let gl = this.glContext;
                gl.useProgram(shaderProgram.program);
            }
            else {
                this.activeShader = null;
            }

        }

        /**
         * Reset the performance counters, should be called at the start of the frame
         */
        resetPerformance() {
            this.performance.vertices = 0;
            this.performance.numDrawCalls = 0;
            this.performance.numModels = 0;
            this.performance.numLights = 0;
            this.performance.batches = 0;

            this.performance.bindShader = 0;
            this.performance.bindMaterial = 0;
            this.performance.bindMesh = 0;
            this.performance.bindTexture = 0;
            this.performance.bindLights = 0;
            this.performance.bindTransform = 0;
        }

        /**
         * Initializes a streaming buffer which holds per-instance model matrices
         */
        _createInstancingBuffer() {
            let gl = this.glContext;

            // sizeof(mat4) * MAX_INSTANCES_PER_BATCH;
            let size = 16 * 4 * MAX_INSTANCES_PER_BATCH;

            let b = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, b);
            gl.bufferData(gl.ARRAY_BUFFER, size, gl.STREAM_DRAW);

            this.instancingBuffer = b;
            this.instancingMatrices = new Float32Array(16 * MAX_INSTANCES_PER_BATCH);
        }

        /**
         * Returns a shader program with the given defines.
         * A new shader will be compiled if one does not already exist.
         *
         * If the shader compilation fails, null is returned
         *
         * @param shader {ShaderSource} Shader to compile.
         * @param defines {Map.<string, string|null> Defines to use
         *
         * @returns {null|ShaderProgram}
         */
        _getShaderProgram(shader, defines) {

            if (!shader)
                return null;

            // Try to get cached shader first
            let key = buildShaderKey(shader.name, defines);

            if (key in this.shaderCache) {
                return this.shaderCache[key];
            }

            let program = this._createShaderProgram(shader, defines);
            this.shaderCache[key] = program;

            if (program) {
                console.log("Compiled shader " + key);
            }

            return program;
        }

        /**
         * Returns a shader based on the shader key generated with buildShaderKey()
         *
         * If the shader has been compiled, the shader program is returned.
         * If the shader was compiled but the compilation failed, null is returned.
         * If the shader has not been compiled or does not exist, undefined is returned.
         *
         * @returns {null|undefined|ShaderProgram} 
         */
        _getCachedShaderProgram(shaderKey) {
            return this.shaderCache[shaderKey];
        }

        /**
         * Compiles a shader program with given defines
         *
         * @param shader {ShaderSource} Shader to compile.
         * @param defines {Map.<string, string|null> Defines to use
         */
        _createShaderProgram(shader, defines) {
            let gl = this.glContext;

            let vertexShader = this._createShader(shader.name, shader.source, gl.VERTEX_SHADER, defines);
            if (!vertexShader)
                return null;

            let fragmentShader = this._createShader(shader.name, shader.source, gl.FRAGMENT_SHADER, defines);
            if (!fragmentShader)
                return null;

            let program = gl.createProgram();
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);
            gl.linkProgram(program);
            
            let success = gl.getProgramParameter(program, gl.LINK_STATUS);
            if (!success) {
                console.log("Failed to compile program " + buildShaderKey(shader.name, shader.defines) +
                    " :" + gl.getProgramInfoLog(program));
                return null;
            }

            let prog = new ShaderProgram();

            prog.source = shader;
            prog.program = program;
            prog.defines = defines;

            prog.uniformLocations = {
                modelMatrix: gl.getUniformLocation(program, "uModelMatrix"),
                modelViewMatrix: gl.getUniformLocation(program, "uModelViewMatrix"),

                diffuseColor: gl.getUniformLocation(program, "uDiffuseColor"),
                specularColor: gl.getUniformLocation(program, "uSpecularColor"),
                ambientColor: gl.getUniformLocation(program, "uAmbientColor"),

                viewMatrix: gl.getUniformLocation(program, "uViewMatrix"),
                viewForward: gl.getUniformLocation(program, "uViewForward"),
                viewPosition: gl.getUniformLocation(program, "uViewPosition"),
                viewProjectionMatrix: gl.getUniformLocation(program, "uViewProjectionMatrix"),

                projectionMatrix: gl.getUniformLocation(program, "uProjectionMatrix"),

                fogParams: gl.getUniformLocation(program, "uFogParams"),
                fogColor: gl.getUniformLocation(program, "uFogColor"),

                debugTint: gl.getUniformLocation(program, "uTint"),
            };

            prog.textureLocations = {
                diffuseMap: gl.getUniformLocation(program, "sDiffuseMap"),
                specularMap: gl.getUniformLocation(program, "sSpecularMap"),
                ambientMap: gl.getUniformLocation(program, "sAmbientMap"),
                normalMap: gl.getUniformLocation(program, "sNormalMap"),
                environmentMap: gl.getUniformLocation(program, "sEnvironmentMap"),
            };

            // Lights are a bit of a special case.
            prog.lightUniformLocations = [];
            for (let i = 0; i < 4; ++i) {
                prog.lightUniformLocations.push({
                    position: gl.getUniformLocation(program, "uLights[" + i + "].position"),
                    color:    gl.getUniformLocation(program, "uLights[" + i + "].color"),
                    range:    gl.getUniformLocation(program, "uLights[" + i + "].range"),
                });
            }

            prog.attribLocations = {
                position: gl.getAttribLocation(program, "iPosition"),
                color: gl.getAttribLocation(program, "iColor"),
                texCoord: gl.getAttribLocation(program, "iTexCoord"),
                normal: gl.getAttribLocation(program, "iNormal"),
                tangent: gl.getAttribLocation(program, "iTangent"),
                bitangent: gl.getAttribLocation(program, "iBitangent"),
                instanceModelMatrix: gl.getAttribLocation(program, "iInstanceModelMatrix"),
            };

            prog.updateKey();

            let uniforms = Object.entries(prog.uniformLocations).
                filter(x => x[1] != null).
                map(x => x[0]).
                join(", ");

            console.log("uniforms " + uniforms);

            /*
            prog.lightUniformLocations.forEach(function(value, index) {
                Object.keys(prog.uniformLocations).forEach(function(key) {
                    if (prog.lightUniformLocations[index][key]) {
                        console.log("light " + index + " uniform " + key);
                    }
                });
            });
            */

            /*
            Object.keys(prog.attribLocations).forEach(function(key) {
                console.log("attrib " + key + " at " + prog.attribLocations[key]);
            });
            */

            return prog;
        }

        /**
         * Returns a string which can be passed on to WebGL shader preprocessor.
         *
         * Contents of the string will look like
         *
         * #define key1 value1
         * #define key2
         * #define key3 value3
         * ...
         *
         *
         * @param defines {Map.<string, string|null> Defines to use
         * @returns string
         */
        _buildShaderDefines(defines) {
            if (!defines) {
                return "";
            }

            return Array.from(defines.keys()).sort().map(function(key) {
                let val = defines[key];
                if (val) {
                    return "#define " + key + " " + val + "\n";
                }
                else {
                    return "#define " + key + "\n";
                }
            }).join("");
        }

        /**
         * Compiles a shader object which can be linked on to a shader program
         */
        _createShader(name, source, type, defines) {
            let gl = this.glContext;

            let typeDefine = null;
            let typeName = null;

            if (type === gl.VERTEX_SHADER) {
                typeDefine = "COMPILE_VERTEX";
                typeName = "vertex";
            }
            else if (type === gl.FRAGMENT_SHADER) {
                typeDefine = "COMPILE_FRAGMENT";
                typeName = "fragment";
            }
            else {
                console.log("Bad shader type: " + type);
                return null;
            }

            let modifiedSource = SHADER_VERSION + "\n" +
                SHADER_PREAMBLE + "\n" +
                "#define " + typeDefine + "\n" +
                "#define MAX_LIGHTS " + MAX_LIGHTS + "\n" +
                this._buildShaderDefines(defines) + "\n" +
                "#line 1\n" +
                source;

            let shader = gl.createShader(type);
            gl.shaderSource(shader, modifiedSource);
            gl.compileShader(shader);

            let success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
            if (!success) {
                console.log("Failed to compile " + typeName + " shader " +
                    buildShaderKey(name, defines) + " : " + gl.getShaderInfoLog(shader));

                console.log(modifiedSource);

                gl.deleteShader(shader);
                return null;
            }

            return shader;
        }

        /**
         * Remove unused shaders
         */
        _clearShaderCache(_lastUsed) {
            // TODO
        }
    };

})(this);
