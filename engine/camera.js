"use strict";

const DegToRad = (Math.PI / 180.0);
const RadToDeg = 1.0 / DegToRad;

(function(context) {

    context.Camera = class {

        constructor() {
            /// If false, the camera will use perspective projection
            this.orthographic = false;

            /// How many world units wide the camera is
            this.orthographicSize = 10.0;

            this.aspectRatio = 0.5;

            /// Field of view in degrees, when using perspective projection
            this.fieldOfView = 60.0;

            /// Near clip plane, pixels nearer than this will not be drawn
            this.nearPlane = 0.01;

            /// Far clip plane, pixels further than this will not be drawn
            this.farPlane = 1000.0;
        }

        get projectionMatrix() {
            if (this.orthographic) {
                return mat4.identity(); // TODO
            }
            else {
                return mat4.perspective(Math.PI * 0.25,
                    engine.gl.aspectRatio,
                    this.nearPlane, this.farPlane
                );
            }
        }
    };

})(this);
