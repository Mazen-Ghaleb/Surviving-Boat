import * as THREE from 'https://cdn.skypack.dev/three';
import Stats from 'https://cdn.skypack.dev/three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from 'https://cdn.skypack.dev/three/examples/jsm/controls/OrbitControls.js';
import { Water } from 'https://cdn.skypack.dev/three/examples/jsm/objects/Water.js';
import { Sky } from 'https://cdn.skypack.dev/three/examples/jsm/objects/Sky.js';
import { GUI } from 'https://cdn.skypack.dev/three/examples/jsm/libs/lil-gui.module.min.js';
import { GLTFLoader } from 'https://cdn.skypack.dev/three/examples/jsm/loaders/GLTFLoader.js';
import { LightningStrike } from 'https://cdn.skypack.dev/three/examples/jsm/geometries/LightningStrike.js';
import { LightningStorm } from 'https://cdn.skypack.dev/three/examples/jsm/objects/LightningStorm.js';
import { EffectComposer } from 'https://cdn.skypack.dev/three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.skypack.dev/three/examples/jsm/postprocessing/RenderPass.js';
import { OutlinePass } from 'https://cdn.skypack.dev/three/examples/jsm/postprocessing/OutlinePass.js';
import { VRButton } from 'https://cdn.skypack.dev/three/examples/jsm/webxr/VRButton.js';

// import * as THREE from 'three';
// import Stats from 'three/examples/jsm/libs/stats.module.js';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// import { Water } from 'three/examples/jsm/objects/Water.js';
// import { Sky } from 'three/examples/jsm/objects/Sky.js';
// import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
// import { LightningStrike } from 'three/examples/jsm/geometries/LightningStrike.js';
// import { LightningStorm } from 'three/examples/jsm/objects/LightningStorm.js';
// import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
// import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
// import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
// import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';

let container, stats;
let camera, scene, renderer, composer;
let controls, water, mesh, mesh2;
let ambient, directionalLight;

var controller;
var Boat_scene, Island_scene;

var waveAudioListener, thunderAudioListener, windAudioListener;
var waveSound, thunderSound, windSound;

let cloud,
  cloudsList = [];
let flash;

const loader = new GLTFLoader();

let currentSceneIndex = 0;

let currentTime = 0;

const parameters = {
  Sound: false,
  SoundMixer: 50,
  CameraLock: true,
  VR: true,
  elevation: 2,
  azimuth: 180,
};

const sceneCreators = [createStormScene];

const clock = new THREE.Clock();

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const cloudCount = 500;
const SCALE = 10000;

function animateClouds(cloudsList) {
  cloudsList.forEach((cloud) => {
    cloud.position.x += 1;
    cloud.position.z -= 1;
    if (cloud.position.x > SCALE / 2) {
      cloud.position.x = -SCALE / 2;
    }
    if (cloud.position.z < -SCALE / 2) {
      cloud.position.z = SCALE / 2;
    }
  });
}

function animateFlash() {
  if (Math.random() > 0.5) {
    if (Math.random() > 0.5 || flash.power > 500) {
      if (flash.power < 100) flash.position.set(Math.random() * SCALE - SCALE / 2, 0, Math.random() * SCALE - SCALE / 2);
      flash.power = 50 + Math.random() * 1000;
    }
  }
}

function cameraPositionLimit() {
  if (parameters.CameraLock) {
    camera.position.x = Boat_scene.position.x;
    camera.position.y = Boat_scene.position.y;
    camera.position.z = Boat_scene.position.z;
    camera.rotation.x = Boat_scene.rotation.x;
    camera.rotation.y = Boat_scene.rotation.y - Math.PI / 2;
    camera.rotation.z = Boat_scene.rotation.z;
    camera.translateX(5.6);
    camera.translateY(-3);
    camera.translateZ(40);
  } else {
    if (camera.position.x > SCALE / 4) {
      camera.position.x = SCALE / 4;
    }

    if (camera.position.x < -SCALE / 4) {
      camera.position.x = SCALE / 4;
    }

    if (camera.position.z > SCALE / 4) {
      camera.position.z = SCALE / 4;
    }

    if (camera.position.z < -SCALE / 4) {
      camera.position.z = SCALE / 4;
    }

    if (camera.position.y > SCALE * 0.09) {
      camera.position.y = SCALE * 0.09;
    }
  }
}
function BoatPositionLimit() {
  if (Boat_scene.position.x > SCALE / 4) {
    Boat_scene.position.x = SCALE / 4;
  }

  if (Boat_scene.position.x < -SCALE / 4) {
    Boat_scene.position.x = SCALE / 4;
  }

  if (Boat_scene.position.z > SCALE / 4) {
    Boat_scene.position.z = SCALE / 4;
  }

  if (Boat_scene.position.z < -SCALE / 4) {
    Boat_scene.position.z = SCALE / 4;
  }
}

class Boat {
  constructor() {
    loader.load('assets/boat/scene.gltf', (gltf) => {
      Boat_scene = gltf.scene;
      scene.add(gltf.scene);
      Boat_scene.scale.set(3, 3, 3);
      Boat_scene.position.set(-7, 13, 70);
      Boat_scene.rotation.y = 1.5;

      this.boat = Boat_scene;
      this.speed = {
        vel: 0,
        rot: 0,
      };
    });
  }

  stop() {
    this.speed.vel = 0;
    this.speed.rot = 0;
  }

  update() {
    if (this.boat) {
      this.boat.rotation.y += this.speed.rot;
      this.boat.translateX(this.speed.vel);

      if (isColliding(boat.boat, Island_scene)) {
        this.boat.translateX(-this.speed.vel);
      }
    }
  }
}
const boat = new Boat();

init();
animate();

function init() {
  container = document.getElementById('container');

  //Renderer
  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.xr.enabled = true;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  container.appendChild(renderer.domElement);
  composer = new EffectComposer(renderer);

  //Scene
  createScene();

  //Camera
  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 20000);
  camera.position.set(5, 13, 110);

  loadIsland();

  // Sounds

  var waveAudioListener = new THREE.AudioListener();
  var thunderAudioListener = new THREE.AudioListener();
  var windAudioListener = new THREE.AudioListener();

  camera.add(waveAudioListener);
  camera.add(thunderAudioListener);
  camera.add(windAudioListener);

  // create a global audio source
  var waveSound = new THREE.Audio(waveAudioListener);
  var thunderSound = new THREE.Audio(thunderAudioListener);
  var windSound = new THREE.Audio(windAudioListener);

  var waveAudioLoader = new THREE.AudioLoader();
  var thunderAudioLoader = new THREE.AudioLoader();
  var windAudioLoader = new THREE.AudioLoader();

  waveAudioLoader.load('soundeffects/waves.mp3', function (buffer) {
    waveSound.setBuffer(buffer);
    waveSound.setLoop(true);
    waveSound.setVolume(parameters.SoundMixer / 100);
  });

  thunderAudioLoader.load('soundeffects/thunder.mp3', function (buffer) {
    thunderSound.setBuffer(buffer);
    thunderSound.setLoop(true);
    thunderSound.setVolume(parameters.SoundMixer / 100);
  });
  windAudioLoader.load('soundeffects/wind.wav', function (buffer) {
    windSound.setBuffer(buffer);
    windSound.setLoop(true);
    windSound.setVolume(parameters.SoundMixer / 100);
  });
  updateSoundMixer();

  // Moon light
  ambient = new THREE.AmbientLight(0x555555);
  scene.add(ambient);
  directionalLight = new THREE.DirectionalLight(0xffeedd);
  directionalLight.position.set(0, 0, 1);
  scene.add(directionalLight);

  // Clouds
  const cloudLoader = new GLTFLoader();
  cloudLoader.load('./models/scene.gltf', function (cloud) {
    for (let p = 0; p < cloudCount; p++) {
      let currCloud = cloud.scene.clone().children[0];

      currCloud.position.x = Math.random() * SCALE - SCALE / 2;
      currCloud.position.y = 2000 + Math.random() * 1500 - 500;
      currCloud.position.z = Math.random() * SCALE - SCALE / 2;

      const scaleMultiplier = Math.random();
      currCloud.scale.setX(2 + 2 * scaleMultiplier);
      currCloud.scale.setY(2 + 2 * scaleMultiplier);
      currCloud.scale.setZ(0.5);

      scene.add(currCloud);

      cloudsList.push(currCloud);
    }
  });

  // Flash
  flash = new THREE.PointLight(0x062d89, 30, SCALE / 2, 0.1);
  flash.position.set(0, SCALE / 2, 0);
  scene.add(flash);

  // Water
  const waterGeometry = new THREE.PlaneGeometry(SCALE, SCALE);

  water = new Water(waterGeometry, {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals: new THREE.TextureLoader().load('assets/waternormals.jpg', function (texture) {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    }),
    sunDirection: new THREE.Vector3(),
    sunColor: 0xffffff,
    waterColor: 0x004a7e,
    distortionScale: 3.7,
    fog: scene.fog !== undefined,
  });

  water.rotation.x = -Math.PI / 2;
  scene.add(water);

  const pmremGenerator = new THREE.PMREMGenerator(renderer);

  function updateSound() {
    if (parameters.Sound) {
      waveSound.play();
      thunderSound.play();
      windSound.play();
    } else {
      waveSound.stop();
      thunderSound.stop();
      windSound.stop();
    }
  }

  function updateSoundMixer() {
    waveSound.setVolume(parameters.SoundMixer / 100);
    thunderSound.setVolume(parameters.SoundMixer / 100);
    windSound.setVolume(parameters.SoundMixer / 100);
  }

  //Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.maxPolarAngle = Math.PI / 2;
  controls.target.set(0, 10, 0);
  controls.minDistance = 0;
  controls.maxDistance = Infinity;
  controls.update();

  //
  const waterUniforms = water.material.uniforms;
  stats = new Stats();
  container.appendChild(stats.dom);

  // GUI
  const gui = new GUI();

  const folderSettings = gui.addFolder('Settings');
  folderSettings.add(parameters, 'Sound').listen().onChange(updateSound);
  folderSettings.add(parameters, 'SoundMixer').name('Sound Mixer').min(1).max(100).step(1).listen().onChange(updateSoundMixer);
  folderSettings.add(parameters, 'CameraLock').name('Camera Lock').listen();

  window.addEventListener('resize', onWindowResize);

  function onSelectStart() {
    // Add code for when user presses their controller
  }

  function onSelectEnd() {
    // Add code for when user releases the button on their controller
  }

  controller = renderer.xr.getController(0);
  controller.addEventListener('selectstart', onSelectStart);
  controller.addEventListener('selectend', onSelectEnd);
  controller.addEventListener('connected', function (event) {});

  controller.addEventListener('disconnected', function () {});
  //controller.position.y += 5;
  camera.add(controller);

  document.body.appendChild(VRButton.createButton(renderer));

  // Window Listeners
  window.addEventListener('resize', onWindowResize, false);

  // Boat moving
  window.addEventListener('keydown', function (e) {
    if (e.key == 'ArrowUp') {
      boat.speed.vel = 1;
    }
    if (e.key == 'ArrowDown') {
      boat.speed.vel = -1;
    }
    if (e.key == 'ArrowRight') {
      boat.speed.rot = -0.1;
    }
    if (e.key == 'ArrowLeft') {
      boat.speed.rot = 0.1;
    }
    if (e.key == 'Z' || e.key == 'z') {
      parameters.CameraLock = !parameters.CameraLock;
    }
    if (e.key == 'M' || e.key == 'm') {
      parameters.Sound = !parameters.Sound;
      updateSound();
    }
  });
  window.addEventListener('keyup', function (e) {
    boat.stop();
  });
}

function isColliding(obj1, obj2) {
  if (obj1) {
    if (obj2) {
      return Math.abs(obj1.position.x - obj2.position.x) < 300 && Math.abs(obj1.position.x - obj2.position.x) < 300;
    }
  }
}

function checkCollisions() {
  if (boat.boat) {
    if (Island_scene) {
      if (isColliding(boat.boat, Island_scene)) {
        console.log('Colliding');
      }
    }
  }
}

function createScene() {
  scene = sceneCreators[currentSceneIndex]();
  scene.fog = new THREE.FogExp2(0x11111f, 0.0004);
  renderer.setClearColor(scene.fog.color);
  scene.userData.timeRate = 1;
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  render();
  animateClouds(cloudsList);
  animateFlash();
  boat.update();
  stats.update();
}

function render() {
  if (boat.boat && Island_scene) {
    checkCollisions();
    BoatPositionLimit();
    cameraPositionLimit();
  }

  const time = performance.now() * 0.001;

  water.material.uniforms['time'].value += 1.0 / 60.0;

  renderer.render(scene, camera);

  currentTime += scene.userData.timeRate * clock.getDelta();
  if (currentTime < 0) {
    currentTime = 0;
  }
  scene.userData.render(currentTime);
}

function loadIsland() {
  let loader = new GLTFLoader();

  loader.load('assets/island.gltf', (gltf) => {
    Island_scene = gltf.scene;
    Island_scene.scale.set(7, 7, 7);
    scene.add(Island_scene);
    Island_scene.position.x = -500;
    Island_scene.position.y = 0;
    Island_scene.position.z = 100;
    Island_scene.rotation.z = -1.2;
    Island_scene.rotation.x = -1.55;
  });
}

function createStormScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050505);

  scene.userData.canGoBackwardsInTime = false;

  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 20000);
  camera.position.set(-1.4, 10, 95);
  // Lights

  scene.add(new THREE.AmbientLight(0x444444));

  const light1 = new THREE.DirectionalLight(0xffffff, 0.5);
  light1.position.set(1, 1, 1);
  scene.add(light1);

  const posLight = new THREE.PointLight(0x00ffff);
  posLight.position.set(0, 100, 0);
  scene.add(posLight);

  // Ground

  const GROUND_SIZE = 1000;

  // Storm

  scene.userData.lightningColor = new THREE.Color(0xb0ffff);
  scene.userData.outlineColor = new THREE.Color(0x00ffff);

  scene.userData.lightningMaterial = new THREE.MeshBasicMaterial({ color: scene.userData.lightningColor });

  const rayDirection = new THREE.Vector3(0, -1, 0);
  let rayLength = 0;
  const vec1 = new THREE.Vector3();
  const vec2 = new THREE.Vector3();

  scene.userData.rayParams = {
    radius0: 1,
    radius1: 0.5,
    minRadius: 0.3,
    maxIterations: 7,

    timeScale: 0.15,
    propagationTimeFactor: 0.2,
    vanishingTimeFactor: 0.9,
    subrayPeriod: 4,
    subrayDutyCycle: 0.6,

    maxSubrayRecursion: 3,
    ramification: 3,
    recursionProbability: 0.4,

    roughness: 0.85,
    straightness: 0.65,

    onSubrayCreation: function (segment, parentSubray, childSubray, lightningStrike) {
      lightningStrike.subrayConePosition(segment, parentSubray, childSubray, 0.6, 0.6, 0.5);

      // Plane projection

      rayLength = lightningStrike.rayParameters.sourceOffset.y;
      vec1.subVectors(childSubray.pos1, lightningStrike.rayParameters.sourceOffset);
      const proj = rayDirection.dot(vec1);
      vec2.copy(rayDirection).multiplyScalar(proj);
      vec1.sub(vec2);
      const scale = proj / rayLength > 0.5 ? rayLength / proj : 1;
      vec2.multiplyScalar(scale);
      vec1.add(vec2);
      childSubray.pos1.addVectors(vec1, lightningStrike.rayParameters.sourceOffset);
    },
  };

  const storm = new LightningStorm({
    size: GROUND_SIZE,
    minHeight: 2000,
    maxHeight: 3000,
    maxSlope: 0.6,
    maxLightnings: 8,

    lightningParameters: scene.userData.rayParams,

    lightningMaterial: scene.userData.lightningMaterial,
  });

  scene.add(storm);

  // Compose rendering

  composer.passes = [];
  composer.addPass(new RenderPass(scene, camera));

  // Light Controls

  const Lightcontrols = new OrbitControls(camera, renderer.domElement);
  Lightcontrols.target.y = GROUND_SIZE * 0.05;
  Lightcontrols.enableDamping = true;
  Lightcontrols.dampingFactor = 0.05;

  scene.userData.render = function (time) {
    storm.update(time);

    Lightcontrols.update();

    if (scene.userData.outlineEnabled) {
      composer.render();
    } else {
      renderer.render(scene, camera);
    }
  };

  return scene;
}
