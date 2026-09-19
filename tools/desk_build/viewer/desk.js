import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";

const PAPER = 0x0b0c0b;
const INK = 0xe8ebe4;
const SAGE = 0x7f8f78;
const BRICK = 0xa65d4e;
const MUTED = 0x3a3d3a;
const BLOTTER = 0xe8ebe4;
const SLAB = 0x161816;
const SHELF = 0xcbbfa8;
const MEM_KEY = "air-desk-opt";
const DEFAULT_RULE = "display-not-cert; park optical/A3; gpu display only; map not solver";

const canvas = document.getElementById("view");
const labelLayer = document.getElementById("labels");
const hwEl = document.getElementById("hw");
const titleEl = document.getElementById("title");
const roleEl = document.getElementById("role");
const metaEl = document.getElementById("meta");
const statusEl = document.getElementById("status");
const scanEl = document.getElementById("scan");
const verdictEl = document.getElementById("verdict");
const memoryEl = document.getElementById("memory");
const sentenceEl = document.getElementById("sentence");

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const labels = new CSS2DRenderer({ element: labelLayer });
labels.domElement.style.position = "absolute";
labels.domElement.style.inset = "0";

const scene = new THREE.Scene();
scene.background = new THREE.Color(PAPER);
scene.fog = new THREE.Fog(PAPER, 12, 26);

const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 80);
camera.position.set(5.2, 3.4, 6.1);

const hemi = new THREE.HemisphereLight(0xd7ddd4, 0x0c0d0c, 0.55);
scene.add(hemi);
const key = new THREE.DirectionalLight(0xf4f1ea, 1.35);
key.position.set(3.2, 7.4, 2.2);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = -6;
key.shadow.camera.right = 6;
key.shadow.camera.top = 6;
key.shadow.camera.bottom = -6;
scene.add(key);
const fill = new THREE.DirectionalLight(0x8f9a90, 0.28);
fill.position.set(-4, 3, -2);
scene.add(fill);

const orbit = new OrbitControls(camera, canvas);
orbit.enableDamping = true;
orbit.target.set(0, 0.35, 0.2);
orbit.maxPolarAngle = Math.PI * 0.48;
orbit.minDistance = 3.2;
orbit.maxDistance = 14;

const pickables = [];
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function tag(text, kind) {
  const el = document.createElement("div");
  el.className = "label3d" + (kind ? " " + kind : "");
  el.textContent = text;
  return new CSS2DObject(el);
}

function matte(color, extra = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: extra.metalness ?? 0.08,
    roughness: extra.roughness ?? 0.62,
    ...extra,
  });
}

function pickable(mesh, data) {
  mesh.userData = data;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  pickables.push(mesh);
  return mesh;
}

function surfaceGeometry(n = 80) {
  const geo = new THREE.PlaneGeometry(2.6, 2.6, n, n);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i);
    const a = pos.getZ(i);
    pos.setY(i, (u * u * u) / 3 - a * u);
  }
  geo.computeVertexNormals();
  return geo;
}

function addBench() {
  const slab = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.22, 4.4), matte(SLAB, { roughness: 0.48, metalness: 0.18 }));
  slab.position.y = -0.11;
  slab.receiveShadow = true;
  slab.castShadow = true;
  scene.add(slab);
  const blotter = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.02, 3.6), matte(BLOTTER, { roughness: 0.86, metalness: 0 }));
  blotter.position.y = 0.011;
  blotter.receiveShadow = true;
  scene.add(blotter);
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(3.6, 48),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28 }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -0.23;
  scene.add(shadow);
}

function addSurface() {
  const mesh = new THREE.Mesh(
    surfaceGeometry(),
    matte(SAGE, { transparent: true, opacity: 0.62, side: THREE.DoubleSide, roughness: 0.38 }),
  );
  mesh.position.y = 0.04;
  mesh.scale.set(0.72, 0.42, 0.72);
  pickable(mesh, {
    name: "S_q fold",
    status: "LIVE seed",
    kind: "live",
    role: "Owned germ S = u³/3 − α u. GPU display of a CPU formula.",
    extra: "DISPLAY only. Not a certificate. Not Sigma_ReS. Not optical caustics.",
  });
  const wire = new THREE.Mesh(
    surfaceGeometry(24),
    new THREE.MeshBasicMaterial({ color: INK, wireframe: true, transparent: true, opacity: 0.16 }),
  );
  wire.position.copy(mesh.position);
  wire.scale.copy(mesh.scale);
  scene.add(wire);
  const label = tag("S_q  DISPLAY", "live");
  label.position.set(0, 0.72, 0);
  mesh.add(label);
}

function plateColor(entry) {
  if (entry.name === "Grok-Ramage00" || entry.pointer_only) return MUTED;
  if (entry.name === "Grok-Ramage01") return SAGE;
  if ((entry.role || "").includes("hub")) return INK;
  return 0x5c6558;
}

function layoutRepos(landscape) {
  const repos = landscape.repos || [];
  repos.forEach((entry, i) => {
    const isHub = (entry.role || "").includes("hub");
    const sealed = entry.name === "Grok-Ramage00" || entry.pointer_only;
    const live = entry.name === "Grok-Ramage01";
    const col = i % 8;
    const row = Math.floor(i / 8);
    const x = -3.15 + col * 0.9;
    const z = 1.35 + row * 0.7;
    const h = sealed ? 0.1 : live ? 0.32 : isHub ? 0.2 : 0.14;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.7, h, 0.55), matte(plateColor(entry), { roughness: 0.5 }));
    mesh.position.set(x, h / 2 + 0.02, z);
    pickable(mesh, {
      name: entry.name,
      status: sealed ? "SEALED" : live ? "LIVE lab" : isHub ? "HUB" : "CATALOG",
      kind: sealed ? "refuse" : live ? "live" : "park",
      role: entry.role,
      extra: entry.full_name + (sealed ? "\npointer-only; no restencil." : ""),
    });
    if (sealed) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.28, 0.016, 8, 28),
        new THREE.MeshBasicMaterial({ color: BRICK }),
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.set(x, h + 0.07, z);
      scene.add(ring);
    }
    if (live || sealed || isHub) {
      const lab = tag(live ? "01" : sealed ? "00" : "HUB", live ? "live" : sealed ? "seal" : "");
      lab.position.set(0, h / 2 + 0.12, 0);
      mesh.add(lab);
    }
  });
}

function addLayers(landscape) {
  const layers = landscape.layers || [];
  layers.forEach((layer, i) => {
    const parked = layer.status === "parked_TEXT";
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.15, 0.04, 0.72),
      matte(parked ? SHELF : SAGE, { roughness: 0.84, metalness: 0 }),
    );
    mesh.position.set(-2.55 + i * 1.35, 1.05, -1.55);
    mesh.rotation.x = -0.42;
    pickable(mesh, {
      name: layer.name,
      status: parked ? "PARKED TEXT" : String(layer.status || "LAYER").toUpperCase(),
      kind: parked ? "park" : "live",
      role: (layer.what || "") + " on " + (layer.owner || ""),
      extra: "not: " + ((layer.not || []).join(", ") || "—"),
    });
    const lab = tag(layer.name.replace("Grok-Ramage ", ""), parked ? "park" : "live");
    lab.position.set(0, 0.08, 0);
    mesh.add(lab);
  });
  const rail = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.08, 0.18), matte(SLAB, { metalness: 0.22 }));
  rail.position.set(-1.2, 0.78, -1.72);
  rail.castShadow = true;
  rail.receiveShadow = true;
  scene.add(rail);
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
    pos[i * 3] = p.u * 0.72;
    pos[i * 3 + 1] = p.S * 0.42 + 0.04;
    pos[i * 3 + 2] = p.a * 0.72;
    const c = p.kind === "CUSP" ? ink : sage;
    col[i * 3] = c.r;
    col[i * 3 + 1] = c.g;
    col[i * 3 + 2] = c.b;
  });
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const dots = new THREE.Points(
    geo,
    new THREE.PointsMaterial({ size: 0.03, vertexColors: true, transparent: true, opacity: 0.8 }),
  );
  dots.userData = {
    name: "legal lattice",
    status: "DISPLAY",
    kind: "live",
    role: "CPU scan α + g = u². GPU points only.",
    extra: JSON.stringify({ count: scan.count, cusp: scan.cusp, fold: scan.fold, residual: scan.semicubical_residual }, null, 2),
  };
  scene.add(dots);
  pickables.push(dots);
}

function setChip(kind, label) {
  statusEl.textContent = label;
  statusEl.className = "chip" + (kind === "refuse" ? " refuse" : kind === "park" ? " park" : "");
}

function show(data) {
  titleEl.textContent = data.name || "desk";
  roleEl.textContent = data.role || "";
  metaEl.textContent = data.extra || "";
  setChip(data.kind || "live", data.status || "LIVE seed");
}

function loadMemory() {
  try {
    return JSON.parse(localStorage.getItem(MEM_KEY) || "");
  } catch {
    return null;
  }
}

function memoryState() {
  return loadMemory() || { v: 1, rules: [DEFAULT_RULE], log: [] };
}

function saveMemory(mem) {
  localStorage.setItem(MEM_KEY, JSON.stringify(mem));
  memoryEl.textContent = "memory v" + mem.v + " · " + (mem.rules[mem.rules.length - 1] || DEFAULT_RULE);
}

function optimizePaths() {
  const mem = memoryState();
  const last = mem.rules[mem.rules.length - 1];
  if (last !== DEFAULT_RULE) {
    mem.v += 1;
    mem.rules.push(DEFAULT_RULE);
    mem.log.unshift({ t: Date.now(), note: "rule evolved" });
  } else {
    mem.log.unshift({ t: Date.now(), note: "no change" });
  }
  saveMemory(mem);
  verdictEl.className = "verdict ok";
  verdictEl.textContent = mem.log[0].note === "no change"
    ? "optimize: paths already current"
    : "optimize: memory v" + mem.v;
}

function admitSentence(text) {
  const s = String(text || "").trim();
  if (!s) {
    verdictEl.className = "verdict no";
    verdictEl.textContent = "REFUSE empty";
    return;
  }
  const refuse =
    /\bCERT\b/i.test(s) ||
    /G7|unpark A3|Sigma_ReS|fold CERT|solver/i.test(s) ||
    /GPU classify/i.test(s);
  const park = /optical|Pearcey|Painlev|Tracy|KPZ|BBP|Bessel|isomonodrom/i.test(s);
  if (refuse) {
    verdictEl.className = "verdict no";
    verdictEl.textContent = "REFUSE  TR_AS_CERT / solver claim";
    setChip("refuse", "REFUSE");
    return;
  }
  if (park) {
    verdictEl.className = "verdict ok";
    verdictEl.textContent = "ADMIT-PARK  TEXT lane";
    setChip("park", "PARKED TEXT");
    return;
  }
  verdictEl.className = "verdict ok";
  verdictEl.textContent = "ADMIT-ROUTE  map sentence";
  setChip("live", "ADMIT-ROUTE");
}

function resize() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  camera.aspect = w / Math.max(h, 1);
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
  labels.setSize(w, h);
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
  labels.render(scene, camera);
  requestAnimationFrame(tick);
}

async function boot() {
  resize();
  window.addEventListener("resize", resize);
  canvas.addEventListener("pointerdown", onClick);
  document.getElementById("optimize").addEventListener("click", optimizePaths);
  document.getElementById("admit-form").addEventListener("submit", (e) => {
    e.preventDefault();
    admitSentence(sentenceEl.value);
  });
  addBench();
  addSurface();
  saveMemory(memoryState());
  const [landscape, hardware, scan] = await Promise.all([
    fetch("/landscape.json").then((r) => r.json()),
    fetch("/hardware.json").then((r) => r.json()),
    fetch("/legal_lattice.json").then((r) => r.json()),
  ]);
  layoutRepos(landscape);
  addLayers(landscape);
  addLattice(scan);
  const gpuName = hardware.gpu?.name || "no NVIDIA GPU";
  hwEl.textContent = (hardware.cpu?.logical || "?") + "-thread CPU · " + gpuName + " (display)";
  scanEl.textContent = "lattice " + scan.count + "  residual " + scan.semicubical_residual;
  show({
    name: landscape.hub.display_name,
    status: "MAP",
    kind: "live",
    role: landscape.hub.role,
    extra: "Orbit the bench. Click a plate. 00 is sealed. 01 is the working lab. Optical stays parked paper.",
  });
  tick();
}

boot().catch((err) => {
  hwEl.textContent = String(err);
});
