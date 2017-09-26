
    // Parsed from a single .OBJ file
    model = {

        // Describes what the vertex_buffer contains
        // If we're using non-interleaved vertex buffers, we don't need these.
        // But my recommendation is to use interleaved vertex buffers, makes
        // managing the buffers much more easier
        // https://gamedev.stackexchange.com/questions/66545/vertex-buffers-interleaved-or-separate

        vertex_buffer_info: {
            has_texcoords: bool,
            texcoord_offset: int,

            has_vertex_colors: bool,
            vertex_color_offset: int,

            has_normals: bool,
            normals_offset: int,

            has_tangents: bool,
            tangents_offset: int,
        }

        // Reference to the vertex buffer on the GPU side
        vertex_buffer,

        // Reference to the index buffer on the GPU side
        index_buffer,

        // Different pieces from which the model is made from
        // Each material is assigned a different geometry
        geometries: [
            {
                // Offset to use when binding the index buffer
                start_index: int,

                // How many indices to draw
                num_indices: int,

                // Reference to the model which contains this geometry
                model: model,

                material: {
                    // Should this material be rendered after opaque geometry?
                    transparent: bool,

                    backface_culling: bool,
                    depth_write: bool,
                    dept_test: bool,
                    blend_mode: "alpha|opaque",
                    winding_order: "cw|ccw",
                    cull_face: "none|front|back|front_and_back",

                    // Which shader to use
                    shader: "shader_name",

                    // Passed as shader uniforms
                    diffuse_color: "#RRGGBB",
                    specular_color: "#RRGGBB",

                    textures: [
                        "texture_1",
                        "texture_2",
                        "texture_3"
                    ]
                }
            }
        ]
    }

    // We should come up with a better name for this, object sounds too generic
    // and might be a reserved word in JavaScript? Maybe SceneNode or SceneObject could work.
    object = {
        name: "name",
        enabled: bool,

        transform: {
            local_transform: mat4,
            world_transform: mat4,

            // Does the world_transform need updating?
            world_transform_dirty: bool,
        },

        // References to the child objects
        children: [
            object, object, object, ...
        ]

        light : {
            color: "#RRGGBB",
            intensity: float,
        },

        model: model,

        camera: {
            fov: float,

            orthographic: bool,
            ortho_size: float,
        }
    }
    



Rendering
=========

- Walk through the scene hiararchy
- Pick every model which contains a model
- Store every geometry from every model into material\_slots, based on the material and geometry
- We could also use geometries as our sort keys, this way we could reduce GPU state changes even further

- Pick the first active camera, use it to calculate MVP matrix

- When rendering, first render the geometries with opaque materials
- Then render the geometries with transparent materials

    scene = object
    
    function renderScene(scene, shader_override)

    render_item : {
        world_transform,
        geometry,
    }
    
    material_slot : {
        wood: [
            render_item, render_item, render_item
        ]

        steel: [
        ]
    }


Shaders
=======

We could start defining what our uniform and vertex attribute names for shaders should be.

Vertex shader inputs
--------------------

    // Model-view-projection matrix
    uniform mat4 uMVP;

    // Time passed since start in seconds, could be used for cool effects
    uniform float uTime;

    // Input vertex position
    in vec3 iPosition;

    // Input vertex color
    in vec4 iColor;

    // Input texture coordinate.
    in vec2 iTexcoord;
    in vec3 iNormal;
    in vec3 iTangent

Fragment Shader inputs
----------------------

    // Time passed since start in seconds, could be used for cool effects
    uniform float uTime;

    uniform sampler2D sDiffuse;
    uniform sampler2D sSpecular;
    uniform sampler2D sAmbient;
    uniform sampler2D sNormalMap;
    uniform sampler2D sHeightMap;

    in vec3 vNormal;
    in vec3 vColor;
    in vec3 vTexcoord;
