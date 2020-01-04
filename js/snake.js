const RAD2 = 1.41421356;
const PI   = 3.14159265;

let scene = new THREE.Scene();

// Setup camera
let camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.z = 5;
camera.position.y = 0;
camera.position.x = 6 * RAD2;
camera.lookAt(6 * RAD2, 0, 0);

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

// Build the Snake
let blues = [];
let reds = [];

let blueMaterial = new THREE.MeshPhongMaterial( { color: 0x156289, emissive: 0x072534, side: THREE.DoubleSide, flatShading: true } );

let shape = new THREE.Shape();
shape.moveTo( 0,0 );
shape.lineTo( RAD2, 0);
shape.lineTo( RAD2 / 2, RAD2 / 2);
shape.lineTo( 0, 0 );

let extrudeSettings = {
    steps: 2,
    depth: 1,
    bevelEnabled: false,
};

let geometry = new THREE.ExtrudeGeometry( shape, extrudeSettings );
let mesh = new THREE.Mesh( geometry, blueMaterial );
scene.add( mesh );
blues.push(mesh);

let count = 1;
while(count < 12) {
    let newMesh = mesh.clone();
    newMesh.position.set(RAD2 * count, 0, 0);
    scene.add(newMesh);
    blues.push(newMesh);
    count = count + 1;
}

let redMaterial = new THREE.MeshPhongMaterial( { color: 0xFF0000, emissive: 0x072534, side: THREE.DoubleSide, flatShading: true } );

shape = new THREE.Shape();
shape.moveTo( 0, RAD2 / 2 );
shape.lineTo( RAD2, RAD2 / 2);
shape.lineTo( RAD2 / 2, 0);
shape.lineTo( 0, RAD2 / 2 );

geometry = new THREE.ExtrudeGeometry( shape, extrudeSettings );
mesh = new THREE.Mesh( geometry, redMaterial );
mesh.position.set(RAD2 / 2, 0, 0)
scene.add( mesh );
reds.push(mesh);

count = 1;
while(count < 12) {
    let newMesh = mesh.clone();
    newMesh.position.set(RAD2 * count + RAD2 / 2, 0, 0);
    scene.add(newMesh);
    reds.push(newMesh);
    count = count + 1;
}

// TODO I think this is unecessary?
function updateAllWorlds() {
    for(const t of blues) {
        t.updateMatrixWorld(true);
    }
    for(const t of reds) {
        t.updateMatrixWorld(true);
    }
}

function animate() {
    requestAnimationFrame( animate );

    // Updates controls when animating
    for (var i in gui.__controllers) {
        gui.__controllers[i].updateDisplay();
    }

    renderer.render( scene, camera );
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
    updateAllWorlds();

    let triCount = 1;
    while(triCount < 24) {
        updateAllWorlds();
        // If particular angle didn't change, don't rotate
        if(oldAngles[triCount] == currentAngles["angle" + triCount]) {
            triCount = triCount + 1;
            continue;
        }

        let mesh;
        if(triCount % 2 == 1) {
            mesh = blues[Math.floor(triCount / 2)];
        } else {
            mesh = reds[Math.floor(triCount / 2) - 1];
        }
        let pivot_matrix = mesh.matrixWorld.clone();
        let pivot_inv = new THREE.Matrix4().getInverse(pivot_matrix, false);
        let desiredTransform;
        if(triCount % 2 == 1) {
            desiredTransform = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(RAD2 / 2, RAD2 / 2, 0), currentAngles["angle" + triCount] - oldAngles[triCount]);
        } else {
            desiredTransform = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(RAD2 / 2, -1 * RAD2 / 2, 0), currentAngles["angle" + triCount] - oldAngles[triCount]);
        }
        oldAngles[triCount] = currentAngles["angle" + triCount];

        count = Math.floor((triCount + 1)/ 2);
        while(count < 12) {
            let todo = blues[count];
            todo.applyMatrix(pivot_inv);
            todo.position.sub(rotationPoint);
            todo.applyMatrix(desiredTransform);
            todo.position.add(rotationPoint);
            todo.applyMatrix(pivot_matrix);

            count = count + 1;
        }
        count = Math.floor(triCount / 2);
        while(count < 12) {
            let todo = reds[count];
            todo.applyMatrix(pivot_inv);
            todo.position.sub(rotationPoint);
            todo.applyMatrix(desiredTransform);
            todo.position.add(rotationPoint);
            todo.applyMatrix(pivot_matrix);

            count = count + 1;
        }
        triCount = triCount + 1;
    }
}

let gui = new dat.GUI({ load: getPresetJSON(), preset: 'Default'});
gui.remember(currentAngles);

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
            }
        },
        folders: {}
    };
}

count = 1;
while(count < 24) {
    gui.add(currentAngles, "angle" + count, -1 * PI, PI).step(PI/2).onChange(redrawSnake);
    count = count + 1;
}

function buildAnimate() {
    let animateGoal = Object.assign({}, currentAngles);

    // Reset to a straight line
    count = 1;
    while(count < 24) {
        currentAngles["angle" + count] = 0;
        count = count + 1;
    }

    redrawSnake();
    setTimeout(animateHelper.bind(null, animateGoal, 1), 300);
}

function animateHelper(goal, count) {
    while(currentAngles["angle" + count] == goal["angle" + count] && count <= 23) {
        count = count + 1;
    }
    currentAngles["angle" + count] = goal["angle" + count];

    redrawSnake();
    if(count < 23) {
        setTimeout(animateHelper.bind(null, goal, count + 1), 300);
    }
}

animate();
