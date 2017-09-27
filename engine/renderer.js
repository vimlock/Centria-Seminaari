"use strict";

(function(context) {

    const MAX_LIGHTS = 8;
    const MAX_TEXTURES = 8;

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
                // TODO: bind material
                // TODO: bind mesh
                // TODO: render the object
            }
        }

        /**
         * Setups a mesh for rendering
         */
        _bindMesh(mesh) {
        }

        /**
         * Setups a material for rendering
         */
        _bindMaterial(material) {
        }

        /**
         * Reset the performance counters
         */
        resetPerformance() {
            this.performance.triangles = 0;
            this.performance.numDrawCalls = 0;
            this.performance.materials = 0;
            this.performance.numModels = 0;
            this.performance.numLights = 0;
        }
    }

})(this);
