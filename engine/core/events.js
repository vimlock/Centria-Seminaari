/* exported Event */

/**
 * Useful event handler
 */
class Event {
    constructor(removeOnInvoke=true) {
        this.removeOnInvoke = removeOnInvoke;
        this.listeners = [];
    }

    addListener(l) {
        this.listeners.push(l);
    }

    invoke(...args) {
        for (let l of this.listeners) {
            l.apply(null, args);
        }

        if (this.removeOnInvoke) {
            this.listeners.length = 0;
        }
    }
    
    
    static addToEvent(event, callback) {
        engine.events[event]
    }
    
    
    static get initInput() {
        
        let input = {};
        
        
        // Possible input keys and buttons
        [ "w", "a", "s", "d", "e", "q",
        "Mouse0", "Mouse1", "Mouse2" ].forEach(function(value) {
            input[value] = false;
        });
        input["MouseX"] = undefined;
        input["MouseY"] = undefined;
        
        input["MouseDeltaX"] = 0.0;
        input["MouseDeltaY"] = 0.0;
        
        
        // Callback functions for events
        let keyDownCallback = function(ev) {
            // When a key is down, this event is triggered continuously
            if(ev.repeat) // Prevent retriggering
                return;
                
                console.log("asd");
            
            ev.preventDefault(); // Prevents most of browser related key functions -- F5 REFRESHING INCLUDED --
            ev.stopPropagation();
            if (ev.key in input) {
                input[ev.key] = true;
            }
        };
        let keyUpCallback = function(ev) {
            ev.preventDefault();
            ev.stopPropagation();
            if (ev.key in input) {
                input[ev.key] = false;
            }
        };
        let mouseDownCallback = function(ev) {
            ev.preventDefault();
            ev.stopPropagation();
            if ("Mouse" + ev.button in input) {
                input["Mouse" + ev.button] = true;
            }
        };
        let mouseUpCallback = function(ev) {
            ev.preventDefault();
            ev.stopPropagation();
            if ("Mouse" + ev.button in input) {
                input["Mouse" + ev.button] = false;
            }
        };
        let mouseMoveCallback = function(ev) {
            ev.preventDefault();
            ev.stopPropagation();
            if (input["MouseX"] === undefined) {
                input["MouseX"] = ev.screenX;
                input["MouseX"] = ev.screenY;
            } else {
                input["MouseDeltaX"] = ev.screenX - input["MouseX"];
                input["MouseDeltaY"] = ev.screenY - input["MouseY"];

                input["MouseX"] = ev.screenX;
                input["MouseY"] = ev.screenY;
            }
        }
        
        
        // Create event listeners
        let body = document.body;
        body.addEventListener("keydown", keyDownCallback, false);
        body.addEventListener("keyup", keyUpCallback, false);
        body.addEventListener("mousedown", mouseDownCallback, false);
        body.addEventListener("mouseup", mouseUpCallback, false);
        body.addEventListener("mousemove", mouseMoveCallback, false);
        
        if(!engine.events) {
            engine.events = {};
        }
        engine.events.input = input;
        
        return input;
        
    }
    
}








engine.events = {};





engine.events.windowResizeHandler = function() {
    webgl.resize(engine.gl, window.innerWidth, window.innerHeight);
}





engine.events.windowOnloadHandler = function() {
    engine.gl = webgl.init("canvas");
    testRun();
}





engine.events.handlerDragOver = function(e) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
}





window.addEventListener("resize", engine.events.windowResizeHandler, false);
window.addEventListener("load", engine.events.windowOnloadHandler, false);
document.getElementById("filedrop").addEventListener("dragover", engine.events.handlerDragOver, false);
document.getElementById("filedrop").addEventListener("drop", engine.filehandler.handleFileUpload, false);
