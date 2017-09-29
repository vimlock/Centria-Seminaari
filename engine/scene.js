"use strict";

(function(context) {

    /**
     * Represents a single object in the scene.
     *
     * Nodes can have children, which move relative to their parent node
     *
     * Nodes can have different component attached to them, like in many
     * other Entity-Component-Systems, except the "System" part is not really
     * implemented here.
     *
     * You should not create new nodes with `new SceneNode()`.
     * Instead you should use createChild() function.
     * This way the scene hierarchy stays intact.
     */
    context.SceneNode = class SceneNode {

        constructor(name = "") {
            this.worldTransform = mat4.identity();
            this.worldTransformDirty = false;

            this.localPosition = vec3.zero;
            this.localRotation = Quaternion.identity;
            this.localScale = vec3.one;

            // Use 0 as default value because 1 is the first valid node id.
            // So if things get messed up, it will wreak the least havoc.
            this.id = 0;

            this.name = name;
            this.parent = null;
            this.children = [];
            this.scene = null;
            this.components = [];
            this.enabled = true;
            this.shouldRemove = false;
        }

        /**
         * Recursively update worldTransform of every subnode.
         *
         * @param force By default, this function updates world transform only if
         *     worldTransformDirty flag is set, this behaviour can be overriden
         *     with this flag
         */
        updateHierarchy(force=false) {
            let dirty = force || this.worldTransformDirty;

            if (dirty && parent) {
                this.worldTransform = mat4.multiply(parent.worldTransform, this.localTransform);
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

        get worldPosition() {
            return mat4.getTranslation(this.worldTransform);
        }

        get forward() {
            let m = this.worldTransform;
            return [m[2], m[6], m[10]];
        }

        get left() {
            let m = this.worldTransform;
            return [m[0], m[1], m[3]];
        }

        get up() {
            let m = this.worldTransform;
            return [m[1], m[5], m[9]];
        }

        createChild(name) {
            let child = new SceneNode(name);
            child.scene = this.scene;

            this.scene._registerNode(child);

            child.setParent(this);

            return child;
        }

        removeChild(child) {
        }

        removeChildAt(n) {
        }

        setParent(parent, keepTransform=true) {
            this.parent = parent;

            // TODO: Check if the scene is different, and either reject the change
            // or register the node to new scene

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

        /**
         * Creates a new component of the given type.
         *
         * @returns The newly created component
         */
        createComponent(type) {
            let tmp = new type();
            tmp.node = this;

            this.components.push(tmp);
            this.scene._registerComponent(tmp);
            
            return tmp;
        }

        /**
         * Returns first component of the given type.
         * This function takes into account inheritance hierarchy.
         * 
         * @returns the component or null if not found.
         */
        getComponent(type) {
            for (let c of this.components) {
                if (c instanceof type) {
                    return c;
                }
            }

            return null;
        }

        /**
         * Same as getComponent, but instead of only returning the first found
         * component, it returns every component of the given type.
         *
         * @param type Type to search for
         *
         * @returns Array of components of the given type. If none is found, empty array is returned.
         */
        getComponents(type) {
            let tmp = [];

            for (let c of this.components) {
                if (c instanceof type) {
                    tmp.push(c);
                }
            }

            return tmp;
        }

        /**
         * Removes first component of the given type
         *
         * If no component exists with the given type, no action is performed.
         */
        removeComponent(type) {
        }

        removeComponentAt(n) {
        }

        /**
         * Recursively iterate every child and call fn on them
         */
        walkAll(fn) {
            fn(this);

            for (let child of this.children) {
                child.walkAll(fn);
            }
        }

        /**
         * Recursively iterate every child and call fn on them, but only if the node is enabled.
         *
         * @fn The callbackback to use, should accept a single parameter.
         */
        walkEnabled(fn) {
            if (!this.enabled)
                return;

            fn(this);

            for (let child of this.children) {
                child.walkEnabled(fn);
            }
        }
    };

    /**
     * The root scene node.
     *
     * @extends SceneNode
     *
     * Root node does not differ much from any other scene node, except the
     * transform is ignored in the root node for performance reasons and it
     * contains some scene-wide variables.
     */
    context.Scene = class extends context.SceneNode {
        constructor() {
            super();

            this.scene = this;

            this.background = new Color(0.15, 0.15, 0.15, 1.0);
            this.ambientColor = new Color(0.01, 0.01, 0.01, 1.0);

            /// Mapping for quick node access by id.
            this.nodes = new Map();
            
            /// Mapping for quick component access by id.
            this.components = new Map();

            /// Used to generate unique node ids.
            this.nextComponentId = 1;

            /// Used to generate unique component ids.
            this.nextNodeId = 1;
        }

        /**
         * Returns a node with the given id.
         * Nodes are indexed by id so this is relatively fast function.
         *
         * @returns Node if found, null if the node was not found.
         */
        getNodeById(id) {
            return this.nodes.get(id);
        }

        /**
         * Warning, this function is slow!
         * It will linearly search every node for a node with the given name.
         *
         * @returns Node if found, null if the node was not found.
         */
        getNodeByName(name) {
            for (let [, node] of this.nodes) {
                if (node.name == name) {
                    return node;
                }
            }

            return null;
        }

        /**
         * Returns a component with the given id.
         * Components are indexed by id so this is relatively fast function.
         *
         * @returns Component if found, null if the component was not found.
         */
        getComponentById(id) {
            return this.components.get(id);
        }

        /**
         * Called when a node is added to the scene.
         */
        _registerNode(node) {
            let id = this.nextNodeId++;

            node.id = id;
            this.nodes.set(id, node);
        }

        /**
         * Called when a node is removed from scene.
         */
        _unregisterNode(node) {
            this.nodes.delete(node.id);
        }

        /**
         * Called when a component is added to the scene.
         */
        _registerComponent(comp) {
            let id = this.nextComponentId++;

            comp.id = id;
            this.components.set(id, comp);
        }

        /**
         * Called when a component is removed from the scene.
         */
        _unregisterComponent(comp) {
            this.components.delete(comp.id);
        }
    };

})(this);
