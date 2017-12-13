/* exported renderPanel */
/* global Color */

"use strict";

function renderPanel(viewer, root) {
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

    function colorInput(id, text) {
        let row = document.createElement("div");
        row.classList.add("row");

        row.innerHTML = 
            "<div class=\"six columns\">" +
                "<span class=\"label-body\">" + text + "</span>" +
            "</div>" +
            "<div class=\"four columns\">" +
                "<input class=\"u-full-width\" value=\"" + settings.get(id).toHexString() + "\">" +
            "</div>";

        let input = row.getElementsByTagName("input")[0];
        if (input) {
            input.onchange = function() {
                viewer._setRenderSetting(id, Color.parse(this.value));
            };
        }

        return row;
    }

    root.classList.add("u-max-full-width");
    root.classList.add("render-menu");

    root.appendChild(boolCheckbox("show-normals", "Show Normals"));
    root.appendChild(boolCheckbox("show-wireframe", "Show Wire"));

    root.appendChild(boolCheckbox("enable-reflections", "Enable Reflections"));
    root.appendChild(boolCheckbox("enable-diffuse", "Enable Diffuse Maps"));
    root.appendChild(boolCheckbox("enable-normalmaps", "Enable Normal Maps"));
    root.appendChild(boolCheckbox("enable-instancing", "Enable Instancing"));
    root.appendChild(boolCheckbox("enable-fog", "Enable Fog"));

    root.appendChild(boolCheckbox("enable-ambient", "Ambient Lighting"));
    root.appendChild(boolCheckbox("enable-direct", "Direct Lighting"));

    root.appendChild(colorInput("ambient-color", "Ambient Color"));
}
