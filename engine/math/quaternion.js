"use strict";

/* global vec3 */

(function(context) {

    context.Quaternion = class Quaternion
    {
        constructor(w, x, y, z) {
            this.w = w;
            this.x = x;
            this.y = y;
            this.z = z;
        }
        
        
        static get identity() {
            return new Quaternion(1.0, 0.0, 0.0, 0.0);
        }
        
        
        toArray() {
            return [ this.w, this.x, this.y, this.z ];
        }
        
        
        toMat4() {
			let x = this.x,  y = this.y,  z = this.z,  w = this.w;
			let x2 = x + x,  y2 = y + y,  z2 = z + z;
			let xx = x * x2, xy = x * y2, xz = x * z2;
			let yy = y * y2, yz = y * z2, zz = z * z2;
			let wx = w * x2, wy = w * y2, wz = w * z2;
			
			return [
				1 - (yy + zz), xy - wz,       xz + wy,       0,
				xy + wz,       1 - (xx + zz), yz - wx,       0,
				xz - wy,       yz + wx,       1 - (xx + yy), 0,
				0,             0,             0,             1 ];
        }

        toMat3() {
			let x = this.x,  y = this.y,  z = this.z,  w = this.w;
			let x2 = x + x,  y2 = y + y,  z2 = z + z;
			let xx = x * x2, xy = x * y2, xz = x * z2;
			let yy = y * y2, yz = y * z2, zz = z * z2;
			let wx = w * x2, wy = w * y2, wz = w * z2;
			
			return [
				1 - (yy + zz), xy - wz,       xz + wy,     
				xy + wz,       1 - (xx + zz), yz - wx,      
				xz - wy,       yz + wx,       1 - (xx + yy),
            ];
        }
        
        toEuler() {
            // TODO
        }
        
        
        static fromArray(a) {
            return new Quaternion(a[0], a[1], a[2], a[3]);
        }
        
        
        static fromEulers(x, y, z) {
			let c1 = Math.cos(x * 0.5);
			let c2 = Math.cos(y * 0.5);
			let c3 = Math.cos(z * 0.5);
			let s1 = Math.sin(x * 0.5);
			let s2 = Math.sin(y * 0.5);
			let s3 = Math.sin(z * 0.5);
			
			return new Quaternion(
				c1 * c2 * c3 - s1 * s2 * s3,
				c1 * c2 * s3 + s1 * s2 * c3,
				s1 * c2 * c3 + c1 * s2 * s3,
				c1 * s2 * c3 - s1 * c2 * s3
			);
        }

        
        static fromMat4(m) {
			// Takes rotation from 4x4 matrix
			let m11 = m[0], m12 = m[1], m13 = m[2];
			let m21 = m[4], m22 = m[5], m23 = m[6];
			let m31 = m[8], m32 = m[9], m33 = m[10];
			let trace = m11 + m22 + m33;
			let s;
            
			if(trace > 0) {
				s = 0.5 / Math.sqrt(trace + 1.0);
				return new Quaternion(
                    0.25 / s,
                    (m32 - m23) * s,
                    (m13 - m31) * s,
                    (m21 - m12) * s);
			} else if (m11 > m22 && m11 > m33) {
				s = 2.0 * Math.sqrt(1.0 + m11 - m22 - m33);
				return new Quaternion(
                    (m32 - m23) / s,
                    0.25 * s,
                    (m12 + m21) / s,
                    (m13 + m31) / s);
			} else if (m22 > m33) {
				s = 2.0 * Math.sqrt(1.0 + m22 - m11 - m33);
				return new Quaternion(
                    (m13 - m31) / s,
                    (m12 + m21) / s,
                    0.25 * s,
                    (m23 + m32) / s);
			} else {
				s = 2.0 * Math.sqrt(1.0 + m33 - m11 - m22);
				return new Quaternion(
                    (m21 - m12) / s,
                    (m13 + m31) / s,
                    (m23 + m32) / s,
                    0.25 * s);
			}
        }

        static fromRotation(v1, v2) {
            // https://stackoverflow.com/a/1171995
            
            let half = vec3.normalize(vec3.add(v1, v2));
            
            let axis = vec3.cross(v1, half);
            let angle = vec3.dot(v1, half);

            let q = new Quaternion(
                angle, axis[0], axis[1], axis[2]
            );

            q.normalize();

            return q;
        }

		length() {
			return Math.sqrt(this.w * this.w + this.x * this.x + this.y * this.y + this.z * this.z);
		}
        
        
		normalize() {
			let l = this.length();
			if(l > 0) {
                this.w = this.w / l;
                this.x = this.x / l;
                this.y = this.y / l;
                this.z = this.z / l;
            } else {
                this.w = 0.0;
                this.x = 0.0;
                this.y = 0.0;
                this.z = 0.0;
            }
		}
        
		
		conjugate() {
            this.x = -this.x;
            this.y = -this.y;
            this.z = -this.z;
		}
        
        
        invert() {
            let r = 1 / this.length();
            this.w = this.w * r;
            this.x = -this.x * r;
            this.y = -this.y * r;
            this.z = -this.z * r;
        }
		
        
		static add(q1, q2) {
			return new Quaternion(
				q1.w + q2.w,
				q1.x + q2.x,
				q1.y + q2.y,
				q1.z + q2.z);
		}
		
		
		static subtract(q1, q2) {
			return new Quaternion(
				q1.w - q2.w,
				q1.x - q2.x,
				q1.y - q2.y,
				q1.z - q2.z);
		}
		
		
		static multiply(q1, q2) {
			let aw = q1.w, ax = q1.x, ay = q1.y, az = q1.z;
			let bw = q2.w, bx = q2.x, by = q2.y, bz = q2.z;
			return new Quaternion(
                ax * bw + aw * bx + ay * bz - az * by,
                ay * bw + aw * by + az * bx - ax * bz,
                az * bw + aw * bz + ax * by - ay * bx,
                aw * bw - ax * bx - ay * by - az * bz);
		}
        
        
    };

})(this);
