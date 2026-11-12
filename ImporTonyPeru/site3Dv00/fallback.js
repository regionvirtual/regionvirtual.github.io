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

const sideCount = 64;
const faces = Array.from(
  { length: sideCount },
  (_, i) =>
    `<i class="thread-face" style="--face-angle:${(i * 360) / sideCount}deg"></i>`,
).join("");
sceneFallback.innerHTML = `
  <div class="css-assembly" aria-hidden="true">
    <div class="css-bobbin">
      <div class="thread-cylinder">${faces}</div>
      <div class="metal-plate plate-top"></div>
      <div class="metal-plate plate-top plate-edge"></div>
      <div class="metal-plate plate-bottom"></div>
      <div class="metal-plate plate-bottom plate-edge"></div>
      <div class="css-hub hub-top"></div>
      <div class="css-hub hub-bottom"></div>
      <div class="css-axis"></div>
    </div>
    <div class="css-needle"><div class="needle-eye"></div><div class="needle-shaft"></div><div class="needle-point"></div></div>
    <div class="thread-tail tail-one"></div>
    <div class="thread-tail tail-two"></div>
  </div>
  <div class="object-shadow" aria-hidden="true"></div>
`;

const assembly = sceneFallback.querySelector(".css-assembly");
function render() {
  assembly.style.transform = `translate(-50%, -50%) rotateX(${49 + pointerY * 7 + progress * 21}deg) rotateY(${-18 + pointerX * 13 + dragRotation + progress * 82}deg) rotateZ(${-23 + Math.sin(phase) * 2}deg)`;
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
