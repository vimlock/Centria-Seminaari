"use strict";

(function(context) {
    context.Material = function() {
        this.name = "Material";

        this.diffuseColor = Color.white;
        this.specularColor = Color.white;

        this.opaque = true;
        this.cullFaces = "back";
        this.depthTest = true;
        this.depthWrite = true;
        this.blendMode = "replace";

        this.shader = null;
        this.drawType = "solid"; // points|wireframe|solid

        this.textures = new Map();
        this.shaderUniforms = new Map();
    }
})(this);
