/* Phone page turning (screens under 760px). Desktop never calls any of this.

   One page at a time. Every page is its own sheet, hinged at the spine on its left edge, and a swipe turns
   exactly one sheet: it lifts, follows the finger over the spine and lands, uncovering the next page that
   lies beneath it. Swiping right brings the previous sheet back over. Vertical swipes turn pages too
   (up = forward), because a phone visitor's first instinct is to scroll and there is nothing else to scroll.

   Feel (numbers from Apple's "Designing Fluid Interfaces" and the usual flipbook readers):
   - 1:1 tracking: one page width of finger travel is one full turn, so the sheet's edge stays near the finger.
   - Let go: a flick (over FLICK pages per second) always turns in its direction; a slow release finishes
     past the half way point and falls back before it. Either way a critically damped spring takes over
     from the finger's own velocity, so there is no seam and no bounce past the page.
   - Interruptible: touching a page in flight and moving catches it where it is; a new flick while one is
     in flight queues the next page, so rapid flicks turn one page each and always end on a whole page.
   - The ends rubber band (Apple's 0.55 constant) and spring back.
   - Transform and opacity only. At most three sheets exist: the one turning, the one beneath it and the one
     before it (kept hidden, ready to turn back). Photos further on are only prefetched, never decoded. */
window.MobileFlip = function MobileFlip(ctx) {
  const { pages, book, castR, castL, edgeL, edgeR, stage, reduce } = ctx;
  const W = 540, P = pages.length, LAST = P - 1;
  const PERSPECTIVE = 2200;                  // page units; a touch deeper than the desktop spread (2600)
  const FLICK = .8;                          // pages per second (about 250px/s of finger travel)
  const RESPONSE = .5;                       // seconds, spring after a swipe
  const SLOP = 8;                            // px before a touch becomes a drag
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const rubber = (x, dim) => (x * dim * .55) / (dim + .55 * Math.abs(x));
  const now = () => performance.now();

  const sheets = new Map();                  // page index -> { el, front, back, t, vis, z }
  let on = false, locked = false, quiet = false;
  let Q = 0, goal = 0;                       // Q: where the paper is (page k lies open at Q = k)
  let spring = null;                         // { g, x0, v0, t0, w }
  let over = 0, overAxis = "x", overSpring = null;
  let scale = 1, vw = 390, vh = 844, drag = null, suppressUntil = 0, firstMove = null;
  let dirty = true, lastPainted = null;

  /* ---------- sheets ---------- */
  const withImgs = html => html.replace(/<img /g, '<img decoding="async" ');
  function make(i) {
    const el = document.createElement("div");
    el.className = "leaf sheet" + (i === 0 || i === LAST ? " first" : "");
    el.innerHTML = `<div class="face front">${withImgs(window.renderPage(pages[i]))}<div class="shade"></div></div>
                    <div class="face back"><div class="shade"></div></div>`;
    el.style.display = "none";                             // unpainted (and its photos undecoded) until it can be seen
    book.insertBefore(el, castL);
    const S = { el, front: el.querySelector(".front .shade"), back: el.querySelector(".back .shade"), t: -1, vis: false, z: -1, prev: clamp(Q - i, 0, 1) };
    sheets.set(i, S);
    return S;
  }
  // the photos two pages ahead start downloading (not decoding) so they are ready when their page arrives
  const fetched = new Set();
  function prefetch(i) {
    if (i < 0 || i > LAST || fetched.has(i)) return;
    fetched.add(i);
    const re = /<img[^>]+src="([^"]+)"/g; let m;
    while ((m = re.exec(pages[i].html))) { const im = new Image(); im.src = m[1]; }
  }
  // keep exactly the sheets that can be seen or can be reached by the next touch
  function sync() {
    const a = Math.floor(clamp(Q, 0, LAST));
    const lo = Math.max(0, a - 1), hi = Math.min(LAST, a + 1);
    sheets.forEach((S, i) => { if (i < lo || i > hi) { S.el.remove(); sheets.delete(i); } });
    for (let i = lo; i <= hi; i++) if (!sheets.has(i)) make(i);
    prefetch(a + 2); prefetch(a - 2);
  }

  /* ---------- drawing ---------- */
  function paint() {
    const a = Math.floor(clamp(Q, 0, LAST));
    let active = null, activeT = 0;
    sheets.forEach((S, i) => {
      const t = clamp(Q - i, 0, 1);
      const vis = t < 1 && i <= a + 1;
      if (vis !== S.vis) { S.vis = vis; S.el.style.display = vis ? "" : "none"; S.el.style.willChange = vis ? "transform" : "auto"; }
      if (t !== S.t) {
        S.t = t;
        const lift = Math.sin(Math.PI * t);
        S.el.style.transform = `perspective(${PERSPECTIVE}px) rotateY(${-180 * t}deg) translateZ(${lift * 18}px) skewY(${lift * -1.2}deg)`;
        S.front.style.opacity = t < .5 ? (lift * .9).toFixed(3) : 0;
        S.back.style.opacity = t >= .5 ? (lift * .9).toFixed(3) : 0;
      }
      const z = (t > 0 && t < 1) ? 100 : P - i;
      if (z !== S.z) { S.z = z; S.el.style.zIndex = z; }
      if (t > 0 && t < 1) { active = S; activeT = t; }
      if (!quiet) {
        const I = clamp(.35 + Math.abs(velocity()) / 6, .35, 1);
        if (S.prev < .05 && t >= .05) sound("flip", { intensity: I, dir: 1 });
        if (S.prev > .95 && t <= .95) sound("flip", { intensity: I, dir: -1 });
        if (S.prev < .985 && t >= .985) sound("land", { intensity: I * .8, pan: -.3 });
        if (S.prev > .015 && t <= .015) sound("land", { intensity: I * .8, pan: .3 });
      }
      S.prev = t;
    });

    // the turning sheet shades the page beneath: wide and soft while it lifts, a thin line at the spine once it is over
    if (active && !reduce) {
      const ang = Math.PI * activeT, c = Math.abs(Math.cos(ang));
      castR.style.opacity = (Math.sin(ang) * .8).toFixed(3);
      castR.style.transform = `scaleX(${(activeT < .5 ? c * .9 : c * .35) + .05})`;
    } else castR.style.opacity = 0;
    castL.style.opacity = 0;

    // the page block: pages still to read on the right, pages read on the spine side
    edgeR.style.width = (Math.max(0, LAST - Q) * .55) + "px";
    edgeR.style.opacity = Q >= LAST - .02 ? 0 : 1;
    edgeL.style.width = (Math.max(0, Q) * .55) + "px";
    edgeL.style.opacity = Q <= .02 ? 0 : 1;

    const o = over / scale;
    book.style.transform = overAxis === "x" ? `translate3d(${-W / 2 + o}px, 0, 0)` : `translate3d(${-W / 2}px, ${o}px, 0)`;
  }
  const sound = (k, o) => { try { if (window.PaperSound) PaperSound[k](o); } catch (e) {} };

  /* ---------- springs (critically damped: no overshoot past the page it lands on) ---------- */
  function springTo(g, v0 = 0, response = RESPONSE) {
    goal = g = clamp(g, 0, LAST);
    spring = { g, x0: Q - g, v0, t0: now(), w: 2 * Math.PI / response };
    if (Math.abs(spring.x0) < 1e-4 && Math.abs(v0) < .01) { Q = g; spring = null; }
    dirty = true;
  }
  function velocity() {
    if (drag && drag.v !== undefined) return drag.v;
    if (!spring) return 0;
    const { x0, v0, t0, w } = spring, t = (now() - t0) / 1000, B = v0 + w * x0;
    return (B - w * (x0 + B * t)) * Math.exp(-w * t);
  }
  function step(tNow) {
    if (spring) {
      const { g, x0, v0, t0, w } = spring, t = (tNow - t0) / 1000, B = v0 + w * x0;
      const x = (x0 + B * t) * Math.exp(-w * t), v = (B - w * (x0 + B * t)) * Math.exp(-w * t);
      if ((Math.abs(x) < .0015 && Math.abs(v) < .05) || (x0 !== 0 && Math.sign(x) !== Math.sign(x0))) { Q = g; spring = null; }
      else Q = g + x;
      dirty = true;
    }
    if (overSpring) {
      const { x0, t0, w } = overSpring, t = (tNow - t0) / 1000;
      over = x0 * (1 + w * t) * Math.exp(-w * t);
      if (Math.abs(over) < .3) { over = 0; overSpring = null; }
      dirty = true;
    }
  }

  /* ---------- gestures ---------- */
  const pageW = () => W * scale;
  function begin(x, y, t, caught) {
    if (!on || locked) return;
    if (window.visualViewport && visualViewport.scale > 1.02) return;   // pinched in: let the browser pan
    drag = { x0: x, y0: y, axis: null, samples: [], caught, moved: false };
  }
  function move(x, y, t) {
    const d = drag; if (!d) return false;
    const dx = x - d.x0, dy = y - d.y0;
    if (!d.axis) {
      if (Math.hypot(dx, dy) < SLOP) return false;
      d.axis = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
      d.moved = true;
      d.base = (d.axis === "x" ? dx : dy) * SLOP / Math.hypot(dx, dy);   // only the slop is swallowed
      d.D = d.axis === "x" ? pageW() * .9 : Math.min(pageW(), vh * .5);
      d.Q0 = Q; d.goal0 = goal; d.flying = spring ? Math.sign(goal - Q) : 0;
      spring = null; overSpring = null; over = 0; overAxis = d.axis;
      if (firstMove) firstMove();
    }
    const raw = d.Q0 - ((d.axis === "x" ? dx : dy) - d.base) / d.D;   // forward is positive
    d.samples.push({ t, q: raw });
    while (d.samples.length > 2 && t - d.samples[0].t > 90) d.samples.shift();
    if (reduce) return true;
    if (raw < 0) { Q = 0; over = rubber(-raw * d.D, d.axis === "x" ? vw : vh); }
    else if (raw > LAST) { Q = LAST; over = -rubber((raw - LAST) * d.D, d.axis === "x" ? vw : vh); }
    else { Q = raw; over = 0; }
    dirty = true;
    return true;
  }
  function end(t, cancelled) {
    const d = drag; drag = null;
    if (!d) return;
    if (d.caught || d.moved) suppressUntil = now() + 450;    // a catch or a swipe is never a tap
    if (!d.moved) return;
    // velocity over the last ~90ms, in pages per second
    const s = d.samples, A = s[0], Z = s[s.length - 1];
    let V = 0;
    if (!cancelled && s.length > 1 && Z.t - A.t > 0 && t - Z.t < 80) V = (Z.q - A.q) / (Z.t - A.t) * 1000;
    const moved = Z ? Z.q - d.Q0 : 0;

    if (reduce) {                                            // no tracking: a clear swipe changes the page at once
      const dir = Math.abs(V) > FLICK ? Math.sign(V) : Math.abs(moved) > .12 ? Math.sign(moved) : 0;
      if (dir) set(Math.round(d.Q0) + dir, { fade: true, sound: true });
      return;
    }
    let g;
    if (V > FLICK) g = d.flying > 0 ? Math.max(d.goal0 + 1, Math.ceil(Q - 1e-6)) : Math.ceil(Q - 1e-6) + (Q % 1 === 0 && moved > 0 ? 1 : 0);
    else if (V < -FLICK) g = d.flying < 0 ? Math.min(d.goal0 - 1, Math.floor(Q + 1e-6)) : Math.floor(Q + 1e-6) - (Q % 1 === 0 && moved < 0 ? 1 : 0);
    else g = Math.round(Q);
    g = clamp(g, Math.floor(Q) - 2, Math.ceil(Q) + 2);       // a burst of flicks never runs away
    springTo(g, clamp(V, -5, 5));                            // even a hard flick lets the paper take ~0.2s
    if (over) { overSpring = { x0: over, t0: now(), w: 2 * Math.PI / .45 }; }
  }

  // touch: we own single finger drags anywhere on screen (a swipe that starts on the intro card or the bars
  // must still turn the page); two fingers are left to the browser (pinch zoom). The reader overlay keeps its
  // own scrolling, and taps on buttons still work because a tap never moves past the slop.
  const tp = e => e.touches[0] || e.changedTouches[0];
  const ours = e => on && !locked && !(e.target && e.target.closest && e.target.closest('[role="dialog"]'));
  document.addEventListener("touchstart", e => {
    if (!ours(e)) return;
    const p = e.touches[0];
    // a swipe that starts on the very edge would be taken by Safari's back and forward gestures
    if (e.touches.length === 1 && (p.clientX < 18 || p.clientX > innerWidth - 18)) e.preventDefault();
    if (e.touches.length > 1) { if (drag) end(e.timeStamp, true); return; }
    begin(p.clientX, p.clientY, now(), !!spring);
  }, { passive: false });
  document.addEventListener("touchmove", e => {
    if (!ours(e)) return;
    if (e.touches.length > 1) { if (drag) end(now(), true); return; }
    if (drag) { const p = tp(e); move(p.clientX, p.clientY, now()); }
    if (e.cancelable) e.preventDefault();                    // never scroll or rubber band the document
  }, { passive: false });
  document.addEventListener("touchend", e => {
    if (!on || e.touches.length) return;
    end(now(), false);
  }, { passive: true });
  document.addEventListener("touchcancel", () => { if (on) end(now(), true); }, { passive: true });
  // a finger that slides off the edge of the screen can end with pointerup but no touchend;
  // never leave a page frozen mid-turn (whichever arrives first ends the drag, the other is a no-op)
  document.addEventListener("pointerup", e => { if (on && drag && e.pointerType === "touch" && !drag.pointer) end(now(), false); }, true);
  document.addEventListener("pointercancel", e => { if (on && drag && e.pointerType === "touch" && !drag.pointer) end(now(), true); }, true);

  // mouse and pen (a narrow desktop window): the same gestures with pointer events
  document.addEventListener("pointerdown", e => {
    if (!ours(e) || e.pointerType === "touch" || e.button !== 0) return;
    if (e.target.closest && e.target.closest("button, a")) return;   // let mouse clicks on controls be clicks
    begin(e.clientX, e.clientY, now(), !!spring);
    if (drag) { drag.pointer = e.pointerId; try { stage.setPointerCapture(e.pointerId); } catch (err) {} }
  });
  stage.addEventListener("pointermove", e => { if (on && drag && drag.pointer === e.pointerId) { if (move(e.clientX, e.clientY, now())) e.preventDefault(); } });
  const pEnd = e => { if (on && drag && drag.pointer === e.pointerId) end(now(), e.type === "pointercancel"); };
  stage.addEventListener("pointerup", pEnd);
  stage.addEventListener("pointercancel", pEnd);

  // after a swipe (or catching a page in flight) the browser may still send a click: it must not open the reader
  addEventListener("click", e => { if (on && now() < suppressUntil) { e.stopPropagation(); e.preventDefault(); } }, true);

  /* ---------- programmatic moves ---------- */
  function set(target, o = {}) {
    target = clamp(Math.round(target), 0, LAST);
    const was = Q;
    spring = null; overSpring = null; over = 0;
    Q = goal = target;
    quiet = !o.sound;
    sync(); paint();
    quiet = false;
    dirty = true;                                             // the chrome catches up on the next frame
    if (o.sound && target !== was) sound("flip", { intensity: .45, dir: target > was ? 1 : -1 });
    if (o.fade && target !== was) book.animate([{ opacity: .15 }, { opacity: 1 }], { duration: 200, easing: "ease-out" });
  }
  function go(target, duration = 1.05) {
    target = clamp(Math.round(target), 0, LAST);
    if (duration < .05) return set(target);
    if (reduce || Math.abs(target - Q) > 2.5) return set(target, { fade: true });   // long jumps fade instead of riffling
    springTo(target, velocity(), clamp(duration * .5, .3, .8));
  }

  /* ---------- lifecycle ---------- */
  return {
    enter(at) {
      on = true; locked = false; drag = null;
      Q = goal = clamp(Math.round(at || 0), 0, LAST);
      spring = null; over = 0; overSpring = null;
      sync(); paint(); dirty = false;
    },
    exit() {
      on = false; drag = null; spring = null; overSpring = null; over = 0;
      sheets.forEach(S => S.el.remove()); sheets.clear();
      castR.style.opacity = 0;
    },
    layout(s, w, h) { scale = s; vw = w; vh = h; dirty = true; },
    // one animation frame; returns true when something moved
    frame(tNow) {
      if (!on) return false;
      step(tNow);
      if (!dirty) return false;
      const a = Math.floor(clamp(Q, 0, LAST));
      if (!sheets.has(a) || (a < LAST && !sheets.has(a + 1)) || a !== lastPainted) { sync(); lastPainted = a; }
      paint(); dirty = false;
      return true;
    },
    go, set,
    lock(v) { locked = !!v; if (locked && drag) { drag = null; if (!spring) springTo(Math.round(Q)); } },
    onFirstMove(fn) { firstMove = fn; },
    get q() { return Q; },
    get goal() { return goal; },
    get settled() { return !spring && !drag && !overSpring && Math.abs(Q - Math.round(Q)) < 1e-3; },
    get dragging() { return !!(drag && drag.moved); },
    images() { return [...book.querySelectorAll(".sheet img")]; },
  };
};
