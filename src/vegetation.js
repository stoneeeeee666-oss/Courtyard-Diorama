import * as THREE from 'three';
import { PALETTE, seededRandom } from './config.js';

const leafMaterials = [
  new THREE.MeshStandardMaterial({ color: PALETTE.sage, roughness: 0.82, side: THREE.DoubleSide }),
  new THREE.MeshStandardMaterial({ color: PALETTE.olive, roughness: 0.86, side: THREE.DoubleSide }),
  new THREE.MeshStandardMaterial({ color: PALETTE.deepGreen, roughness: 0.88, side: THREE.DoubleSide }),
];
const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x506046, roughness: 0.92 });
const bambooMaterial = new THREE.MeshStandardMaterial({ color: 0x687659, roughness: 0.88 });

function enableLeafShadows(object) {
  object.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  return object;
}

function createLeafGeometry(length = 1.8, width = 0.72, segments = 7) {
  const vertices = [];
  const indices = [];
  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const half = Math.sin(t * Math.PI) * width * 0.5 * (0.88 + t * 0.12);
    const bend = Math.sin(t * Math.PI) * 0.14 + t * t * 0.16;
    vertices.push(-half, t * length, bend - half * .28, 0, t * length, bend + half * .16, half, t * length, bend - half * .28);
    if (i < segments) {
      const a = i * 3;
      indices.push(a, a + 1, a + 3, a + 1, a + 4, a + 3, a + 1, a + 2, a + 4, a + 2, a + 5, a + 4);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

const broadLeafGeometry = createLeafGeometry(1.9, 0.95, 8);
const narrowLeafGeometry = createLeafGeometry(1.25, 0.18, 6);
const smallLeafGeometry = createLeafGeometry(0.46, 0.16, 4);

function stemBetween(start, end, radius = 0.035, material = stemMaterial) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 1.2, length, 6), material);
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  mesh.castShadow = true;
  return mesh;
}

function createBroadLeafPlant(seed, scale = 1) {
  const random = seededRandom(seed);
  const group = new THREE.Group();
  const leafCount = 7 + Math.floor(random() * 3);
  for (let i = 0; i < leafCount; i += 1) {
    const azimuth = (i / leafCount) * Math.PI * 2 + random() * 0.45;
    const height = 0.62 + random() * 0.42;
    const end = new THREE.Vector3(Math.cos(azimuth) * 0.48, height, Math.sin(azimuth) * 0.48);
    group.add(stemBetween(new THREE.Vector3(0, 0.08, 0), end, 0.025));
    const leaf = new THREE.Mesh(broadLeafGeometry, leafMaterials[i % leafMaterials.length]);
    leaf.position.copy(end);
    leaf.rotation.order = 'YXZ';
    leaf.rotation.y = -azimuth + Math.PI / 2;
    leaf.rotation.x = 0.75 + random() * 0.38;
    leaf.rotation.z = (random() - 0.5) * 0.24;
    const s = 0.72 + random() * 0.42;
    leaf.scale.set(s, s, s);
    leaf.castShadow = true;
    group.add(leaf);
  }
  group.scale.setScalar(scale);
  return group;
}

function createMonsteraGeometry() {
  const shape = new THREE.Shape();
  const points = [
    [0, 0], [-0.28, .12], [-.58, .34], [-.38, .48], [-.76, .7], [-.42, .78],
    [-.68, 1.08], [-.29, 1.05], [0, 1.42], [.29, 1.05], [.68, 1.08], [.42, .78],
    [.76, .7], [.38, .48], [.58, .34], [.28, .12],
  ];
  points.forEach(([x, y], index) => index ? shape.lineTo(x, y) : shape.moveTo(x, y));
  shape.closePath();
  for (const [x, y, r] of [[-.2,.68,.07],[.22,.72,.08],[-.13,.98,.06],[.15,1.08,.055]]) {
    const hole = new THREE.Path();
    hole.absellipse(x, y, r, r * 1.8, 0, Math.PI * 2, false);
    shape.holes.push(hole);
  }
  const geometry = new THREE.ShapeGeometry(shape, 8);
  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i += 1) {
    const x = positions.getX(i), y = positions.getY(i);
    positions.setZ(i, .22 * Math.sin(y * 2.2) - x * x * .3 - .14 * y * y);
  }
  geometry.computeVertexNormals();
  return geometry;
}

const monsteraGeometry = createMonsteraGeometry();

function createMonstera(seed, scale = 1) {
  const random = seededRandom(seed);
  const group = new THREE.Group();
  for (let i = 0; i < 6; i += 1) {
    const azimuth = i / 6 * Math.PI * 2 + random() * .35;
    const end = new THREE.Vector3(Math.cos(azimuth) * .4, .5 + random() * .6, Math.sin(azimuth) * .4);
    group.add(stemBetween(new THREE.Vector3(0, .05, 0), end, .026));
    const leaf = new THREE.Mesh(monsteraGeometry, leafMaterials[(i + 2) % 3]);
    leaf.position.copy(end);
    leaf.rotation.order = 'YXZ';
    leaf.rotation.y = -azimuth;
    leaf.rotation.x = Math.PI / 2 + .23 + random() * .25;
    leaf.rotation.z = (random() - .5) * .35;
    const size = .65 + random() * .24;
    leaf.scale.setScalar(size);
    leaf.castShadow = true;
    group.add(leaf);
  }
  group.scale.setScalar(scale);
  return group;
}

function createFern(seed, scale = 1) {
  const random = seededRandom(seed);
  const group = new THREE.Group();
  const fronds = 8;
  for (let f = 0; f < fronds; f += 1) {
    const azimuth = f / fronds * Math.PI * 2 + random() * .18;
    const length = 1.45 + random() * .4;
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0, .12, 0),
      new THREE.Vector3(Math.cos(azimuth) * .3, .82, Math.sin(azimuth) * .3),
      new THREE.Vector3(Math.cos(azimuth) * length, .42 + random() * .28, Math.sin(azimuth) * length),
    );
    const stem = new THREE.Mesh(new THREE.TubeGeometry(curve, 8, .018, 5, false), stemMaterial);
    stem.castShadow = true;
    group.add(stem);
    for (let i = 1; i < 12; i += 1) {
      const t = i / 13;
      const center = curve.getPoint(t);
      const taper = 1 - Math.abs(t - .52) * .75;
      for (const side of [-1, 1]) {
        const leaflet = new THREE.Mesh(smallLeafGeometry, leafMaterials[1 + (f % 2)]);
        leaflet.position.copy(center);
        leaflet.scale.set(taper * .75, taper * .78, taper);
        leaflet.rotation.order = 'YXZ';
        leaflet.rotation.y = -azimuth + (side > 0 ? 1.14 : -1.14);
        leaflet.rotation.x = 1.32;
        leaflet.castShadow = true;
        group.add(leaflet);
      }
    }
  }
  group.scale.setScalar(scale);
  return group;
}

function createGrass(seed, scale = 1) {
  const random = seededRandom(seed);
  const group = new THREE.Group();
  for (let i = 0; i < 13; i += 1) {
    const leaf = new THREE.Mesh(narrowLeafGeometry, leafMaterials[i % 2]);
    const azimuth = i / 13 * Math.PI * 2 + random() * .5;
    leaf.position.set((random() - .5) * .28, 0, (random() - .5) * .28);
    leaf.rotation.order = 'YXZ';
    leaf.rotation.y = azimuth;
    leaf.rotation.x = .35 + random() * .62;
    leaf.rotation.z = (random() - .5) * .32;
    leaf.scale.set(.7 + random() * .45, .85 + random() * .5, 1);
    leaf.castShadow = true;
    group.add(leaf);
  }
  group.scale.setScalar(scale);
  return group;
}

function createBamboo(seed, scale = 1) {
  const random = seededRandom(seed);
  const group = new THREE.Group();
  for (let i = 0; i < 5; i += 1) {
    const height = 2.8 + random() * 1.4;
    const x = (random() - .5) * .72;
    const z = (random() - .5) * .72;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(.045, .065, height, 7), bambooMaterial);
    stem.position.set(x, height / 2, z);
    stem.rotation.z = (random() - .5) * .08;
    stem.castShadow = true;
    group.add(stem);
    for (let j = 1; j < 5; j += 1) {
      const branchY = height * (.32 + j * .13);
      for (const side of [-1, 1]) {
        const leaf = new THREE.Mesh(narrowLeafGeometry, leafMaterials[(i + j) % 3]);
        leaf.position.set(x, branchY, z);
        leaf.rotation.order = 'YXZ';
        leaf.rotation.y = random() * Math.PI * 2;
        leaf.rotation.x = 1.05 + random() * .38;
        leaf.rotation.z = side * .25;
        leaf.scale.set(.65, .64 + random() * .3, .65);
        leaf.castShadow = true;
        group.add(leaf);
      }
    }
  }
  group.scale.setScalar(scale);
  return group;
}

function createGroundCover(seed, scale = 1) {
  const random = seededRandom(seed);
  const group = new THREE.Group();
  for (let i = 0; i < 18; i += 1) {
    const leaf = new THREE.Mesh(smallLeafGeometry, leafMaterials[i % 3]);
    const radius = Math.sqrt(random()) * .8;
    const angle = random() * Math.PI * 2;
    leaf.position.set(Math.cos(angle) * radius, random() * .09, Math.sin(angle) * radius);
    leaf.rotation.y = -angle + Math.PI / 2;
    leaf.rotation.x = .9 + random() * .5;
    leaf.scale.setScalar(.45 + random() * .34);
    leaf.castShadow = true;
    group.add(leaf);
  }
  group.scale.setScalar(scale);
  return group;
}

function place(group, plant, x, z, rotation = 0) {
  plant.position.set(x, .55, z);
  plant.rotation.y = rotation;
  group.add(enableLeafShadows(plant));
}

export function createVegetation() {
  const group = new THREE.Group();
  group.name = 'LayeredVegetation';
  const random = seededRandom(202410);

  const broadPlants = [
    [-4.7, 3.55, 1.05], [-3.7, -2.95, .9], [3.8, 2.8, 1], [3.9, -2.5, .86],
    [1.8, -3.7, .72], [-5.05, -.35, .78],
  ];
  broadPlants.forEach(([x, z, scale], i) => place(group, createBroadLeafPlant(100 + i, scale), x, z, random() * 6));

  const monsteras = [[-3.25, 3.65, 1.05], [3.25, 2.25, .95], [3.5, -2.25, .76], [-4.1, -1.25, .72]];
  monsteras.forEach(([x, z, scale], i) => place(group, createMonstera(200 + i, scale), x, z, random() * 6));

  const ferns = [[-4.45, 2.1, .65], [-3.65, -3.65, .58], [2.65, 3.5, .68], [4.2, .5, .62], [2.9, -3.3, .55]];
  ferns.forEach(([x, z, scale], i) => place(group, createFern(300 + i, scale), x, z, random() * 6));

  const grasses = [[-4.65, 1.1, .75], [-2.8, -4.05, .7], [1.25, 4.25, .8], [4.45, -1, .72], [4, 1.65, .62]];
  grasses.forEach(([x, z, scale], i) => place(group, createGrass(400 + i, scale), x, z, random() * 6));

  place(group, createBamboo(500, .85), 4.55, -3.4, -.2);
  place(group, createBamboo(501, .72), -5.15, -3.0, .4);
  // Deliberate banks: tall foliage against the galleries, low ferns beside the bridge.
  [[-5.6,-2.2,.9],[-5.7,.2,1.1],[-5.3,2.2,.85],[4.9,-2,1.05],[4.8,2.6,.9]].forEach(([x,z,s],i) =>
    place(group, createBroadLeafPlant(710+i,s),x,z,random()*6));
  [[-4.3,4.3,1.15],[3.8,4.1,1.2],[4.9,.6,.95]].forEach(([x,z,s],i) =>
    place(group, createMonstera(730+i,s),x,z,random()*6));
  [[-3.1,3.7,.6],[-3.8,-2.8,.7],[3.6,-3.8,.65],[-5,1.7,.7]].forEach(([x,z,s],i) =>
    place(group, createFern(750+i,s),x,z,random()*6));

  const covers = [[-4.7, 3.1], [-4.8, -2.1], [-2.9, 3.9], [3.55, 3.25], [4.15, -2.9], [2.6, -3.8], [-3.7, -3.7]];
  covers.forEach(([x, z], i) => place(group, createGroundCover(600 + i, .72), x, z, random() * 6));
  // Batch shared leaf prototypes while retaining each leaf's curved geometry and transform.
  group.updateMatrixWorld(true);
  const batches = new Map();
  group.traverse((mesh) => {
    if (!mesh.isMesh || !leafMaterials.includes(mesh.material)) return;
    const key = mesh.geometry.uuid + mesh.material.uuid;
    if (!batches.has(key)) batches.set(key, []);
    batches.get(key).push(mesh);
  });
  for (const leaves of batches.values()) {
    const batch = new THREE.InstancedMesh(leaves[0].geometry, leaves[0].material, leaves.length);
    leaves.forEach((leaf, i) => {
      batch.setMatrixAt(i, leaf.matrixWorld);
      leaf.removeFromParent();
    });
    batch.castShadow = batch.receiveShadow = true;
    group.add(batch);
  }
  return group;
}
