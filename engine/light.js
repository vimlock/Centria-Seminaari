"use strict";

(function(context) {

    /**
     * Light component.
     */
    context.Light = function() {

        /// TODO: Add support for other light types, directional, spot, etc.

        /// Color this light is tinted to.
        this.color = Color.white;

        /// How far this light has effect at most
        this.range = 5.00;

        /// Multiplies the effect of this light
        this.intensity = 1.0;

        /// How the light fades to distance?
        /// Possible values linear/quadratic/constant
        this.falloff = "quadratic";

        /// Should this light contribute to the diffuse color?
        this.diffuseEnabled = true;

        /// Should this light contribute to the specular color?
        this.specularEnabled = true;
    }
})(this);
