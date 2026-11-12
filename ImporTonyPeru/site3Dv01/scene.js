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
  let ready = false;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  host.appendChild(renderer.domElement);
  renderer.domElement.setAttribute("aria-hidden", "true");

  camera.position.set(0, 0.3, 10);
  camera.lookAt(0, 0, 0);
  scene.add(assembly);

  // The original transparent logo forms both the front and its depth layers.
  // The result uses the client's exact artwork at every camera angle.
  new THREE.TextureLoader().load(
    "assets/logo.png",
    (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(
        renderer.capabilities.getMaxAnisotropy(),
        4,
      );
      const geometry = new THREE.PlaneGeometry(5.8, (5.8 * 341) / 1200);
      const depthMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        color: 0xa77d22,
        transparent: true,
        alphaTest: 0.45,
        side: THREE.DoubleSide,
        toneMapped: false,
      });
      for (let index = 0; index < 18; index += 1) {
        const layer = new THREE.Mesh(geometry, depthMaterial);
        layer.position.z = index * 0.012 - 0.11;
        assembly.add(layer);
      }
      const front = new THREE.Mesh(
        geometry,
        new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          alphaTest: 0.1,
          side: THREE.DoubleSide,
          toneMapped: false,
        }),
      );
      front.position.z = 0.12;
      assembly.add(front);
      ready = true;
      host.classList.add("has-3d");
      host.dispatchEvent(new Event("importony-webgl-ready"));
      setPaused(reducedMotion.matches);
      resize();
    },
    undefined,
    () => {
      renderer.domElement.remove();
      renderer.dispose();
    },
  );

  function resize() {
    const width = host.clientWidth;
    const height = host.clientHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // Fit the complete logo at narrow tablet widths as well as on mobile.
    const halfFieldOfView = THREE.MathUtils.degToRad(camera.fov / 2);
    camera.position.z = Math.max(7, 6.8 / (2 * Math.tan(halfFieldOfView) * camera.aspect));
    camera.updateProjectionMatrix();
    renderOnce();
  }

  function updatePose() {
    const progress = paused ? 0 : pageProgress;
    assembly.rotation.set(
      -0.08 + pointer.y * 0.16 + progress * 0.12,
      -0.22 + manualRotation + pointer.x * 0.24 + progress * 0.48,
      -0.04 + Math.sin(elapsed * 0.4) * 0.015,
    );
    assembly.position.set(0, Math.sin(elapsed * 0.75) * 0.06, 0);
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
    if (scheduledFrame || !visible || document.hidden || paused || !ready)
      return;
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

  motionButton.addEventListener("click", () => {
    if (ready) setPaused(!paused);
  });
  reducedMotion.addEventListener("change", (event) => {
    if (ready) setPaused(event.matches);
  });
  host.addEventListener("pointerdown", (event) => {
    if (!ready || event.pointerType === "touch") return;
    dragging = true;
    lastPointerX = event.clientX;
    host.setPointerCapture(event.pointerId);
  });
  host.addEventListener("pointermove", (event) => {
    if (!ready || paused) return;
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
    if (!ready || (event.key !== "ArrowLeft" && event.key !== "ArrowRight"))
      return;
    event.preventDefault();
    manualRotation += event.key === "ArrowLeft" ? -0.18 : 0.18;
    renderOnce();
  });
  renderer.domElement.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    stop();
    ready = false;
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
  resize();
}
