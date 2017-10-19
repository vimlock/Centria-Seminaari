"use strict";

(function(context) {
    
    context.CameraController = class CameraController extends Component {
        
        constructor() {
            super();
            
            this.camera = null;
            
            //this.dx = 0;
            //this.dy = 0;
            //this.dz = -10;
            
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
            
            if(input["MouseDeltaX"]) { rx += input["MouseDeltaX"] * 0.005 * timeDelta; }
            if(input["MouseDeltaY"]) { ry += input["MouseDeltaY"] * 0.005 * timeDelta; }
            
            input["MouseDeltaX"] = 0;
            input["MouseDeltaY"] = 0;
            
            let d = vec3.add(
                vec3.add(vec3.scale(this.node.left, dx), vec3.scale(this.node.up, dy)),
                vec3.scale(this.node.forward, dz)
            );
            this.node.translateLocal(d);
            
            
            // TODO
            // Some roll is soon applied
            // Think of a way to correct the roll
            // or a way to rotate so no roll is applied. Ever.
            
            let pitch = Quaternion.fromAxisAngle(engine.scene.up, rx);
            let yaw = Quaternion.fromAxisAngle(this.node.left, ry);
            let rot = Quaternion.multiply(pitch, yaw);
            
            this.node.rotateLocal(rot);
        }
        
    }
    
})(this);