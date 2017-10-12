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
		return;
	}
	
	var reader = new FileReader();
	reader.fileName = file.name;
	reader.onload = function() {
		let rawMesh = Mesh.parse(reader.result);
		// let mesh = Mesh.fromData(rawMesh.);
	}
	reader.readAsText(file, "UTF-8");
}