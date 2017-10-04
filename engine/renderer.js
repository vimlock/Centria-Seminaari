/* global buildShaderKey, Camera, Color, Light, Material, Model, ShaderProgram, mat4, vec3 */
"use strict";

(function(context) {

    const MAX_LIGHTS = 4;

    /// If batch size does not exceed this limit, non-instanced draw calls will be used.
    /// This is because instancing has some overhead to it.
    const MIN_INSTANCES_PER_BATCH = 5;

    /// How many instances can be drawn in a single instanced draw call.
    const MAX_INSTANCES_PER_BATCH = 256;

    const SHADER_VERSION = "#version 300 es";
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
        case "wireframe":
        default:
            return gl.TRIANGLES;
        }
    }

    /**
     * Holds the geometries which are collected from the scene
     * during rendering.
     */
    function GeometryBatch(geometry, material) {
        this.geometry = geometry;
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

            this.enableInstancing = true;

            if (this.enableInstancing) {
                this._createInstancingBuffer();
            }
        }

        /**
         * Draws a scene to the default viewport
         *
         * If camera is defined, it will be used instead of the scenes
         * own camera.
         *
         * If shaderOverride is defined, it will used instead of the
         * materials own shader.
         */
        renderScene(scene, camera, shaderOverride) {
            // Prepare scene for rendering
            
            let lights = [];
            
            // Opaque and transparent materials should be kept separate
            // for correct alpha blending and depth sorting.
            let opaqueGeomBatches = [];
            let transparentGeomBatches = [];

            let renderer = this;

            scene.walkEnabled(function(node) {

                // Pick the lights
                let light = node.getComponent(Light);
                if (light) {
                    renderer._queueLight(lights, light, node.worldTransform);
                }

                // Pick the models
                let model = node.getComponent(Model);
                if (model && model.mesh) {

                    renderer.performance.numModels++;

                    model.mesh.geometries.forEach(function (geometry, index) {
                        let material = model.getMaterial(index) || renderer.defaultMaterial;
                        if (!material) {
                            return;
                        }

                        if (material.opaque) {
                            renderer._queueGeometry(opaqueGeomBatches, geometry, material, node.worldTransform);
                        }
                        else {
                            renderer._queueGeometry(transparentGeomBatches, geometry, material, node.worldTransform);
                        }
                    });
                }

                // Pick a camera, if we have not found one yet
                if (!camera) {
                    camera = node.getComponent(Camera);
                }
            });


            if (!camera) {
                console.log("No camera found to render scene with");
                return;
            }

            // Calculate light priorities for culling
            let camPosition = camera.node.worldPosition;
            for (let l of lights) {
                l.priority = vec3.distanceSquared(mat4.getTranslation(l.transform), camPosition) * l.intensity;
            }

            this._cullLights(camera, lights, MAX_LIGHTS);

            let gl = this.glContext;
            gl.clearColor( ...scene.background.toArray());
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            // TODO: Cull batches by bounding box or some other volume

            // TODO: Sort opaque batches front-to-back
            // TODO: Sort transparent batches back-to-front
            
            this.performance.numLights += lights.length;
            
            this._renderPass(camera, lights, opaqueGeomBatches, shaderOverride);
            this._renderPass(camera, lights, transparentGeomBatches, shaderOverride);
        }

        /**
         * Add a geometry to a batch.
         *
         * If a batch with the same material-geometry combination does not exist,
         * it will be created.
         */
        _queueGeometry(batches, geometry, material, transform) {

            let batch = null;

            // Find an existing batch for the geometry and material.
            //
            // This could be a bit slow with large scenes, O(n).
            // But it's not the bottleneck right now.
            for (let i of batches) {
                if (i.geometry === geometry && i.material === material) {
                    batch = i;
                    break;
                }
            }

            // If no batch exists, create a new one.
            if (batch === null) {
                batch = new GeometryBatch(geometry, material);
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
         * @param camera {Camera} The camera to for culling.
         * @param lightBatches {Array.<Light>} The Lights which are to be culled.
         * @param maxLights Light limit.
         */
        _cullLights(camera, lights, maxLights) {

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
         * given lights and camera.
         *
         * If shaderOverride is defined, it will used instead of the
         * materials own shader.
         */
        _renderPass(camera, lights, batches, shaderOverride) {
            // TODO: pick the closest and most brighest lights and upload them as uniforms

            // TODO: Maybe add instancing support? Might be out of scope
            // TODO: Sort the batches by material before rendering
            
            this.activeMaterial = null;
            this.activeShader = null;
            this.activeCamera = null;
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

                if (instanced) {
                    this._bindMaterial(mat, new Map([...mat.defines, ["INSTANCING", null]]));
                }
                else {
                    this._bindMaterial(mat, mat.defines);
                }

                if (!this.activeShader) {
                    continue;
                }

                this._bindMesh(mesh);
                this._bindCamera(camera);
                this._bindLights(lights);

                if (!this.activeMesh || !this.activeMaterial || !this.activeShader)
                    continue;

                this.performance.vertices += geo.indexCount * batch.transforms.length;

                if (instanced) {
                    this._drawInstanced(drawType, batch, geo.indexCount, mesh.indexType, geo.indexOffset);
                }
                else {
                    this._drawIndividual(drawType, batch, geo.indexCount, mesh.indexType, geo.indexOffset);
                }
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

                gl.drawElements(drawType, indexCount, indexType, indexOffset);

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
                    gl.drawElementsInstanced(drawType, indexCount, indexType, indexOffset, instanceNum);

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

                    gl.uniform3fv(uniforms[i].position, light.node.worldPosition);
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
         * Sets the camera uniforms in the shader.
         */
        _bindCamera(cam) {
            let uniforms = this.activeShader.uniformLocations;
            let gl = this.glContext;

            this.activeCamera = cam;

            this.cameraViewMatrix = cam.node.worldTransform;
            this.cameraProjectionMatrix = cam.projectionMatrix;

            gl.uniformMatrix4fv(uniforms.viewMatrix, false, this.cameraViewMatrix);
            gl.uniformMatrix4fv(uniforms.projectionMatrix, false, this.cameraProjectionMatrix);
            gl.uniformMatrix4fv(uniforms.inverseViewMatrix, false, mat4.invert(this.cameraViewMatrix));
            gl.uniformMatrix4fv(uniforms.viewProjectionMatrix, false,
                mat4.multiply(this.cameraProjectionMatrix, this.cameraViewMatrix));

            gl.uniform4fv(uniforms.ambientColor, cam.node.scene.ambientColor.toArray());
            gl.uniform3fv(uniforms.viewForward, cam.node.forward);
            gl.uniform3fv(uniforms.viewPosition, cam.node.worldPosition);
        }

        /**
         * Should be called after binding the shader.
         * Sets the transform uniforms in the shader.
         */
        _bindTransform(transform) {
            let uniforms = this.activeShader.uniformLocations;
            let gl = this.glContext;

            this.performance.bindTransform++;

            let m = mat4.multiply(this.cameraViewMatrix, transform);
            // let m = mat4.multiply(transform, this.cameraViewMatrix);

            // console.log(m);

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

            mesh.attributes.forEach(function(attrib, index) {
                gl.vertexAttribPointer(index, attrib.size, gl.FLOAT, false,
                    mesh.vertexSize,
                    4 * attrib.offset
                );
                gl.enableVertexAttribArray(index);
            });

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
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
        }

        _bindShader(shaderProgram) {
            if (shaderProgram === this.activeShader) {
                return;
            }

            this.performance.bindShader++;
            this.activeShader = shaderProgram;

            let gl = this.glContext;

            gl.useProgram(shaderProgram.program);
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
                normal: gl.getAttribLocation(program, "iNormal"),
                instanceModelMatrix: gl.getAttribLocation(program, "iInstanceModelMatrix"),
            };

            prog.updateKey();

            /*
            let uniforms = Object.entries(prog.uniformLocations).
                filter(x => x[1] != null).
                map(x => x[0]).
                join(", ");

            console.log("uniforms " + uniforms);

            prog.lightUniformLocations.forEach(function(value, index) {
                Object.keys(prog.uniformLocations).forEach(function(key) {
                    if (prog.lightUniformLocations[index][key]) {
                        console.log("light " + index + " uniform " + key);
                    }
                });
            });

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
        _clearShaderCache(lastUsed) {
            // TODO
        }
    };

})(this);
