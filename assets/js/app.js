const DEFAULT_FRAME_HOLD = 3;
const TEXT_COLLAPSE_DELAY = 260;
const SCROLL_STEP = 48;

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
    anchorFrame: 14,
    title: "Hybridní saunová kamna, která spojují elektřinu a dřevo",
    desc: "Rychlé nahřátí. Skutečný oheň. Bez kompromisů."
  },
  {
    start: 18,
    end: 30,
    label: "ELEKTŘINA",
    anchorFrame: 21,
    title: "Elektrická saunová kamna pro okamžitý komfort",
    desc: "Teplo na povel. Stabilní výkon. Bez čekání."
  },
  {
    start: 31,
    end: 41,
    label: "DŘEVO",
    anchorFrame: 34,
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
const scrollModeQuery = window.matchMedia("(max-width: 840px)");
const progressRail = document.getElementById("progressRail");
const scrollSpacer = document.getElementById("timelineSpacer");

const frameCatalog = [];
const holdPerFrame = [];
const progressSegments = [];

sequences.forEach((seq) => {
  const holdValue = seq.hold || DEFAULT_FRAME_HOLD;

  const pushFrame = (frameNumber) => {
    const src = frameNumber ? `${seq.base}${String(frameNumber).padStart(4, "0")}.webp` : null;
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
let pointerHandlersAttached = false;
let isScrollMode = false;
let frameTweenId = null;
let scrollTimelineAttached = false;
let suppressScrollSync = false;

preloadFrames();
renderFrame(0);

buildProgressRail();

const handleModeSwitch = (event) => {
  if (event.matches) {
    activateScrollMode();
  } else {
    deactivateScrollMode();
  }
};

handleModeSwitch(scrollModeQuery);

if (scrollModeQuery.addEventListener) {
  scrollModeQuery.addEventListener("change", handleModeSwitch);
} else if (scrollModeQuery.addListener) {
  scrollModeQuery.addListener(handleModeSwitch);
}

window.addEventListener("resize", () => {
  if (isScrollMode) {
    updateScrollSpacer();
  }
});

setupMobileCompareSnap();
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
  cancelFrameTween();
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
  updateProgressRail(safeIndex);
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
    compareBlock.style.minHeight = "min(520px, 80vh)";
    textBlock.classList.add("is-hidden");
    clearTimeout(titleTimeout);
    scheduleTextCollapse();
    contactBlock.classList.remove("is-visible");
    return;
  }

  if (entry.mode === "contact") {
    compareBlock.classList.remove("is-visible");
    compareBlock.style.minHeight = "";
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
  compareBlock.style.minHeight = "";
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
  cancelFrameTween();
  if (!isScrollMode) {
    detachScrollHandlers();
    body.classList.add("locked");
  }
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
  if (isScrollMode) {
    const { start } = getScrollMetrics();
    window.scrollTo({ top: start, behavior: "auto" });
    handleScrollTimeline();
  } else {
    attachScrollHandlers();
  }

  window.history.replaceState(null, "", window.location.pathname);
  if (!isScrollMode) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function formatCopy(value = "") {
  if (!value) return "";
  return value.replace(/\n/g, "<br>");
}

function buildProgressRail() {
  if (!progressRail) return;
  progressRail.innerHTML = "";
  progressSegments.length = 0;

  const track = document.createElement("div");
  track.className = "progressRail__track";

  copyTrack.forEach((entry) => {
    const segment = document.createElement("button");
    segment.type = "button";
    segment.className = "progressRail__segment";
    segment.setAttribute("aria-label", `${entry.label} - ${entry.title.replace(/\n/g, " ")}`);
    segment.addEventListener("click", () => handleSegmentClick(entry));
    track.appendChild(segment);
    progressSegments.push({ button: segment, entry });
  });

  progressRail.appendChild(track);
  updateProgressRail(currentFrame);
}

function updateProgressRail(frameIndex) {
  if (!progressSegments.length) return;
  progressSegments.forEach(({ button, entry }) => {
    const isActive = frameIndex >= entry.start && frameIndex <= entry.end;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
}

function handleSegmentClick(entry) {
  if (!entry) return;
  const targetFrame = getEntryTargetFrame(entry);
  if (typeof targetFrame !== "number") return;

  if (isScrollMode) {
    scrollToFrame(targetFrame);
    return;
  }
  animateToFrame(targetFrame);
}

function animateToFrame(targetFrame, options = {}) {
  const { onComplete } = options;
  const clampedTarget = clamp(targetFrame, 0, maxFrame);
  cancelFrameTween();

  if (clampedTarget === currentFrame) {
    if (typeof onComplete === "function") onComplete();
    return;
  }

  const direction = clampedTarget > currentFrame ? 1 : -1;

  const step = () => {
    if (currentFrame === clampedTarget) {
      cancelFrameTween();
      if (typeof onComplete === "function") onComplete();
      return;
    }
    currentFrame = clamp(currentFrame + direction, 0, maxFrame);
    renderFrame(currentFrame);
    frameTweenId = requestAnimationFrame(step);
  };

  frameTweenId = requestAnimationFrame(step);
}

function cancelFrameTween() {
  if (!frameTweenId) return;
  cancelAnimationFrame(frameTweenId);
  frameTweenId = null;
}

function scrollToFrame(targetFrame) {
  const clampedTarget = clamp(targetFrame, 0, maxFrame);
  const progress = maxFrame ? clampedTarget / maxFrame : 0;
  const { track, start } = getScrollMetrics();
  const target = start + progress * track;

  suppressScrollSync = true;
  window.scrollTo({ top: target, behavior: "auto" });

  animateToFrame(clampedTarget, {
    onComplete: () => {
      const { track: refreshedTrack, start: refreshedStart } = getScrollMetrics();
      const refreshedProgress = maxFrame ? currentFrame / maxFrame : 0;
      const adjustedTarget = refreshedStart + refreshedProgress * refreshedTrack;
      window.scrollTo({ top: adjustedTarget, behavior: "auto" });
      suppressScrollSync = false;
      handleScrollTimeline();
    }
  });
}

function getEntryTargetFrame(entry) {
  if (!entry) return null;
  if (typeof entry.anchorFrame === "number") {
    return clamp(entry.anchorFrame, entry.start, entry.end);
  }
  return Math.round((entry.start + entry.end) / 2);
}

function activateScrollMode() {
  if (isScrollMode) {
    updateScrollSpacer();
    return;
  }

  isScrollMode = true;
  detachScrollHandlers();
  body.classList.remove("locked");
  body.classList.add("scrollTimeline");
  updateScrollSpacer();

  const { track, start } = getScrollMetrics();
  if (track > 0 && maxFrame > 0) {
    const progress = currentFrame / maxFrame;
    window.scrollTo({ top: start + progress * track, behavior: "auto" });
  }

  if (!scrollTimelineAttached) {
    window.addEventListener("scroll", handleScrollTimeline, { passive: true });
    scrollTimelineAttached = true;
  }

  handleScrollTimeline();
}

function deactivateScrollMode() {
  if (scrollTimelineAttached) {
    window.removeEventListener("scroll", handleScrollTimeline);
    scrollTimelineAttached = false;
  }

  isScrollMode = false;
  body.classList.remove("scrollTimeline");
  body.classList.add("locked");

  if (scrollSpacer) {
    scrollSpacer.style.height = "0px";
  }

  attachScrollHandlers();
  window.scrollTo({ top: 0, behavior: "auto" });
}

function updateScrollSpacer() {
  if (!scrollSpacer) return;
  const spacerHeight = Math.max((maxFrame + 1) * SCROLL_STEP, window.innerHeight * 2);
  scrollSpacer.style.height = `${Math.round(spacerHeight)}px`;
}

function handleScrollTimeline() {
  if (!isScrollMode || suppressScrollSync) return;
  const { track, start } = getScrollMetrics();
  if (track <= 0) return;

  const relativeScroll = clamp(window.scrollY - start, 0, track);
  const progress = track ? relativeScroll / track : 0;
  const targetFrame = Math.round(progress * maxFrame);

  if (targetFrame === currentFrame) return;

  cancelFrameTween();
  currentFrame = targetFrame;
  renderFrame(currentFrame);

  if (targetFrame >= maxFrame) {
    completeTimeline();
  } else if (timelineComplete) {
    body.classList.remove("timeline-complete");
    timelineComplete = false;
  }
}

function getScrollMetrics() {
  if (scrollSpacer) {
    const start = scrollSpacer.offsetTop || 0;
    const track = Math.max((scrollSpacer.offsetHeight || 0) - window.innerHeight, 1);
    return { start, track };
  }
  const doc = document.documentElement;
  return {
    start: 0,
    track: Math.max(doc.scrollHeight - doc.clientHeight, 1)
  };
}

function attachScrollHandlers() {
  if (pointerHandlersAttached || isScrollMode) return;
  window.addEventListener("wheel", handleWheel, { passive: false });
  window.addEventListener("touchstart", handleTouchStart, { passive: false });
  window.addEventListener("touchmove", handleTouchMove, { passive: false });
  pointerHandlersAttached = true;
}

function detachScrollHandlers() {
  if (!pointerHandlersAttached) return;
  window.removeEventListener("wheel", handleWheel);
  window.removeEventListener("touchstart", handleTouchStart);
  window.removeEventListener("touchmove", handleTouchMove);
  pointerHandlersAttached = false;
}

function setupMobileCompareSnap() {
  if (!compareBlock || !contactBlock) return;

  const mediaQuery = window.matchMedia("(max-width: 640px)");
  const SNAP_OFFSET = 40;
  const MIN_SWIPE_DELTA = 50;
  let snapTouchStart = null;
  let snapCooldown = false;

  const shouldSnap = () => !body.classList.contains("locked") && mediaQuery.matches && compareBlock.offsetHeight > 0;

  const handleSnapTouchStart = (event) => {
    if (!shouldSnap() || event.touches.length !== 1 || snapCooldown) return;
    snapTouchStart = event.touches[0].clientY;
  };

  const handleSnapTouchEnd = (event) => {
    if (!shouldSnap() || snapTouchStart === null || snapCooldown || !event.changedTouches.length) {
      snapTouchStart = null;
      return;
    }

    const delta = snapTouchStart - event.changedTouches[0].clientY;
    snapTouchStart = null;

    if (Math.abs(delta) < MIN_SWIPE_DELTA) return;

    const direction = delta > 0 ? 1 : -1;
    const snapped = attemptSnap(direction, SNAP_OFFSET);

    if (snapped) {
      snapCooldown = true;
      setTimeout(() => {
        snapCooldown = false;
      }, 600);
    }
  };

  const attemptSnap = (direction, offset) => {
    const compareTop = compareBlock.getBoundingClientRect().top + window.scrollY;
    const contactTop = contactBlock.getBoundingClientRect().top + window.scrollY;
    const midpoint = window.scrollY + window.innerHeight / 2;

    const aboveCompare = midpoint < compareTop - offset;
    const betweenSections = midpoint >= compareTop - offset && midpoint < contactTop - offset;
    const beyondContact = midpoint >= contactTop - offset;

    if (direction > 0) {
      if (aboveCompare) return snapTo(compareBlock);
      if (betweenSections) return snapTo(contactBlock);
    } else if (direction < 0) {
      if (beyondContact) return snapTo(compareBlock);
    }

    return false;
  };

  const snapTo = (target) => {
    if (!target) return false;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    return true;
  };

  window.addEventListener("touchstart", handleSnapTouchStart, { passive: true });
  window.addEventListener("touchend", handleSnapTouchEnd, { passive: true });
}

