/* exported updateSceneGraph, SceneGraphMenu */

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
