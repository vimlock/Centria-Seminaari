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
            /*
            if (input["w"]) { this.dz += 0.01 * timeDelta; }
            if (input["s"]) { this.dz -= 0.01 * timeDelta; }

            if (input["d"]) { this.dx += 0.01 * timeDelta; }
            if (input["a"]) { this.dx -= 0.01 * timeDelta; }

            if (input["e"]) { this.dy += 0.01 * timeDelta; }
            if (input["q"]) { this.dy -= 0.01 * timeDelta; }
            */
            let dx = 0.0;
            let dy = 0.0;
            let dz = 0.0;
            
            let rx = Math.sin(timeDelta * 0.0001) * Math.PI * 2;
            let ry = 0.0;
            
            if (input["w"]) { dz -= 1.0; }
            if (input["s"]) { dz += 1.0; }

            if (input["d"]) { dx += 1.0; }
            if (input["a"]) { dx -= 1.0; }

            if (input["e"]) { dy += 1.0; }
            if (input["q"]) { dy -= 1.0; }
            
            let d = vec3.add(
                vec3.add(vec3.scale(this.node.left, dx), vec3.scale(this.node.up, dy)),
                vec3.scale(this.node.forward, dz)
            );
            this.node.translateLocal(d);
            
            //console.log(this.node.worldRotation);
            
            let r = Quaternion.multiply(Quaternion.fromEulers(rx, 0, 0), Quaternion.fromEulers(0, ry, 0));
            this.node.rotateLocal(r);
        }
        
    }
    
})(this);