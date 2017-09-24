engine.filehandler = {};





engine.filehandler.handleFileUpload = function(e) {
	e.preventDefault();
	e.stopPropagation();
	
	var files = e.dataTransfer.files;
	
	if(files.length > 1) {
		//document.getElementById("list").innerHTML = "Please drop one file at a time";
		files.length = 0;
		return;
	}
	
	var file = files[0];
	if(!/[\w\d]+\.obj/i.test(file.name)) {
		//document.getElementById("list").innerHTML = "only .obj files are currently supported";
		files.length = 0;
		return
	}
	
	var reader = new FileReader();
	reader.onload = function(e) {
		//document.getElementById("list").innerHTML = e.target.result;
		//engine.models[this.fileName.slice(0, this.fileName.indexOf(".obj"))] = webgl.parseObjFileToModel(e.target.result, true);
		engine.models.cube = webgl.parseObjFileToModel(e.target.result, true);
		engine.models.cube.program = engine.gl.program.default;
		engine.models.cube.vertNum = engine.models.cube.vertices.length / 3;
		engine.models.cube.vao = webgl.createModelVaoAndBuffers(engine.gl, engine.models.cube);
		obj.model = engine.models.cube;
	}
	reader.fileName = file.name;
	reader.readAsText(file, "UTF-8");
}