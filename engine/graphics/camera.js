/* global Component, engine, mat4 */
/* exported DegToRad, RadToDeg */

"use strict";

const DegToRad = (Math.PI / 180.0);
const RadToDeg = 1.0 / DegToRad;

(function(context) {

    context.Camera = class Camera extends Component{

        constructor() {
            super();

            /// If false, the camera will use perspective projection
            this.orthographic = false;

            /// How many world units wide the camera is
            this.orthographicSize = 10.0;

            this.aspectRatio = 0.5;
            //this.aspectRatio = window.innerWidth / window.innerHeight // True aspect ratio

            /// Field of view in degrees, when using perspective projection
            this.fieldOfView = 60.0;

            /// Near clip plane, pixels nearer than this will not be drawn
            this.nearPlane = 0.01;

            /// Far clip plane, pixels further than this will not be drawn
            this.farPlane = 1000.0;
        }

        /**
         * @returns mat4 Representing the projection of this camera
         */
        get projectionMatrix() {
            if (this.orthographic) {
                let width = 50;
                let asRa = window.innerWidth / window.innerHeight;
                let height = width / asRa;
                return mat4.orthographic(width, 0, height, 0, 0.1, 100); // TODO
            }
            else {
                return mat4.perspective(Math.PI * 0.25,
                    engine.gl.aspectRatio,
                    this.nearPlane, this.farPlane
                );
            }
        }

        /**
         * Shorthand to get view matrix from this camera.
         *
         * @returns mat4 Representing the view matrix of this camera
         */
        get viewMatrix() {
            return this.node.worldTransform;
        }

        /**
         * Shorthand to get view vector from this camera.
         *
         * @returns vec3 Representing the view vector of this camera
         */
        get viewDirection() {
            return this.node.worldTransform.forward;
        }

        serialize() {
            return {
                orhographic: this.orthographic,
                orthographicSize: this.orthographicSize,
                aspectRatio: this.aspectRatio,
                fieldOfView: this.fieldOfView,
                nearPlane: this.nearPlane,
                farPlane: this.farPlane,
            };
        }

        deserialize(deserializer, src) {
            this.orthographic = src.orthographic;
            this.orthographicSize = src.orthographicSize;
            this.aspectRatio = src.aspectRatio;
            this.fieldOfView = src.fieldOfView;
            this.nearPlane = src.nearPlane;
            this.farPlane = src.farPlane;
        }
    };

})(this);
