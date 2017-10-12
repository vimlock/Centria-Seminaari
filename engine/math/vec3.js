"use strict";

(function(context) {
    
    
	context.vec3 = {
		
		
		add: function(a, b) {
			return [ a[0] + b[0], a[1] + b[1], a[2] + b[2] ];
		},
		
		
		subtract: function(a, b) {
			return [ a[0] - b[0], a[1] - b[1], a[2] - b[2] ];
		},
		
		
		multiply: function(a, b) {
			return [ a[0] * b[0], a[1] * b[1], a[2] * b[2] ];
		},
		
		
		normalize: function(v) {
			var len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
			return len > 0 ? [ v[0] / len, v[1] / len, v[2] / len ] : [ 0.0, 0.0, 0.0 ];
		},

        dot: function(a, b) {
            return (
                a[0] * b[0] +
                a[1] * b[1] +
                a[2] * b[2]
            );
        },
		
		cross: function(a, b) {
			return [
				a[1] * b[2] - a[2] * b[1],
				a[2] * b[0] - a[0] * b[2],
				a[0] * b[1] - a[1] * b[0] ];
		},
		
		
		getNormal: function(a, b, c) {
			return this.normalize(this.cross(this.subtract(a, b), this.subtract(a, c)));
		},
		
		
		translate: function(x, y, z) {
			
		},
		
		
		scale: function(a, b) {
            return [a[0] * b, a[1] * b, a[2] * b];
		},

        length: function(a) {
            return Math.sqrt(a[0] * a[0]  + a[1] * a[1] + a[2] * a[2]);
        },

        lengthSquared: function(a) {
            return a[0] * a[0]  + a[1] * a[1] + a[2] * a[2];
        },

        distance: function(a, b) {
            return this.length(this.subtract(a, b));
        },

        distanceSquared: function(a, b) {
            return this.lengthSquared(this.subtract(a, b));
        },
		
		rotateX: function(angle) {
			
		},
		
		
		rotateY: function(angle) {
			
		},
		
		
		rotateZ: function(angle) {
			
		},
		
		
		get zero()    { return [  0,  0,  0 ]; },
		get one()     { return [  1,  1,  1 ]; },
		get left()    { return [ -1,  0,  0 ]; },
		get right()   { return [  1,  0,  0 ]; },
		get down()    { return [  0, -1,  0 ]; },
		get up()      { return [  0,  1,  0 ]; },
		get back()    { return [  0,  0, -1 ]; },
		get forward() { return [  0,  0,  1 ]; }
		
		
	};
	
	
})(this);
