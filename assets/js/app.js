const DEFAULT_FRAME_HOLD = 3;
const TEXT_COLLAPSE_DELAY = 260;

const introReverseList = Array.from({ length: 18 }, (_, index) => 18 - index);

const sequences = [
  { key: "intro", base: "assets/img/intro/intro_", frames: 18, hold: 2 },
  { key: "ele", base: "assets/img/ele/ele_", frames: 7, hold: 3, pingPong: true },
  { key: "wood", base: "assets/img/wood/wood_", frames: 6, hold: 3, pingPong: true },
  { key: "bridge", frames: 3, hold: 2, blank: true },
  { key: "intro_reverse", base: "assets/img/intro/intro_", frameList: introReverseList, hold: 2 },
  { key: "compare_hold", base: "assets/img/intro/intro_", frameList: [1, 1], hold: 3 },
  { key: "contact_fade", frames: 3, hold: 2, blank: true }
];

const copyTrack = [
  {
    start: 0,
    end: 17,
    label: "HYBRID",
    title: "Hybridní saunová kamna, která spojují elektřinu a dřevo",
    desc: "Rychlé nahřátí. Skutečný oheň. Bez kompromisů."
  },
  {
    start: 18,
    end: 30,
    label: "ELEKTŘINA",
    title: "Elektrická saunová kamna pro okamžitý komfort",
    desc: "Teplo na povel. Stabilní výkon. Bez čekání."
  },
  {
    start: 31,
    end: 41,
    label: "DŘEVO",
    title: "Saunová kamna\nna dřevo\npro autentický zážitek",
    desc: "Plameny, vůně dřeva a absolutní soběstačnost."
  },
  {
    start: 42,
    end: 50,
    label: "A NEBO",
    title: "A nebo...",
    desc: "...chcete jenom co nejrychleji do sauny."
  },
  {
    start: 52,
    end: 62,
    label: "HYBRID+",
    title: "Hybridní saunová kamna.\nKdyž chcete víc.",
    desc: "Elektřina pro rychlost. Dřevo pro sílu."
  },
  {
    start: 63,
    end: 64,
    label: "POROVNÁNÍ",
    title: "Porovnání variant",
    desc: "Tabulka shrnuje rozdíly mezi kamny na dřevo, elektřinu a hybrid.",
    mode: "compare"
  },
  {
    start: 65,
    end: 67,
    label: "KONTAKT",
    title: "Domluvme si konzultaci",
    desc: "Napiš nám a společně vyladíme řešení do tvé sauny.",
    mode: "contact"
  }
];

const stageEl = document.getElementById("stage");
const stageImage = document.getElementById("stageImage");
const stageLabel = document.getElementById("stageLabel");
const stageTitle = document.getElementById("stageTitle");
const stageDesc = document.getElementById("stageDesc");
const textBlock = document.getElementById("textBlock");
const compareBlock = document.getElementById("compareBlock");
const contactBlock = document.getElementById("contactBlock");
const brandLinks = document.querySelectorAll(".brand");
const body = document.body;
const brandTapTimers = new WeakMap();

const frameCatalog = [];
const holdPerFrame = [];

sequences.forEach((seq) => {
  const holdValue = seq.hold || DEFAULT_FRAME_HOLD;

  const pushFrame = (frameNumber) => {
    const src = frameNumber ? `${seq.base}${String(frameNumber).padStart(4, "0")}.png` : null;
    frameCatalog.push({ segment: seq.key, src });
    holdPerFrame.push(holdValue);
  };

  if (seq.frameList && Array.isArray(seq.frameList)) {
    seq.frameList.forEach((frameNumber) => pushFrame(frameNumber));
    return;
  }

  if (seq.blank) {
    for (let i = 0; i < (seq.frames || 1); i++) {
      pushFrame(null);
    }
    return;
  }

  for (let i = 1; i <= seq.frames; i++) {
    pushFrame(i);
  }

  if (seq.pingPong) {
    for (let i = seq.frames - 1; i >= 1; i--) {
      pushFrame(i);
    }
  }
});

const maxFrame = frameCatalog.length - 1;
let currentFrame = 0;
let titleTimeout = null;
let collapseTimeout = null;
let timelineComplete = false;
let touchStartY = null;
let scrollAccumulator = 0;

preloadFrames();
renderFrame(0);

attachScrollHandlers();
brandLinks.forEach((link) => {
  link.addEventListener("pointerdown", handleBrandPress);
  link.addEventListener("pointerup", handleBrandRelease);
  link.addEventListener("pointerleave", handleBrandRelease);
  link.addEventListener("pointercancel", handleBrandRelease);
  link.addEventListener("touchend", handleBrandRelease);
  link.addEventListener("touchcancel", handleBrandRelease);
  link.addEventListener("click", handleBrandClick);
});

function preloadFrames() {
  frameCatalog.forEach((frame) => {
    if (!frame || !frame.src) return;
    const img = new Image();
    img.src = frame.src;
  });
}

function handleWheel(event) {
  if (!body.classList.contains("locked")) return;

  const direction = Math.sign(event.deltaY);
  if (direction === 0) return;

  scrollAccumulator += direction;

  const targetHold = holdPerFrame[clamp(currentFrame, 0, holdPerFrame.length - 1)] || DEFAULT_FRAME_HOLD;

  if (Math.abs(scrollAccumulator) < targetHold) {
    event.preventDefault();
    return;
  }

  const effectiveDirection = Math.sign(scrollAccumulator);
  scrollAccumulator = scrollAccumulator % targetHold;

  if ((effectiveDirection > 0 && currentFrame < maxFrame) || (effectiveDirection < 0 && currentFrame > 0)) {
    event.preventDefault();
    stepFrame(effectiveDirection);
  } else if (effectiveDirection > 0 && currentFrame === maxFrame) {
    event.preventDefault();
    completeTimeline();
  } else {
    event.preventDefault();
  }
}

function handleTouchStart(event) {
  if (!body.classList.contains("locked")) return;
  touchStartY = event.touches[0].clientY;
}

function handleTouchMove(event) {
  if (!body.classList.contains("locked") || touchStartY === null) return;

  const currentY = event.touches[0].clientY;
  const diff = touchStartY - currentY;

  if (Math.abs(diff) < 6) return;

  const direction = diff > 0 ? 1 : -1;

  scrollAccumulator += direction;

  const targetHold = holdPerFrame[clamp(currentFrame, 0, holdPerFrame.length - 1)] || DEFAULT_FRAME_HOLD;

  if (Math.abs(scrollAccumulator) < targetHold) {
    event.preventDefault();
    touchStartY = currentY;
    return;
  }

  const effectiveDirection = Math.sign(scrollAccumulator);
  scrollAccumulator = scrollAccumulator % targetHold;

  if ((effectiveDirection > 0 && currentFrame < maxFrame) || (effectiveDirection < 0 && currentFrame > 0)) {
    event.preventDefault();
    stepFrame(effectiveDirection);
  } else if (effectiveDirection > 0 && currentFrame === maxFrame) {
    event.preventDefault();
    completeTimeline();
  }

  touchStartY = currentY;
}

function stepFrame(direction) {
  currentFrame = clamp(currentFrame + direction, 0, maxFrame);
  renderFrame(currentFrame);
}

function renderFrame(frameIndex) {
  const safeIndex = clamp(frameIndex, 0, maxFrame);
  const frame = frameCatalog[safeIndex];

  if (frame && frame.src) {
    if (stageImage.dataset.src !== frame.src) {
      stageImage.dataset.src = frame.src;
      stageImage.src = frame.src;
    }
    stageImage.style.opacity = "1";
  } else {
    stageImage.style.opacity = "0";
  }

  updateCopy(safeIndex);
}

function updateCopy(frameIndex) {
  const entry = copyTrack.find((item) => frameIndex >= item.start && frameIndex <= item.end);

  if (!entry) {
    textBlock.classList.add("is-hidden");
    clearTimeout(titleTimeout);
    scheduleTextCollapse();
    compareBlock.classList.remove("is-visible");
    contactBlock.classList.remove("is-visible");
    stageEl.classList.remove("is-contact");
    return;
  }

  if (entry.mode === "compare") {
    stageEl.classList.remove("is-contact");
    stageEl.classList.add("is-compare");
    compareBlock.classList.add("is-visible");
    textBlock.classList.add("is-hidden");
    clearTimeout(titleTimeout);
    scheduleTextCollapse();
    contactBlock.classList.remove("is-visible");
    return;
  }

  if (entry.mode === "contact") {
    compareBlock.classList.remove("is-visible");
    contactBlock.classList.add("is-visible");
    stageEl.classList.add("is-contact");
    stageEl.classList.remove("is-compare");
    textBlock.classList.add("is-hidden");
    clearTimeout(titleTimeout);
    scheduleTextCollapse();
    return;
  }

  cancelTextCollapse();
  stageEl.classList.remove("is-contact");
  stageEl.classList.remove("is-compare");
  stageEl.classList.remove("is-compare");
  compareBlock.classList.remove("is-visible");
  contactBlock.classList.remove("is-visible");

  const isSameLabel = stageLabel.textContent === entry.label;
  const isSameTitle = stageTitle.innerHTML === formatCopy(entry.title);
  const isSameDesc = stageDesc.innerHTML === formatCopy(entry.desc);

  if (isSameLabel && isSameTitle && isSameDesc) {
    textBlock.classList.remove("is-hidden");
    return;
  }

  textBlock.classList.add("is-hidden");
  clearTimeout(titleTimeout);
  titleTimeout = setTimeout(() => {
    stageLabel.textContent = entry.label;
    stageTitle.innerHTML = formatCopy(entry.title);
    stageDesc.innerHTML = formatCopy(entry.desc);
    textBlock.classList.remove("is-hidden");
  }, 200);
}

function completeTimeline() {
  if (timelineComplete) return;
  timelineComplete = true;
  body.classList.add("timeline-complete");
  scrollAccumulator = 0;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function scheduleTextCollapse() {
  if (collapseTimeout) clearTimeout(collapseTimeout);
  collapseTimeout = setTimeout(() => {
    textBlock.classList.add("is-collapsed");
  }, TEXT_COLLAPSE_DELAY);
}

function cancelTextCollapse() {
  if (collapseTimeout) {
    clearTimeout(collapseTimeout);
    collapseTimeout = null;
  }
  textBlock.classList.remove("is-collapsed");
}

function handleBrandClick(event) {
  event.preventDefault();
  clearBrandPressed(event.currentTarget);
  resetTimeline();
}

function handleBrandPress(event) {
  const target = event.currentTarget;
  target.classList.add("is-pressed");

  const existing = brandTapTimers.get(target);
  if (existing) clearTimeout(existing);

  const timeoutId = setTimeout(() => {
    target.classList.remove("is-pressed");
    brandTapTimers.delete(target);
  }, 450);

  brandTapTimers.set(target, timeoutId);
}

function handleBrandRelease(event) {
  clearBrandPressed(event.currentTarget);
}

function clearBrandPressed(target) {
  if (!target) return;

  const timerId = brandTapTimers.get(target);
  if (timerId) {
    clearTimeout(timerId);
    brandTapTimers.delete(target);
  }

  target.classList.remove("is-pressed");
}

function resetTimeline() {
  detachScrollHandlers();
  body.classList.add("locked");
  body.classList.remove("timeline-complete");
  timelineComplete = false;
  scrollAccumulator = 0;
  touchStartY = null;
  currentFrame = 0;
  clearTimeout(titleTimeout);
  cancelTextCollapse();
  compareBlock.classList.remove("is-visible");
  contactBlock.classList.remove("is-visible");
  textBlock.classList.remove("is-hidden", "is-collapsed");
  stageEl.classList.remove("is-contact");
  stageEl.classList.remove("is-compare");
  brandLinks.forEach((link) => clearBrandPressed(link));

  const introEntry = copyTrack[0];
  if (introEntry) {
    stageLabel.textContent = introEntry.label;
    stageTitle.innerHTML = formatCopy(introEntry.title);
    stageDesc.innerHTML = formatCopy(introEntry.desc);
  }

  renderFrame(0);
  attachScrollHandlers();

  window.history.replaceState(null, "", window.location.pathname);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function formatCopy(value = "") {
  if (!value) return "";
  return value.replace(/\n/g, "<br>");
}

function attachScrollHandlers() {
  window.addEventListener("wheel", handleWheel, { passive: false });
  window.addEventListener("touchstart", handleTouchStart, { passive: false });
  window.addEventListener("touchmove", handleTouchMove, { passive: false });
}

function detachScrollHandlers() {
  window.removeEventListener("wheel", handleWheel);
  window.removeEventListener("touchstart", handleTouchStart);
  window.removeEventListener("touchmove", handleTouchMove);
}
