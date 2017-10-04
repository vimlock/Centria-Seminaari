/* exported Serialize */

"use strict";

class Serialize {

    static color(prop) {
        return prop.toArray().join(" ");
    }

    static component(prop) {
        return "Component:" + prop.id;
    }

    static sceneNode(prop) {
        return "SceneNode:" + prop.id;
    }

    static sceneNodeArray(props) {
        return "SceneNodeArray:" + props.map(p => p.id).join(";");
    }

    static resource(prop) {
        return "Resource:" + prop.name;
    }
    static resourceArray(props) {
        return props.map(p => p.name).join(";");
    }

    static quaternion(prop) {
        return prop.toArray().join(" ");
    }

    static mat4(prop) {
        return prop.join(" ");
    }

    static vec2(prop) {
        return prop[0] + " " + prop[1];
    }

    static vec3(prop) {
        return prop[0] + " " + prop[1] + " " + prop[2];
    }

    static vec4(prop) {
        return prop.join(" ");
    }
}
