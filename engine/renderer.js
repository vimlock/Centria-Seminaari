"use strict";

(function(context) {

    function GeometryBatch(geometry, material) {
        this.geometry = geometry;
        this.material = material;
        this.transforms = [];
    }

    function LightBatch(transform, light) {
        this.transform = transform;
        this.light = light;
    }

    context.Renderer = class {

        constructor(glContext) {
            // The material we'll use if none is assigned to a model
            this.defaultMaterial = new Material();

            // Accumulated rendering statistics
            this.performance = {};
            this.resetPerformance();
            this.glContext = glContext;
        }

        renderScene(scene, camera, shaderOverride) {
            // Prepare scene for rendering
            
            let lights = [];
            
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

            this.renderBatches(camera, lights, opaqueGeomBatches, shaderOverride);
            this.renderBatches(camera, lights, opaqueGeomBatches, shaderOverride);
        }

        queueGeometry(batches, geometry, material, transform) {

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

        queueLight(batches, light, transform) {
            lights.push(new LightBatch(transform, light));
        }

        renderBatches(camera, lights, batches, shaderOverride) {
            // TODO: pick the closest and most brighest lights and upload them as uniforms

            for (let batch of batches) {
                // TODO: bind material
                // TODO: bind mesh
                // TODO: render the object
            }
        }

        resetPerformance() {
            this.performance.triangles = 0;
            this.performance.numDrawCalls = 0;
            this.performance.materials = 0;
            this.performance.numModels = 0;
            this.performance.numLights = 0;
        }
    }

})(this);
