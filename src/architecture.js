import * as THREE from 'three';
import { DIMENSIONS, PALETTE, seededRandom } from './config.js';
import { PLAN } from './plan.js';

const plaster = new THREE.MeshStandardMaterial({ color: PALETTE.plaster, roughness: 0.94 });
const darkWood = new THREE.MeshStandardMaterial({ color: PALETTE.darkWood, roughness: 0.9 });
const floorWood = new THREE.MeshStandardMaterial({ color: 0x8f785e, roughness: 0.88 });

function shadows(mesh, cast = true, receive = true) {
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
  return mesh;
}

function box(w, h, d, material, x, y, z) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  return shadows(mesh);
}

function createThatchTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#95876e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const random = seededRandom(901);
  for (let x = 0; x < canvas.width; x += 2) {
    const value = 88 + Math.floor(random() * 42);
    ctx.strokeStyle = `rgba(${value},${value - 8},${value - 22},${0.18 + random() * 0.28})`;
    ctx.lineWidth = random() > 0.78 ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(x + random() * 2, 0);
    ctx.bezierCurveTo(x - 2, 70, x + 3, 170, x + random() * 3, 256);
    ctx.stroke();
  }
  for (let y = 14; y < canvas.height; y += 18) {
    ctx.fillStyle = 'rgba(62,52,39,.055)';
    ctx.fillRect(0, y, canvas.width, 2);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(9, 2.4);
  return texture;
}

const thatchTexture = createThatchTexture();
const thatch = new THREE.MeshStandardMaterial({
  color: PALETTE.roof,
  map: thatchTexture,
  roughness: 1,
  metalness: 0,
});
const thatchEdge = new THREE.MeshStandardMaterial({ color: PALETTE.roofDark, roughness: 1 });

function addRoofFringe(group, length, width, rise, height) {
  const strands = Math.max(16, Math.floor(length * 3.6));
  const geometry = new THREE.BoxGeometry(0.035, 0.34, 0.035);
  const instances = new THREE.InstancedMesh(geometry, thatchEdge, strands * 2);
  const dummy = new THREE.Object3D();
  const random = seededRandom(Math.floor(length * 100 + width * 9));
  let index = 0;
  for (const side of [-1, 1]) {
    for (let i = 0; i < strands; i += 1) {
      dummy.position.set(
        -length / 2 + (i + 0.5) * (length / strands),
        height - 0.06 - random() * 0.11,
        side * (width / 2 + 0.48),
      );
      dummy.rotation.set((random() - 0.5) * 0.1, 0, (random() - 0.5) * 0.12);
      dummy.scale.set(0.7 + random() * 0.7, 0.72 + random() * 0.48, 1);
      dummy.updateMatrix();
      instances.setMatrixAt(index, dummy.matrix);
      index += 1;
    }
  }
  instances.castShadow = true;
  group.add(instances);

  const ridge = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.29, length + 1.05, 8),
    thatchEdge,
  );
  ridge.rotation.z = Math.PI / 2;
  ridge.position.y = height + rise + 0.08;
  shadows(ridge);
  group.add(ridge);
}

export function createThatchedRoof({ length, width, x = 0, z = 0, rotation = 0, height = DIMENSIONS.wallHeight }) {
  const group = new THREE.Group();
  const overhang = 0.58;
  group.userData.isRoof = true;
  const run = width / 2;
  const rise = run * DIMENSIONS.roofPitch;
  const slope = Math.hypot(run + overhang, rise);
  const angle = Math.atan2(rise, run + overhang);

  for (const side of [-1, 1]) {
    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(length + overhang * 2, 0.3, slope),
      thatch,
    );
    panel.position.set(0, height + rise / 2, side * (run + overhang) / 2);
    panel.rotation.x = side * angle;
    shadows(panel);
    group.add(panel);
  }

  addRoofFringe(group, length, width, rise, height);
  group.position.set(x, 0, z);
  group.rotation.y = rotation;
  return group;
}

// A full timber facade: solid lower panels, dense lattice windows and real door bays.
function createCourtyardFacade({ length, x = 0, z = 0, rotation = 0, bays = 6, openBays = [] }) {
  const group = new THREE.Group();
  const bayWidth = length / bays;
  const floor = DIMENSIONS.floorY + 0.06;
  const top = DIMENSIONS.wallHeight;
  for (let i = 0; i <= bays; i += 1) {
    group.add(box(.17, top - floor, .17, darkWood,
      -length / 2 + i * bayWidth, (floor + top) / 2, 0));
  }
  group.add(box(length, .2, .18, darkWood, 0, top - .1, 0));
  for (let i = 0; i < bays; i += 1) {
    if (openBays.includes(i)) continue;
    const cx = -length / 2 + (i + .5) * bayWidth;
    const w = bayWidth - .17;
    group.add(box(w, .9, .12, darkWood, cx, floor + .45, 0));
    // Opaque timber backing keeps A enclosed; lattice is articulated on both faces.
    group.add(box(w, top - floor - .9, .045, floorWood, cx, (top + floor + .9) / 2, 0));
    for (const side of [-1, 1]) {
      for (let j = 0; j <= 8; j += 1) {
        group.add(box(.045, 1.85, .055, darkWood, cx - w / 2 + j * w / 8, floor + 1.87, side * .07));
      }
      for (let j = 0; j <= 5; j += 1) {
        group.add(box(w, .045, .055, darkWood, cx, floor + .95 + j * .37, side * .07));
      }
    }
  }
  group.position.set(x, 0, z);
  group.rotation.y = rotation;
  return group;
}

function addDeckBoards(group, width, depth, x, z, rotation = 0) {
  const deck = new THREE.Group();
  const boards = Math.max(5, Math.floor(depth / 0.45));
  for (let i = 0; i < boards; i += 1) {
    deck.add(box(width, 0.12, depth / boards - 0.025, floorWood, 0, DIMENSIONS.floorY, -depth / 2 + (i + 0.5) * depth / boards));
  }
  deck.position.set(x, 0, z);
  deck.rotation.y = rotation;
  group.add(deck);
}

// Open structures share plan-aligned decks and post/beam rows. Ends remain walkable.
function createOpenStructure(name, bounds, alongZ = false) {
  const [left, right, back, front] = bounds;
  const x = (left + right) / 2;
  const z = (back + front) / 2;
  const width = right - left;
  const depth = front - back;
  const group = new THREE.Group();
  group.name = name;
  addDeckBoards(group, width, depth, x, z);
  const length = alongZ ? depth : width;
  const span = alongZ ? width : depth;
  const frame = new THREE.Group();
  const bays = Math.ceil(length / 2.8);
  const floor = DIMENSIONS.floorY + .06;
  const height = DIMENSIONS.wallHeight - floor;
  for (const side of [-1, 1]) {
    frame.add(box(length, .2, .18, darkWood, 0, DIMENSIONS.wallHeight - .1, side * (span / 2 - .12)));
    for (let i = 0; i <= bays; i += 1) {
      frame.add(box(.18, height, .18, darkWood, -length / 2 + i * length / bays,
        floor + height / 2, side * (span / 2 - .12)));
    }
  }
  for (let i = 0; i <= bays; i += 1) {
    frame.add(box(.16, .18, span, darkWood, -length / 2 + i * length / bays,
      DIMENSIONS.wallHeight - .22, 0));
  }
  frame.position.set(x, 0, z);
  frame.rotation.y = alongZ ? Math.PI / 2 : 0;
  group.add(frame, createThatchedRoof({length, width: span, x, z, rotation: frame.rotation.y}));
  return group;
}

function createNorthWing() {
  return createOpenStructure('C_OpenCorridor', PLAN.regions.openCorridor);
}

function createWestWing() {
  const group = new THREE.Group();
  group.name = 'A_ContinuousMainHouse';
  const [left, right, back, front] = PLAN.regions.west;
  const length = front - back;
  const width = right - left;
  const x = (left + right) / 2;
  const z = (back + front) / 2;
  addDeckBoards(group, width, length, x, z);
  group.add(
    createCourtyardFacade({length, x: left, z, rotation: Math.PI / 2, bays: 6, openBays: [2]}),
    createCourtyardFacade({length, x: right, z, rotation: Math.PI / 2, bays: 6}),
    createCourtyardFacade({length: width, x, z: front, bays: 3, openBays: [1]}),
    // North door connects the house to B without a wall across the passage.
    createCourtyardFacade({length: width, x, z: back, bays: 3, openBays: [1]}),
    createThatchedRoof({length, width, x, z, rotation: Math.PI / 2}),
  );
  return group;
}

function createPassage() {
  const group = createOpenStructure('B_CoveredPassage', PLAN.regions.passage);
  // House interfaces flank B; only north/south segments are walls, never its ends.
  for (const [ax, az, bx, bz] of PLAN.walls) {
    const wall = box(Math.hypot(bx - ax, bz - az), 2.8, .16, plaster,
      (ax + bx) / 2, DIMENSIONS.floorY + 1.4, (az + bz) / 2);
    wall.rotation.y = -Math.atan2(bz - az, bx - ax);
    group.add(wall);
  }
  return group;
}

function createEastPavilion() {
  return createOpenStructure('E_OpenPavilion', PLAN.regions.right, true);
}

function createForegroundCorridor() {
  const group = createOpenStructure('F_CoveredWalkway', PLAN.regions.foreground);
  // Ground-cover surface only: no new vegetation, raised platform or paving south of F.
  const [left, right, , front] = PLAN.regions.foreground;
  const lawn = new THREE.MeshStandardMaterial({color: PALETTE.sage, roughness: 1});
  group.add(box(right - left, .012, 11.1 - front, lawn,
    (left + right) / 2, .47, (front + 11.1) / 2));
  return group;
}

function createRailings() {
  const group = new THREE.Group();
  const segments = PLAN.rails.map(([ax, az, bx, bz]) => [
    (ax+bx)/2, (az+bz)/2, Math.hypot(bx-ax,bz-az), -Math.atan2(bz-az,bx-ax),
  ]);
  for (const [x, z, length, rotation] of segments) {
    const rail = new THREE.Group();
    rail.add(box(length, 0.11, 0.1, darkWood, 0, 1.04, 0));
    rail.add(box(length, 0.09, 0.09, darkWood, 0, 0.63, 0));
    const posts = Math.ceil(length / 1.45);
    for (let i = 0; i <= posts; i += 1) {
      rail.add(box(0.11, 0.9, 0.11, darkWood, -length / 2 + i * length / posts, 0.72, 0));
    }
    rail.position.set(x, 0, z);
    rail.rotation.y = rotation;
    group.add(rail);
  }
  return group;
}

export function createArchitecture() {
  const group = new THREE.Group();
  group.name = 'Architecture';
  group.add(createWestWing(), createPassage(), createNorthWing(), createEastPavilion(),
    createForegroundCorridor(), createRailings());
  return group;
}
