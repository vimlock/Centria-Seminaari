"use strict";

(function (context) {
    context.Geometry = function(offset, count, mesh) {
        this.indexOffset = offset;
        this.indexCount = count; 
        this.mesh = mesh;
    };
})(this);
