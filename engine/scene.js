"use strict";

engine.scene = [];
engine.scene.current = {};

engine.scene.change = function(nextScene) {
	var sceneDifferences = this.getLoadable(this.current, this[nextScene]);
	this.loadScene(sceneDifferences);
}

engine.scene.loadscene = function(differences) {
	
}

engine.scene[0] = {};


(function(context) {

    context.SceneNode = class {

        constructor(name = "") {
            this.worldTransform = mat4.identity();
            this.worldTransformDirty = false;

            this.localPosition = vec3.zero;
            this.localRotation = Quaternion.identity;
            this.localScale = vec3.one;

            this.name = name;
            this.parent = null;
            this.children = [];
            this.components = [];
            this.enabled = true;
            this.shouldRemove = false;
        }

        updateHierarchy(force) {
            let dirty = force || this.worldTransformDirty;

            if (dirty && parent) {
                worldTransform = mat4.multiply(parent.worldTransform, this.localTransform);
                this.worldTransformDirty = false;
            }

            for (let child of this.children) {
                child.updateHierarchy(force);
            }
        }

        update() {
            for (let child of this.children) {
                child.update();
            }
        }

        get localTransform() {
        }

        get forward() {
        }

        get left() {
        }

        get up() {
        }

        createChild(name) {
            let child = new SceneNode(name);
            child.setParent(this);

            return child;
        }

        removeChild(child) {
        }

        removeChildAt(n) {
        }

        setParent(parent, keepTransform=true) {
            this.parent = parent;

            if (!keepTransform)
                this.worldTransformDirty = true;

            if (parent) {
                parent.children.push(this);
            }
            else {
            }
        }

        serializeJSON() {
        }

        deserializeJSON(src) {
        }

        createComponent(type) {
            let tmp = new type();
            this.components.push(tmp);
            
            return tmp;
        }

        getComponent(type) {
            for (let child of this.children) {
                if (child instanceof type) {
                    return child;
                }
            }

            return null;
        }

        removeComponent(type) {
        }

        removeComponentAt(n) {
        }

        // Recursively iterate every child and call fn on them
        walkAll(fn) {
            fn(this);

            for (let child of this.children) {
                child.walkAll(fn);
            }
        }

        // Recursively iterate every child and call fn on them, but only if the node is enabled
        walkEnabled(fn) {
            if (!this.enabled)
                return;

            fn(this);

            for (let child of this.children) {
                child.walkEnabled(fn);
            }
        }
    };

    context.Scene = class extends context.SceneNode {
        constructor() {
            super();

            this.background = new Color(0.15, 0.15, 0.15, 1.0);
            this.ambient = new Color(0.01, 0.01, 0.01, 1.0);
        }
    };

})(this);
