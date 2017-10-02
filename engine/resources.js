engine.resources = {
	cache: {}
};




(function(context) {
	
	
	context.ResourceManager = class {
		load(type, sourceUrl) {
			var x = new XMLHttpRequest();
			x.open("POST", sourceUrl, true);
			x.responseType = type.img ? "blob" : ("text/plain", x.overrideMimeType("text/plain"));
			x.onload = this.handler;
			
			x.type = type;
			x.sourceUrl = sourceUrl;
			
			x.send();
		}
		
		handler() {
			if(this.status !== 200)
				return;
			
			let resource = this.type.parse(this.response);
			engine.resources.cache[this.type.name] = resource;
			return resource;
		}
	}
	
	// Example class
	context.VertexData = class {
		constructor() {
			this.id = null;
			this.name = null;
			this.sourceUrl = null;
		}
		
		parse(data) {
			// No real parsing done currently
			this.vertexData = data;
			return this.vertexData;
		}
	}
	
	
	// Example class
	context.Texture = class {
		constructor() {
			this.img = new Image();
			this.id = null;
			this.name = null;
			this.sourceUrl = null;
		}
		
		parse(data) {
			this.img.src = window.URL.createObjectURL(data);
			return this.img;
		}
	}
	
	
})(this);