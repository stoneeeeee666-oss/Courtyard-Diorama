import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createArchitecture } from './architecture.js';
import { createPond, updateWater } from './pond.js';
import { createVegetation } from './vegetation.js';
import { DIMENSIONS, PALETTE, seededRandom } from './config.js';

const mount = document.querySelector('#scene');
const loading = document.querySelector('#loading');
const resetButton = document.querySelector('#reset-view');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xe9e5da);
scene.fog = new THREE.Fog(0xe9e5da, 38, 72);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.setSize(mount.clientWidth, mount.clientHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.06;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
mount.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(31, mount.clientWidth / mount.clientHeight, 0.1, 120);
const defaultTarget = new THREE.Vector3(0, 1.9, -0.2);
const baseDefaultPosition = new THREE.Vector3(27, 22, 30);
const defaultPosition = baseDefaultPosition.clone();
let portraitMode = camera.aspect < 0.72;
if (portraitMode) {
  defaultPosition.sub(defaultTarget).multiplyScalar(1.7).add(defaultTarget);
  camera.fov = 58;
  camera.updateProjectionMatrix();
}
camera.position.copy(defaultPosition);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(defaultTarget);
controls.enableDamping = true;
controls.dampingFactor = 0.065;
controls.minDistance = 19;
controls.maxDistance = 56;
controls.minPolarAngle = Math.PI * 0.18;
controls.maxPolarAngle = Math.PI * 0.47;
controls.enablePan = true;
controls.screenSpacePanning = false;
controls.panSpeed = 0.45;
controls.rotateSpeed = 0.52;
controls.zoomSpeed = 0.72;
controls.update();
controls.saveState();

function makeGroundTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const context = canvas.getContext('2d');
  context.fillStyle = '#aaa28e';
  context.fillRect(0, 0, 256, 256);
  const random = seededRandom(777);
  for (let i = 0; i < 3200; i += 1) {
    const value = 80 + Math.floor(random() * 100);
    context.fillStyle = `rgba(${value},${value - 2},${value - 10},${0.025 + random() * 0.07})`;
    const radius = random() * 1.25;
    context.fillRect(random() * 256, random() * 256, radius, radius);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 5);
  return texture;
}

function createTerrain() {
  const group = new THREE.Group();
  const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x8f8776, roughness: 1 });
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: PALETTE.earth,
    map: makeGroundTexture(),
    roughness: 1,
  });

  const shape = new THREE.Shape();
  const width = DIMENSIONS.siteWidth;
  const depth = DIMENSIONS.siteDepth;
  const radius = 1.1;
  shape.moveTo(-width / 2 + radius, -depth / 2);
  shape.lineTo(width / 2 - radius, -depth / 2);
  shape.quadraticCurveTo(width / 2, -depth / 2, width / 2, -depth / 2 + radius);
  shape.lineTo(width / 2, depth / 2 - radius);
  shape.quadraticCurveTo(width / 2, depth / 2, width / 2 - radius, depth / 2);
  shape.lineTo(-width / 2 + radius, depth / 2);
  shape.quadraticCurveTo(-width / 2, depth / 2, -width / 2, depth / 2 - radius);
  shape.lineTo(-width / 2, -depth / 2 + radius);
  shape.quadraticCurveTo(-width / 2, -depth / 2, -width / 2 + radius, -depth / 2);

  const base = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, { depth: .72, bevelEnabled: true, bevelSize: .22, bevelThickness: .16, bevelSegments: 2 }),
    baseMaterial,
  );
  base.rotation.x = Math.PI / 2;
  base.position.y = .25;
  base.receiveShadow = true;
  base.castShadow = true;
  group.add(base);

  const surface = new THREE.Mesh(new THREE.ShapeGeometry(shape), groundMaterial);
  surface.rotation.x = -Math.PI / 2;
  surface.position.y = .46;
  surface.receiveShadow = true;
  group.add(surface);

  // Sparse stepping stones keep the open foreground visually quiet.
  const stoneMaterial = new THREE.MeshStandardMaterial({ color: 0xaaa79b, roughness: 1 });
  for (let i = 0; i < 7; i += 1) {
    const stone = new THREE.Mesh(new THREE.CylinderGeometry(.38 + i % 3 * .05, .42, .11, 7), stoneMaterial);
    stone.position.set(-2.1 + i * .75, .56, 7.2 + Math.sin(i * 1.4) * .22);
    stone.rotation.y = i * .73;
    stone.scale.z = .72 + (i % 2) * .2;
    stone.receiveShadow = true;
    group.add(stone);
  }
  return group;
}

function createLighting() {
  const hemisphere = new THREE.HemisphereLight(0xf2efe4, 0x6d7364, 2.1);
  scene.add(hemisphere);

  const sun = new THREE.DirectionalLight(0xfff7e8, 3.4);
  sun.position.set(-14, 24, 18);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -18;
  sun.shadow.camera.right = 18;
  sun.shadow.camera.top = 17;
  sun.shadow.camera.bottom = -17;
  sun.shadow.camera.near = 3;
  sun.shadow.camera.far = 55;
  sun.shadow.bias = -0.0007;
  sun.shadow.normalBias = 0.035;
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0xb7c6bd, .55);
  fill.position.set(12, 8, -12);
  scene.add(fill);
}

function createBackdrop() {
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(25, 64),
    new THREE.MeshBasicMaterial({ color: 0xbcb7aa, transparent: true, opacity: .16, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, -.16, 1.5);
  shadow.scale.set(1.35, .74, 1);
  scene.add(shadow);
}

const diorama = new THREE.Group();
diorama.name = 'CourtyardDiorama';
diorama.add(createTerrain(), createArchitecture(), createPond(), createVegetation());
diorama.rotation.y = -0.055;
scene.add(diorama);
createLighting();
createBackdrop();

const renderStats = { meshes: 0, triangles: 0, objects: 0 };
scene.traverse((object) => {
  renderStats.objects += 1;
  if (!object.isMesh) return;
  renderStats.meshes += 1;
  const geometryTriangles = object.geometry.index
    ? object.geometry.index.count / 3
    : object.geometry.attributes.position.count / 3;
  renderStats.triangles += geometryTriangles * (object.isInstancedMesh ? object.count : 1);
});
window.__COURTYARD_STATS__ = renderStats;
window.__COURTYARD_VIEW__ = () => ({
  position: camera.position.toArray().map((value) => Number(value.toFixed(3))),
  target: controls.target.toArray().map((value) => Number(value.toFixed(3))),
});

let resetStart = 0;
let resetFromPosition = new THREE.Vector3();
let resetFromTarget = new THREE.Vector3();
const resetDuration = 720;

resetButton.addEventListener('click', () => {
  resetFromPosition.copy(camera.position);
  resetFromTarget.copy(controls.target);
  resetStart = performance.now();
  controls.enabled = false;
});

function animateReset(now) {
  if (!resetStart) return;
  const t = Math.min(1, (now - resetStart) / resetDuration);
  const eased = 1 - Math.pow(1 - t, 3);
  camera.position.lerpVectors(resetFromPosition, defaultPosition, eased);
  controls.target.lerpVectors(resetFromTarget, defaultTarget, eased);
  if (t === 1) {
    controls.reset();
    controls.enabled = true;
    resetStart = 0;
  }
}

function resize() {
  const width = mount.clientWidth;
  const height = mount.clientHeight;
  const nextAspect = width / height;
  const nextPortraitMode = nextAspect < 0.72;
  if (nextPortraitMode !== portraitMode) {
    const distanceScale = nextPortraitMode ? 1.7 : 1 / 1.7;
    camera.position.sub(controls.target).multiplyScalar(distanceScale).add(controls.target);
    portraitMode = nextPortraitMode;
  }
  defaultPosition.copy(baseDefaultPosition);
  if (portraitMode) defaultPosition.sub(defaultTarget).multiplyScalar(1.7).add(defaultTarget);
  controls.position0.copy(defaultPosition);
  controls.target0.copy(defaultTarget);
  camera.aspect = nextAspect;
  camera.fov = portraitMode ? 58 : 31;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setSize(width, height, false);
}

window.addEventListener('resize', resize, { passive: true });

const clock = new THREE.Clock();
let firstFrame = true;
function render(now) {
  requestAnimationFrame(render);
  animateReset(now);
  if (!resetStart) controls.update();
  updateWater(clock.getElapsedTime());
  renderer.render(scene, camera);
  if (firstFrame) {
    firstFrame = false;
    document.documentElement.dataset.renderReady = 'true';
    requestAnimationFrame(() => loading.classList.add('hidden'));
  }
}

requestAnimationFrame(render);
