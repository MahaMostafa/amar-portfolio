/* Reading mode (phones). On phones a tap on the book dispatches "mag:tap"; the tapped page lifts off
   the desk into a full-screen reader where it is large enough to read. Pan by scrolling, double tap
   (or the Fit / Zoom pill) to switch zoom, arrows or a swipe at fit to change page, close with the
   button, Escape or the Back gesture. Desktop never builds any of this. */
(() => {
  const MAG = window.MAG;
  if (!MAG) return;

  const doc = document;
  const W = 540, H = 720, GUT = 16;
  const EASE = "cubic-bezier(0.23, 1, 0.32, 1)";
  const reduceMQ = matchMedia("(prefers-reduced-motion: reduce)");
  const reduced = () => reduceMQ.matches;
  const HAS_ZOOM = !!(window.CSS && CSS.supports && CSS.supports("zoom", "2"));
  const HINT_KEY = "amar-reader-hint";
  const total = MAG.pages.length;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const sound = (kind, o) => { try { if (window.PaperSound) PaperSound[kind](o); } catch (e) {} };
  const bookEl = doc.getElementById("book");

  const ICON = {
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    left: '<path d="m15 18-6-6 6-6"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
    zoomIn: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M11 8v6"/><path d="M8 11h6"/>',
    zoomOut: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M8 11h6"/>',
  };
  const svg = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;

  const labelText = i => i === 0 ? "Cover" : i === total - 1 ? "Back cover" : `Page ${i} of ${total - 2}`;
  const labelHTML = i => i === 0 ? "Cover" : i === total - 1 ? "Back cover" : `Page <b>${i}</b>of ${total - 2}`;
  function titleOf(pg) {
    const s = pg && (pg.querySelector(".serif") || pg.querySelector(".kick"));
    let t = "";
    if (s) { const c = s.cloneNode(true); c.querySelectorAll("br").forEach(b => b.replaceWith(" ")); t = c.textContent.replace(/\s+/g, " ").trim(); }
    if (t.length > 72) t = t.slice(0, 72).replace(/\s+\S*$/, "") + "…";
    return t;
  }
  const bookPage = i => bookEl && MAG.pages[i] ? bookEl.querySelector(`.pg[data-page="${MAG.pages[i].id}"]`) : null;
  function bookRect(i) {
    const p = bookPage(i);
    if (!p) return null;
    const r = p.getBoundingClientRect();
    return r.width > 2 && r.height > 2 ? r : null;
  }

  /* ---------------- state ---------------- */
  let el = null, ui = null;
  let state = "closed";                       // closed · opening · open · closing
  let index = 0, Z = 1, mode = "read", fitZ = 1, readZ = 1, boxPos = { left: 0, top: 0 };
  let anims = [], zoomAnim = null, turnAnim = null, seq = 0;
  let returnFocus = null, inerted = [];
  let pushed = false, popPending = false, popTimer = 0;
  let lastTap = null, lastClick = null, touch = null;
  const isOpen = () => state === "opening" || state === "open";

  /* ---------------- DOM (built on first use) ---------------- */
  function build() {
    el = doc.createElement("div");
    el.className = "rd";
    el.hidden = true;
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("data-lenis-prevent", "");   // let the reader scroll natively while the book's smooth scroll is stopped
    el.innerHTML = `
      <div class="rd-bg"></div>
      <div class="rd-scroll" tabindex="0" role="region" aria-label="Page view">
        <div class="rd-canvas"><div class="rd-box"><div class="rd-lift"></div><div class="rd-sheet"><div class="rd-turn"></div></div></div></div>
      </div>
      <div class="rd-top">
        <span class="rd-label" aria-live="polite"></span>
        <button type="button" class="rd-ic" data-act="close" aria-label="Close the page and return to the magazine">${svg(ICON.x)}</button>
      </div>
      <div class="rd-bot">
        <button type="button" class="rd-ic" data-act="prev" aria-label="Previous page">${svg(ICON.left)}</button>
        <button type="button" class="rd-pill" data-act="zoom"></button>
        <button type="button" class="rd-ic" data-act="next" aria-label="Next page">${svg(ICON.right)}</button>
      </div>`;
    doc.body.appendChild(el);
    const q = s => el.querySelector(s);
    ui = {
      bg: q(".rd-bg"), scroll: q(".rd-scroll"), canvas: q(".rd-canvas"), box: q(".rd-box"), lift: q(".rd-lift"),
      sheet: q(".rd-sheet"), turn: q(".rd-turn"), top: q(".rd-top"), bot: q(".rd-bot"), label: q(".rd-label"),
      close: q('[data-act="close"]'), prev: q('[data-act="prev"]'), next: q('[data-act="next"]'), zoom: q('[data-act="zoom"]'),
    };
    ui.bars = [ui.top, ui.bot];
    el.addEventListener("click", onClick);
    ui.scroll.addEventListener("touchstart", onTouchStart, { passive: true });
    ui.scroll.addEventListener("touchend", onTouchEnd, { passive: true });
    ui.scroll.addEventListener("touchcancel", () => { touch = null; }, { passive: true });
  }

  /* ---------------- geometry + zoom ---------------- */
  function metrics() {
    return { vw: ui.scroll.clientWidth, vh: ui.scroll.clientHeight, top: ui.top.offsetHeight, bot: ui.bot.offsetHeight };
  }
  // fit = the whole page on screen; read = ~1.5 to 1.8 times the fit-to-width size, so body text lands near 14px
  function computeZooms(m) {
    const widthFit = (m.vw - 2 * GUT) / W;
    const heightFit = (m.vh - m.top - m.bot - 8) / H;
    fitZ = Math.max(.2, Math.min(widthFit, heightFit));
    const TARGET = 1.12;
    const r = widthFit >= TARGET ? widthFit : Math.min(Math.max(TARGET, widthFit * 1.5), widthFit * 1.8);
    readZ = Math.max(r, fitZ * 1.25);
  }
  function applyZoom(z) {
    Z = z;
    const bw = W * z, bh = H * z, m = metrics();
    ui.box.style.width = bw + "px";
    ui.box.style.height = bh + "px";
    if (HAS_ZOOM) ui.sheet.style.zoom = String(z);
    else ui.sheet.style.transform = `scale(${z})`;       // older engines without CSS zoom
    const cw = Math.max(m.vw, bw + 2 * GUT), ch = Math.max(m.vh, bh + m.top + m.bot);
    ui.canvas.style.width = cw + "px";
    ui.canvas.style.height = ch + "px";
    boxPos = { left: (cw - bw) / 2, top: m.top + Math.max(0, (m.vh - m.top - m.bot - bh) / 2) };
    ui.box.style.left = boxPos.left + "px";
    ui.box.style.top = boxPos.top + "px";
    syncZoomButton();
  }
  function syncZoomButton() {
    const reading = mode === "read";
    ui.zoom.innerHTML = reading ? `${svg(ICON.zoomOut)}<span>Fit</span>` : `${svg(ICON.zoomIn)}<span>Zoom</span>`;
    ui.zoom.setAttribute("aria-label", reading ? "Fit the whole page on screen" : "Zoom in to read");
  }
  // keep page point (px, py) under the screen point (cx, cy)
  function panTo(px, py, cx, cy) {
    const sr = ui.scroll.getBoundingClientRect();
    ui.scroll.scrollLeft = boxPos.left + px * Z - (cx - sr.left);
    ui.scroll.scrollTop = boxPos.top + py * Z - (cy - sr.top);
  }
  // reading start: the top left of the text column, just inside the gutter
  function panHome() {
    ui.scroll.scrollLeft = mode === "read" ? boxPos.left + 40 * Z - 12 : 0;
    ui.scroll.scrollTop = 0;
  }
  function pagePoint(cx, cy) {
    const sr = ui.scroll.getBoundingClientRect();
    return {
      x: clamp((cx - sr.left + ui.scroll.scrollLeft - boxPos.left) / Z, 0, W),
      y: clamp((cy - sr.top + ui.scroll.scrollTop - boxPos.top) / Z, 0, H),
    };
  }

  function zoomTo(to, point) {
    if (state !== "open") return;
    if (zoomAnim) { zoomAnim.cancel(); zoomAnim = null; }
    const z1 = Z, z2 = to === "read" ? readZ : fitZ;
    const sr = ui.scroll.getBoundingClientRect(), m = metrics();
    const fx = point ? point.x : sr.left + m.vw / 2;
    const fy = point ? point.y : sr.top + m.top + (m.vh - m.top - m.bot) / 2;
    const p = pagePoint(fx, fy);
    // screen position of that page point right now (it may have been clamped onto the page)
    const cx = sr.left - ui.scroll.scrollLeft + boxPos.left + p.x * z1;
    const cy = sr.top - ui.scroll.scrollTop + boxPos.top + p.y * z1;
    mode = to;
    applyZoom(z2);
    panTo(p.x, p.y, cx, cy);
    if (reduced() || Math.abs(z1 - z2) < 1e-3) return;
    const r = ui.box.getBoundingClientRect();
    const ox = p.x * z2, oy = p.y * z2;
    const origin = `${ox}px ${oy}px`;
    zoomAnim = ui.box.animate([
      { transformOrigin: origin, transform: `translate(${cx - (r.left + ox)}px, ${cy - (r.top + oy)}px) scale(${z1 / z2})` },
      { transformOrigin: origin, transform: "none" },
    ], { duration: 320, easing: EASE });
    const a = zoomAnim;
    a.finished.then(() => { if (zoomAnim === a) zoomAnim = null; }, () => {});
  }
  const toggleZoom = point => zoomTo(mode === "read" ? "fit" : "read", point);

  /* ---------------- page content ---------------- */
  function setPage(i) {
    index = i;
    ui.turn.innerHTML = MAG.renderPage(MAG.pages[i]);
    const pg = ui.turn.firstElementChild;
    if (pg) pg.classList.add("is-open");            // in-page animations show their settled state
    ui.label.innerHTML = labelHTML(i);
    const t = titleOf(pg);
    el.setAttribute("aria-label", t ? `${labelText(i)} · ${t}` : labelText(i));
    const a = doc.activeElement;
    ui.prev.disabled = i <= 0;
    ui.next.disabled = i >= total - 1;
    if ((a === ui.prev && ui.prev.disabled) || (a === ui.next && ui.next.disabled)) ui.zoom.focus({ preventScroll: true });
  }

  function turn(d) {
    if (state !== "open") return;
    const j = index + d;
    if (j < 0 || j >= total) return;
    if (turnAnim) turnAnim.cancel();
    setPage(j);
    panHome();
    turnAnim = reduced()
      ? ui.turn.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, easing: "ease-out" })
      : ui.turn.animate([{ opacity: 0, transform: `translateX(${d * 28}px)` }, { opacity: 1, transform: "none" }], { duration: 320, easing: EASE });
    sound("flip", { intensity: .45, dir: d });
    syncBook(j);
  }

  // move the book underneath so closing lands on the same page (its smooth scroll ignores scrollTo while stopped)
  let syncSeq = 0;
  function syncBook(i, cb) {
    const my = ++syncSeq;
    const at = () => Math.abs(MAG.q - i) < .005;
    if (at()) { if (cb) cb(); return; }
    MAG.lock(false);
    MAG.go(i, .01);
    let n = 0;
    (function wait() {
      if (my !== syncSeq) return;
      if (at() || ++n > 45) {
        if (isOpen()) MAG.lock(true);
        if (cb) cb();
        return;
      }
      requestAnimationFrame(wait);
    })();
  }

  /* ---------------- open / close ---------------- */
  function open(i, point) {
    if (!MAG.mobile || !(i >= 0 && i < total)) return;
    if (state === "closing") finishClose();
    if (state !== "closed") return;
    if (!el) build();
    const my = ++seq;
    state = "opening";
    returnFocus = doc.activeElement;
    el.hidden = false;
    el.classList.remove("is-closing");
    setPage(i);
    computeZooms(metrics());
    mode = "read";
    applyZoom(readZ);

    const src = bookRect(i);
    if (point && src) {
      const px = clamp((point.x - src.left) / src.width * W, 0, W), py = clamp((point.y - src.top) / src.height * H, 0, H);
      panTo(px, py, point.x, point.y);
    } else panHome();

    MAG.lock(true);
    setInert(true);
    if (!popPending) pushEntry();
    ui.close.focus({ preventScroll: true });
    dismissHint();
    sound("flip", { intensity: .28, dir: 1 });
    if (Math.round(MAG.q) !== i) syncBook(i);

    cancelAnims();
    if (reduced() || !src) {
      anims = [el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: "ease-out" })];
    } else {
      const tgt = ui.box.getBoundingClientRect();
      const from = `translate(${src.left - tgt.left}px, ${src.top - tgt.top}px) scale(${src.width / tgt.width})`;
      anims = [
        ui.box.animate([{ transform: from }, { transform: "none" }], { duration: 420, easing: EASE }),
        ui.bg.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 320, easing: "ease-out" }),
        ui.lift.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 420, easing: EASE }),
        ...ui.bars.map(b => b.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240, delay: 160, easing: "ease-out", fill: "backwards" })),
      ];
    }
    anims[0].finished.then(() => { if (my === seq && state === "opening") state = "open"; }, () => {});
  }

  function requestClose() {
    if (!isOpen()) return;
    if (pushed && history.state && history.state.magReader) {
      pushed = false;
      popPending = true;                           // the popstate this back() causes is ours: ignore it
      clearTimeout(popTimer);
      popTimer = setTimeout(() => { popPending = false; }, 1000);
      history.back();
    }
    close();
  }

  function close() {
    if (!isOpen()) return;
    const my = ++seq;
    // read where everything is right now, so closing mid-open reverses from there
    const cs = getComputedStyle(ui.box);
    const cur = {
      box: cs.transform && cs.transform !== "none" ? cs.transform : "none",
      bg: +getComputedStyle(ui.bg).opacity, lift: +getComputedStyle(ui.lift).opacity,
      el: +getComputedStyle(el).opacity, bars: ui.bars.map(b => +getComputedStyle(b).opacity),
    };
    cancelAnims();
    if (zoomAnim) { zoomAnim.cancel(); zoomAnim = null; }
    if (turnAnim) { turnAnim.finish(); turnAnim = null; }
    state = "closing";
    el.classList.add("is-closing");
    setInert(false);
    MAG.lock(false);
    restoreFocus();
    sound("land", { intensity: .32, pan: 0 });

    syncBook(index, () => {
      if (my !== seq) return;
      const tgt = bookRect(index);
      if (reduced() || !tgt) {
        anims = [el.animate([{ opacity: cur.el }, { opacity: 0 }], { duration: 200, easing: "ease-out", fill: "forwards" })];
      } else {
        const r = ui.box.getBoundingClientRect();
        const to = `translate(${tgt.left - r.left}px, ${tgt.top - r.top}px) scale(${tgt.width / r.width})`;
        anims = [
          ui.box.animate([{ transform: cur.box }, { transform: to }], { duration: 380, easing: EASE, fill: "forwards" }),
          ui.bg.animate([{ opacity: cur.bg }, { opacity: 0 }], { duration: 340, easing: "ease-out", fill: "forwards" }),
          ui.lift.animate([{ opacity: cur.lift }, { opacity: 0 }], { duration: 380, easing: EASE, fill: "forwards" }),
          ...ui.bars.map((b, k) => b.animate([{ opacity: cur.bars[k] }, { opacity: 0 }], { duration: 160, easing: "ease-out", fill: "forwards" })),
        ];
      }
      anims[0].finished.then(() => { if (my === seq) finishClose(); }, () => {});
    });
  }

  function finishClose() {
    seq++;
    cancelAnims();
    if (zoomAnim) { zoomAnim.cancel(); zoomAnim = null; }
    if (turnAnim) { turnAnim.cancel(); turnAnim = null; }
    if (el) { el.hidden = true; el.classList.remove("is-closing"); ui.turn.innerHTML = ""; }
    if (state !== "closing") { setInert(false); MAG.lock(false); }
    state = "closed";
  }

  // instant close, used when the screen stops being a phone layout
  function closeNow() {
    if (state === "closed") return;
    if (state !== "closing") {
      if (pushed && history.state && history.state.magReader) {
        pushed = false; popPending = true;
        clearTimeout(popTimer); popTimer = setTimeout(() => { popPending = false; }, 1000);
        history.back();
      }
      setInert(false); MAG.lock(false); restoreFocus();
    }
    state = "closing";
    finishClose();
  }

  function cancelAnims() { anims.forEach(a => a.cancel()); anims = []; }

  function setInert(on) {
    if (on) {
      inerted = [...doc.body.children].filter(c => c !== el && c.tagName !== "SCRIPT" && !c.inert);
      inerted.forEach(c => { c.inert = true; });
    } else {
      inerted.forEach(c => { c.inert = false; });
      inerted = [];
    }
  }

  function restoreFocus() {
    let t = returnFocus;
    if (!t || t === doc.body || !doc.contains(t) || (el && el.contains(t))) t = bookEl;
    if (!t) return;
    if (t === bookEl && !bookEl.hasAttribute("tabindex")) { bookEl.setAttribute("tabindex", "-1"); bookEl.classList.add("rd-return"); }
    try { t.focus({ preventScroll: true }); } catch (e) {}
    returnFocus = null;
  }

  /* ---------------- input ---------------- */
  function onClick(e) {
    const b = e.target.closest("button[data-act]");
    if (b) {
      if (b.disabled || !isOpen()) return;
      const a = b.dataset.act;
      if (a === "close") requestClose();
      else if (a === "prev") turn(-1);
      else if (a === "next") turn(1);
      else if (a === "zoom") toggleZoom(null);
      return;
    }
    if (!ui.scroll.contains(e.target) || e.target.closest("a")) return;
    const now = performance.now();
    if (lastClick && now - lastClick.t < 350 && Math.hypot(e.clientX - lastClick.x, e.clientY - lastClick.y) < 40) {
      lastClick = null;
      toggleZoom({ x: e.clientX, y: e.clientY });
    } else lastClick = { t: now, x: e.clientX, y: e.clientY };
  }

  // swipe left / right changes page while the whole page is on screen
  function onTouchStart(e) {
    touch = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY, t: performance.now() } : null;
  }
  function onTouchEnd(e) {
    const s = touch; touch = null;
    if (!s || state !== "open" || e.touches.length) return;
    const t = e.changedTouches[0], dx = t.clientX - s.x, dy = t.clientY - s.y;
    const canPanX = ui.scroll.scrollWidth > ui.scroll.clientWidth + 2;
    const pinched = window.visualViewport && visualViewport.scale > 1.02;
    if (!canPanX && !pinched && Math.abs(dx) > 56 && Math.abs(dx) > Math.abs(dy) * 1.6 && performance.now() - s.t < 700) {
      lastClick = null;
      turn(dx < 0 ? 1 : -1);
    }
  }

  function focusables() {
    return [...el.querySelectorAll('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')]
      .filter(n => n.getClientRects().length);
  }
  // capture phase on window, so the book's own arrow / space handlers never see keys meant for the reader
  addEventListener("keydown", e => {
    if (!isOpen()) return;
    e.stopPropagation();
    const k = e.key;
    if (k === "Escape") { e.preventDefault(); requestClose(); return; }
    if (k === "Tab") {
      const f = focusables(); if (!f.length) return;
      const first = f[0], last = f[f.length - 1], a = doc.activeElement;
      if (e.shiftKey && (a === first || !el.contains(a))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (a === last || !el.contains(a))) { e.preventDefault(); first.focus(); }
      return;
    }
    const scrollerFocused = doc.activeElement === ui.scroll;
    const canPanX = ui.scroll.scrollWidth > ui.scroll.clientWidth + 2;
    if ((k === "ArrowLeft" || k === "ArrowRight") && !(scrollerFocused && canPanX)) { e.preventDefault(); turn(k === "ArrowRight" ? 1 : -1); return; }
    if (k === "PageDown" && !scrollerFocused) { e.preventDefault(); turn(1); return; }
    if (k === "PageUp" && !scrollerFocused) { e.preventDefault(); turn(-1); return; }
    if (k === "+" || k === "=") { e.preventDefault(); if (mode !== "read") zoomTo("read", null); return; }
    if (k === "-" || k === "_") { e.preventDefault(); if (mode !== "fit") zoomTo("fit", null); }
  }, true);

  doc.addEventListener("focusin", e => { if (isOpen() && el && !el.contains(e.target)) ui.close.focus({ preventScroll: true }); });

  // our history entry must not bring back the book's old scroll position when it is popped
  // (the reader may have moved the book to another page), so the page's own entry is "manual" meanwhile
  let savedScrollMode = null;
  function pushEntry() {
    try { if (savedScrollMode === null) savedScrollMode = history.scrollRestoration; history.scrollRestoration = "manual"; } catch (e) {}
    history.pushState({ magReader: 1 }, "");
    pushed = true;
  }
  function restoreScrollMode() {
    if (savedScrollMode === null || pushed) return;
    try { history.scrollRestoration = savedScrollMode; } catch (e) {}
    savedScrollMode = null;
  }

  addEventListener("popstate", () => {
    if (popPending) {
      popPending = false; clearTimeout(popTimer);
      // reopened before our own back() landed: give the new reading its history entry
      if (isOpen() && !pushed) pushEntry(); else restoreScrollMode();
      return;
    }
    if (isOpen()) { pushed = false; close(); }
    restoreScrollMode();
  });

  addEventListener("resize", () => {
    if (state === "closed" || !el) return;
    if (!MAG.mobile) { closeNow(); return; }
    if (state === "closing") return;
    const sr = ui.scroll.getBoundingClientRect();
    const c = pagePoint(sr.left + sr.width / 2, sr.top + sr.height / 2);
    computeZooms(metrics());
    applyZoom(mode === "read" ? readZ : fitZ);
    panTo(c.x, c.y, sr.left + sr.width / 2, sr.top + sr.height / 2);
  });

  // remember where the finger landed; the book announces the tap right after
  doc.addEventListener("click", e => { if (e.detail) lastTap = { x: e.clientX, y: e.clientY, t: performance.now() }; }, true);
  doc.addEventListener("mag:tap", e => {
    const d = e.detail || {};
    const pt = lastTap && performance.now() - lastTap.t < 400 ? lastTap : null;
    lastTap = null;
    open(d.index, pt);
  });

  /* ---------------- one-time hint (phones only) ---------------- */
  let hintEl = null, hintDone = false;
  try { hintDone = localStorage.getItem(HINT_KEY) === "1"; } catch (e) {}
  function maybeHint() {
    if (hintDone || !MAG.mobile || state !== "closed") { if (hintEl) hintEl.classList.remove("on"); return; }
    if (doc.body.classList.contains("loading")) return;
    const intro = doc.getElementById("intro"), scrollHint = doc.getElementById("hint");
    if (intro && !intro.classList.contains("gone")) return;
    if (scrollHint && !scrollHint.classList.contains("gone")) return;   // one hint at a time
    if (!hintEl) {
      hintEl = doc.createElement("div");
      hintEl.className = "rd-hint";
      hintEl.innerHTML = `${svg(ICON.zoomIn)}<span>Tap a page to read</span>`;
      doc.body.appendChild(hintEl);
      hintEl.getBoundingClientRect();
    }
    hintEl.classList.add("on");
  }
  function dismissHint() {
    if (hintDone) return;
    hintDone = true;
    try { localStorage.setItem(HINT_KEY, "1"); } catch (e) {}
    if (hintEl) { hintEl.classList.remove("on"); const h = hintEl; hintEl = null; setTimeout(() => h.remove(), 600); }
  }
  doc.addEventListener("mag:open", maybeHint);
  addEventListener("resize", maybeHint);

  window.MAG_READER = { open: i => open(i, null), close: requestClose, get state() { return state; }, get zoom() { return { Z, mode, fitZ, readZ }; }, get index() { return index; } };
})();
