/* exported Viewer */
/* global engine, hierarchyPanel, renderPanel, Model, NormalRenderer */

"use strict";

class Viewer {

    constructor(scene) {
        this._activeNode = null;
        this._hiddenNodes = new Set();
        this._scene = scene;

        this._dirty = true;

        this._panels = {};
        this._panelContainer = null;

        this._activePanel = null;

        this._renderSettingsDirty = true;
        this._renderSettings = new Map([
            [ "show-normals", false ],
            [ "show-wireframe", false ],

            [ "enable-reflections", true ],
            [ "enable-normalmaps", true ],
            [ "enable-instancing", true ],
            [ "enable-fog", true ],

            [ "enable-diffuse", true ],
            [ "enable-ambient", true ],
            [ "enable-direct", true ],

            [ "ambient-color", scene.ambientColor ],
        ]);
    }

    init() {
        let viewer = this;
        this._scene.onModified.addListener(function() {
            viewer._dirty = true;
        });

        this._panelContainer = document.getElementById("panel-inner");

        this._panels["hierarchy"] = {
            button: document.getElementById("viewer-hierarchy-panel-button"),
            create: hierarchyPanel,
        };

        this._panels["render"] = {
            button: document.getElementById("viewer-render-panel-button"),
            create: renderPanel,
        };

        for (let name in this._panels) {
            this._panels[name].button.onclick = function() {
                viewer.setActivePanel(viewer._panels[name]);
            };
        }

        this.setActivePanel(this._panels["render"]);
    }

    update() {

        if (this._renderSettingsDirty) {
            this._updateRenderSettings();
            this._renderSettingsDirty = false;
        }

        if (!this._dirty) {
            return;
        }

        this._dirty = false;

        this._panelContainer.innerHTML = "";
        if (!this._activePanel) {
            return;
        }

        this._activePanel.create(this, this._panelContainer);
    }


    hideSceneNode(node) {
        if (!node)
            return;

        this._dirty = true;
        this._hiddenNodes.add(node.id);
    }

    showSceneNode(node) {
        if (!node)
            return;

        this._dirty = true;
        this._hiddenNodes.delete(node.id);
    }

    isSceneNodeShown(node) {
        if (!node)
            return false;

        return !this._hiddenNodes.has(node.id);
    }

    selectSceneNode(node) {
        this._dirty = true;
        this._activeNode = node;
    }

    getSelectedSceneNode() {
        return this._activeNode;
    }

    setActivePanel(panel) {
        this._activePanel = panel;
        this._dirty = true;

        // Update the panel buttons
        for (let name in this._panels) {
            let button = this._panels[name].button;

            if (panel == this._panels[name]) {
                button.classList.add("button-primary");
            }
            else {
                button.classList.remove("button-primary");
            }
        }
    }

    _setRenderSetting(name, value) {
        if (this._renderSettings.get(name) !== value) {
            this._renderSettings.set(name, value);
            this._renderSettingsDirty = true;
        }
    }

    _updateRenderSettings()
    {
        let renderer = engine.renderer;
        if (!renderer) {
            console.log("No renderer available");
            return;
        }

        renderer.enableReflections = this._renderSettings.get("enable-reflections");
        renderer.enableInstancing = this._renderSettings.get("enable-instancing");

        let shaderDisables = new Set();

        if (!this._renderSettings.get("enable-fog"))
            shaderDisables.add("FOG");

        if (!this._renderSettings.get("enable-diffuse"))
            shaderDisables.add("DIFFUSEMAP");

        if (!this._renderSettings.get("enable-normalmaps"))
            shaderDisables.add("NORMALMAP");

        if (!this._renderSettings.get("enable-ambient"))
            shaderDisables.add("AMBIENT");

        if (!this._renderSettings.get("enable-direct"))
            shaderDisables.add("LIGHTS");

        renderer.disabledDefines = shaderDisables;

        if (this._renderSettings.get("show-normals")) {
            this._scene.walkAll(function(node) {
                if (node.getComponent(NormalRenderer))
                    return;

                if (node.getComponent(Model)) {
                    node.createComponent(NormalRenderer);
                }
            });
        }
        else {
            this._scene.walkAll(function(node) {
                node.removeComponent(NormalRenderer);
            });
        }

        if (this._renderSettings.get("show-wireframe")) {
            renderer.drawTypeOverride = "lines";
        }
        else {
            renderer.drawTypeOverride = null;
        }
    }
}
