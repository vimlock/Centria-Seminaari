/* exported hierarchyPanel */

"use strict";

function updateComponent(viewer, component) {
    let div = document.createElement("div");
    div.classList.add("component");

    div.innerText = component.constructor.name;

    return div;
}

function updateProperties(viewer) {
    let node = viewer.getSelectedSceneNode();
    if (!node) {
        return null;
    }

    let pos = node.worldPosition.map(x => x.toFixed(2));
    let rot = node.worldRotation.toArray().map(x => x.toFixed(2));
    let sca = node.worldScale.map(x => x.toFixed(2));

    let properties = document.createElement("div");
    properties.classList.add("properties");

    let nodeHTML = 
    "<hr />" +
    "<div class=\"u-max-full-width\">" +
        "<div class=\"row\">" + 
            "<div class=\"twelve columns\">Position</div>" +
        "</div><div class=\"row\">" + 
            pos.map(x => "<div class=\"four columns\">" + x + "</div>").join("") +
        "</div><div class=\"row\">" + 
            "<div class=\"twelve columns\">Rotation</div>" + 
        "</div><div class=\"row\">" + 
            rot.map(x => "<div class=\"three columns\">" + x + "</div>").join("") +
        "</div><div class=\"row\">" + 
            "<div class=\"twelve columns\">Scale</div>" + 
        "</div><div class=\"row\">" + 
            sca.map(x => "<div class=\"four columns\">" + x + "</div>").join("") +
        "</div>" + 
    "</div>" ;

    properties.innerHTML = nodeHTML;

    for (let component of node.components) {
        let tmp = updateComponent(viewer, component);
        if (tmp) {
            properties.appendChild(document.createElement("hr"));
            properties.appendChild(tmp);
        }
    }

    return properties;
}

function updateSceneGraph(viewer, scene) {

    function onClickSelect(event) {
        let id = event.target.parentNode.dataset.sceneNodeId;
        viewer.selectSceneNode(scene.getNodeById(parseInt(id)));
    }

    function onClickToggleVisible(event) {
        let id = event.target.parentNode.dataset.sceneNodeId;
        let sceneNode = scene.getNodeById(parseInt(id));

        if (viewer.isSceneNodeShown(sceneNode)) {
            viewer.hideSceneNode(sceneNode);
        }
        else {
            viewer.showSceneNode(sceneNode);
        }
    }

    function buildGraph(sceneNode, parentList) {

        let shown = viewer.isSceneNodeShown(sceneNode);
        let selected = viewer.getSelectedSceneNode() === sceneNode;

        let item = parentList.appendChild(document.createElement("li"));
        item.dataset.sceneNodeId = sceneNode.id;
        item.classList.add("scene-graph-node");

        if (sceneNode.enabled) {
            item.classList.add("scene-node-enabled");
        }
        else {
            item.classList.add("scene-node-disabled");
        }

        if (selected) {
            item.classList.add("scene-node-selected");
        }

        let title = item.appendChild(document.createElement("span"));
        title.innerText = sceneNode.name;
        title.addEventListener("click", onClickSelect, false);

        if (sceneNode.children.length > 0) {
            let button = item.appendChild(document.createElement("span"));
            button.innerText = shown ? "(-)" : "(+)";
            button.addEventListener("click", onClickToggleVisible, false);
        }

        if (!shown || sceneNode.children.length === 0) {
            return;
        }

        let childList = parentList.appendChild(document.createElement("ul"));

        for (let child of sceneNode.children) {
            buildGraph(child, childList);
        }
    }

    let graph = document.createElement("div");
    graph.classList.add("scene-graph");

    let rootNodeList = graph.appendChild(document.createElement("ul"));

    for (let child of scene.children) {
        buildGraph(child, rootNodeList);
    }

    return graph;
}

function hierarchyPanel(viewer, root) {
    
    let scene = viewer._scene;

    let sgraph = updateSceneGraph(viewer, scene);
    if (sgraph) {
        root.appendChild(sgraph);
    }

    let properties = updateProperties(viewer);
    if (properties) {
        root.appendChild(properties);
    }
}
