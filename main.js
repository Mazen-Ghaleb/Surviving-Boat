import * as THREE from './node_modules/three/build/three.module.js';

let scene, camera, renderer, mesh;

init();
animate();

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);
  renderer = new THREE.WebGL1Renderer({ antialiasing: true });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  camera.position.z = 50;
  camera.position.x = -50;
  camera.position.y = 50;
  camera.lookAt(0, 0, 0);

  let geometry = new THREE.BoxGeometry(20, 20, 20);
  let texture = new THREE.TextureLoader().load('./crate.jpg');
  //   let material = new THREE.MeshBasicMaterial({ color: 0x0000ff });
  let material = new THREE.MeshBasicMaterial({ map: texture });
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = 30;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  let planeGeometry = new THREE.PlaneGeometry(100, 100, 10, 10);
  let planeMaterial = new THREE.MeshStandardMaterial({ color: 0x404040 });
  let planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
  planeMesh.rotation.x = -Math.PI / 2;
  planeMesh.castShadow = true;
  planeMesh.receiveShadow = true;
  scene.add(planeMesh);

  // adding an ambient light
  let ambientLight = new THREE.AmbientLight(0xffffff);
  scene.add(ambientLight);

  // adding a point light
  let pointLight = new THREE.PointLight(0xffffff, 1, 0);
  pointLight.position.set(50, 100, 50);
  pointLight.castShadow = true;
  scene.add(pointLight);

  // adding a listener to the resize event
  window.addEventListener('resize', onWindowResize);
}
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  mesh.rotation.x += 0.005;
  mesh.rotation.y += 0.001;
  renderer.render(scene, camera);
}
