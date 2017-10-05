/* global Component, Color, Serialize, Deserialize */

"use strict";

(function(context) {

    /**
     * Light component.
     */
    context.Light = class Light extends Component {

        constructor() {
            super();

            /// TODO: Add support for other light types, directional, spot, etc.

            /// Color this light is tinted to.
            this.color = Color.white;

            /// How far this light has effect at most
            this.range = 50.00;

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

        serialize() {
            return {
                color: Serialize.color(this.color),
                range: this.range,
                intensity: this.intensity,
                fallof: this.falloff,
                diffuseEnabled: this.diffuseEnabled,
                specularEnabled: this.specularEnabled,
            };
        }

        deserialize(deserializer, src) {
            this.color = Deserialize.color(src.color);
            this.range = src.range;
            this.intensity = src.intensity;
            this.fallof = src.fallof;
            this.diffuseEnabled = src.diffuseEnabled;
            this.specularEnabled = src.specularEnabled;
        }
    };

})(this);
