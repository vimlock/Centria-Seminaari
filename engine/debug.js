/* exported DebugRenderer */
/* global mat3, vec3 */

"use strict";

class DebugRenderer {

    /*
     * Debug vertex looks like this:
     *
     * position: vec3
     * color: vec4:
     *
     */
    
    constructor(glContext, maxLines=500) {
        this._glContext = glContext;

        this._vertexSize = 7; // sizeof(position + color)
        this._maxLines = maxLines;

        this._vertices = new Float32Array(maxLines * this._vertexSize);

        this._lineIndices = new Uint16Array(maxLines * 2);
        this._faceIndices = new Uint16Array(maxLines * 2);

        this._nextVertexIndex = 0;
        this._nextFaceIndex = 0;
        this._nextLineIndex = 0;

        this._vbo = null;
        this._lineIb = null;
        this._faceIb = null;

        this._shader = null;

        this._initBuffers();
    }

    line(start, end, color) {
        this._addLine(start, end, color, color);
    }

    circle(center, radius, normal, color, filled=false, segments=32) {
        if (segments < 3)
            return;

        let q = Quaternion.fromRotation(vec3.up, normal);
        let mat = q.toMat3();

        let step = (Math.PI * 2.0) / segments;
        let previous = null;

        for (let i = 0; i <= segments; ++i) {
            let current = [
                Math.sin(step * i),
                Math.cos(step * i),
                0
            ];

            current = mat3.multiplyVector(mat, current);
            current = [
                center[0] + current[0] * radius,
                center[1] + current[1] * radius,
                center[2] + current[2] * radius,
            ];

            if (previous) {
                this._addLine(previous, current, color, color);
            }

            previous = current;
        }
    }

    dottedCircle(center, radius, normal, color, filled=false, segments=32) {
        if (segments < 3)
            return;

        let q = Quaternion.fromRotation(vec3.up, normal);
        let mat = q.toMat3();

        let step = (Math.PI * 2.0) / segments;
        let previous = null;

        for (let i = 0; i <= segments; ++i) {
            let current = [
                Math.sin(step * i),
                Math.cos(step * i),
                0
            ];

            current = mat3.multiplyVector(mat, current);
            current = [
                center[0] + current[0] * radius,
                center[1] + current[1] * radius,
                center[2] + current[2] * radius,
            ];

            if (previous) {
                this._addLine(previous, current, color, color);
                previous = null;
            }
            else {
                previous = current;
            }
        }
    }

    cube(center, radius, color, filled=false) {
        let half = radius * 0.5;

        let vertexOffset = this._nextVertexIndex;
        let lineOffset = this._nextLineIndex;
        let faceOffset = this._nextFaceIndex;

        this._addVertex(vec3.add(center, [-half, -half, -half]), color);
        this._addVertex(vec3.add(center, [ half, -half, -half]), color);
        this._addVertex(vec3.add(center, [ half,  half, -half]), color);
        this._addVertex(vec3.add(center, [-half,  half, -half]), color);

        this._addVertex(vec3.add(center, [-half, -half,  half]), color);
        this._addVertex(vec3.add(center, [ half, -half,  half]), color);
        this._addVertex(vec3.add(center, [ half,  half,  half]), color);
        this._addVertex(vec3.add(center, [-half,  half,  half]), color);

        let lines = [
            0, 1,  1, 2,  2, 3,  3, 0,

            4, 5,  5, 6,  6, 7,  7, 4,

            0, 4,  1, 5,  2, 6,  3, 7,
        ];

        for (let i = 0; i < lines.length; i += 2) {
            let start = lines[i + 0];
            let end = lines[i + 1];

            this._lineIndices[lineOffset + i + 0] = vertexOffset + start;
            this._lineIndices[lineOffset + i + 1] = vertexOffset + end;
        }

        this._nextLineIndex += lines.length;

        if (filled) {

            // Generated with trial and error, winding order is fucked up
            let faces = [
                // front
                0, 1, 2,  0, 2, 3,

                // back
                4, 5, 6,  4, 6, 7,

                // Bottom
                0, 4, 5,  0, 5, 1,

                // Top
                2, 3, 6,  6, 7, 3,

                // Left
                0, 3, 4,  4, 3, 7,

                // Right
                1, 5, 6,  6, 2, 1
            ];

            for (let i = 0; i < faces.length; i += 3) {
                this._faceIndices[faceOffset + i + 0] = vertexOffset + faces[i + 0];
                this._faceIndices[faceOffset + i + 1] = vertexOffset + faces[i + 1];
                this._faceIndices[faceOffset + i + 2] = vertexOffset + faces[i + 2];
            }

            console.log(this._faceIndices);

            this._nextFaceIndex += faces.length;
        }
    }

    sphere(center, radius, color, rings=8, sectors=8) {
    }

    cone(origin, length, radius, color, filled=false, segments=8) {
    }

    updateBuffers() {

        let gl = this._glContext;

        // Skip the buffer updates if there is not any data to upload there

        if (this._nextVertexIndex > 0) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this._vbo);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0,
                this._vertices.subarray(0, this._vertexSize * this._nextVertexIndex)
            );
        }
        
        if (this._nextFaceIndex > 0) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._faceIb);
            gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0,
                this._faceIndices.subarray(0, this._nextFaceIndex)
            );
        }

        if (this._nextLineIndex > 0) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._lineIb);
            gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0,
                this._lineIndices.subarray(0, this._nextLineIndex)
            );
        }
    }

    clear() {
        this._nextVertexIndex = 0;
        this._nextFaceIndex = 0;
        this._nextLineIndex = 0;
    }

    _addVertex(position, color) {
        let offset = this._nextVertexIndex * this._vertexSize;

        this._vertices[offset + 0] = position[0];
        this._vertices[offset + 1] = position[1];
        this._vertices[offset + 2] = position[2];

        this._vertices[offset + 3] = color.r;
        this._vertices[offset + 4] = color.g;
        this._vertices[offset + 5] = color.b;
        this._vertices[offset + 6] = color.a;

        this._nextVertexIndex++;
    }

    _addLine(start, end, startColor, endColor) {
        if (!endColor) {
            endColor = startColor;
        }

        if (this._nextVertexIndex + 2 >= this._maxLines * 2) {
            console.log("Debug line max count reached");
            return;
        }

        this._lineIndices[this._nextLineIndex + 0] = this._nextVertexIndex + 0;
        this._lineIndices[this._nextLineIndex + 1] = this._nextVertexIndex + 1;
        this._nextLineIndex += 2;

        let offset = this._nextVertexIndex * this._vertexSize;

        this._vertices[offset + 0] = start[0];
        this._vertices[offset + 1] = start[1];
        this._vertices[offset + 2] = start[2];

        this._vertices[offset + 3] = startColor.r;
        this._vertices[offset + 4] = startColor.g;
        this._vertices[offset + 5] = startColor.b;
        this._vertices[offset + 6] = startColor.a;

        this._nextVertexIndex++;

        offset = this._nextVertexIndex * this._vertexSize;
        this._vertices[offset + 0] = end[0];
        this._vertices[offset + 1] = end[1];
        this._vertices[offset + 2] = end[2];

        this._vertices[offset + 3] = endColor.r;
        this._vertices[offset + 4] = endColor.g;
        this._vertices[offset + 5] = endColor.b;
        this._vertices[offset + 6] = endColor.a;

        this._nextVertexIndex++;
    }

    _initBuffers() {
        let gl = this._glContext;

        let vb = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vb);
        gl.bufferData(gl.ARRAY_BUFFER, this._vertexSize * this._maxLines * 4, gl.STREAM_DRAW);

        // maxLines * sizeof(uint16) * vertices_per_line
        //
        // Well this is actually not enough for face index buffer
        // Because faces with more than 3 vertices take up more indices than lines.
        // But it's close enough.
        let ibSize = this._maxLines * 2 * 2;

        let lineIb = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lineIb);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, ibSize, gl.STREAM_DRAW);

        let faceIb = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, faceIb);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, ibSize, gl.STREAM_DRAW);

        this._vbo = vb;
        this._lineIb = lineIb;
        this._faceIb = faceIb;
    }
}
