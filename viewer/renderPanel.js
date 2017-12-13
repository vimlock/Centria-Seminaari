/* exported renderPanel */
"use strict";

function renderPanel(viewer, root) {
    let scene = viewer._scene;
    let settings = viewer._renderSettings;

    function boolCheckbox(id, text) {

        let row = document.createElement("div");
        row.classList.add("row");

        row.innerHTML = 
            "<div class=\"nine columns\">" +
                "<span class=\"label-body\">" + text + "</span>" +
            "</div>" +
            "<div class=\"three columns\">" +
                "<input type=\"checkbox\" " + (settings.get(id) ? "checked" : "") +">" +
            "</div>";

        let input = row.getElementsByTagName("input")[0];
        if (input) {
            input.onclick = function() {
                viewer._setRenderSetting(id, this.checked);
            };
        }

        return row;
    }


    root.classList.add("u-max-full-width");
    root.appendChild(boolCheckbox("show-normals", "Show Normals"));

    root.appendChild(boolCheckbox("enable-reflections", "Enable Reflections"));
    root.appendChild(boolCheckbox("enable-normalmaps", "Enable Normal Maps"));
    root.appendChild(boolCheckbox("enable-instancing", "Enable Instancing"));
    root.appendChild(boolCheckbox("enable-fog", "Enable Fog"));

    root.appendChild(boolCheckbox("enable-ambient", "Ambient Lighting"));
    root.appendChild(boolCheckbox("enable-direct", "Direct Lighting"));
}
