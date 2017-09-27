"use strict";

(function(context) {

    context.Camera = function() {
        this.orhograhpic = false;
        this.orthographicSize = 10.0;
        this.fieldOfView = 60.0;
        this.nearPlane = 0.01;
        this.farPlane = 300.0;
    }
})(this);
