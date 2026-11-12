import * as THREE from "./assets/three.module.js";

const host = document.getElementById("scene");
const motionButton = document.querySelector(".motion-toggle");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let renderer;

try {
  renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
  });
} catch (error) {
  // The CSS scene remains interactive when WebGL is unavailable.
}

if (renderer) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 80);
  const assembly = new THREE.Group();
  const bobbin = new THREE.Group();
  const pointer = new THREE.Vector2();
  const targetPointer = new THREE.Vector2();
  const clock = new THREE.Clock();
  let visible = true;
  let paused = reducedMotion.matches;
  let manualRotation = 0;
  let dragging = false;
  let lastPointerX = 0;
  let scheduledFrame = 0;
  let pageProgress = 0;
  let elapsed = 0;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  host.appendChild(renderer.domElement);
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.classList.add("has-3d");
  host.dispatchEvent(new Event("importony-webgl-ready"));

  camera.position.set(0, 1.4, 9.4);
  camera.lookAt(0, 0, 0);
  scene.add(assembly);
  assembly.add(bobbin);

  // Large studio panels create sharp, readable reflections on the metal.
  const environmentScene = new THREE.Scene();
  environmentScene.background = new THREE.Color(0xc8d5df);
  const panels = [
    { color: 0xffffff, position: [-5, 4, 3], scale: [3, 8, 2] },
    { color: 0xf8f0d7, position: [4, 3, -2], scale: [2, 7, 3] },
    { color: 0x253e51, position: [0, -3, 5], scale: [9, 3, 1] },
    { color: 0xffffff, position: [0, 6, 0], scale: [6, 1, 6] },
  ];
  for (const panel of panels) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(...panel.scale),
      new THREE.MeshBasicMaterial({ color: panel.color }),
    );
    mesh.position.set(...panel.position);
    environmentScene.add(mesh);
  }
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(environmentScene, 0.03);
  scene.environment = environment.texture;
  pmrem.dispose();

  scene.add(new THREE.HemisphereLight(0xeaf7ff, 0x665938, 3));
  const keyLight = new THREE.DirectionalLight(0xffffff, 4);
  keyLight.position.set(-4, 6, 5);
  scene.add(keyLight);
  const rimLight = new THREE.DirectionalLight(0xffdf9b, 3);
  rimLight.position.set(5, 2, -3);
  scene.add(rimLight);

  const chrome = new THREE.MeshStandardMaterial({
    color: 0xd7e1e7,
    metalness: 0.98,
    roughness: 0.22,
  });
  const gold = new THREE.MeshStandardMaterial({
    color: 0xc19a43,
    metalness: 0.9,
    roughness: 0.26,
  });
  const blueThread = new THREE.MeshStandardMaterial({
    color: 0x075d91,
    metalness: 0.1,
    roughness: 0.66,
  });

  function cylinder(radiusTop, radiusBottom, height, material) {
    return new THREE.Mesh(
      new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 96),
      material,
    );
  }

  function ring(radius, tube, material) {
    return new THREE.Mesh(
      new THREE.TorusGeometry(radius, tube, 12, 100),
      material,
    );
  }

  function bobbinPlate() {
    const outline = new THREE.Shape();
    outline.absarc(0, 0, 1.29, 0, Math.PI * 2, false);
    const center = new THREE.Path();
    center.absarc(0, 0, 0.25, 0, Math.PI * 2, true);
    outline.holes.push(center);
    for (let i = 0; i < 8; i += 1) {
      const angle = (i / 8) * Math.PI * 2;
      const hole = new THREE.Path();
      hole.absarc(
        Math.cos(angle) * 0.87,
        Math.sin(angle) * 0.87,
        0.18,
        0,
        Math.PI * 2,
        true,
      );
      outline.holes.push(hole);
    }
    const geometry = new THREE.ExtrudeGeometry(outline, {
      depth: 0.09,
      bevelEnabled: true,
      bevelThickness: 0.025,
      bevelSize: 0.022,
      bevelSegments: 3,
      curveSegments: 40,
    });
    const plate = new THREE.Mesh(geometry, chrome);
    plate.rotation.x = Math.PI / 2;
    return plate;
  }

  const threadBody = cylinder(0.98, 0.98, 1.3, blueThread);
  bobbin.add(threadBody);
  const core = cylinder(0.33, 0.33, 1.68, gold);
  bobbin.add(core);

  for (const height of [-0.72, 0.81]) {
    const plate = bobbinPlate();
    plate.position.y = height;
    bobbin.add(plate);
    const lip = ring(1.28, 0.035, gold);
    lip.rotation.x = Math.PI / 2;
    lip.position.y = height - 0.03;
    bobbin.add(lip);
    const innerLip = ring(0.32, 0.045, chrome);
    innerLip.rotation.x = Math.PI / 2;
    innerLip.position.y = height + 0.02;
    bobbin.add(innerLip);
  }

  // A single helix gives the thread real geometry without hundreds of meshes.
  const threadPoints = [];
  const windings = 115;
  for (let i = 0; i <= 15000; i += 1) {
    const progress = i / 15000;
    const angle = progress * Math.PI * 2 * windings;
    threadPoints.push(
      new THREE.Vector3(
        Math.cos(angle) * 0.989,
        progress * 1.26 - 0.63,
        Math.sin(angle) * 0.989,
      ),
    );
  }
  const woundThread = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(threadPoints),
    new THREE.LineBasicMaterial({
      color: 0x4b8cad,
      transparent: true,
      opacity: 0.58,
    }),
  );
  bobbin.add(woundThread);

  // A companion needle and the free thread complete the sewing composition.
  const needle = new THREE.Group();
  const shaft = cylinder(0.035, 0.035, 3.75, chrome);
  const point = cylinder(0.035, 0, 0.48, chrome);
  point.position.y = -2.11;
  const head = cylinder(0.064, 0.04, 0.42, chrome);
  head.position.y = 2.06;
  const eye = ring(0.065, 0.022, chrome);
  eye.scale.y = 2.7;
  eye.position.y = 2.42;
  needle.add(shaft, point, head, eye);
  needle.rotation.z = -0.12;
  needle.position.set(1.9, 0.15, 0.35);
  assembly.add(needle);

  const freeThreadCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.9, -0.25, 0.5),
    new THREE.Vector3(1.4, -0.6, 1),
    new THREE.Vector3(2.7, 0.3, 0.45),
    new THREE.Vector3(2.17, 2.5, 0.35),
    new THREE.Vector3(1.7, 3.1, 0.1),
    new THREE.Vector3(0.4, 2.8, -0.5),
    new THREE.Vector3(-1.9, 1.2, -0.9),
    new THREE.Vector3(-2.3, -1.1, -0.2),
    new THREE.Vector3(-1.1, -2.4, 0.5),
    new THREE.Vector3(1.1, -2.5, 0.2),
  ]);
  const freeThread = new THREE.Mesh(
    new THREE.TubeGeometry(freeThreadCurve, 150, 0.016, 6, false),
    gold,
  );
  assembly.add(freeThread);
  bobbin.rotation.set(0.25, 0.2, 0.12);
  bobbin.position.x = -0.3;

  function resize() {
    const width = host.clientWidth;
    const height = host.clientHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.position.z = width < 500 ? 11.5 : 9.8;
    camera.updateProjectionMatrix();
    renderOnce();
  }

  function updatePose() {
    const progress = paused ? 0 : pageProgress;
    assembly.rotation.set(
      0.28 + pointer.y * 0.11 + progress * 0.42,
      -0.22 + manualRotation + pointer.x * 0.2 + progress * 1.6,
      -0.32 + progress * 0.16,
    );
    assembly.position.set(
      -0.25,
      Math.sin(elapsed * 0.75) * 0.08 - progress * 0.12,
      0,
    );
    bobbin.rotation.y = 0.2 + elapsed * 0.045;
  }

  function renderOnce() {
    updatePose();
    renderer.render(scene, camera);
  }

  function tick() {
    scheduledFrame = 0;
    const delta = Math.min(clock.getDelta(), 0.05);
    if (!paused) {
      elapsed += delta;
      pointer.lerp(targetPointer, 0.06);
    }
    renderOnce();
    if (visible && !document.hidden && !paused)
      scheduledFrame = requestAnimationFrame(tick);
  }

  function start() {
    if (scheduledFrame || !visible || document.hidden || paused) return;
    clock.getDelta();
    scheduledFrame = requestAnimationFrame(tick);
  }

  function stop() {
    if (scheduledFrame) cancelAnimationFrame(scheduledFrame);
    scheduledFrame = 0;
  }

  function setPaused(value) {
    paused = value;
    motionButton.setAttribute("aria-pressed", String(paused));
    motionButton.innerHTML = paused
      ? '<span aria-hidden="true">▷</span> Activar movimiento'
      : '<span aria-hidden="true">Ⅱ</span> Pausar movimiento';
    if (paused) stop();
    else start();
    renderOnce();
  }

  motionButton.addEventListener("click", () => setPaused(!paused));
  reducedMotion.addEventListener("change", (event) => setPaused(event.matches));
  host.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "touch") return;
    dragging = true;
    lastPointerX = event.clientX;
    host.setPointerCapture(event.pointerId);
  });
  host.addEventListener("pointermove", (event) => {
    if (paused) return;
    const bounds = host.getBoundingClientRect();
    targetPointer.set(
      (event.clientX - bounds.left) / bounds.width - 0.5,
      (event.clientY - bounds.top) / bounds.height - 0.5,
    );
    if (dragging) {
      manualRotation += (event.clientX - lastPointerX) * 0.007;
      lastPointerX = event.clientX;
    }
  });
  host.addEventListener("pointerup", () => {
    dragging = false;
  });
  host.addEventListener("pointercancel", () => {
    dragging = false;
  });
  host.addEventListener("pointerleave", () => targetPointer.set(0, 0));
  host.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    manualRotation += event.key === "ArrowLeft" ? -0.18 : 0.18;
    renderOnce();
  });
  renderer.domElement.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    stop();
    host.classList.remove("has-3d");
    host.dispatchEvent(new Event("importony-webgl-lost"));
    paused = true;
  });
  new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      if (visible) start();
      else stop();
    },
    { threshold: 0.01 },
  ).observe(host);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });
  window.addEventListener("importony-scroll", (event) => {
    pageProgress = event.detail;
  });
  new ResizeObserver(resize).observe(host);
  setPaused(paused);
  resize();
  start();
}
