"use strict";

const effectsMotion = matchMedia("(prefers-reduced-motion: reduce)");
const menuPanel = document.getElementById("site-menu");
const menuTrigger = document.querySelector(".menu-toggle");
const closeTrigger = menuPanel.querySelector(".menu-close");
let menuClosingTimer;
let menuReturnFocus = true;

function finishMenuClose() {
  menuPanel.close();
  menuPanel.classList.remove("closing");
  document.body.classList.remove("menu-active");
  menuTrigger.setAttribute("aria-expanded", "false");
  if (menuReturnFocus) menuTrigger.focus({ preventScroll: true });
}

function closeMenu(returnFocus = true) {
  if (!menuPanel.open || menuPanel.classList.contains("closing")) return;
  menuReturnFocus = returnFocus;
  menuPanel.classList.add("closing");
  clearTimeout(menuClosingTimer);
  menuClosingTimer = setTimeout(
    finishMenuClose,
    effectsMotion.matches ? 0 : 380,
  );
}

menuTrigger.addEventListener("click", () => {
  clearTimeout(menuClosingTimer);
  menuPanel.classList.remove("closing");
  menuPanel.showModal();
  document.body.classList.add("menu-active");
  menuTrigger.setAttribute("aria-expanded", "true");
  closeTrigger.focus({ preventScroll: true });
});
closeTrigger.addEventListener("click", () => closeMenu());
menuPanel.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeMenu();
});
menuPanel.addEventListener("click", (event) => {
  if (event.target === menuPanel) closeMenu();
});
for (const link of menuPanel.querySelectorAll('a[href^="#"]')) {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    const target = document.querySelector(link.getAttribute("href"));
    closeMenu(false);
    setTimeout(
      () => {
        target.scrollIntoView({
          behavior: effectsMotion.matches ? "instant" : "smooth",
        });
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
        target.addEventListener(
          "blur",
          () => target.removeAttribute("tabindex"),
          { once: true },
        );
      },
      effectsMotion.matches ? 0 : 390,
    );
  });
}

// Duplicated visual labels roll in opposite directions while retaining one name.
for (const link of document.querySelectorAll(
  "#navigation > a, .menu-link-label, .contact-button",
)) {
  const labelTarget = link.matches(".contact-button")
    ? link.childNodes[0]
    : null;
  const text = labelTarget
    ? labelTarget.textContent.trim()
    : link.textContent.trim();
  const label = document.createElement("span");
  label.className = "roll-label";
  label.setAttribute("aria-hidden", "true");
  for (let i = 0; i < 2; i += 1) {
    const line = document.createElement("span");
    line.textContent = text;
    label.appendChild(line);
  }
  if (labelTarget) link.replaceChild(label, labelTarget);
  else link.replaceChildren(label);
  const accessibleLink = link.closest("a");
  if (!link.matches(".menu-link-label"))
    accessibleLink.setAttribute("aria-label", text);
  else {
    const number = accessibleLink.querySelector("small").textContent;
    accessibleLink.setAttribute("aria-label", `${number} · ${text}`);
  }
}

const questions = [...document.querySelectorAll(".buying-item")];
function setQuestion(item, expanded) {
  const button = item.querySelector(".buying-toggle");
  const answer = item.querySelector(".buying-answer");
  button.setAttribute("aria-expanded", String(expanded));
  answer.inert = !expanded;
  item.classList.toggle("expanded", expanded);
}
for (const item of questions) {
  const button = item.querySelector(".buying-toggle");
  button.addEventListener("click", () => {
    const expanded = button.getAttribute("aria-expanded") !== "true";
    for (const other of questions)
      setQuestion(other, other === item && expanded);
  });
}

const buyingSection = document.getElementById("como-pedir");
const contactSection = document.getElementById("contacto");
const contactFooter = document.querySelector(".contact-footer");
const sectionObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      entry.target.classList.toggle("motion-visible", entry.isIntersecting);
      if (entry.isIntersecting) entry.target.classList.add("motion-entered");
    }
  },
  { threshold: 0.12 },
);
sectionObserver.observe(buyingSection);
sectionObserver.observe(contactSection);
sectionObserver.observe(contactFooter);

function resetContactPointer() {
  contactSection.style.setProperty("--contact-x", "0px");
  contactSection.style.setProperty("--contact-y", "0px");
}
contactSection.addEventListener("pointermove", (event) => {
  if (effectsMotion.matches || event.pointerType === "touch") return;
  const box = contactSection.getBoundingClientRect();
  contactSection.style.setProperty(
    "--contact-x",
    `${((event.clientX - box.left) / box.width - 0.5) * 40}px`,
  );
  contactSection.style.setProperty(
    "--contact-y",
    `${((event.clientY - box.top) / box.height - 0.5) * 35}px`,
  );
});
contactSection.addEventListener("pointerleave", resetContactPointer);
effectsMotion.addEventListener("change", (event) => {
  if (event.matches) resetContactPointer();
});
