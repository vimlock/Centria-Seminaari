/* exported Viewer, MenuView */

"use strict";

class MenuView {
    update() {
    }
}

class Viewer {

    constructor(scene) {
        this._activeNode = null;
        this._hiddenNodes = new Set();
        this._scene = scene;

        this._dirty = true;

        this._activeMenu = null;
    }

    update() {
        if (this._activeMenu) {
            this._activeMenu.update();
        }
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

}
