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
    renderer.render( scene, camera );
}
animate();

window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}, false );

let angles = {
    angle1: 0,
    angle2: 0,
    angle3: 0,
    angle4: 0,
    angle5: 0,
    angle6: 0,
    angle7: 0,
    angle8: 0,
    angle9: 0,
    angle10: 0,
    angle11: 0,
    angle12: 0,
    angle13: 0,
    angle14: 0,
    angle15: 0,
    angle16: 0,
    angle17: 0,
    angle18: 0,
    angle19: 0,
    angle20: 0,
    angle21: 0,
    angle22: 0,
    angle23: 0
}

let oldAngles = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
function redrawSnake(angle) {
    let rotationPoint = new THREE.Vector3(3 * RAD2 / 4, RAD2 / 4, 0.5);
    updateAllWorlds();

    let triCount = 1;
    while(triCount < 24) {
        updateAllWorlds();
        // If particular angle didn't change, don't rotate
        if(oldAngles[triCount] == angles["angle" + triCount]) {
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
            desiredTransform = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(RAD2 / 2, RAD2 / 2, 0), angles["angle" + triCount] - oldAngles[triCount]);
        } else {
            desiredTransform = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(RAD2 / 2, -1 * RAD2 / 2, 0), angles["angle" + triCount] - oldAngles[triCount]);
        }
        oldAngles[triCount] = angles["angle" + triCount];

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

let gui = new dat.GUI();
gui.add(angles, 'angle1', -1 * PI, PI).onChange(redrawSnake);
gui.add(angles, 'angle2', -1 * PI, PI).onChange(redrawSnake);
gui.add(angles, 'angle3', -1 * PI, PI).onChange(redrawSnake);
gui.add(angles, 'angle4', -1 * PI, PI).onChange(redrawSnake);
gui.add(angles, 'angle5', -1 * PI, PI).onChange(redrawSnake);
gui.add(angles, 'angle6', -1 * PI, PI).onChange(redrawSnake);
gui.add(angles, 'angle7', -1 * PI, PI).onChange(redrawSnake);
gui.add(angles, 'angle8', -1 * PI, PI).onChange(redrawSnake);
gui.add(angles, 'angle9', -1 * PI, PI).onChange(redrawSnake);
gui.add(angles, 'angle10', -1 * PI, PI).onChange(redrawSnake);
gui.add(angles, 'angle11', -1 * PI, PI).onChange(redrawSnake);
gui.add(angles, 'angle12', -1 * PI, PI).onChange(redrawSnake);
gui.add(angles, 'angle13', -1 * PI, PI).onChange(redrawSnake);
gui.add(angles, 'angle14', -1 * PI, PI).onChange(redrawSnake);
gui.add(angles, 'angle15', -1 * PI, PI).onChange(redrawSnake);
gui.add(angles, 'angle16', -1 * PI, PI).onChange(redrawSnake);
gui.add(angles, 'angle17', -1 * PI, PI).onChange(redrawSnake);
gui.add(angles, 'angle18', -1 * PI, PI).onChange(redrawSnake);
gui.add(angles, 'angle19', -1 * PI, PI).onChange(redrawSnake);
gui.add(angles, 'angle20', -1 * PI, PI).onChange(redrawSnake);
gui.add(angles, 'angle21', -1 * PI, PI).onChange(redrawSnake);
gui.add(angles, 'angle22', -1 * PI, PI).onChange(redrawSnake);
gui.add(angles, 'angle23', -1 * PI, PI).onChange(redrawSnake);
