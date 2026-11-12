"use strict";

const categories = [
  {
    name: "Garfios",
    image: "garfios.jpg",
    slug: "garfios",
    description:
      "Consulta modelos y referencias para tu máquina de confección.",
  },
  {
    name: "Prensatelas",
    image: "prensatelas.jpg",
    slug: "prensatelas",
    description: "Encuentra el accesorio adecuado para el acabado que buscas.",
  },
  {
    name: "Agujas",
    image: "agujas.jpg",
    slug: "agujas",
    description: "Confirma el sistema y la medida que necesita tu máquina.",
  },
  {
    name: "Accesorios",
    image: "accesorios.jpg",
    slug: "accesorios",
    description: "Explora los complementos para el trabajo de tu taller.",
  },
  {
    name: "Planchas industriales",
    image: "planchas.png",
    slug: "planchas-industriales",
    description: "Consulta los modelos y su disponibilidad con nuestro equipo.",
  },
  {
    name: "Planchuelas",
    image: "planchuelas.png",
    slug: "planchuelas",
    description:
      "Comparte el modelo de tu máquina para consultar compatibilidad.",
  },
];

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const grid = document.getElementById("products");
const search = document.getElementById("search");
const count = document.getElementById("results");
const filters = [...document.querySelectorAll("[data-filter]")];
let selectedCategory = "Todos";

function whatsappUrl(message) {
  const url = new URL("https://wa.me/51994151785");
  url.searchParams.set("text", message);
  return url.href;
}

for (const link of document.querySelectorAll("[data-whatsapp]")) {
  link.href = whatsappUrl(link.dataset.whatsapp);
}

function addTilt(element) {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  element.addEventListener("pointermove", (event) => {
    if (reducedMotion.matches) return;
    const bounds = element.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    element.style.setProperty("--rx", `${-y * 5}deg`);
    element.style.setProperty("--ry", `${x * 6}deg`);
  });
  element.addEventListener("pointerleave", () => {
    element.style.setProperty("--rx", "0deg");
    element.style.setProperty("--ry", "0deg");
  });
}

function renderCatalogue() {
  const query = search.value.trim().toLocaleLowerCase("es");
  const found = categories.filter(
    (category) =>
      (selectedCategory === "Todos" || category.name === selectedCategory) &&
      category.name.toLocaleLowerCase("es").includes(query),
  );
  count.textContent = `${found.length} ${found.length === 1 ? "familia de productos" : "familias de productos"}`;
  if (!found.length) {
    grid.innerHTML =
      '<div class="empty"><p>Prueba otro nombre o explora todas las líneas.</p><button type="button" id="reset-search">Mostrar todas</button></div>';
    document
      .getElementById("reset-search")
      .addEventListener("click", () => selectCategory("Todos"));
    return;
  }
  grid.innerHTML = found
    .map(
      (category) => `
    <article class="product-card">
      <a class="product-image" href="https://importonyperu.com.pe/${category.slug}" target="_blank" rel="noopener noreferrer" aria-label="Ver ${category.name} en el catálogo de Importony" style="display:block">
        <img src="assets/${category.image}" alt="Selección de ${category.name.toLocaleLowerCase("es")} de Importony" loading="lazy" width="600" height="360">
        <span class="circle-arrow" aria-hidden="true">↗</span>
      </a>
      <div class="product-body">
        <h3>${category.name}</h3>
        <p>${category.description}</p>
        <div class="product-actions">
          <a href="https://importonyperu.com.pe/${category.slug}" target="_blank" rel="noopener noreferrer">Ver productos ↗</a>
          <a class="consult" href="${whatsappUrl(`Hola, Importony. Quisiera consultar por ${category.name.toLocaleLowerCase("es")}. ¿Me confirman modelos y disponibilidad?`)}" target="_blank" rel="noopener noreferrer">Consultar por WhatsApp ↗</a>
        </div>
      </div>
    </article>
  `,
    )
    .join("");
  for (const card of grid.children) addTilt(card);
}

function selectCategory(name) {
  selectedCategory = name;
  search.value = "";
  for (const filter of filters) {
    const active = filter.dataset.filter === name;
    filter.classList.toggle("selected", active);
    filter.setAttribute("aria-pressed", String(active));
  }
  renderCatalogue();
}

for (const button of filters) {
  button.addEventListener("click", () => selectCategory(button.dataset.filter));
}
for (const tile of document.querySelectorAll("[data-category]")) {
  tile.addEventListener("click", () => {
    selectCategory(tile.dataset.category);
    document.getElementById("catalogo").scrollIntoView({
      behavior: reducedMotion.matches ? "instant" : "smooth",
    });
  });
}
search.addEventListener("input", renderCatalogue);
renderCatalogue();

if ("IntersectionObserver" in window) {
  document.documentElement.classList.add("js");
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.08 },
  );
  for (const element of document.querySelectorAll(".reveal"))
    observer.observe(element);
}
for (const element of document.querySelectorAll(".tilt")) addTilt(element);

const hero = document.querySelector(".hero-scroll");
let scrollScheduled = false;
function updateScroll() {
  scrollScheduled = false;
  const bounds = hero.getBoundingClientRect();
  const headerHeight = document.querySelector(".header").offsetHeight;
  const distance = Math.max(
    1,
    hero.offsetHeight - (window.innerHeight - headerHeight),
  );
  const progress = Math.max(
    0,
    Math.min(1, (headerHeight - bounds.top) / distance),
  );
  document.documentElement.style.setProperty(
    "--hero-progress",
    reducedMotion.matches ? 0 : progress,
  );
  window.dispatchEvent(
    new CustomEvent("importony-scroll", { detail: progress }),
  );
}
window.addEventListener(
  "scroll",
  () => {
    if (scrollScheduled) return;
    scrollScheduled = true;
    requestAnimationFrame(updateScroll);
  },
  { passive: true },
);
window.addEventListener("resize", updateScroll);
updateScroll();
