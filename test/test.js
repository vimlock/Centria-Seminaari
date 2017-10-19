// Test run script
function testRun() {
	// Setting up model program and vao is done when model is loaded
	// Model loading starts after gl has been initialized!!!
	engine.models.cube.program = engine.gl.program.default;
	engine.models.cube.vao = webgl.createModelVaoAndBuffers(engine.gl, engine.models.cube);
	// Demo object. Objects refer to a model
	// Transform is a property of a demo object, not a model's
	obj = {};
	obj.model = engine.models.cube;
	
    engine.builtinMesh = {
        "ColorCube": engine.models.cube,
    };
	engine.gl.view = mat4.invert(mat4.translate(0, 0, -5));
	
	// asd();
    sceneTest();
}

function asd() {
	requestAnimationFrame(asd);
	
	obj.transform = mat4.multiply(mat4.rotateY(Date.now() * 0.001), mat4.rotateX(Date.now() * 0.003));
	
	webgl.drawObjectModel(engine.gl, obj);
}

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

function random(scale) {
    return ((Math.random() * 2.0) - 1.0) * scale;
}

function spawnCubes(scene, mesh, material, num)
{
    for (let i = 0; i < num; ++i) {
        let cubeNode = scene.createChild("Cube");

        let scale = (0.75 + random(0.7)) * 5.0;

        cubeNode.worldPosition = [ random(50.0), random(50.0), random(50.0) ];
        cubeNode.localScale = [ scale, scale, scale ];

        cubeNode.localRotation = Quaternion.fromEulers(
            random(360.0), random(360.0), random(360.0)
        );

        let cube = cubeNode.createComponent(Model);
        cube.mesh = mesh;
        cube.meshName = mesh.name;

        cube.material = material;
        cube.materialName = "DefaultMaterial";
    }
}


function initInput() {

    let inputKeys = ["w", "a", "s", "d", "e", "q"];

    let input = {
    };

    inputKeys.forEach(function(value) {
        input[value] = false;
    });

    input["MouseX"] = undefined;
    input["MouseY"] = undefined;

    input["MouseDeltaX"] = 0.0;
    input["MouseDeltaY"] = 0.0;

    window.addEventListener("keydown", function(ev) {
        if (ev.key in input) {
            input[ev.key] = true;
        }

    }, false);

    window.addEventListener("keyup", function(ev) {
        if (ev.key in input) {
            input[ev.key] = false;
        }

    }, false);

    window.addEventListener("mousemove", function(ev) {
        if (input["MouseX"] === undefined) {
            input["MouseX"] = ev.screenX;
            input["MouseX"] = ev.screenY;
        }
        else {
            input["MouseDeltaX"] = ev.screenX - input["MouseX"];
            input["MouseDeltaY"] = ev.screenY - input["MouseY"];

            input["MouseX"] = ev.screenX;
            input["MouseY"] = ev.screenY;
        }

    }, false);

    return input;
}

function updateCamera(camNode, timeDelta) {

    let dz = 0.0;
    let dx = 0.0;
    let dy = 0.0;

    if (engine.input["w"]) { dz += 1.0; }
    if (engine.input["s"]) { dz -= 1.0; }

    if (engine.input["d"]) { dx += 1.0; }
    if (engine.input["a"]) { dx -= 1.0; }

    if (engine.input["e"]) { dy -= 1.0; }
    if (engine.input["q"]) { dy += 1.0; }

    const speed = 0.01;

    dz *= timeDelta * speed;
    dx *= timeDelta * speed;
    dy *= timeDelta * speed;

    /*
    let d = vec3.add(
        vec3.scale(camNode.forward, dz),
        vec3.scale(camNode.left, dx)
    );

    d = vec3.add(d, vec3.scale(camNode.up, dy));
    */

    let d = vec3.add(
        vec3.add(vec3.scale(vec3.left, dx), vec3.scale(vec3.up, dy)),
        vec3.scale(vec3.forward, dz)
    );

    camNode.translateLocal(d);
    camNode.worldRotation = Quaternion.fromEulers(Date.now() * 0.00005 * Math.PI, 0, 0);
}

function drawOriginAxes(debug, size, opacity=1.0) {
    debug.line([-size,     0,     0], [size,    0,    0], new Color(1, 0, 0, opacity));
    debug.line([    0, -size,     0], [   0, size,    0], new Color(0, 1, 0, opacity));
    debug.line([    0,     0, -size], [   0,    0, size], new Color(0, 0, 1, opacity));
}

function sceneTest() {
    engine.renderer = new Renderer(engine.gl);
    engine.renderer.performance.fps = 0.0;
    engine.input = initInput();

    engine.componentTypes = {
        "Camera": Camera,
        "Light": Light,
        "Model": Model,
    };

    engine.resourceTypes = {
        "Texture": Texture,
        "Material": Material,
        "Mesh": Mesh,
        "JSONFile": JSONFile,
        "TextFile": TextFile,
    };

	engine.resources = new ResourceManager();
    engine.resources.queueForLoading(Mesh, "data/models/monkey.obj");
    engine.resources.queueForLoading(Texture, "data/textures/MonkeyPink.png");
    //engine.resources.queueForLoading(JSONFile, "data/scenes/testScene.json");

    engine.resources.queueForLoading(Mesh, "data/models/UVCube.obj");
    engine.resources.queueForLoading(Texture, "data/textures/CubeDiffuse.png");
    engine.resources.queueForLoading(Texture, "data/textures/CubeNormal.png");
    engine.resources.queueForLoading(Texture, "data/textures/CubeSpecular.png");
    
    
    // Debug loading model without uv coordinates
    engine.resources.queueForLoading(Mesh, "data/models/ThreeMaterialCube.obj");
    
    
    let scene = new Scene();
    scene.ambientColor = new Color(0.1, 0.01, 0.01, 1.0);
    scene.fogColor = new Color(0.15, 0.15, 0.15, 1.0);
    scene.fogDistance = 80.0;

    engine.scene = scene;

    let mesh = buildTestMesh(
        engine.models.cube.vertices,
        engine.models.cube.colors,
        engine.models.cube.normals,
        engine.models.cube.indices
    );

    let shader = new ShaderSource("TestShader",
        document.getElementById("test-shader").innerHTML);

    let debugShader = new ShaderSource("DebugShader",
        document.getElementById("debug-shader").innerHTML
    );

    let material = new Material();
    material.shader = shader;
    material.enableDefine("NORMALS");
    material.enableDefine("LIGHTS");

    engine.resources.addBuiltinResource("DefaultMaterial", material);
    engine.resources.addBuiltinResource("ColorCube", mesh);
    engine.resources.addBuiltinResource("DebugShader", debugShader);
	
    engine.resources.onAllLoaded(function() {

        let t = engine.resources.getCached(Texture, "data/textures/MonkeyPink.png");

        let m = new Material();
        m.shader = shader;

        m.enableDefine("DIFFUSEMAP");
        m.enableDefine("NORMALS");
        m.enableDefine("LIGHTS");
        m.enableDefine("FOG");
        m.enableDefine("ENVIRONMENTMAP");

        m.textures = new Map([
            ["diffuseMap", t]
        ]);

        spawnCubes(scene, engine.resources.getCached(Mesh, "data/models/monkey.obj"),
            m, 50);

        let testNode = scene.createChild("Cube");
        testNode.scaleLocal([3, 3, 3]);
        testNode.translateLocal([0, 5, 0]);

        let model = testNode.createComponent(Model);
        model.mesh = engine.resources.getCached(Mesh, "data/models/UVCube.obj");

        m = new Material();
        m.diffuseColor = Color.white;
        m.specularColor = Color.black;
        m.shader = shader;

        m.enableDefine("LIGHTS");
        m.enableDefine("DIFFUSEMAP");
        m.enableDefine("NORMALS");
        m.enableDefine("NORMALMAP");
        m.enableDefine("FOG");
        m.enableDefine("ENVIRONMENTMAP");

        m.textures = new Map([
            ["diffuseMap", engine.resources.getCached(Texture, "data/textures/CubeDiffuse.png")],
            ["normalMap", engine.resources.getCached(Texture, "data/textures/CubeNormal.png")],
        ]);

        model.material = m;
        model.materials[1] = m;

        let envMaps = scene.getAllComponents(EnvironmentMap);
        envMaps.forEach(function(env, index) {
            console.log("Building environment map " + index + "/" + envMaps.length);
            env.build(engine.renderer);
        });
    });

    let debug = new DebugRenderer(engine.gl);
    debug._shader = debugShader;
	
    let cubeNode = scene.createChild("Cube");

    let cube = cubeNode.createComponent(Model);
    cube.mesh = mesh;
    cube.meshName = "ColorCube";
    cube.material = material;
    cube.materialName = "DefaultMaterial";

    let camNode = scene.createChild("Camera");
	camNode.translateLocal([0, 0, 15]);
    let camera = camNode.createComponent(Camera);
    camera.fieldOfView = 90.0;
    let cameraController = camNode.createComponent(CameraController);
    cameraController.camera = camera;

    let lightRotator = scene.createChild("LightRotator");

    let lightNode = scene.createChild("Light");
    lightNode.localPosition = [30, 30, -30];
    lightNode.setParent(lightRotator);

    let light = lightNode.createComponent(Light);
    light.color = new Color(0.8, 0.8, 0.8, 1.0);

    /*
    lightNode = scene.createChild("Light2");
    lightNode.localPosition = [-30, -30, 30];
    lightNode.setParent(lightRotator);

    light = lightNode.createComponent(Light);
    light.color = new Color(0.1, 1.0, 0.1, 1.2);

    lightNode = scene.createChild("Light3");
    lightNode.localPosition = [30, -30, 30];
    lightNode.setParent(lightRotator);

    light = lightNode.createComponent(Light);
    light.color = new Color(1.0, 0.1, 0.1, 1.2);
    */

    let envmapNode = scene.createChild("EnvironmentMap");
    envmapNode.createComponent(EnvironmentMap);
    envmapNode.translateLocal([0, 20, 0]);

    let prevFrameTime = Date.now();

    requestAnimationFrame(function update() {
        let currentFrameTime = Date.now();
        let timeDelta = currentFrameTime - prevFrameTime;

        let fps = 1.0 / Math.max(timeDelta * 0.001, 0.001);

        requestAnimationFrame(update);

        lightRotator.localRotation = Quaternion.fromEulers(
                Date.now() * 0.0005, Date.now() * 0.0005, Date.now() * 0.0005
        );

        scene.update();
        cameraController.updateCamera(timeDelta);

        let renderView = RenderView.fromCamera(camera);

        engine.renderer.resetPerformance();
        engine.renderer.renderScene(scene, renderView);

        debug.dottedCircle([0, 0, 0], 3, vec3.left, Color.magenta);
        debug.cube([0, 0, 0], 5, Color.green, true);
        debug.dottedCircle(lightNode.worldPosition, 1.0, vec3.left, Color.yellow);

        // debug.cube(camNode.worldPosition, 1, Color.cyan, true);

        drawOriginAxes(debug, 200, 0.5);

        engine.renderer.renderDebugLines(renderView, debug);
        debug.clear();

        engine.renderer.performance.fps = engine.renderer.performance.fps * 0.99 + fps * 0.01;
        engine.renderer.performance.objects = scene.nodes.size;

        displayStatics(engine.renderer.performance);

        prevFrameTime = currentFrameTime;
    });
}
