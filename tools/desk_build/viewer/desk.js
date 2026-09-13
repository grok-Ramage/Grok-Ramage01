import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const PAPER = 0x0b0c0b;
const INK = 0xe8ebe4;
const SAGE = 0x7f8f78;
const BRICK = 0xa65d4e;
const MUTED = 0x3a3d3a;

const canvas = document.getElementById("view");
const hwEl = document.getElementById("hw");
const titleEl = document.getElementById("title");
const roleEl = document.getElementById("role");
const metaEl = document.getElementById("meta");
const scanEl = document.getElementById("scan");

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(PAPER);
scene.fog = new THREE.Fog(PAPER, 10, 28);

const camera = new THREE.PerspectiveCamera(42, 1, 0.05, 80);
camera.position.set(4.2, 2.8, 5.4);

const hemi = new THREE.HemisphereLight(0xc9d2c4, 0x121412, 0.85);
scene.add(hemi);
const key = new THREE.DirectionalLight(0xf2f4ee, 1.1);
key.position.set(4, 7, 3);
scene.add(key);

const orbit = new OrbitControls(camera, canvas);
orbit.enableDamping = true;
orbit.target.set(0, 0.2, 0);

const pickables = [];
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function surfaceGeometry(n = 96) {
  const geo = new THREE.PlaneGeometry(4, 4, n, n);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i);
    const a = pos.getZ(i);
    const S = (u * u * u) / 3 - a * u;
    pos.setY(i, S);
  }
  geo.computeVertexNormals();
  return geo;
}

function addSurface() {
  const mat = new THREE.MeshStandardMaterial({
    color: SAGE,
    metalness: 0.05,
    roughness: 0.72,
    transparent: true,
    opacity: 0.38,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(surfaceGeometry(), mat);
  mesh.userData = {
    name: "S_q surface",
    role: "owned germ S = u³/3 − α u  ·  GPU display of a CPU formula",
    extra: "Sigma_Sq at origin. Not Sigma_ReS. Not optical caustics.",
  };
  scene.add(mesh);
  pickables.push(mesh);
  const wire = new THREE.Mesh(
    surfaceGeometry(32),
    new THREE.MeshBasicMaterial({ color: INK, wireframe: true, transparent: true, opacity: 0.12 }),
  );
  scene.add(wire);
}

function addGrid() {
  const g = new THREE.GridHelper(8, 8, MUTED, 0x1c1e1c);
  g.position.y = -0.02;
  scene.add(g);
}

function plateColor(entry, landscape) {
  if (entry.name === landscape.hub.display_name.split(" ").pop() || entry.role.includes("hub")) return INK;
  if (entry.name === "Grok-Ramage00" || entry.pointer_only) return MUTED;
  if (entry.name === "Grok-Ramage01") return SAGE;
  return 0x5c6558;
}

function layoutRepos(landscape) {
  const repos = landscape.repos || [];
  const n = repos.length;
  repos.forEach((entry, i) => {
    const ang = (i / n) * Math.PI * 2 - Math.PI / 2;
    const r = entry.role.includes("hub") ? 0 : 3.15;
    const x = Math.cos(ang) * r;
    const z = Math.sin(ang) * r;
    const h = entry.pointer_only ? 0.08 : entry.name === "Grok-Ramage01" ? 0.28 : 0.16;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, h, 0.72),
      new THREE.MeshStandardMaterial({
        color: plateColor(entry, landscape),
        metalness: 0.1,
        roughness: 0.55,
      }),
    );
    mesh.position.set(x, h / 2, z);
    mesh.userData = {
      name: entry.name,
      role: entry.role,
      extra: JSON.stringify({ full_name: entry.full_name, pointer_only: !!entry.pointer_only }, null, 2),
    };
    scene.add(mesh);
    pickables.push(mesh);
    if (entry.name === "Grok-Ramage00") {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.42, 0.015, 8, 24),
        new THREE.MeshBasicMaterial({ color: BRICK }),
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.set(x, h + 0.05, z);
      scene.add(ring);
    }
  });
}

function addLayers(landscape) {
  (landscape.layers || []).forEach((layer, i) => {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.1, 0.7),
      new THREE.MeshStandardMaterial({
        color: layer.status === "parked_TEXT" ? 0xcbbfa8 : SAGE,
        side: THREE.DoubleSide,
        roughness: 0.8,
      }),
    );
    mesh.position.set(-2.4 - i * 0.15, 0.55, -2.2);
    mesh.rotation.x = -Math.PI / 2.6;
    mesh.userData = {
      name: layer.name,
      role: `${layer.status} on ${layer.owner} (${layer.path})`,
      extra: `${layer.what}\nnot: ${(layer.not || []).join(", ")}`,
    };
    scene.add(mesh);
    pickables.push(mesh);
  });
}

function addLattice(scan) {
  const pts = scan.points || [];
  if (!pts.length) return;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(pts.length * 3);
  const col = new Float32Array(pts.length * 3);
  const sage = new THREE.Color(SAGE);
  const ink = new THREE.Color(INK);
  pts.forEach((p, i) => {
    pos[i * 3] = p.u;
    pos[i * 3 + 1] = p.S;
    pos[i * 3 + 2] = p.a;
    const c = p.kind === "CUSP" ? ink : sage;
    col[i * 3] = c.r;
    col[i * 3 + 1] = c.g;
    col[i * 3 + 2] = c.b;
  });
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const dots = new THREE.Points(
    geo,
    new THREE.PointsMaterial({ size: 0.035, vertexColors: true, transparent: true, opacity: 0.85 }),
  );
  dots.userData = {
    name: "legal lattice",
    role: "CPU scan α + g = u² · Δ 0.01 · GPU points",
    extra: JSON.stringify({ count: scan.count, cusp: scan.cusp, fold: scan.fold, residual: scan.semicubical_residual }, null, 2),
  };
  scene.add(dots);
  pickables.push(dots);
}

function show(data) {
  titleEl.textContent = data.name || "landscape";
  roleEl.textContent = data.role || "";
  metaEl.textContent = data.extra || "";
}

function resize() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  camera.aspect = w / Math.max(h, 1);
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
}

function onClick(e) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(pickables, false);
  if (hits.length) show(hits[0].object.userData);
}

function tick() {
  orbit.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

async function boot() {
  resize();
  window.addEventListener("resize", resize);
  canvas.addEventListener("pointerdown", onClick);
  addGrid();
  addSurface();
  const [landscape, hardware, scan] = await Promise.all([
    fetch("/landscape.json").then((r) => r.json()),
    fetch("/hardware.json").then((r) => r.json()),
    fetch("/legal_lattice.json").then((r) => r.json()),
  ]);
  layoutRepos(landscape);
  addLayers(landscape);
  addLattice(scan);
  const gpuName = hardware.gpu?.name || "no NVIDIA GPU";
  hwEl.textContent = `${hardware.cpu?.logical}-thread CPU · ${gpuName} (display) · classify ${hardware.classify_device}`;
  scanEl.textContent = `lattice ${scan.count}  (CUSP ${scan.cusp} · FOLD ${scan.fold})  residual ${scan.semicubical_residual}`;
  show({
    name: landscape.hub.display_name,
    role: landscape.hub.role,
    extra: "Click a plate. 00 is frozen (brick ring). 01 is sage. Optical is parked paper. GPU draws; CPU classified the lattice.",
  });
  tick();
}

boot().catch((err) => {
  hwEl.textContent = String(err);
});
