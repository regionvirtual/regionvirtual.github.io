// CSS geometry keeps the opening interactive on devices without WebGL.
const stage = document.getElementById("scene");
const sceneFallback = stage.querySelector(".scene-fallback");
const motionControl = document.querySelector(".motion-toggle");
const preference = matchMedia("(prefers-reduced-motion: reduce)");
const canHover = matchMedia("(hover: hover) and (pointer: fine)");
let usingWebgl = false;
let paused = preference.matches;
let pointerX = 0;
let pointerY = 0;
let dragRotation = 0;
let startX = 0;
let isDragging = false;
let progress = 0;
let phase = 0;
let frameId = 0;
let previousTime = 0;
let isVisible = true;

const depthLayers = Array.from(
  { length: 16 },
  (_, index) =>
    `<span class="logo-depth-layer" style="--layer:${index}"></span>`,
).join("");
sceneFallback.innerHTML = `
  <div class="css-assembly logo-assembly" aria-hidden="true">
    ${depthLayers}
    <img class="logo-face" src="assets/logo.png" alt="">
  </div>
  <div class="object-shadow" aria-hidden="true"></div>
`;

const assembly = sceneFallback.querySelector(".css-assembly");
function render() {
  assembly.style.transform = `translate(-50%, -50%) rotateX(${-7 + pointerY * 10 + progress * 8}deg) rotateY(${-14 + pointerX * 16 + dragRotation + progress * 28}deg) rotateZ(${-3 + Math.sin(phase) * 1.5}deg)`;
}

function animate(time) {
  frameId = 0;
  if (!previousTime) previousTime = time;
  phase += Math.min(time - previousTime, 40) * 0.00035;
  previousTime = time;
  render();
  if (!paused && !usingWebgl && isVisible && !document.hidden)
    frameId = requestAnimationFrame(animate);
}

function stop() {
  cancelAnimationFrame(frameId);
  frameId = 0;
  previousTime = 0;
}

function start() {
  if (frameId || paused || usingWebgl || !isVisible || document.hidden) return;
  frameId = requestAnimationFrame(animate);
}

function syncMotion() {
  if (usingWebgl) return;
  motionControl.setAttribute("aria-pressed", String(paused));
  motionControl.innerHTML = paused
    ? '<span aria-hidden="true">▷</span> Activar movimiento'
    : '<span aria-hidden="true">Ⅱ</span> Pausar movimiento';
  if (paused) stop();
  else start();
}

stage.addEventListener("importony-webgl-ready", () => {
  usingWebgl = true;
  stop();
});
stage.addEventListener("importony-webgl-lost", () => {
  usingWebgl = false;
  paused = preference.matches;
  syncMotion();
});
motionControl.addEventListener("click", () => {
  if (usingWebgl) return;
  paused = !paused;
  syncMotion();
});
preference.addEventListener("change", (event) => {
  paused = event.matches;
  syncMotion();
});
stage.addEventListener("pointerdown", (event) => {
  if (usingWebgl || paused || !canHover.matches) return;
  isDragging = true;
  startX = event.clientX;
  stage.setPointerCapture(event.pointerId);
});
stage.addEventListener("pointermove", (event) => {
  if (usingWebgl || paused || !canHover.matches) return;
  const bounds = stage.getBoundingClientRect();
  pointerX = (event.clientX - bounds.left) / bounds.width - 0.5;
  pointerY = (event.clientY - bounds.top) / bounds.height - 0.5;
  if (isDragging) {
    dragRotation += (event.clientX - startX) * 0.25;
    startX = event.clientX;
  }
  render();
});
stage.addEventListener("pointerup", () => {
  isDragging = false;
});
stage.addEventListener("pointercancel", () => {
  isDragging = false;
});
stage.addEventListener("pointerleave", () => {
  pointerX = 0;
  pointerY = 0;
});
stage.addEventListener("keydown", (event) => {
  if (usingWebgl || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
  event.preventDefault();
  dragRotation += event.key === "ArrowLeft" ? -12 : 12;
  render();
});
window.addEventListener("importony-scroll", (event) => {
  if (usingWebgl || paused) return;
  progress = event.detail;
  render();
});
new IntersectionObserver((entries) => {
  isVisible = entries[0].isIntersecting;
  if (isVisible) start();
  else stop();
}).observe(stage);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stop();
  else start();
});
syncMotion();
render();
