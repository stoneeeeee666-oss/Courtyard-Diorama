import * as THREE from 'three';
import { DIMENSIONS, PALETTE, seededRandom } from './config.js';

const plaster = new THREE.MeshStandardMaterial({ color: PALETTE.plaster, roughness: 0.94 });
const plasterShade = new THREE.MeshStandardMaterial({ color: PALETTE.plasterShade, roughness: 0.96 });
const wood = new THREE.MeshStandardMaterial({ color: PALETTE.wood, roughness: 0.83 });
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

function addRoofFringe(group, length, width, rise) {
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
        DIMENSIONS.wallHeight - 0.06 - random() * 0.11,
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
  ridge.position.y = DIMENSIONS.wallHeight + rise + 0.08;
  shadows(ridge);
  group.add(ridge);
}

export function createThatchedRoof({ length, width, x = 0, z = 0, rotation = 0, height = DIMENSIONS.wallHeight }) {
  const group = new THREE.Group();
  const overhang = 0.58;
  const run = width / 2;
  const rise = run * DIMENSIONS.roofPitch;
  const slope = Math.hypot(run + overhang, rise);
  const angle = Math.atan2(rise, run + overhang);

  for (const side of [-1, 1]) {
    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(length + overhang * 2, 0.3, slope),
      thatch,
    );
    panel.position.set(0, height + rise / 2, side * (run / 2 + overhang * 0.18));
    panel.rotation.x = side * angle;
    shadows(panel);
    group.add(panel);
  }

  addRoofFringe(group, length, width, rise);
  group.position.set(x, 0, z);
  group.rotation.y = rotation;
  return group;
}

function createCourtyardFacade({ length, z, x = 0, rotation = 0, bays = 6, openBays = [] }) {
  const group = new THREE.Group();
  const bayWidth = length / bays;
  const facadeY = DIMENSIONS.floorY + 1.78;

  for (let i = 0; i <= bays; i += 1) {
    const px = -length / 2 + i * bayWidth;
    group.add(box(0.17, 3.45, 0.17, darkWood, px, facadeY, z));
  }
  group.add(box(length + 0.3, 0.19, 0.19, darkWood, 0, DIMENSIONS.floorY + 3.15, z));
  group.add(box(length + 0.3, 0.14, 0.2, darkWood, 0, DIMENSIONS.floorY + 1.28, z));

  for (let i = 0; i < bays; i += 1) {
    if (openBays.includes(i)) continue;
    const cx = -length / 2 + (i + 0.5) * bayWidth;
    const screen = box(bayWidth - 0.25, 1.66, 0.08, plasterShade, cx, DIMENSIONS.floorY + 2.18, z + 0.035);
    screen.material = screen.material.clone();
    screen.material.transparent = true;
    screen.material.opacity = 0.84;
    group.add(screen);
    group.add(box(bayWidth - 0.2, 0.1, 0.13, darkWood, cx, DIMENSIONS.floorY + 2.18, z + 0.09));
    group.add(box(0.09, 1.68, 0.13, darkWood, cx, DIMENSIONS.floorY + 2.18, z + 0.09));
  }

  group.position.x = x;
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

function createNorthWing() {
  const group = new THREE.Group();
  const length = DIMENSIONS.northLength;
  const depth = DIMENSIONS.northDepth;
  const z = -7.2;
  group.add(box(length, 3.1, depth, plaster, 0, DIMENSIONS.floorY + 1.55, z - 0.25));
  addDeckBoards(group, length + 0.5, 1.35, 0, z + depth / 2 + 0.42);
  group.add(createCourtyardFacade({ length, z: z + depth / 2 + 0.05, bays: 7, openBays: [3] }));
  group.add(createThatchedRoof({ length, width: depth + 1.35, z: z - 0.2 }));
  return group;
}

function createWestWing() {
  const group = new THREE.Group();
  const length = DIMENSIONS.westLength;
  const depth = DIMENSIONS.westDepth;
  const x = -9.8;
  const z = 0.4;
  const body = box(length, 3.05, depth, plaster, 0, DIMENSIONS.floorY + 1.52, 0);
  body.rotation.y = Math.PI / 2;
  body.position.set(x - 0.25, DIMENSIONS.floorY + 1.52, z);
  group.add(body);
  addDeckBoards(group, length + 0.15, 1.4, x + depth / 2 + 0.42, z, Math.PI / 2);
  const facade = createCourtyardFacade({ length, z: 0, rotation: Math.PI / 2, bays: 5, openBays: [3] });
  facade.position.set(x + depth / 2 + 0.05, 0, z);
  group.add(facade);
  group.add(createThatchedRoof({ length, width: depth + 1.3, x, z, rotation: Math.PI / 2 }));
  return group;
}

function createEastPavilion() {
  const group = new THREE.Group();
  const x = 8.7;
  const z = 1.1;
  const length = DIMENSIONS.eastLength;
  const width = DIMENSIONS.eastDepth;
  addDeckBoards(group, length, width, x, z, Math.PI / 2);

  const rows = [-width / 2 + 0.45, width / 2 - 0.45];
  const columns = 5;
  for (const row of rows) {
    for (let i = 0; i < columns; i += 1) {
      const localZ = -length / 2 + 0.55 + i * ((length - 1.1) / (columns - 1));
      group.add(box(0.2, 3.2, 0.2, darkWood, x + row, DIMENSIONS.floorY + 1.6, z + localZ));
    }
  }
  group.add(box(width - 0.4, 0.2, 0.2, darkWood, x, DIMENSIONS.floorY + 3.12, z - length / 2 + 0.55));
  group.add(box(width - 0.4, 0.2, 0.2, darkWood, x, DIMENSIONS.floorY + 3.12, z + length / 2 - 0.55));
  group.add(createThatchedRoof({ length, width: width + 0.8, x, z, rotation: Math.PI / 2 }));

  // A restrained rear wall preserves the open dining-hall character visible in the reference.
  group.add(box(0.18, 2.55, length - 1.1, plaster, x + width / 2 - 0.36, DIMENSIONS.floorY + 1.34, z));
  for (let i = 0; i < 4; i += 1) {
    group.add(box(0.12, 2.7, 0.15, darkWood, x + width / 2 - 0.46, DIMENSIONS.floorY + 1.4, z - 4.4 + i * 2.9));
  }
  return group;
}

function createSouthGate() {
  const group = new THREE.Group();
  const x = -7.1;
  const z = 8.05;
  addDeckBoards(group, 5.1, 2.25, x, z);
  for (const px of [-2, 2]) {
    group.add(box(0.22, 2.85, 0.22, darkWood, x + px, DIMENSIONS.floorY + 1.42, z));
  }
  group.add(box(4.5, 0.2, 0.22, darkWood, x, DIMENSIONS.floorY + 2.78, z));
  const roof = createThatchedRoof({ length: 5.7, width: 3, x, z, height: 3.05 });
  roof.scale.y = 0.82;
  group.add(roof);
  return group;
}

function createRailings() {
  const group = new THREE.Group();
  const segments = [
    [-6.5, 6.25, 7.2, 0],
    [5.2, 6.1, 5.8, 0],
    [6.9, 4.0, 4.2, Math.PI / 2],
  ];
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
  group.add(createNorthWing(), createWestWing(), createEastPavilion(), createSouthGate(), createRailings());

  // Stone thresholds and a narrow courtyard path anchor the wooden structures to the terrain.
  const stone = new THREE.MeshStandardMaterial({ color: PALETTE.stone, roughness: 0.96 });
  for (let i = 0; i < 8; i += 1) {
    const slab = box(1.5, 0.12, 0.75, stone, -7.2 + i * 1.55, 0.48, 6.75 - i * 0.1);
    slab.rotation.y = (i % 2 ? -1 : 1) * 0.025;
    group.add(slab);
  }
  return group;
}
