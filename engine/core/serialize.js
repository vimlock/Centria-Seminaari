/* exported Serialize, Deserialize */

/* global Color, Quaternion */

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

class Deserialize {

    static color(src) {
        return Color.fromArray(src.split(" "));
    }

    static component(src) {
        return parseInt(src.split(":")[1]);
    }

    static sceneNode(src) {
        return parseInt(src.split(":")[1]);
    }

    static sceneNodeArray(src) {
        return src.substring(src.indexOf(":") + 1).split(";");
    }

    static resource(src) {
        return parseInt(src.split(":")[1]);
    }

    static resourceArray(src) {
        return src.substring(src.indexOf(":") + 1).split(";");
    }

    static quaternion(src) {
        return Quaternion.fromArray(src.split(" "));
    }
    
    static mat4(src) {
        return src.split(" ");
    }

    static vec2(src) {
        return src.split(" ");
    }

    static vec3(src) {
        return src.split(" ");
    }

    static vec4(src) {
        return src.split(" ");
    }
}
