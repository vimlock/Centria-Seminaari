/* global Component, CubeMap, RenderView, vec3, mat4 */
/* exported EnvironmentMap */

"use strict";

(function(context) {

    const cubeForward = [
        [ 1,  0,  0],
        [-1,  0,  0],
        [ 0,  1,  0],
        [ 0, -1,  0],
        [ 0,  0,  1],
        [ 0,  0, -1],
    ];

    const cubeUp = [
        [ 0, -1, 0],
        [ 0, -1, 0],
        [ 0,  0, 1],
        [ 0,  0, 1],
        [ 0, -1, 0],
        [ 0, -1, 0],
    ];

    class EnvironmentMap extends Component {
        constructor() {
            super();

            this.resolution = 256;
            this.cubemap = null;
        }

        /**
         * Generate a new cubemap
         */
        build(renderer) {

            let scene = this.node.scene;
            if (!scene) {
                console.log("Can't build environment map, not assigned to a scene");
                return;
            }

            let projectionMatrix = mat4.perspective(Math.PI / 2, 0.5, 2.0, 100.0);
            let position = this.node.worldPosition;

            let views = [];

            for (let i = 0; i < 6; ++i) {
                let forward = cubeForward[i];
                let up = cubeUp[i];

                let viewMatrix = mat4.lookAt(position, vec3.add(position, forward), up);
                views.push(new RenderView(projectionMatrix, viewMatrix));
            }

            let cubemap = CubeMap.create(this.resolution);
            renderer.renderCubeMap(cubemap, scene, views);

            this.cubemap = cubemap;
        }
    }

    context.EnvironmentMap = EnvironmentMap;
})(this);
