"use strict";

(function(context) {

    const MAX_LIGHTS = 8;
    const MAX_TEXTURES = 8;

    const SHADER_VERSION = "#version 300 es";
    const SHADER_PREAMBLE = "";

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

            scene.walkEnabled(function(node) {

                // Pick the lights
                let light = node.getComponent(Light);
                if (light) {
                    this.queueLight(lights, light, node.transform);
                }

                // Pick the models
                let model = node.getComponent(Model);
                if (model && model.mesh) {

                    this.performance.numModels++;

                    model.mesh.geometries.forEach(function (geometry, index) {
                        let material = model.getMaterial(index) || this.defaultMaterial;
                    });

                    for (let geom of model.geometries) {

                        if (material.opaque) {
                            this.queueGeometry(opaqueGeomBatches, material, batch, node.worldTransform);
                        }
                        else {
                            this.queueGeometry(transparentGeomBatches, material, node.worldTransform);
                        }
                    }
                }

                // Pick a camera, if we have not found one yet
                if (!camera) {
                    camera = node.getComponent(Camera);
                }
            });


            if (!camera) {
                console.log("No camera found to render scene with")
                return;
            }

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
            lights.push(new LightBatch(transform, light));
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
            
            for (let batch of batches) {
                
                let geo = batch.geometry;
                let mat = batch.material;

                this._bindMesh(geo.mesh);
                this._bindMaterial(mat);

                if (!this.activeMesh || !this.activeMaterial || !this.activeShader)
                    continue;

                for (let t of batch.transforms) {
                    this.performance.numDrawCalls++;
                    this.performance.vertices += geom.indexCount;

                    // TODO: render the object
                }
            }
        }

        _bindTransform(transform) {
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

            this._bindShader(_getShaderProgram(material.shader, material.defines));
        }

        _bindShader(shaderProgram) {
            if (shaderProgram === this.activeShader) {
                return;
            }

            this.performance.numShaderChanges++;
            this.activeShader = shaderProgram;

            let gl = this.glContext;

            gl.useProgram(shader.program);
        }

        /**
         * Reset the performance counters, should be called at the start of the frame
         */
        resetPerformance() {
            this.performance.vertices = 0;
            this.performance.numDrawCalls = 0;
            this.performance.numModels = 0;
            this.performance.numLights = 0;

            this.performance.numMeshChanges = 0;
            this.performance.numMaterialChanges = 0;
            this.performance.numShaderChanges = 0;
        }

        _getShaderProgram(shader, defines) {

            // Try to get cached shader first
            let key = buildShaderKey(name, defines);

            if (key in this.shaderCache) {
                return this.shaderCache[key];
            }

            let program = this._buildShaderProgram(name, defines);
            this.shaderCache[key] = program;

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

            let vertexShader = this._createShader(shader.name, shader.source, gl.VERTEX_SHADER);
            if (!vertexShader)
                return null;

            let fragmentShader = this._createShader(shader.name, shader.source, gl.FRAGMENT_SHADER);
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

            prog.updateKey();

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
    }

})(this);
