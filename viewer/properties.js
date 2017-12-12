/* exported updateProperties */

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
