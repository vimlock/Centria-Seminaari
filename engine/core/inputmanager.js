"use strict";


(function(context) {
    
    
    context.InputManager = class InputManager {
        
        constructor() {
            
            this.input = null;
            
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
                
                //ev.preventDefault(); // Prevents most of browser related key functions -- F5 REFRESHING INCLUDED --
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
            
            let inputManager = new InputManager();
            inputManager.input = input;
            
            
            return inputManager;
            
        }
        
    }
    
    
})(this);