"use strict";

(function(context) {

    context.Light = function() {
        this.color = Color.white;
        this.intensity = 1.0;

        this.diffuseEnabled = true;
        this.specularEnabled = true;
    }
})(this);
