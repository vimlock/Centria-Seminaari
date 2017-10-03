
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
