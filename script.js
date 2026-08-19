const tooltip = document.getElementById("tooltip");
const tooltipTitle = tooltip.querySelector("h2");
const tooltipText = tooltip.querySelector("p");
const closeBtn = tooltip.querySelector(".tooltip-close");
const terms = [...document.querySelectorAll(".term")];

let activeTerm = null;

function placeTooltip(target) {
  if (window.matchMedia("(max-width: 760px)").matches) {
    tooltip.style.left = "50%";
    tooltip.style.top = "50%";
    return;
  }

  const rect = target.getBoundingClientRect();
  const cardWidth = Math.min(320, window.innerWidth - 32);
  const cardHeight = 230;
  const gap = 18;

  let left = rect.right + gap;
  let top = rect.top - cardHeight * 0.35;

  if (left + cardWidth > window.innerWidth - 16) {
    left = rect.left - cardWidth - gap;
  }

  if (left < 16) {
    left = Math.max(16, (window.innerWidth - cardWidth) / 2);
  }

  top = Math.max(16, Math.min(top, window.innerHeight - cardHeight - 16));

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

function openTooltip(target) {
  activeTerm = target;
  tooltipTitle.textContent = target.dataset.title;
  tooltipText.textContent = target.dataset.explanation;
  placeTooltip(target);
  tooltip.classList.add("is-open");
  tooltip.setAttribute("aria-hidden", "false");
}

function closeTooltip() {
  tooltip.classList.remove("is-open");
  tooltip.setAttribute("aria-hidden", "true");
  activeTerm = null;
}

terms.forEach(term => {
  term.addEventListener("mouseenter", () => openTooltip(term));
  term.addEventListener("focus", () => openTooltip(term));
  term.addEventListener("click", (event) => {
    event.stopPropagation();
    openTooltip(term);
  });
});

tooltip.addEventListener("mouseenter", () => {
  tooltip.classList.add("is-open");
});

tooltip.addEventListener("mouseleave", closeTooltip);
closeBtn.addEventListener("click", closeTooltip);

document.addEventListener("click", (event) => {
  if (!tooltip.contains(event.target) && !event.target.classList.contains("term")) {
    closeTooltip();
  }
});

window.addEventListener("resize", () => {
  if (activeTerm) placeTooltip(activeTerm);
});

window.addEventListener("scroll", () => {
  if (activeTerm) placeTooltip(activeTerm);
}, { passive: true });

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeTooltip();
});
