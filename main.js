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

// import * as THREE from './node_modules/three';
// import Stats from './node_modules/three/examples/jsm/libs/stats.module.js';
// import { GUI } from './node_modules/three/examples/jsm/libs/lil-gui.module.min.js';
// import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js';
// import { Water } from './node_modules/three/examples/jsm/objects/Water.js';
// import { Sky } from './node_modules/three/examples/jsm/objects/Sky.js';
// import { GUI } from './node_modules/three/examples/jsm/libs/lil-gui.module.min.js';
// import { GLTFLoader } from './node_modules/three/examples/jsm/loaders/GLTFLoader.js';

let container, stats;
let camera, scene, renderer, composer;
let controls, water, sun, mesh;
let ambient, directionalLight;
let cloud,
  cloudsList = [];
let flash;

const loader = new GLTFLoader();

let currentSceneIndex = 0;

let currentTime = 0;

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
  if (camera.position.x > SCALE / 2) {
    camera.position.x = SCALE / 2;
  }

  if (camera.position.x < -SCALE / 2) {
    camera.position.x = -SCALE / 2;
  }

  if (camera.position.z > SCALE / 2) {
    camera.position.z = SCALE / 2;
  }

  if (camera.position.z < -SCALE / 2) {
    camera.position.z = -SCALE / 2;
  }

  if (camera.position.y < 0) {
    camera.position.z = 0;
  }
}

class Boat {
  constructor() {
    loader.load('assets/boat/scene.gltf', (gltf) => {
      scene.add(gltf.scene);
      gltf.scene.scale.set(3, 3, 3);
      gltf.scene.position.set(5, 13, 50);
      gltf.scene.rotation.y = 1.5;

      this.boat = gltf.scene;
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
    }
  }
}
const boat = new Boat();

init();
animate();

function init() {
  container = document.getElementById('container');

  //

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  container.appendChild(renderer.domElement);
  composer = new EffectComposer(renderer);
  //

  createScene();
  // scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 20000);
  camera.position.set(30, 30, 100);

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

  //
  // sun = new THREE.Vector3();

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

  // Skybox

  // const sky = new Sky();
  // sky.scale.setScalar(10000);
  // scene.add(sky);

  // const skyUniforms = sky.material.uniforms;

  // skyUniforms['turbidity'].value = 10;
  // skyUniforms['rayleigh'].value = 2;
  // skyUniforms['mieCoefficient'].value = 0.005;
  // skyUniforms['mieDirectionalG'].value = 0.8;

  const parameters = {
    Sound: true,
    VR: true,
    elevation: 2,
    azimuth: 180,
  };

  const pmremGenerator = new THREE.PMREMGenerator(renderer);

  // function updateSun() {
  //   const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
  //   const theta = THREE.MathUtils.degToRad(parameters.azimuth);

  //   sun.setFromSphericalCoords(1, phi, theta);

  //   // sky.material.uniforms['sunPosition'].value.copy(sun);
  //   water.material.uniforms['sunDirection'].value.copy(sun).normalize();

  //   // scene.environment = pmremGenerator.fromScene(sky).texture;
  // }
  function updateSound() {}
  function updateVR() {}

  // updateSun();

  //

  const geometry = new THREE.BoxGeometry(0, 0, 0);
  const material = new THREE.MeshStandardMaterial({ roughness: 0 });

  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  //

  controls = new OrbitControls(camera, renderer.domElement);
  controls.maxPolarAngle = (1.5 * Math.PI) / 2;
  controls.target.set(0, 10, 0);
  controls.minDistance = 40.0;
  controls.maxDistance = 200.0;
  controls.update();

  //
  const waterUniforms = water.material.uniforms;

  stats = new Stats();
  container.appendChild(stats.dom);

  // GUI

  const gui = new GUI();

  const folderSettings = gui.addFolder('Settings');
  folderSettings.add(parameters, 'Sound', 0, 1, 1).onChange(updateSound);
  folderSettings.add(parameters, 'VR', 0, 1, 1).onChange(updateVR);
  folderSettings.open();

  // const folderSky = gui.addFolder('Sky');
  // folderSky.add(parameters, 'elevation', 0, 90, 0.1).onChange(updateSun);
  // folderSky.add(parameters, 'azimuth', -180, 180, 0.1).onChange(updateSun);
  // folderSky.open();

  const folderWater = gui.addFolder('Water');
  folderWater.add(waterUniforms.distortionScale, 'value', 0, 8, 0.1).name('distortionScale');
  folderWater.add(waterUniforms.size, 'value', 0.1, 10, 0.1).name('size');
  folderWater.open();

  window.addEventListener('resize', onWindowResize);

  // ------------ Music Init --------- //

  window.addEventListener('load', () => {
    // noinspection JSUnresolvedVariable
    let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    let xhr = new XMLHttpRequest();
    xhr.open('GET', 'soundeffects/thunder.mp3');
    xhr.responseType = 'arraybuffer';
    xhr.addEventListener('load', () => {
      let playsound = (audioBuffer) => {
        let source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioCtx.destination);
        source.loop = false;
        source.start();

        setTimeout(function () {
          playsound(audioBuffer);
        }, 1000 + Math.random() * 2500);
      };

      audioCtx.decodeAudioData(xhr.response).then(playsound);
    });
    xhr.send();
  });

  window.addEventListener('load', () => {
    // noinspection JSUnresolvedVariable
    let audioCtx2 = new (window.AudioContext || window.webkitAudioContext)();
    let xhr2 = new XMLHttpRequest();
    xhr2.open('GET', 'soundeffects/waves.mp3');
    xhr2.responseType = 'arraybuffer';
    xhr2.addEventListener('load', () => {
      let playsound2 = (audioBuffer) => {
        let source2 = audioCtx2.createBufferSource();
        source2.buffer = audioBuffer;
        source2.connect(audioCtx2.destination);
        source2.loop = false;
        source2.start();

        setTimeout(function () {
          playsound2(audioBuffer);
        }, 1000 + Math.random() * 2500);
      };

      audioCtx2.decodeAudioData(xhr2.response).then(playsound2);
    });
    xhr2.send();
  });

  window.addEventListener('load', () => {
    // noinspection JSUnresolvedVariable
    let audioCtx3 = new (window.AudioContext || window.webkitAudioContext)();
    let xhr3 = new XMLHttpRequest();
    xhr3.open('GET', 'soundeffects/wind.wav');
    xhr3.responseType = 'arraybuffer';
    xhr3.addEventListener('load', () => {
      let playsound3 = (audioBuffer) => {
        let source3 = audioCtx3.createBufferSource();
        source3.buffer = audioBuffer;
        source3.connect(audioCtx3.destination);
        source3.loop = false;
        source3.start();

        setTimeout(function () {
          playsound3(audioBuffer);
        }, 1000 + Math.random() * 2500);
      };

      audioCtx3.decodeAudioData(xhr3.response).then(playsound3);
    });
    xhr3.send();
  });

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
  });
  window.addEventListener('keyup', function (e) {
    boat.stop();
  });
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
  cameraPositionLimit();
  const time = performance.now() * 0.001;

  mesh.position.y = Math.sin(time) * 20 + 5;
  mesh.rotation.x = time * 0.5;
  mesh.rotation.z = time * 0.51;

  water.material.uniforms['time'].value += 1.0 / 60.0;

  renderer.render(scene, camera);

  currentTime += scene.userData.timeRate * clock.getDelta();
  if (currentTime < 0) {
    currentTime = 0;
  }
  scene.userData.render(currentTime);
}

function createStormScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050505);

  scene.userData.canGoBackwardsInTime = false;

  // scene.userData.camera = new THREE.PerspectiveCamera(27, window.innerWidth / window.innerHeight, 20, 10000);
  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 20000);
  camera.position.set(30, 30, 100);
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

  // scene.userData.camera.position.set(0, 0.2, 1.6).multiplyScalar(GROUND_SIZE * 0.5);

  //const ground = new THREE.Mesh( new THREE.PlaneGeometry( GROUND_SIZE, GROUND_SIZE ), new THREE.MeshLambertMaterial( { color: 0x072302 } ) );
  //ground.rotation.x = - Math.PI * 0.5;
  //scene.add( ground );

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

  // // Black star mark
  // const starVertices = [];
  // const prevPoint = new THREE.Vector3(0, 0, 1);
  // const currPoint = new THREE.Vector3();
  // for (let i = 1; i <= 16; i++) {
  //   currPoint.set(Math.sin((2 * Math.PI * i) / 16), 0, Math.cos((2 * Math.PI * i) / 16));

  //   if (i % 2 === 1) {
  //     currPoint.multiplyScalar(0.3);
  //   }

  //   starVertices.push(0, 0, 0);
  //   starVertices.push(prevPoint.x, prevPoint.y, prevPoint.z);
  //   starVertices.push(currPoint.x, currPoint.y, currPoint.z);

  //   prevPoint.copy(currPoint);
  // }

  // const starGeometry = new THREE.BufferGeometry();
  // starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
  // const starMesh = new THREE.Mesh(starGeometry, new THREE.MeshBasicMaterial({ color: 0x020900 }));
  // starMesh.scale.multiplyScalar(6);

  //

  const storm = new LightningStorm({
    size: GROUND_SIZE,
    minHeight: 2000,
    maxHeight: 3000,
    maxSlope: 0.6,
    maxLightnings: 8,

    lightningParameters: scene.userData.rayParams,

    lightningMaterial: scene.userData.lightningMaterial,

    onLightningDown: function (lightning) {
      // Add black star mark at ray strike
      const star1 = starMesh.clone();
      star1.position.copy(lightning.rayParameters.destOffset);
      star1.position.y = 0.05;
      star1.rotation.y = 2 * Math.PI * Math.random();
      scene.add(star1);
    },
  });

  scene.add(storm);

  // Compose rendering

  composer.passes = [];
  composer.addPass(new RenderPass(scene, camera));
  //	createOutline( scene, storm.lightningsMeshes, scene.userData.outlineColor );

  // Controls

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
