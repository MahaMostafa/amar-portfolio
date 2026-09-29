/* PaperSound — synthesised paper foley (no audio files).
   flip(): a page lifting and sweeping across (rustle + fibre crackle, panned with the page)
   land(): the page settling flat (soft tap + low thump)
   roll(): a longer, airier rustle for rolled/peeled sheets
   fold(): a crisp crease for gatefold hinges */
window.PaperSound = (() => {
  let ctx = null, out = null, noiseBuf = null, crackleBuf = null;
  let on = false, lastAt = 0;
  const buttons = new Set();

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20; comp.ratio.value = 3; comp.attack.value = .003; comp.release.value = .2;
    out = ctx.createGain(); out.gain.value = .85;
    out.connect(comp).connect(ctx.destination);
    noiseBuf = makePink(2);
    crackleBuf = makeCrackle(2);
    return ctx;
  }

  function makePink(sec) {
    const len = Math.floor(sec * ctx.sampleRate), b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b0 = .99765 * b0 + w * .099046; b1 = .963 * b1 + w * .2965164; b2 = .57 * b2 + w * 1.0526913;
      d[i] = (b0 + b1 + b2 + w * .1848) * .2;
    }
    return b;
  }
  // sparse decaying impulses ≈ paper fibres cracking
  function makeCrackle(sec) {
    const len = Math.floor(sec * ctx.sampleRate), b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
    let v = 0;
    for (let i = 0; i < len; i++) {
      if (Math.random() < .0022) v = (Math.random() * 2 - 1) * (.4 + Math.random() * .6);
      else v *= .6;
      d[i] = v + (Math.random() * 2 - 1) * .015;
    }
    return b;
  }

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  function source(buf, rate) { const s = ctx.createBufferSource(); s.buffer = buf; s.playbackRate.value = rate; return s; }
  function envelope(param, t0, peak, attack, total) {
    param.setValueAtTime(.0001, t0);
    param.exponentialRampToValueAtTime(Math.max(.0002, peak), t0 + attack);
    param.exponentialRampToValueAtTime(.0001, t0 + total);
  }
  function ready(gap = .055) {
    if (!on || !ctx || ctx.state !== "running") return false;
    const now = ctx.currentTime;
    if (now - lastAt < gap) return false;
    lastAt = now; return true;
  }
  function panner(from, to, t0, dur) {
    if (!ctx.createStereoPanner) return null;
    const p = ctx.createStereoPanner();
    p.pan.setValueAtTime(from, t0); p.pan.linearRampToValueAtTime(to, t0 + dur);
    return p;
  }

  function rustle({ intensity = .7, dir = 1, dur = .42, lo = 700, hi = 2600, crackle = .5, bright = 1400 } = {}) {
    if (!ready()) return;
    const I = clamp(intensity, .18, 1), now = ctx.currentTime, d = dur * (1.15 - I * .3);
    const bus = ctx.createGain();

    const n = source(noiseBuf, .9 + Math.random() * .25);
    const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = .85;
    bp.frequency.setValueAtTime(lo, now);
    bp.frequency.exponentialRampToValueAtTime(hi + I * bright, now + d * .42);
    bp.frequency.exponentialRampToValueAtTime(lo * 1.5, now + d);
    const g = ctx.createGain(); envelope(g.gain, now, .34 * I, d * .3, d);
    n.connect(bp).connect(g).connect(bus);

    const c = source(crackleBuf, .8 + Math.random() * .45);
    const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 1900;
    const gc = ctx.createGain(); envelope(gc.gain, now, crackle * I, d * .18, d * .85);
    c.connect(hp).connect(gc).connect(bus);

    const p = panner(.55 * dir, -.55 * dir, now, d);
    if (p) bus.connect(p).connect(out); else bus.connect(out);
    n.start(now, Math.random() * 1.2, d + .05);
    c.start(now, Math.random() * 1.2, d + .05);
  }

  function flip(o = {}) { rustle(o); }
  function roll(o = {}) { rustle({ dur: .7, lo: 500, hi: 1900, crackle: .35, bright: 900, dir: 0, ...o }); }
  function fold(o = {}) { rustle({ dur: .26, lo: 1200, hi: 3400, crackle: .8, bright: 1800, ...o }); }

  function land({ intensity = .6, pan = 0 } = {}) {
    if (!on || !ctx || ctx.state !== "running") return;
    const I = clamp(intensity, .2, 1), now = ctx.currentTime;
    const bus = ctx.createGain();
    const n = source(noiseBuf, 1);
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1100;
    const g = ctx.createGain(); envelope(g.gain, now, .5 * I, .004, .13);
    n.connect(lp).connect(g).connect(bus);
    const o = ctx.createOscillator(); o.type = "sine";
    o.frequency.setValueAtTime(105, now); o.frequency.exponentialRampToValueAtTime(52, now + .1);
    const go = ctx.createGain(); envelope(go.gain, now, .16 * I, .005, .12);
    o.connect(go).connect(bus);
    const p = panner(pan, pan, now, .1);
    if (p) bus.connect(p).connect(out); else bus.connect(out);
    n.start(now, Math.random(), .16); o.start(now); o.stop(now + .15);
  }

  function setOn(v) {
    on = !!v;
    if (on) { ensure(); if (ctx && ctx.state !== "running") ctx.resume(); }
    try { localStorage.setItem("amar-sound", on ? "1" : "0"); } catch (e) {}
    buttons.forEach(sync);
  }
  function sync(btn) {
    btn.setAttribute("aria-pressed", String(on));
    const s = btn.querySelector("span"); if (s) s.textContent = on ? "Sound on" : "Sound off";
  }
  const ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><g class="wave"><path d="M15.5 9a4 4 0 0 1 0 6"/><path d="M18 6.5a7.5 7.5 0 0 1 0 11"/></g><g class="x"><path d="M16 9.5l5 5M21 9.5l-5 5"/></g></svg>`;
  function button(extraClass = "") {
    const b = document.createElement("button");
    b.type = "button"; b.className = "snd " + extraClass;
    b.innerHTML = ICON + "<span></span>";
    b.addEventListener("click", () => setOn(!on));
    buttons.add(b); sync(b);
    return b;
  }
  function wantsSound() { try { return localStorage.getItem("amar-sound") === "1"; } catch (e) { return false; } }

  return { flip, roll, fold, land, setOn, button, wantsSound, get on() { return on; } };
})();
