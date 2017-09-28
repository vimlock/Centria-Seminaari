"use strict";

(function(context) {

    context.Camera = function() {

        /// If false, the camera will use perspective projection
        this.orhograhpic = false;

        /// How many world units wide the camera is
        this.orthographicSize = 10.0;

        /// Field of view in degrees, when using perspective projection
        this.fieldOfView = 60.0;

        /// Near clip plane, pixels nearer than this will not be drawn
        this.nearPlane = 0.01;

        /// Far clip plane, pixels further than this will not be drawn
        this.farPlane = 300.0;
    }
})(this);
