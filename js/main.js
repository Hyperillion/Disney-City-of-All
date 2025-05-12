let camera, scene, renderer;
let controller1, controller2;

const cursor = new THREE.Vector3();

var fbxloader = new FBXLoader();

let controls;

let jellyfish;

let jellyfishInteract = false;
let moveCounter = 0; // Counter for the sine wave movement

let touch = false; 

let envJellyfish = []

init();

function init() {

  const container = document.createElement('div');
  document.body.appendChild(container);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x222222);

  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 50);
  camera.position.set(0, 1.6, 3);

  controls = new OrbitControls(camera, container);
  controls.target.set(0, 1.6, 0);
  controls.update();

  const grid = new THREE.GridHelper(4, 1, 0x111111, 0x111111);
  scene.add(grid);

  scene.add(new THREE.HemisphereLight(0x888877, 0x777788, 3));

  const light = new THREE.DirectionalLight(0xffffff, 1.5);
  light.position.set(0, 4, 0);
  scene.add(light);

  //

  const painter1 = new TubePainter(new THREE.Color(Math.random(), Math.random(), Math.random()));
  scene.add(painter1.mesh);

  const painter2 = new TubePainter(new THREE.Color(Math.random(), Math.random(), Math.random()));
  scene.add(painter2.mesh);

  //

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  renderer.xr.enabled = true;
  container.appendChild(renderer.domElement);

  document.body.appendChild(XRButton.createButton(renderer));


  fbxloader.load("models/xiaozao.fbx", function (obj) {
    jellyfish = obj; // Assign to the global variable
    window.loadedObject = obj; // Store the object in a global variable for later access

    obj.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.material = new THREE.MeshPhongMaterial({ 
          color: 0x51d3ff,
          transparent: true,
          opacity: 0.7
        });
      }
    });
    obj.castShadow = true;
    obj.receiveShadow = true;
    obj.scale.set(0.001, 0.001, 0.001); 
    obj.position.set(0, 1, -0.5); 
    scene.add(obj);
  });

  for (let i = 0; i < 100; i++) {
    fbxloader.load("models/xiaozao.fbx", function (obj) {
      window.loadedObject = obj; // Store the object in a global variable for later access
      obj.traverse(function (child) {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          child.material = new THREE.MeshPhongMaterial({ 
            color: 0x51d3ff,
            transparent: true,
            opacity: 0.7
          });
        }
      });
      obj.castShadow = true;
      obj.receiveShadow = true;
      obj.scale.set(0.001, 0.001, 0.001); 
      obj.position.set(Math.random() * 4 - 2, Math.random() * 4 - 2, Math.random() * 4 - 2);
      scene.add(obj);
      envJellyfish.push(obj); // Add the jellyfish to the array
    });
  }

  function onSelectStart() {

    const painter1 = new TubePainter(new THREE.Color(Math.random(), Math.random(), Math.random()));
    scene.add(painter1.mesh);
    controller1.userData.painter = painter1;
    const painter2 = new TubePainter(new THREE.Color(Math.random(), Math.random(), Math.random()));
    scene.add(painter2.mesh);
    controller2.userData.painter = painter2;

    this.updateMatrixWorld(true);

    const pivot = this.getObjectByName('pivot');
    cursor.setFromMatrixPosition(pivot.matrixWorld);

    const painter = this.userData.painter;
    painter.moveTo(cursor);

    this.userData.isSelecting = true;
    touch = true; // Set touch to true on select start
  }

  function onSelectEnd() {

    this.userData.isSelecting = false;
    touch = false; // Set touch to false on select end
    jellyfishInteract = true; // Toggle jellyfish interaction on select end
  }

  function onSqueezeStart() {

    this.userData.isSqueezing = true;
    this.userData.positionAtSqueezeStart = this.position.y;
    this.userData.scaleAtSqueezeStart = this.scale.x;

  }

  function onSqueezeEnd() {

    this.userData.isSqueezing = false;

  }

  controller1 = renderer.xr.getController(0);
  controller1.addEventListener('selectstart', onSelectStart);
  controller1.addEventListener('selectend', onSelectEnd);
  controller1.addEventListener('squeezestart', onSqueezeStart);
  controller1.addEventListener('squeezeend', onSqueezeEnd);
  controller1.userData.painter = painter1;
  scene.add(controller1);

  controller2 = renderer.xr.getController(1);
  controller2.addEventListener('selectstart', onSelectStart);
  controller2.addEventListener('selectend', onSelectEnd);
  controller2.addEventListener('squeezestart', onSqueezeStart);
  controller2.addEventListener('squeezeend', onSqueezeEnd);
  controller2.userData.painter = painter2;
  scene.add(controller2);

  //

  const pivot = new THREE.Mesh(new THREE.IcosahedronGeometry(0.01, 3));
  pivot.name = 'pivot';
  pivot.position.z = - 0.05;

  const group = new THREE.Group();
  group.add(pivot);

  controller1.add(group.clone());
  controller2.add(group.clone());

  //

  window.addEventListener('resize', onWindowResize);

}

function animate() {
  handleController(controller1);
  handleController(controller2);
  jellyfishCome();
  jellyfishMove(); 
  renderer.render(scene, camera);
}

function jellyfishMove() {
  if (jellyfishInteract) {
    jellyfish.rotation.y += 0.01; // Rotate the jellyfish around its Y-axis
    jellyfish.position.y = Math.sin(moveCounter * 0.5) * 0.2 + 1.5; // Move the jellyfish up and down
  }
  for (let i = 0; i < envJellyfish.length; i++) {
    let jellyfishClone = envJellyfish[i];
    jellyfishClone.rotation.y += 0.01; // Rotate the jellyfish around its Y-axis
    jellyfishClone.position.y = Math.sin(moveCounter * 0.1 + i) * 0.2 + 1; // Move the jellyfish up and down
    // moveCounter += 0.1; // Increment the counter for the sine wave
  }
  moveCounter += 0.1; // Increment the counter for the sine wave
}

function jellyfishCome(){
  if (touch){
    //jellyfish will swim to the controller position
    const targetPosition = controller1.position.clone(); // Get the position of the controller
    jellyfish.position.lerp(targetPosition, 0.05) // Move the jellyfish towards the controller position
    //add sine wave movement to jellyfish
    jellyfish.rotation.y += 0.1; // Rotate the jellyfish around its Y-axis
    jellyfish.position.y = Math.sin(moveCounter) * 0.1 + 1.3; // Move the jellyfish up and down
    moveCounter += 0.1; // Increment the counter for the sine wave

  }
}

// function loadFbx(path) {
//   const loader = new FBXLoader();
//   loader.load(path, function (object) {
//     object.traverse(function (child) {
//       if (child.isMesh) {
//         child.castShadow = true;
//         child.receiveShadow = true;
//       }
//     });
//     object.scale.set(0.005, 0.005, 0.005); // Set scale to 0.1
//     object.position.set(0, 0, 3);
//     object.matrixAutoUpdate = false; // Disable automatic updates to the object's matrix
//     object.updateMatrix(); // Manually update the object's matrix
//     scene.add(object);
//   });
// }

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

}

//

function handleController(controller) {

  controller.updateMatrixWorld(true);

  const userData = controller.userData;
  const painter = userData.painter;

  const pivot = controller.getObjectByName('pivot');

  if (userData.isSqueezing === true) {

    const delta = (controller.position.y - userData.positionAtSqueezeStart) * 5;
    const scale = Math.max(0.1, userData.scaleAtSqueezeStart + delta);

    pivot.scale.setScalar(scale);
    painter.setSize(scale);

  }

  cursor.setFromMatrixPosition(pivot.matrixWorld);

  if (userData.isSelecting === true) {

    painter.lineTo(cursor);
    painter.update();

  }

}
