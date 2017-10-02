engine.resources = {
	cache: {}
};



(function(context) {
	
	
	context.ResourceManager = class {
		load(type, sourceUrl, sync) {
			/// Get file with XMLHttpRequest
			var x = new XMLHttpRequest();
			
			/// Open a new request and set the preferred file transfer method
			/// GET or POST. POST is more secure than GET
			x.open("POST", sourceUrl, sync);
			
			/// If requesting an image, download a blob, else load plain text
			x.responseType = type.img ? "blob" : ("text/plain", x.overrideMimeType("text/plain"));
			
			/// Set handler for when file is fully received
			x.onload = this.handler;
			
			/// Handler needs some data. Set said data to the request
			x.type = type;
			x.sourceUrl = sourceUrl;
			
			/// Send request to server. Server send data with 
			x.send();
		}
		
		handler() {
			/// If file transfer is not succesfull, return null
			if(this.status !== 200)
				return null;
			
			let resource = this.type.parse(this.response, this.sourceUrl);
			
			/// Check cache, if resource is not already there
			if(!engine.resources.cache[resource.name])
				engine.resources.cache[resource.name] = resource;
			
			return resource;
		}
	}
	
	// Example class
	context.VertexData = class {
		constructor(id, name, sourceUrl, mesh) {
			this.id        = id        || null;
			this.name      = name      || null;
			this.sourceUrl = sourceUrl || null;
			this.mesh      = mesh      || null;
		}
		
		parse(data, sourceUrl) {
			/// TODO: Create a way to determine an unique id
			let id = null;
			
			/// The name is fetched from filename (for now)
			/// Gets the characters between / and .
			let name = sourceUrl.match(/\/(\w+)\./)[1];
			
			/// Parse the mesh data
			let vertices   = data.slice(data.indexOf('v '),  data.indexOf('vt '));
			let textCoords = data.slice(data.indexOf('vt '), data.indexOf('vn '));
			let normals    = data.slice(data.indexOf('vn '), data.indexOf('f '));
			let indices    = data.slice(data.indexOf('f '),  data.length);
			
			vertices   = vertices.match(/-?\d\.\d*/g).map(parseFloat);
			textCoords = textCoords.match(/\d\.\d*/g).map(parseFloat);
			normals    = normals.match(/-?\d\.\d*/g).map(parseFloat);
			indices    = indices.match(/\d+/g).map(function(num) { return parseInt(num, 10) - 1 });
			
			
			/** HOX: Temporarily fill textCoords with color */
			/** Remove the next 4 lines to use texture coordinates normally */
			let len = textCoords.length / 2;
			textCoords.length = 0;
			while(len--)
				textCoords.push(...[ 0.0, 1.0, 0.0 ]);
			
			
			let v = [], c = [], n = [], ind = [];
			let ilen = indices.length;
			let count = 0;
			
			while(count < ilen) {
				ind.push(count / 3);
				v.push(vertices[indices[count] * 3 + 0],
				       vertices[indices[count] * 3 + 1],
				       vertices[indices[count] * 3 + 2]);
				count++;
				c.push(textCoords[indices[count] * 3 + 0],
				       textCoords[indices[count] * 3 + 1],
				       textCoords[indices[count] * 3 + 2]);
				count++;
				n.push(normals[indices[count] * 3 + 0],
				       normals[indices[count] * 3 + 1],
				       normals[indices[count] * 3 + 2]);
				count++;
			}
			
			console.log(v);
			console.log(c);
			console.log(n);
			console.log("c");
			console.log(indices);
			console.log(ind);
			
			let mesh = buildTestMesh(v, c, n, ind);
			
			return new VertexData(id, name, sourceUrl, mesh);
		}
	}
	
	
	// Example class
	context.Texture = class {
		constructor(id, name, sourceUrl, imgSrc) {
			this.id        = id        || null;
			this.name      = name      || null;
			this.sourceUrl = sourceUrl || null;
			this.img       = new Image();
			if(imgSrc)
				this.img.src = imgSrc;
		}
		
		parse(data, sourceUrl) {
			/// TODO: Create a way to determine an unique id
			let id = Object.keys(engine.resources.cache).length;
			
			/// The name is fetched from filename (for now)
			/// Gets the characters between / and .
			let name = sourceUrl.match(/\/(\w+)\./)[1];
			
			/// Create an URL for the image stored in RAM
			/// The URL is given for an image object as a source
			let imgSrc = window.URL.createObjectURL(data);
			
			return new Texture(id, name, sourceUrl, imgSrc);
		}
	}
	
	
})(this);