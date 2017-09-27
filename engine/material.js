"use strict";

(function(context) {
    context.Material = function() {
        this.name = "Material";

        /// Tint of the diffuse color.
        this.diffuseColor = Color.white;

        /// Tint of the specular color.
        /// HOX! The alpha value will be used as the specular hardness.
        this.specularColor = Color.white;

        /// Used to control rendering order.
        /// Transparent materials are rendered after opaque geometry.
        this.opaque = true;

        /// Which faces to cull during rendering
        this.cullFaces = "back";

        /// Should this material use Z rejection?
        this.depthTest = true;

        /// Should this material write to Z buffer?
        this.depthWrite = true;

        /// How this material should be blended?
        this.blendMode = "replace"; // add/alpha/multiply/replace

        /// Which shader to use?
        this.shader = null;
        this.drawType = "solid"; // points|wireframe|solid

        /// Texture mapping.
        this.textures = new Map();

        /// Custom uniforms to use.
        /// Possible values are
        //
        /// float number
        /// vec2 [number, number]
        /// vec3 [number, number, number]
        /// vec4 [number, number, number, number]
        this.shaderUniforms = new Map();
    }
})(this);
