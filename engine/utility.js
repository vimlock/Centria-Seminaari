(function() {
	
	//  Holds all function that return 16 cell arrays (4x4, 3d matrices)
	this.mat4 = {
		
		
		identity: function() {
			return [
				1, 0, 0, 0,
				0, 1, 0, 0,
				0, 0, 1, 0,
				0, 0, 0, 1 ];
		},
		
		
		perspective: function(fovrad, aspectRatio, near, far) {
			var f        = 1.0 / Math.tan(fovrad / 2);
			var rangeInv = 1 / (near - far);
			return [
				f / aspectRatio, 0, 0,                         0,
				0,               f, 0,                         0,
				0,               0, (near + far) * rangeInv,   -1,
				0,               0, near * far * rangeInv * 2, 0 ];
		},
		
		
		lookAt: function(camPos, target, up) {
			var zAxis = vec3.normalize(vec3.subtract(camPos, target));
			var xAxis = vec3.cross(up, zAxis);
			var yAxis = vec3.cross(zAxis, xAxis);
			
			return [
				xAxis[0],  xAxis[1],  xAxis[2],	0,
				yAxis[0],  yAxis[1],  yAxis[2],	0,
				zAxis[0],  zAxis[1],  zAxis[2],	0,
				camPos[0], camPos[1], camPos[2],	1 ];
		},
		
		
		invert: function(m) {
			var det;
			var i;
			var invOut = [];
			var inv    = [];
			inv[0] = m[5]  * m[10] * m[15] -
					 m[5]  * m[11] * m[14] -
					 m[9]  * m[6]  * m[15] +
					 m[9]  * m[7]  * m[14] +
					 m[13] * m[6]  * m[11] -
					 m[13] * m[7]  * m[10];
			inv[4] = -m[4]  * m[10] * m[15] +
					  m[4]  * m[11] * m[14] +
					  m[8]  * m[6]  * m[15] -
					  m[8]  * m[7]  * m[14] -
					  m[12] * m[6]  * m[11] +
					  m[12] * m[7]  * m[10];
			inv[8] = m[4]  * m[9] * m[15] -
					 m[4]  * m[11] * m[13] -
					 m[8]  * m[5] * m[15] +
					 m[8]  * m[7] * m[13] +
					 m[12] * m[5] * m[11] -
					 m[12] * m[7] * m[9];
			inv[12] = -m[4]  * m[9] * m[14] +
					   m[4]  * m[10] * m[13] +
					   m[8]  * m[5] * m[14] -
					   m[8]  * m[6] * m[13] -
					   m[12] * m[5] * m[10] +
					   m[12] * m[6] * m[9];
			inv[1] = -m[1]  * m[10] * m[15] +
					  m[1]  * m[11] * m[14] +
					  m[9]  * m[2] * m[15] -
					  m[9]  * m[3] * m[14] -
					  m[13] * m[2] * m[11] +
					  m[13] * m[3] * m[10];
			inv[5] = m[0]  * m[10] * m[15] -
					 m[0]  * m[11] * m[14] -
					 m[8]  * m[2] * m[15] +
					 m[8]  * m[3] * m[14] +
					 m[12] * m[2] * m[11] -
					 m[12] * m[3] * m[10];
			inv[9] = -m[0]  * m[9] * m[15] +
					  m[0]  * m[11] * m[13] +
					  m[8]  * m[1] * m[15] -
					  m[8]  * m[3] * m[13] -
					  m[12] * m[1] * m[11] +
					  m[12] * m[3] * m[9];
			inv[13] = m[0]  * m[9] * m[14] -
					  m[0]  * m[10] * m[13] -
					  m[8]  * m[1] * m[14] +
					  m[8]  * m[2] * m[13] +
					  m[12] * m[1] * m[10] -
					  m[12] * m[2] * m[9];
			inv[2] = m[1]  * m[6] * m[15] -
					 m[1]  * m[7] * m[14] -
					 m[5]  * m[2] * m[15] +
					 m[5]  * m[3] * m[14] +
					 m[13] * m[2] * m[7] -
					 m[13] * m[3] * m[6];
			inv[6] = -m[0]  * m[6] * m[15] +
					  m[0]  * m[7] * m[14] +
					  m[4]  * m[2] * m[15] -
					  m[4]  * m[3] * m[14] -
					  m[12] * m[2] * m[7] +
					  m[12] * m[3] * m[6];
			inv[10] = m[0]  * m[5] * m[15] -
					  m[0]  * m[7] * m[13] -
					  m[4]  * m[1] * m[15] +
					  m[4]  * m[3] * m[13] +
					  m[12] * m[1] * m[7] -
					  m[12] * m[3] * m[5];
			inv[14] = -m[0]  * m[5] * m[14] +
					   m[0]  * m[6] * m[13] +
					   m[4]  * m[1] * m[14] -
					   m[4]  * m[2] * m[13] -
					   m[12] * m[1] * m[6] +
					   m[12] * m[2] * m[5];
			inv[3] = -m[1] * m[6] * m[11] +
					  m[1] * m[7] * m[10] +
					  m[5] * m[2] * m[11] -
					  m[5] * m[3] * m[10] -
					  m[9] * m[2] * m[7] +
					  m[9] * m[3] * m[6];
			inv[7] = m[0] * m[6] * m[11] -
					 m[0] * m[7] * m[10] -
					 m[4] * m[2] * m[11] +
					 m[4] * m[3] * m[10] +
					 m[8] * m[2] * m[7] -
					 m[8] * m[3] * m[6];
			inv[11] = -m[0] * m[5] * m[11] +
					   m[0] * m[7] * m[9] +
					   m[4] * m[1] * m[11] -
					   m[4] * m[3] * m[9] -
					   m[8] * m[1] * m[7] +
					   m[8] * m[3] * m[5];
			inv[15] = m[0] * m[5] * m[10] -
					  m[0] * m[6] * m[9] -
					  m[4] * m[1] * m[10] +
					  m[4] * m[2] * m[9] +
					  m[8] * m[1] * m[6] -
					  m[8] * m[2] * m[5];
			det = m[0] * inv[0] + m[1] * inv[4] + m[2] * inv[8] + m[3] * inv[12];
			if (det == 0)
				return false;
			det = 1.0 / det;
			for (i = 0; i < 16; i++)
				invOut[i] = inv[i] * det;
			return invOut;
		},
		
		
		transpose: function(m) {
			var r = [];
			r[0]  = m[0]; r[1]  = m[4]; r[2]  = m[8];  r[3]  = m[12];
			r[4]  = m[1]; r[5]  = m[5]; r[6]  = m[9];  r[7]  = m[13];
			r[8]  = m[2]; r[9]  = m[6]; r[10] = m[10]; r[11] = m[14];
			r[12] = m[3]; r[13] = m[7]; r[14] = m[11]; r[15] = m[15];
			return r;
		},
		
		
		add: function(a, b) {
			return [
				a[0]  + b[0],  a[1]  + b[1],  a[2]  + b[2],  a[3]  + b[3],
				a[4]  + b[4],  a[5]  + b[5],  a[6]  + b[6],  a[7]  + b[7], 
				a[8]  + b[8],  a[9]  + b[9],  a[10] + b[10], a[11] + b[11],
				a[12] + b[12], a[13] + b[13], a[14] + b[14], a[15] + b[15]
			];
		},
		
		
		subtract: function(a, b) {
			return [
				a[0]  - b[0],  a[1]  - b[1],  a[2]  - b[2],  a[3]  - b[3],
				a[4]  - b[4],  a[5]  - b[5],  a[6]  - b[6],  a[7]  - b[7], 
				a[8]  - b[8],  a[9]  - b[9],  a[10] - b[10], a[11] - b[11],
				a[12] - b[12], a[13] - b[13], a[14] - b[14], a[15] - b[15]
			];
		},
		
		
		multiply: function(a, b) {
			var result = [];
			var a00 = a[0],  a01 = a[1],  a02 = a[2],  a03 = a[3];
			var a10 = a[4],  a11 = a[5],  a12 = a[6],  a13 = a[7];
			var a20 = a[8],  a21 = a[9],  a22 = a[10], a23 = a[11];
			var a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
			
			// Cache only the current line of the second matrix
			var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];  
			result[0] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
			result[1] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
			result[2] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
			result[3] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
			
			b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
			result[4] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
			result[5] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
			result[6] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
			result[7] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
			
			b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
			result[8] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
			result[9] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
			result[10] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
			result[11] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
			
			b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
			result[12] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
			result[13] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
			result[14] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
			result[15] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
			
			return result;
		},
		
		
		translate: function(x, y, z) {
			return [
				1.0,	0.0,	0.0,	0.0,
				0.0,	1.0,	0.0,	0.0,
				0.0,	0.0,	1.0,	0.0,
				x,		y,		z,		1.0 ];
		},
		
		
		scale: function(w, h, d) {
			return [
				w,		0.0,	0.0,	0.0,
				0.0,	h,		0.0,	0.0,
				0.0,	0.0,	d,		0.0,
				0.0,	0.0,	0.0,	1.0 ];
		},
		
		
		rotateX: function(angle) {
			var cos0 = Math.cos(angle),
				sin0 = Math.sin(angle);
			return [
				1, 0,    0,     0,
				0, cos0, -sin0, 0,
				0, sin0, cos0,  0,
				0, 0,    0,     1 ];
		},
		
		
		rotateY: function(angle) {
			var cos0 = Math.cos(angle),
				sin0 = Math.sin(angle);
			return [
				cos0,  0, sin0, 0,
				0,     1, 0,    0,
				-sin0, 0, cos0, 0,
				0,     0, 0,    1 ];
		},
		
		
		rotateZ: function(angle) {
			var cos0 = Math.cos(angle),
				sin0 = Math.sin(angle);
			return [
				cos0, -sin0, 0, 0,
				sin0, cos0,  0, 0,
				0,    0,     1, 0,
				0,    0,     0, 1 ];
		}
		
	}
	
	
	
	
	
	//  Holds all functions that return 3 cell arrays (3x1, 3d vectors)
	this.vec3 = {
		
		
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
		
		
		scale: function(a) {
			
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
		
		
	}
	
	
	
	
	
	function decToHexPadded(dec) {
		let tmp = dec.toString(16);
		return tmp.length < 2 ? '0' + tmp : tmp;
	}
	
	
	this.Color = class {
	
	
		constructor(r, g, b, a) {
			this.r = r;
			this.g = g;
			this.b = b;
			this.a = a;
		}
		
		
		fromArray(a) {
			return new Color(a[0], a[1], a[2], a[3]);
		}
		
		
		toArray() {
			return [ this.r, this.g, this.b, this.a ];
		}
		
		
		toHex() {
			return [ this.r * 255, this.g * 255, this.b * 255, this.a * 255 ];
		}
		
		
		toHexString() {
			return this.toHex().map(decToHexPadded).join("");
		}
		
		
		get black() {
			return new Color(0.0, 0.0, 0.0, 1.0);
		}
		
		
		get white() {
			return new Color(1.0, 1.0, 1.0, 1.0);
		}
		
		
		get red() {
			return new Color(1.0, 0.0, 0.0, 1.0);
		}
		
		
		get green() {
			return new Color(0.0, 1.0, 0.0, 1.0);
		}
		
		
		get blue() {
			return new Color(0.0, 0.0, 1.0, 1.0);
		}
		
		
		get yellow() {
			return new Color(1.0, 1.0, 0.0, 1.0);
		}
		
		
		get cyan() {
			return new Color(0.0, 1.0, 1.0, 1.0);
		}
		
		
		get magenta() {
			return new Color(1.0, 0.0, 1.0, 1.0);
		}
		
		
	}
	
	
})(this);
