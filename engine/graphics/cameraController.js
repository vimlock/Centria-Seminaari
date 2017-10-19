"use strict";

(function(context) {
    
    context.CameraController = class CameraController extends Component {
        
        constructor() {
            super();
            
            this.camera = null;
            
            this._pitch = 0;
            this._yaw = 0;
            this._roll = 0;
            
        }
        
        updateCamera(timeDelta) {

            let input = engine.input;
            
            let dx = 0.0;
            let dy = 0.0;
            let dz = 0.0;
            
            let rx = 0.0;//Math.sin(timeDelta * 0.0001) * Math.PI * 2;
            let ry = 0.0;
            
            if (input["w"]) { dz -= 0.1 * timeDelta; }
            if (input["s"]) { dz += 0.1 * timeDelta; }

            if (input["d"]) { dx += 0.1 * timeDelta; }
            if (input["a"]) { dx -= 0.1 * timeDelta; }

            if (input["e"]) { dy += 0.1 * timeDelta; }
            if (input["q"]) { dy -= 0.1 * timeDelta; }
            
            if(input["r"] && input["MouseDeltaX"]) { rx = input["MouseDeltaX"] * 0.04; }
            if(input["r"] && input["MouseDeltaY"]) { ry = input["MouseDeltaY"] * 0.04; }
            
            input["MouseDeltaX"] = 0;
            input["MouseDeltaY"] = 0;
            
            let d = vec3.add(
                vec3.add(vec3.scale(this.node.left, dx), vec3.scale(this.node.up, dy)),
                vec3.scale(this.node.forward, dz)
            );
            this.node.translateLocal(d);
            
            this._pitch += ry;
            this._yaw += rx;
            
            if(this._pitch > Math.PI * 0.5 - 0.05)
                this._pitch = Math.PI * 0.5 - 0.05;
            else if(this._pitch < -Math.PI * 0.5 + 0.05)
                this._pitch = -Math.PI * 0.5 + 0.05;
            
            if(this._yaw > Math.PI)
                this._yaw -= (2 * Math.PI);
            else if(this._yaw < -Math.PI)
                this._yaw += (2 * Math.PI);
            
            console.log(this._pitch);
            
            //let yaw = Quaternion.fromAxisAngle(this.node.up, this._yaw);
            //let pitch = Quaternion.fromAxisAngle(this.node.left, this._pitch);
            let yaw = Quaternion.fromEulers(this._yaw,0,0);
            let pitch = Quaternion.fromEulers(0,0,this._pitch);
            let rot = Quaternion.multiply(pitch, yaw);
            
            this.node.localRotation = rot;
        }
        
    }
    
})(this);