const RAD2 = Math.SQRT2;
const PI   = Math.PI;

let scene = new THREE.Scene();

// Setup camera
let camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.z = 15;
camera.position.y = 0;
camera.position.x = 6 * RAD2;

// Setup lights
let lights = [];
lights[ 0 ] = new THREE.PointLight( 0xffffff, 1, 0 );
lights[ 1 ] = new THREE.PointLight( 0xffffff, 1, 0 );
lights[ 2 ] = new THREE.PointLight( 0xffffff, 1, 0 );

lights[ 0 ].position.set( 0, 200, 0 );
lights[ 1 ].position.set( 100, 200, 100 );
lights[ 2 ].position.set( - 100, - 200, - 100 );

scene.add( lights[ 0 ] );
scene.add( lights[ 1 ] );
scene.add( lights[ 2 ] );

// Renderer/controls
let renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );
controls = new THREE.OrbitControls( camera, renderer.domElement );
controls.target = new THREE.Vector3(6 * RAD2, 0, 0);

// Build the Snake
function buildBlocks(shape, material, offset) {
    let extrudeSettings = {
        steps: 2,
        depth: 1,
        bevelEnabled: false,
    };
    let blocks = [];

    let geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    let mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(offset, 0, 0);
    scene.add(mesh);
    blocks.push(mesh);

    let count = 1;
    while(count < 12) {
        let newMesh = mesh.clone();
        newMesh.position.set(RAD2 * count + offset, 0, 0);
        scene.add(newMesh);
        blocks.push(newMesh);
        count = count + 1;
    }
    return blocks;
}

let blueMaterial = new THREE.MeshPhongMaterial( { color: 0x156289,
    emissive: 0x072534, side: THREE.DoubleSide, flatShading: true } );

let shape = new THREE.Shape();
shape.moveTo( 0,0 );
shape.lineTo( RAD2, 0);
shape.lineTo( RAD2 / 2, RAD2 / 2);
shape.lineTo( 0, 0 );
let blues = buildBlocks(shape, blueMaterial, 0);

let redMaterial = new THREE.MeshPhongMaterial( { color: 0xFF0000,
    emissive: 0x072534, side: THREE.DoubleSide, flatShading: true } );

shape = new THREE.Shape();
shape.moveTo( 0, RAD2 / 2 );
shape.lineTo( RAD2, RAD2 / 2);
shape.lineTo( RAD2 / 2, 0);
shape.lineTo( 0, RAD2 / 2 );
let reds = buildBlocks(shape, redMaterial, RAD2 / 2);

function updateAllWorlds() {
    for(const t of blues) {
        t.updateMatrixWorld(true);
    }
    for(const t of reds) {
        t.updateMatrixWorld(true);
    }
}

window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}, false );

function genAngles(s) {
    let i = 1;
    let angles = {};
    while(i < 24) {
        let angle = PI / 2 * parseInt(s[i-1]);
        if(angle > PI) {
            angle = angle - 2 * PI;
        }
        angles["angle" + i] = angle;
        i = i + 1;
    }
    return angles;
}

let currentAngles = genAngles("00000000000000000000000");

let oldAngles = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
function redrawSnake() {
    let rotationPoint = new THREE.Vector3(3 * RAD2 / 4, RAD2 / 4, 0.5);

    let triCount = 1;
    while(triCount < 24) {
        // Without this, the world matrices don't get updated and the rotations are messed up
        updateAllWorlds();
        // If particular angle didn't change, don't rotate
        if(oldAngles[triCount] == currentAngles["angle" + triCount]) {
            triCount = triCount + 1;
            continue;
        }

        let mesh;
        let rotationVector;

        if(triCount % 2 == 1) {
            mesh = blues[Math.floor(triCount / 2)];
            rotationVector = new THREE.Vector3(RAD2 / 2, RAD2 / 2, 0);
        } else {
            mesh = reds[Math.floor(triCount / 2) - 1];
            rotationVector = new THREE.Vector3(RAD2 / 2, -1 * RAD2 / 2, 0);
        }

        let pivotMatrix = mesh.matrixWorld.clone();
        let invPivotMatrix = new THREE.Matrix4().getInverse(pivotMatrix, false);

        let rotationAngle = currentAngles["angle" + triCount] - oldAngles[triCount];
        let rotationMatrix = new THREE.Matrix4().makeRotationAxis(rotationVector, rotationAngle);
        oldAngles[triCount] = currentAngles["angle" + triCount];

        function transformAfter(list, idx) {
            while(idx < 12) {
                let block = list[idx];
                block.applyMatrix(invPivotMatrix);
                block.position.sub(rotationPoint);
                block.applyMatrix(rotationMatrix);
                block.position.add(rotationPoint);
                block.applyMatrix(pivotMatrix);

                idx = idx + 1;
            }
        }

        transformAfter(blues, Math.floor((triCount + 1)/2));
        transformAfter(reds, Math.floor(triCount / 2));

        triCount = triCount + 1;
    }
}

function getPresetJSON() {
    return {
        "preset": "Default",
        "closed": false,
        "remembered": {
            "Default": {
                "0": genAngles("00000000000000000000000")
            },
            "Cat": {
                "0": genAngles("02202201022022022000000")
            },
            "Three Peaks": {
                "0": genAngles("10012321211233232123003")
            },
            "ZigZag": {
                "0": genAngles("11111111111111111111111")
            },
            "Triangle": {
                "0": genAngles("30000001300000013000000")
            },
            "Ball": {
                "0": genAngles("13133131131331311313313")
            },
            "Cross": {
                "0": genAngles("20220202202000220002022")
            }
        },
        folders: {}
    };
}

// Build GUI controls
let gui = new dat.GUI({ load: getPresetJSON(), preset: 'Default'});
gui.remember(currentAngles);

gui.add(controls, "autoRotate");
gui.add(window, "animateBuild");

function colorChange(material, newColor) {
    material.color.setRGB(newColor.r/256, newColor.g/256, newColor.b/256);
}

let colorHolder = {"color1": {"r": 0x15, "g": 0x62, "b": 0x89},
                   "color2": {"r": 0xFF, "g": 0x00, "b": 0x00}};
gui.addColor(colorHolder, "color1").onChange(colorChange.bind(null, blueMaterial));
gui.addColor(colorHolder, "color2").onChange(colorChange.bind(null, redMaterial));

count = 1;
while(count < 24) {
    gui.add(currentAngles, "angle" + count, -1 * PI, PI).step(PI/2).onChange(redrawSnake);
    count = count + 1;
}

let building = false;
function animateBuild() {
    if(building) {
        return;
    }
    building = true;
    let animateGoal = Object.assign({}, currentAngles);

    // Reset to a straight line
    count = 1;
    while(count < 24) {
        currentAngles["angle" + count] = 0;
        count = count + 1;
    }

    redrawSnake();
    setTimeout(buildHelper.bind(null, animateGoal, 1), 300);
}

function buildHelper(goal, count) {
    while(currentAngles["angle" + count] == goal["angle" + count] && count <= 23) {
        count = count + 1;
    }
    currentAngles["angle" + count] = goal["angle" + count];

    redrawSnake();
    if(count < 23) {
        setTimeout(buildHelper.bind(null, goal, count + 1), 300);
    } else {
        building = false;
    }
}

// Start the three js animation loop
function animate() {
    requestAnimationFrame( animate );

    // Updates controls when animating
    for (var i in gui.__controllers) {
        gui.__controllers[i].updateDisplay();
    }

    controls.update();
    renderer.render( scene, camera );
}
animate();
