/* exported viewerMain */
/* global engine */
/* global Color, MeshAttribute, Quaternion */
/* global EnvironmentMap, Camera, Light, Model */
/* global Material, Mesh, ShaderSource, Texture, JSONFile, TextFile */
/* global DebugRenderer, Renderer, RenderView, ResourceManager, Scene */
/* global Viewer */
/* global InputManager */
/* global CameraController */
/* global DegToRad */

"use strict";

function buildTestMesh(positions, colors, normals, indices) {

    if (positions.length != colors.length || positions.length != normals.length) {
        console.log("Uneven lengths on vertex attributes");
        return null;
    }

    if ((positions.length % 3) != 0) {
        console.log("Vertex attribute lengths not multiply of 3");
        return null;
    }

    let vCount = positions.length / 3;
    let vSize = 9; // sizeof(position) + sizeof(color) + sizeof(normal)

    let vBuff = new Float32Array(vCount * vSize);

    for (let i = 0; i < vCount; ++i) {
        let offset = i * vSize;

        vBuff[offset + 0] = positions[i * 3 + 0];
        vBuff[offset + 1] = positions[i * 3 + 1];
        vBuff[offset + 2] = positions[i * 3 + 2];

        vBuff[offset + 3] = colors[i * 3 + 0];
        vBuff[offset + 4] = colors[i * 3 + 1];
        vBuff[offset + 5] = colors[i * 3 + 2];

        vBuff[offset + 6] = normals[i * 3 + 0];
        vBuff[offset + 7] = normals[i * 3 + 1];
        vBuff[offset + 8] = normals[i * 3 + 2];
    }

    let iBuff = new Uint16Array(indices);

    let attrs = [
        new MeshAttribute("position", 0, 3),
        new MeshAttribute("color", 3, 3),
        new MeshAttribute("normal", 6, 3),
    ];
    

    return Mesh.fromData(vBuff, iBuff, attrs);
}

function random(scale) {
    return ((Math.random() * 2.0) - 1.0) * scale;
}

function spawnEyeballs(scene, mesh, material, count, spread)
{
    for (let i = 0; i < count; ++i) {

        let node = scene.createChild("EyeMonster_" + i);

        let scale = 8 + random(4);

        node.worldPosition = [ random(spread), random(spread), random(spread) ];
        node.localScale = [ scale, scale, scale ];

        node.localRotation = Quaternion.fromEulers(
            random(360.0), random(360.0), random(360.0)
        );

        let model = node.createComponent(Model);
        model.mesh = mesh;
        model.meshName = mesh.name;

        model.material = material;
        model.materialName = material.name;
    }
}

function initBuiltinResources() {

    // Init builtin shaders
    let defaultShader = new ShaderSource("TestShader",
        document.getElementById("default-shader").innerHTML);

    let debugShader = new ShaderSource("DebugShader",
        document.getElementById("debug-shader").innerHTML
    );

    engine.resources.addBuiltinResource("DebugShader", defaultShader);
    engine.resources.addBuiltinResource("DebugShader", debugShader);

    // Init builtin materials
    let defaultMaterial = new Material();
    defaultMaterial.shader = defaultShader;
    defaultMaterial.enableDefine("NORMALS");
    defaultMaterial.enableDefine("LIGHTS");

    engine.resources.addBuiltinResource("DefaultMaterial", defaultMaterial);

    let normalDebugMaterial = new Material();
    normalDebugMaterial.shader = defaultShader;
    normalDebugMaterial.drawType = "lines";
    normalDebugMaterial.allowReflections = false;
    normalDebugMaterial.diffuseColor = new Color(0.5, 1.0, 0.9, 1.0);
    normalDebugMaterial.enableDefine("FOG");

    engine.resources.addBuiltinResource("DebugNormal", normalDebugMaterial);

    // Init builtin meshes

    let defaultCube = buildTestMesh(
        engine.models.cube.vertices,
        engine.models.cube.colors,
        engine.models.cube.normals,
        engine.models.cube.indices
    );

    engine.resources.addBuiltinResource("DefaultCube", defaultCube);
}

function initGLContext(canvas) {
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        gl.aspectRatio = canvas.width / canvas.height;
        gl.viewport(0,0, canvas.width, canvas.height);
    }

    let gl = canvas.getContext("webgl2");

    canvas.width = 1024;
    canvas.height = 764;

    resizeCanvas();

    gl.enable(gl.DEPTH_TEST);
    gl.frontFace(gl.CCW);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.FRONT);

    window.addEventListener("resize", resizeCanvas);

    return gl;
}

function initEngine() {
    // Used for scene loading/unloading
    engine.componentTypes = {
        "Camera": Camera,
        "Light": Light,
        "Model": Model,
    };

    // Used for scene loading/unloading
    engine.resourceTypes = {
        "Texture": Texture,
        "Material": Material,
        "Mesh": Mesh,
        "JSONFile": JSONFile,
        "TextFile": TextFile,
    };

    engine.gl = initGLContext(document.getElementById("canvas"));

    engine.renderer = new Renderer(engine.gl);
    engine.resources = new ResourceManager();
    engine.inputManager = InputManager.initInput;

    initBuiltinResources();
}

function makeDefaultScene() {
    let scene = new Scene();

    // Global scene settings to add some mood to the scene.
    scene.ambientColor = new Color(0.1, 0.01, 0.01, 1.0);
    scene.fogColor = new Color(0.15, 0.15, 0.15, 1.0);
    scene.fogStart = 100.0;
    scene.fogDistance = 80.0;

    // Create a light for some illumination.
    let lightNode = scene.createChild("Light");
    lightNode.localPosition = [30, 30, -30];
    let light = lightNode.createComponent(Light);
    light.color = new Color(0.8, 0.8, 0.8, 1.0);

    // Stationary lights are boring.
    let lightRotator = scene.createChild("LightRotator");
    lightNode.setParent(lightRotator);

    // Create environment map to capture reflections.
    let envmapNode = scene.createChild("EnvironmentMap");
    envmapNode.createComponent(EnvironmentMap);
    envmapNode.translateLocal([0, 20, 0]);

    /*
    // Create something to look at.
    let cubeNode = scene.createChild("Cube");
    let cubeModel = cubeNode.createComponent(Model);
    cubeModel.mesh = engine.resources.getCached(Mesh, "DefaultCube");
    cubeModel.material = engine.resources.getCached(Material, "DefaultMaterial");
    */

    // Create a camera so we can actually see the scene
    let camNode = scene.createChild("Camera");
    camNode.translateLocal([0, 0, -5]);
    let camera = camNode.createComponent(Camera);
    camera.fieldOfView = 90.0;
    camera.farPlane = 300.0;

    let cameraController = camNode.createComponent(CameraController);
    cameraController.camera = camera;
    cameraController.input = engine.inputManager.input;
    cameraController.turnSpeed = 0.5 * DegToRad;

    scene.camera = camera;

    engine.resources.queueForLoading(Mesh, "data/models/Rog.obj");
    engine.resources.queueForLoading(Texture, "data/textures/Rog_Diffuse.png");
    engine.resources.queueForLoading(Texture, "data/textures/Rog_Normal.png");
    engine.resources.queueForLoading(Texture, "data/textures/Rog_Specular.png");

    engine.resources.onAllLoaded(function() {
        let res = engine.resources;

        let eyeMesh = engine.resources.getCached(Mesh, "data/models/Rog.obj");
        let eyeMaterial = engine.resources.getCached(Material, "DefaultMaterial").clone();

        eyeMaterial.enableDefine("DIFFUSEMAP");
        eyeMaterial.enableDefine("NORMALS");
        eyeMaterial.enableDefine("LIGHTS");
        eyeMaterial.enableDefine("FOG");
        eyeMaterial.enableDefine("NORMALMAP");
        eyeMaterial.enableDefine("SPECMAP");
        eyeMaterial.enableDefine("AMBIENT");
        
        eyeMaterial.specularColor = new Color(2, 2, 2, 40);

        eyeMaterial.textures = new Map([
            ["diffuseMap", res.getCached(Texture, "data/textures/Rog_Diffuse.png")],
            ["normalMap", res.getCached(Texture, "data/textures/Rog_Normal.png")],
            ["specularMap", res.getCached(Texture, "data/textures/Rog_Specular.png")],
        ]);

        spawnEyeballs(scene, eyeMesh, eyeMaterial, 1, 0);
        spawnEyeballs(scene, eyeMesh, eyeMaterial, 8, 150);

    });

    engine.resources.onAllLoaded(function() {
        buildEnvironmentMaps(scene);
        buildEnvironmentMaps(scene);
    });

    return scene;
}

function buildEnvironmentMaps(scene) {
    let envMaps = scene.getAllComponents(EnvironmentMap);
    envMaps.forEach(function(env, index) {
        console.log("Building environment map " + index + "/" + envMaps.length);
        env.build(engine.renderer);
    });
}

function drawOriginAxes(debug, size, opacity=1.0) {
    debug.line([-size,     0,     0], [size,    0,    0], new Color(1, 0, 0, opacity));
    debug.line([    0, -size,     0], [   0, size,    0], new Color(0, 1, 0, opacity));
    debug.line([    0,     0, -size], [   0,    0, size], new Color(0, 0, 1, opacity));
}

function displayStatics(performance) {
    let div = document.getElementById("render-statistics");

    let html = 
        "<p>FPS: " + parseInt(performance.fps) + "</p>" +
        "<p>Scene Nodes: " + performance.objects + "</p>" +
        "<p>Vertices: " + performance.vertices + "</p>" +
        "<p>Draw Calls: " + performance.numDrawCalls + "</p>" +
        "<p>Lights: " +     performance.numLights + "</p>" +
        "<p>Batches: " +    performance.batches + "</p>" +
        "<p> bindShader(): " +    performance.bindShader + "</p>" +
        "<p> bindMaterial(): " +  performance.bindMaterial + "</p>"+
        "<p> bindMesh(): " +      performance.bindMesh + "</p>"+
        "<p> bindTexture(): " +   performance.bindTexture + "</p>"+
        "<p> bindLights(): " +    performance.bindLights + "</p>"+
        "<p> bindTransform(): " + performance.bindTransform + "</p>";

    div.innerHTML = html;
}

function viewerMain() {
    initEngine();
    let scene = makeDefaultScene();

    let prevFrameTime = Date.now();

    let fpsCounter = document.getElementById("fps-counter");

    engine.renderer.performance.fps = 50.0;

    engine.debug = new DebugRenderer(engine.gl);
    engine.debug._shader = engine.resources.getCached(ShaderSource, "DebugShader");

    let viewer = new Viewer(scene);

    viewer.init();

    requestAnimationFrame(function update() {
        let currentFrameTime = Date.now();
        let timeDelta = currentFrameTime - prevFrameTime;

        let fps = 1.0 / Math.max(timeDelta * 0.001, 0.001);

        requestAnimationFrame(update);

        // Update the scene
        scene.update(timeDelta);

        // Render the scene
        let renderView = RenderView.fromCamera(scene.camera);
        engine.renderer.resetPerformance();
        engine.renderer.renderScene(scene, renderView);

        // Draw debug lines
        drawOriginAxes(engine.debug, 200, 0.5);
        // engine.debug.cube([0, 0, 0], 5, Color.green, true);

        engine.renderer.renderDebugLines(renderView, engine.debug);
        engine.debug.clear();

        // Calculate a rolling average of the FPS.
        let avgFps = engine.renderer.performance.fps * 0.99 + fps * 0.01;

        engine.renderer.performance.fps = avgFps;
        engine.renderer.performance.objects = scene.nodes.size;

        if (fpsCounter) {
            fpsCounter.innerHTML = parseInt(avgFps);
        }

        displayStatics(engine.renderer.performance);

        prevFrameTime = currentFrameTime;

        viewer.update();
    });
}
