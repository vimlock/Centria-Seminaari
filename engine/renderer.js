"use strict";

(function(context) {

    const MAX_LIGHTS = 8;
    const MAX_TEXTURES = 8;

    const SHADER_VERSION = "#version 300 es";
    const SHADER_PREAMBLE = "";

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

            this._cullLights(camera, lights, 8);

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
            if (maxLights > MAX_LIGHTS)
                maxLights = MAX_LIGHTS;

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
            
            let gl = this.glContext;

            gl.enable(gl.DEPTH_TEST);
            gl.enable(gl.CULL_FACE);
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

                this._bindMaterial(mat);
                this._bindMesh(mesh);
                this._bindCamera(camera);
                this._bindLights(lights);

                if (!this.activeMesh || !this.activeMaterial || !this.activeShader)
                    continue;

                for (let t of batch.transforms) {
                    this.performance.numDrawCalls++;
                    this.performance.vertices += geo.indexCount;

                    this._bindTransform(t);

                    gl.drawElements(drawType, geo.indexCount, mesh.indexType, geo.indexOffset);
                }
            }
        }

        _bindLights(lights) {
        }

        /**
         * Should be called after binding the shader
         */
        _bindCamera(cam) {
            let uniforms = this.activeShader.uniformLocations;
            let gl = this.glContext;

            this.activeCamera = cam;

            this.cameraViewMatrix = cam.node.worldTransform;
            this.cameraProjectionMatrix = cam.projectionMatrix;

            gl.uniformMatrix4fv(uniforms.projectionMatrix, false, this.cameraProjectionMatrix);
            gl.uniformMatrix4fv(uniforms.normalMatrix, false, mat4.transpose(mat4.invert(this.cameraViewMatrix)));
        }

        /**
         * Should be called after binding the shader
         */
        _bindTransform(transform) {
            let uniforms = this.activeShader.uniformLocations;
            let gl = this.glContext;

            let m = mat4.multiply(this.cameraViewMatrix, transform);
            // let m = mat4.multiply(transform, this.cameraViewMatrix);

            // console.log(m);

            gl.uniformMatrix4fv(uniforms.modelViewMatrix, false, m);
        }

        /**
         * Setups a mesh for rendering
         */
        _bindMesh(mesh) {
            if (mesh === this.activeMesh) {
                return;
            }

            this.performance.numMeshChanges++;
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

            console.log("bound mesh");
            console.log(mesh);
        }

        /**
         * Setups a material for rendering
         */
        _bindMaterial(material) {

            if (material === this.activeMaterial) {
                return;
            }

            this.performance.numMaterialChanges++;
            this.activeMaterial = material;

            this._bindShader(this._getShaderProgram(material.shader, material.defines));

            let uniforms = this.activeShader.uniformLocations;
            let gl = this.glContext;

            gl.uniform4fv(uniforms.diffuseColor, material.diffuseColor.toArray());
        }

        _bindShader(shaderProgram) {
            if (shaderProgram === this.activeShader) {
                return;
            }

            this.performance.numShaderChanges++;
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

            this.performance.numMeshChanges = 0;
            this.performance.numMaterialChanges = 0;
            this.performance.numShaderChanges = 0;
        }

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
         * 
         */
        _getCachedShaderProgram(shaderKey) {
            return this.shaderCache[shaderKey];
        }

        /**
         * Compiles a shader with given defines
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
                modelViewMatrix: gl.getUniformLocation(program, "uModelViewMatrix"),
                projectionMatrix: gl.getUniformLocation(program, "uProjectionMatrix"),
                normalMatrix: gl.getUniformLocation(program, "uNormalMatrix"),
                diffuseColor: gl.getUniformLocation(program, "uDiffuseColor"),
            };

            prog.attribLocations = {
                position: gl.getAttribLocation(program, "iPosition"),
                color: gl.getAttribLocation(program, "iColor"),
            };

            prog.updateKey();

            Object.keys(prog.uniformLocations).forEach(function(key) {
                console.log("uniform " + key + " at " + prog.uniformLocations[key]);
            });

            Object.keys(prog.attribLocations).forEach(function(key) {
                console.log("attrib " + key + " at " + prog.attribLocations[key]);
            });

            return prog;
        }

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
        }
    };

})(this);
