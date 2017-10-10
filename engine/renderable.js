/* global Component */
/* exported Renderable */

"use strict";

class Renderable extends Component {
    constructor() {
        super();

        this.staticEnvironmentMap = false;
        this.environmentMap = null;
    }

    /**
     * Should return an array of geometries which will be used for
     * rendering.
     *
     * If a falsy value is returned, the component will not be rendered.
     *
     * Override this in a derived class.
     */
    getRenderGeometries() {
        throw new Error("Not implemented");
    }

    /**
     * Should return an array of materials which will be used for
     * rendering
     *
     * If a falsy value is returned, the component will not be rendered.
     *
     * Override this in a derived class.
     */
    getRenderMaterials() {
        throw new Error("Not implemented");
    }
}
