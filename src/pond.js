import * as THREE from 'three';
import { PALETTE, seededRandom } from './config.js';

const pondPoints = [
  [-4.9, -3.5], [-2.5, -4.5], [0.4, -4.35], [3.35, -3.55],
  [4.75, -1.45], [4.45, 1.15], [3.3, 3.6], [1.2, 4.55],
  [-1.7, 4.15], [-4.2, 2.65], [-5.15, 0.3],
];

function makeShape(scale = 1, offsetX = 0, offsetZ = 0) {
  const shape = new THREE.Shape();
  pondPoints.forEach(([x, z], index) => {
    const px = x * scale + offsetX;
    const pz = z * scale + offsetZ;
    if (index === 0) shape.moveTo(px, pz);
    else shape.lineTo(px, pz);
  });
  shape.closePath();
  return shape;
}

function horizontalShape(shape, material, y) {
  const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = y;
  mesh.receiveShadow = true;
  return mesh;
}

const waterMaterial = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  uniforms: {
    uTime: { value: 0 },
    uLight: { value: new THREE.Vector3(-0.45, 0.8, 0.35).normalize() },
    uShallow: { value: new THREE.Color(0xa9bbb0) },
    uDeep: { value: new THREE.Color(0x617a70) },
  },
  vertexShader: `
    varying vec3 vWorld;
    varying float vWave;
    uniform float uTime;
    void main() {
      vec3 p = position;
      float wave = sin(p.x * 2.1 + uTime * .75) * .018 + cos(p.y * 2.7 - uTime * .55) * .014;
      p.z += wave;
      vec4 world = modelMatrix * vec4(p, 1.0);
      vWorld = world.xyz;
      vWave = wave;
      gl_Position = projectionMatrix * viewMatrix * world;
    }
  `,
  fragmentShader: `
    varying vec3 vWorld;
    varying float vWave;
    uniform vec3 uShallow;
    uniform vec3 uDeep;
    uniform vec3 uLight;
    void main() {
      vec3 viewDir = normalize(cameraPosition - vWorld);
      float fresnel = pow(1.0 - max(dot(viewDir, vec3(0.0, 1.0, 0.0)), 0.0), 2.5);
      float bands = sin(vWorld.x * 1.7 + vWorld.z * 1.35) * .5 + .5;
      vec3 color = mix(uDeep, uShallow, .35 + bands * .2);
      float ripple = sin(vWorld.x * 12.0 + vWorld.z * 8.0 + vWave * 80.0);
      color += (.035 + vWave * .8) * max(dot(uLight, vec3(0.0, 1.0, 0.0)), 0.0);
      color += pow(max(ripple, 0.0), 18.0) * .035;
      color = mix(color, vec3(.83, .86, .80), fresnel * .28);
      gl_FragColor = vec4(color, .76 + fresnel * .12);
    }
  `,
});

function createShore() {
  const group = new THREE.Group();
  const mud = new THREE.MeshStandardMaterial({ color: 0x766f5e, roughness: 1 });
  const waterbed = new THREE.MeshStandardMaterial({ color: 0x657369, roughness: 0.98 });
  group.add(horizontalShape(makeShape(1.08), mud, 0.43));
  group.add(horizontalShape(makeShape(1), waterbed, 0.45));
  return group;
}

function createStones() {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: PALETTE.stone, roughness: 0.98 });
  const random = seededRandom(812);
  const positions = [
    [-4.5, -2.4], [-5, 0.4], [-4.1, 2.9], [-2.8, 4.1], [0.2, 4.25],
    [3.05, 3.35], [4.25, 1.3], [4.3, -1.2], [3.15, -3.35], [-1.8, -4.15],
  ];
  positions.forEach(([x, z], i) => {
    const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.32 + random() * 0.28, 0), material);
    stone.position.set(x, 0.55 + random() * 0.08, z);
    stone.scale.set(1.2 + random(), 0.38 + random() * 0.25, 0.75 + random() * 0.5);
    stone.rotation.set(random(), random() * Math.PI, random());
    stone.castShadow = i % 2 === 0;
    stone.receiveShadow = true;
    group.add(stone);
  });
  return group;
}

function createBridge() {
  const group = new THREE.Group();
  const plankMaterial = new THREE.MeshStandardMaterial({ color: 0x6f5945, roughness: 0.9 });
  const supportMaterial = new THREE.MeshStandardMaterial({ color: 0x4a3b31, roughness: 0.94 });
  const count = 19;
  const length = 9.3;
  const angle = -0.13;

  for (let i = 0; i < count; i += 1) {
    const t = i / (count - 1);
    const z = -length / 2 + t * length;
    const arch = Math.sin(t * Math.PI) * 0.56;
    const nextArch = Math.sin(Math.min(1, t + 1 / (count - 1)) * Math.PI) * 0.56;
    const plank = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.18, length / count - 0.035), plankMaterial);
    plank.position.set(0, 1.05 + arch, z);
    plank.rotation.x = -Math.atan2(nextArch - arch, length / count);
    plank.castShadow = true;
    plank.receiveShadow = true;
    group.add(plank);
  }

  for (const x of [-0.48, 0.48]) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.2, length), supportMaterial);
    beam.position.set(x, 0.92, 0);
    beam.castShadow = true;
    group.add(beam);
  }
  for (const z of [-3.4, 0, 3.4]) {
    for (const x of [-0.48, 0.48]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 1.2, 6), supportMaterial);
      post.position.set(x, 0.55, z);
      post.castShadow = true;
      group.add(post);
    }
  }

  group.rotation.y = angle;
  group.position.set(-0.8, 0, -0.15);
  return group;
}

function createLilyPads() {
  const group = new THREE.Group();
  const green = new THREE.MeshStandardMaterial({ color: 0x667d61, roughness: 0.86, side: THREE.DoubleSide });
  const pale = new THREE.MeshStandardMaterial({ color: 0x82957a, roughness: 0.88, side: THREE.DoubleSide });
  const positions = [[2.5, -1.6, .42], [2.9, -.85, .34], [2.3, .05, .28], [-3.2, 1.2, .3], [-2.75, 1.65, .23]];
  positions.forEach(([x, z, radius], i) => {
    const shape = new THREE.Shape();
    shape.absarc(0, 0, radius, 0.18, Math.PI * 1.92, false);
    shape.lineTo(0, 0);
    const pad = new THREE.Mesh(new THREE.ShapeGeometry(shape), i % 2 ? pale : green);
    pad.rotation.x = -Math.PI / 2;
    pad.rotation.z = i * 1.7;
    pad.position.set(x, 0.59 + i * 0.001, z);
    group.add(pad);
  });
  return group;
}

export function createPond() {
  const group = new THREE.Group();
  group.name = 'PondAndBridge';
  group.add(createShore());
  const water = horizontalShape(makeShape(0.97), waterMaterial, 0.58);
  water.name = 'AnimatedWater';
  group.add(water, createStones(), createBridge(), createLilyPads());
  return group;
}

export function updateWater(time) {
  waterMaterial.uniforms.uTime.value = time;
}
