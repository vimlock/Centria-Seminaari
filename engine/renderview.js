/* exported RenderView */
/* global mat4 */

"use strict";

class RenderView {
    constructor(projection, view) {
        this.projectionMatrix = projection;
        this.viewMatrix = view;

        this.inverseViewMatrix = mat4.invert(view);
        this.viewProjectionMatrix = mat4.multiply(projection, view);
    }

    get position() {
        return mat4.getTranslation(this.viewMatrix);
    }

    get forward() {
        let m = this.viewMatrix;
        return [m[2], m[6], m[10]];
    }

    static fromCamera(camera) {
        return new RenderView(camera.projectionMatrix, camera.viewMatrix);
    }
}
