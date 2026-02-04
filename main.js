import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

const container = document.getElementById("viewer");
const partsList = document.getElementById("parts");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0f1a);

const camera = new THREE.PerspectiveCamera(
  55,
  container.clientWidth / container.clientHeight,
  0.1,
  100
);
camera.position.set(2.6, 1.6, 2.6);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 1.2;
controls.maxDistance = 6;
controls.target.set(0, 0.6, 0);

const ambient = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambient);

const keyLight = new THREE.DirectionalLight(0xffffff, 1);
keyLight.position.set(3, 4, 2);
scene.add(keyLight);

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(3, 32),
  new THREE.MeshStandardMaterial({ color: 0x111827 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.01;
scene.add(ground);

const loader = new GLTFLoader();
const modelUrl = new URL(
  "./Panel Galvatech prueba tamaño 1 (1).glb",
  import.meta.url
).href;

let modelRoot;

loader.load(
  modelUrl,
  (gltf) => {
    modelRoot = gltf.scene;
    modelRoot.position.set(0, 0, 0);
    scene.add(modelRoot);

    const box = new THREE.Box3().setFromObject(modelRoot);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);
    modelRoot.position.sub(center);
    const scale = 1.6 / Math.max(size.x, size.y, size.z);
    modelRoot.scale.setScalar(scale);

    const parts = [];
    modelRoot.traverse((child) => {
      if (child.isMesh) {
        parts.push(child.name || `Mesh_${parts.length + 1}`);
      }
    });

    partsList.innerHTML = "";
    parts.forEach((name) => {
      const item = document.createElement("li");
      item.textContent = name;
      partsList.appendChild(item);
    });
  },
  undefined,
  (error) => {
    console.error("No se pudo cargar el GLB", error);
  }
);

const revealObject = new THREE.Mesh(
  new THREE.BoxGeometry(0.2, 0.2, 0.2),
  new THREE.MeshStandardMaterial({ color: 0x4ade80 })
);
revealObject.visible = false;
revealObject.position.set(0, 1.4, 0.6);
scene.add(revealObject);

let triggered = false;
let animationProgress = 0;
let animationActive = false;
const animationDuration = 1.2;
const startY = 1.4;
const endY = 0.4;

function startRevealAnimation() {
  revealObject.visible = true;
  animationActive = true;
  animationProgress = 0;
}

function updateRevealAnimation(delta) {
  if (!animationActive) return;
  animationProgress += delta;
  const t = Math.min(animationProgress / animationDuration, 1);
  revealObject.position.y = THREE.MathUtils.lerp(startY, endY, t);
  if (t >= 1) {
    animationActive = false;
  }
}

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  controls.update();

  const angle = Math.abs(controls.getAzimuthalAngle());
  const nearHalfTurn = angle >= Math.PI - 0.1;

  if (nearHalfTurn && !triggered) {
    startRevealAnimation();
    triggered = true;
  }

  if (!nearHalfTurn && angle < Math.PI / 2) {
    triggered = false;
    revealObject.visible = false;
    revealObject.position.y = startY;
  }

  updateRevealAnimation(delta);
  renderer.render(scene, camera);
}

animate();

window.addEventListener("resize", () => {
  const { clientWidth, clientHeight } = container;
  camera.aspect = clientWidth / clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(clientWidth, clientHeight);
});
