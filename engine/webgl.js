var webgl = {};
webgl.defaults = {
	shaderIds: {
		vertexShader: "vertex_shader",
		fragmentShader: "fragment_shader"
	},
	fieldOfView:     Math.PI * 0.25,
	aspectRatio:     0,
	minViewDistance: 0.1,
	maxViewDistance: 100.0,
	program:         [],
	perspective:     mat4.identity(),
	view:            mat4.identity()
}





webgl.init = function(canvasId) {
	var gl = document.getElementById(canvasId).getContext("webgl2");
	var vertexShader;
	var fragmentShader;
	
	gl.fieldOfView     = Math.PI * 0.25;
	gl.aspectRatio     = 0;
	gl.minViewDistance = 0.1;
	gl.maxViewDistance = 100.0;
	gl.program         = {};
	gl.perspective     = mat4.identity();
	gl.view            = mat4.identity();
	
	vertexShader                          = this.createShader(gl, gl.VERTEX_SHADER, this.defaults.shaderIds.vertexShader);
	fragmentShader                        = this.createShader(gl, gl.FRAGMENT_SHADER, this.defaults.shaderIds.fragmentShader);
	gl.program.default                    = this.createProgram(gl, vertexShader, fragmentShader);
	gl.program.default.vertexShader       = vertexShader;
	gl.program.default.fragmentShader     = fragmentShader;
	gl.program.default.attributeLocations = this.getAttributeLocations(gl, gl.program.default);
	gl.program.default.uniformLocations   = this.getUniformLocations(gl, gl.program.default);
	
	this.resize(gl, window.innerWidth, window.innerHeight);
	this.setDefaultRenderRules(gl);
	
	return gl;
}





webgl.setDefaultRenderRules = function(gl) {
	gl.enable(gl.DEPTH_TEST);
	gl.frontFace(gl.CCW);
	gl.enable(gl.CULL_FACE);
	gl.cullFace(gl.FRONT);
	gl.clearColor(0.75, 0.85, 0.8, 1.0);
}





webgl.createShader = function(gl, type, sourceId) {
	var shader = gl.createShader(type);
	gl.shaderSource(shader, document.getElementById(sourceId).innerHTML);
	gl.compileShader(shader);
	
	var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
	if(success)
		return shader;
	
	console.log("No success in creating " + type + " shader");
	gl.deleteShader(shader);
}





webgl.createProgram = function(gl, vertexShader, fragmentShader) {
	var program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);
	
	var success = gl.getProgramParameter(program, gl.LINK_STATUS);
	if(success)
		return program;
	
	console.log("Creating program failed");
	gl.deleteProgram(program);
}





webgl.getAttributeLocations = function(gl, program) {
	return {
		position: gl.getAttribLocation(program, "a_position"),
		color:    gl.getAttribLocation(program, "a_color")
	};
}





webgl.getUniformLocations = function(gl, program) {
	return {
		modelTransformLocation: gl.getUniformLocation(program, "model"),
		perspectiveLocation:    gl.getUniformLocation(program, "perspective"),
		viewLocation:           gl.getUniformLocation(program, "view")
	};
}





webgl.createModelVaoAndBuffers = function(gl, model) {
	// Vao
	var vao = gl.createVertexArray();
	gl.bindVertexArray(vao);
	
	// Position
	var buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.vertices), gl.STATIC_DRAW);
	
	gl.vertexAttribPointer(model.program.attributeLocations.position, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(model.program.attributeLocations.position);
	
	// Color
	if(model.colors) {
		buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.colors), gl.STATIC_DRAW);
		
		gl.vertexAttribPointer(model.program.attributeLocations.color, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(model.program.attributeLocations.color);
	}
	
	// Unbind vao to avoid errors
	gl.bindVertexArray(null);
	
	return vao;
}





webgl.drawObjectModel = function(gl, object) {
	var model = object.model;
	
	gl.useProgram(model.program);
	gl.bindVertexArray(model.vao);
	
	gl.uniformMatrix4fv(model.program.uniformLocations.modelTransformLocation, false, new Float32Array(object.transform));
	gl.uniformMatrix4fv(model.program.uniformLocations.perspectiveLocation,    false, new Float32Array(gl.perspective));
	gl.uniformMatrix4fv(model.program.uniformLocations.viewLocation,           false, new Float32Array(mat4.invert(gl.view)));
	
	gl.drawArrays(gl.TRIANGLES, 0, model.vertNum);
	gl.bindVertexArray(null);
}





webgl.resize = function(gl, w, h) {
	gl.canvas.width  = w;
	gl.canvas.height = h;
	gl.viewport(0,0,w,h);
	gl.aspectRatio   = w / h;
	gl.perspective   = mat4.perspective(gl.fieldOfView, w / h, gl.minViewDistance, gl.maxViewDistance);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}





webgl.parseObjFileToModel = function(rawFile, name, withIndices) {
	var vertices   = rawFile.slice(rawFile.indexOf('v '),	rawFile.indexOf('vt '));
	var textCoords = rawFile.slice(rawFile.indexOf('vt '),	rawFile.indexOf('vn '));
	var normals    = rawFile.slice(rawFile.indexOf('vn '),	rawFile.indexOf('usemtl '));
	var indices    = rawFile.slice(rawFile.indexOf('f '),	rawFile.length);
	
	vertices   = vertices.match(/-?\d\.\d+/g).map(parseFloat);
	textCoords = textCoords.match(/\d\.\d+/g).map(parseFloat);
	normals    = normals.match(/-?\d\.\d+/g).map(parseFloat);
	indices    = indices.match(/\d+/g).map(function(num) { return parseInt(num, 10) });
	
	var ci = 0; // Current indice
	var indl = indices.length; // Indices length (amount)
	var v = [], t = [], n = [];
	var model = {};
	
	if(withIndices) {
		/* Create model with indices */
		while(ci < indl) {
			v[v.length] = indices[ci++];
			t[t.length] = indices[ci++];
			n[n.length] = indices[ci++];
		}
		// Push vertex data and indices to model data
		model.verticeIndices = v;
		model.textCoordIndices = t;
		model.normalIndices = n;
		
		model.vertices = vertices;
		model.textCoords = textCoords;
		model.normals = normals;
	} else {
		/* Create model without indices */
		while(ci < indl) {
			v.push(vertices[indices[ci] * 3 ],
			       vertices[indices[ci] * 3 + 1 ],
			       vertices[indices[ci] * 3 + 2 ]);
			ci++
			t.push(textCoords[indices[ci] * 2 ],
			       textCoords[indices[ci] * 2 + 1 ]);
			ci++
			n.push(normals[indices[ci] * 3 ],
			       normals[indices[ci] * 3 + 1 ],
			       normals[indices[ci] * 3 + 2 ]);
			ci++
		}
		// Push vertex data to model data
		model.vertices = v;
		model.textCoords = t;
		model.normals = n;
	}
	return model;
}