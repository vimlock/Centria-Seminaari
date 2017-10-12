/* global engine, Color, vec3, mat4, Quaternion, Serialize, Deserialize */

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
            this._worldTransform = mat4.identity();
            this._worldTransformDirty = false;

            this._localPosition = vec3.zero;
            this._localRotation = Quaternion.identity;
            this._localScale = vec3.one;

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

            if (dirty) {
                this._updateWorldTransform();
            }

            for (let child of this.children) {
                child.updateHierarchy(dirty);
            }
        }

        update() {
            for (let child of this.children) {
                child.update();
            }
        }

        _markWorldTransformDirty() {
            // If this scene node is dirty, we can assume the children are dirty
            // as well and skip them.
            if (this._worldTransformDirty)
                return;

            this._worldTransformDirty = true;

            // Go down the transform hiararchy and mark children as dirty
            for (let child of this.children) {
                child._markWorldTransformDirty();
            }

        }

        _updateWorldTransform() {
            this._worldTransformDirty = false;

            if (this.parent && this.parent !== this.scene) {
                this._worldTransform = mat4.multiply(this.parent.worldTransform, this.localTransform);
            }
            else {
                this._worldTransform = this.localTransform;
            }
        }

        get worldTransform() {
            if (this._worldTransformDirty) {
                this._updateWorldTransform();
            }
            
            return this._worldTransform;
        }

        get localTransform() {
            let p = this._localPosition;
            let s = this._localScale;

            // Rotate
            let t = this._localRotation.toMat4();

            // Scale
            t[0] *= s[0];
            t[1] *= s[1];
            t[2] *= s[2];

            t[4] *= s[0];
            t[5] *= s[1];
            t[6] *= s[2];

            t[8] *= s[0];
            t[9] *= s[1];
            t[10] *= s[2];

            // Translate
            t[12] = p[0];
            t[13] = p[1];
            t[14] = p[2];

            return t;
        }

        get localPosition() {
            return this._localPosition;
        }

        set localPosition(value) {
            this._markWorldTransformDirty();
            this._localPosition = value;

        }

        get localRotation() {
            return this._localRotation;
        }

        set localRotation(value) {
            this._markWorldTransformDirty();
            this._localRotation = value;
        }

        get localScale() {
            return this._localScale;
        }

        set localScale(value) {
            this._markWorldTransformDirty();
            this._localScale = value;
        }

        get worldPosition() {
            return mat4.getTranslation(this.worldTransform);
        }

        set worldPosition(value) {
            this._markWorldTransformDirty();

            // Do we have a parent?
            if (this.parent && this.parent !== this.scene) {
                let t = this.parent.transform;
                this._localPosition = vec3.subtract(mat4.getTranslation(t), value);
            }
            else {
                this._localPosition = value;
            }
        }

        get worldRotaton() {
            return Quaternion.fromMat4(this.transform);
        }

        set worldRotation(rotation) {
            this._markWorldTransformDirty();

            // Do we have a parent?
            if (this.parent && this.parent !== this.scene) {
                let tmp = mat4.multiply(mat4.invert(this.parent.worldTransform, rotation.toMat4()));
                this._localRotation = Quaternion.fromMat4(tmp);
                this._localRotation.normalize();

            }
            else {
                this._localRotation = rotation;
            }
        }

        get worldScale() {
            // TODO
            return [1, 1, 1];
        }

        set worldScale(_value) {
            this._markWorldTransformDirty();
            // TODO
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
            this.removeChildAt(this.children.indexOf(child));
        }

        removeChildAt(n) {
            if (n < 0) {
                return;
            }

            this.children.splice(n, 1);
        }

        setParent(parent, keepTransform=true) {
            if (!(parent instanceof SceneNode)) { throw Error("Invalid parent type"); }

            if (this.parent) {
                this.parent.removeChild(this);
            }

            if (!parent) {
                parent = this.scene;
            }

            // TODO: Check if the scene is different, and either reject the change
            // or register the node to new scene

            this.parent = parent;
            if (parent) {
                parent.children.push(this);
            }

            if (!keepTransform || keepTransform)
                this._markWorldTransformDirty();
        }

        translateLocal(offset) {
            this.localPosition = vec3.add(this._localPosition, offset);
        }

        rotateLocal(rotation) {
            this.localRotation = Quaternion.multiply(this._localRotation, rotation);
        }

        scaleLocal(scale) {
            this.localScale = vec3.multiply(this._localScale, scale);
        }

        /**
         * Converts the SceneNode into a JSON representation from which it
         * can be saved to a file
         *
         * @returns JSON object
         */
        serializeJSON(serializer) {
            return {
                id: this.id,
                name: this.name,
                enabled: this.enabled,

                localPosition: Serialize.vec3(this._localPosition),
                localRotation: Serialize.quaternion(this._localRotation),
                localScale: Serialize.vec3(this._localScale),

                parent: serializer.nodeRef(this.parent),
                components: this.components.map(comp => comp.serializeJSON(serializer)),
            };
        }

        deserializeJSON(_src) {
            // TODO
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
        removeComponent(_type) {
            // TODO
        }

        removeComponentAt(_n) {
            // TODO
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

    class SceneSerializer {
        constructor() {
            this.resources = [];
        }

        resourceRef(type, name) {
            if (!name) {
                return -1;
            }

            let id = 0;

            for (let res of this.resources) {
                if (res[1] == name) {
                    if (res[0] !== type) {
                        console.log("Warning, mismatching resource types " +
                            type.name + " and " + res[0].name);
                    }

                    return id;
                }

                id++;
            }

            this.resources.push([type, name]);

            return id;
        }

        resourceRefArray(type, names) {
            return names.map(function (name) {
                return this.resourceRef(type, name);
            }, this).join(";");
        }

        nodeRef(target) {
            return target ? target.id : 0;
        }

        componentRef(target) {
            return target ? target.id : 0;
        }
    }


    class SceneDeserializer {
        constructor(scene, nodeMapping, componentMapping, resourceMapping) {
            this.scene = scene;
            this.resources = scene.engine.resources;
            this.nodeMapping = nodeMapping;
            this.componentMapping = componentMapping;
            this.resourceMapping = resourceMapping;
        }

        resourceRef(type, id) {
            if (id >= 0) {
                return this.resources.getCached(type, this.resourceMapping[id][1]);
            }
            else {
                return null;
            }
        }

        resourceRefName(id) {
            if (id >= 0)
                return this.resourceMapping[id][1];
            else
                return null;
        }

        resourceRefArray(type, ids) {
            return ids.split(";").map(function(id) {
                if (id >= 0) {
                    return this.resourceRef(type, id);
                }
                else {
                    return null;
                }
            }, this);
        }

        resourceRefArrayNames(ids) {
            return ids.split(";").map(function(id) {
                return this.resourceRefName(id);
            }, this);
        }

        nodeRef(id) {
            return this.nodeMapping(id);
        }

        componentRef(id) {
            return this.componentMapping(id);
        }
    }

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

            this.engine = engine;

            this.scene = this;

            this.background = new Color(0.15, 0.15, 0.15, 1.0);
            this.ambientColor = new Color(0.01, 0.01, 0.01, 1.0);

            this.fogEnabled = true;
            this.fogMode = "linear"; // linear|quadratic
            this.fogColor = new Color(0.1, 0.1, 0.1, 1.0);
            this.fogStart = 10.0;
            this.fogDistance = 30.0;

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
         * Converts the Scene into a JSON representation from which it
         * can be saved to a file.
         *
         * This method overrides SceneNode.serializeJson because Scene objects
         * have special properties which also need to be serialized.
         */
        serializeJSON() {

            let nodes = [];
            let serializer = new SceneSerializer();

            for (let child of this.children) {
                child.walkAll(function (node) {
                    nodes.push(node.serializeJSON(serializer));
                });
            }

            let resources = serializer.resources.map(x => x[0].name +";" + x[1]);

            return {
                background: Serialize.color(this.background),
                ambientColor: Serialize.color(this.ambientColor),

                fogEnabled: this.fogEnabled,
                fogMode: this.fogMode,
                fogColor: Serialize.color(this.fogColor),
                fogStart: this.fogStart,
                fogDistance: this.fogDistance,

                resources: resources,
                nodes: nodes,
            };
        }

        /**
         *
         */
        deserializeJSON(src, onCompleteCallback) {

            // Queue resources for loading
            let resourceMapping = src.resources.map(function(resource) {
                let [typeName, resourceName] = resource.split(";");
                let type = this.engine.resourceTypes[typeName];
                
                if (!type) {
                    console.log("Unknown resource type \"" + typeName + "\"");
                    return;
                }

                engine.resources.queueForLoading(type, resourceName);

                return [type, resourceName];
            }, this);

            this.background = Deserialize.color(src.background);
            this.ambientColor = Deserialize.color(src.ambientColor);
            
            this.fogEnabled = src.fogEnabled,
            this.fogMode = src.fogMode;
            this.fogColor = Deserialize.color(src.fogColor);
            this.fogStart = src.fogStart;
            this.fogDistance = src.fogDistance;

            let nodeIdMapping = new Map();
            let componentIdMapping = new Map();

            let nodes = new Array(src.nodes.length);
            let components = new Array();

            for (let nodeSrc of src.nodes) {
                let node = new context.SceneNode();
                let id = this.nextNodeId++;

                nodeIdMapping.set(nodeSrc.id, node);

                node.id = id;
                node.name = nodeSrc.name;
                node.enabled = nodeSrc.enabled;
                node.scene = this;

                node._localPosition = Deserialize.vec3(nodeSrc.localPosition);
                node._localRotation = Deserialize.quaternion(nodeSrc.localRotation);
                node._localScale = Deserialize.vec3(nodeSrc.localScale);

                if (nodeSrc.parent) {
                    node.setParent(nodeIdMapping.get(nodeSrc.parent));
                }
                else {
                    node.setParent(this);
                }

                for (let compSrc of nodeSrc.components) {
                    let type = this.engine.componentTypes[compSrc.type];
                    if (!type) {
                        console.log("Component of type " + compSrc.type + " does not exist.");
                        continue;
                    }

                    let comp = new type();
                    comp.id = this.nextComponentId++;
                    componentIdMapping.set(compSrc.id, comp);
                    node.components.push(comp);

                    components.push([compSrc, comp]);
                }

                nodes.push(node);
            }

            let deserializer = new SceneDeserializer(this, nodeIdMapping,
                componentIdMapping, resourceMapping);

            let scene = this;
            engine.resources.onAllLoaded(function() {
                for (let [compSrc, comp] of components) {
                    comp.deserialize(deserializer, compSrc.properties);
                }

                if (onCompleteCallback)
                    onCompleteCallback(scene);
            });
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
         * Returns every component in the scene with the given type
         *
         * @param type Type of the component to search for 
         * @returns {Array.<type>
         */
        getAllComponents(type) {
            let c = [];

            for (let [, component] of this.components) {
                if (component instanceof type) {
                    c.push(component);
                }
            }

            return c;
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
