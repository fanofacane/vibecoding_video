// film.js: the film's timeline. Shot files register shots with shot(t0, t1, fn) and sounds with cue(t, kind).
// drawFrame(ctx, t) finds the shot under t and calls fn(ctx, t, lt) with lt = t - t0.

const DURATION = 90;
const SHOTS = [];
const CUES = [];
// Music plan read by audio.mjs: a bouncy ukulele section, a stop, then quiet piano.
const MUSIC = {
  bpm: 120, upStart: 8.0, upEnd: 51.5,           // bouncy part (beats on 8.0 + k * 0.5)
  introStart: 0.4,                               // soft night intro before the bouncy part
  sadStart: 52.0, sadEnd: 60.6,                  // chapter 5: slow, thin, then stops
  pianoStart: 62.0, end: 90,
};
const BEAT = 60 / MUSIC.bpm;
const onBeat = (t, t0 = MUSIC.upStart) => (t - t0) / BEAT;      // beat number (fractional)

function shot(t0, t1, fn, name = '') { SHOTS.push({ t0, t1, fn, name }); }
function cue(t, kind, o = {}) { CUES.push({ t, kind, ...o }); }

function fill(ctx, col, a = 1) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = clamp(a); ctx.fillStyle = col; ctx.fillRect(0, 0, W, H); ctx.restore();
}
// Bottom caption (subtitle).
function caption(ctx, s, a = 1) {
  if (a <= 0) return;
  text(ctx, s, W / 2, H - 92, 58, C.white, { alpha: a, outline: 10, outCol: 'rgba(40,24,18,.85)' });
}
// Scale the whole frame about (cx, cy) while drawing fn (used for push-ins between shots).
function zoomAbout(ctx, z, cx, cy, fn) {
  ctx.save(); ctx.translate(cx, cy); ctx.scale(z, z); ctx.translate(-cx, -cy); fn(); ctx.restore();
}
// Soft vignette.
function vignette(ctx, a = .45) {
  const g = ctx.createRadialGradient(W / 2, H / 2, H * .45, W / 2, H / 2, H * 1.05);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(20,10,5,${a})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
// Multiply tint in screen space.
function tint(ctx, col, a) {
  if (a <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = rgba(col, a); ctx.fillRect(0, 0, W, H); ctx.restore();
}
function shakeOff(amt, seed = 0) { return [(noise1(T * 31 + seed) - .5) * amt, (noise1(T * 27 + 40 + seed) - .5) * amt]; }

// Chapter page: the e-book open on a device close-up with Clawd beside it reading through pixel glasses.
// o: dev ('pc' | 'fridge' | 'tv'), chap, title, icon, clawd (fn(lt) → clawd opts), bg, c0, c1, out (fn(ctx, lt) for exit)
function chapterPage(ctx, lt, dur, o) {
  const flip = seg(lt, 0, .45), reveal = seg(lt, .35, Math.min(dur - .3, 1.2));
  insert(ctx, o.dev, {
    bg: o.bg, c0: o.c0 || '#f7d9e2', c1: o.c1 || '#f0bfd0', glowK: o.glowK ?? .5,
    content(ctx, x, y, w, h) {
      // soft pink reader background with hearts
      for (let i = 0; i < 14; i++) { const hx = x + hash(i * 3) * w, hy = y + ((hash(i * 7) * h + T * 20 * (1 + hash(i))) % h); shape(ctx, ptsHeart(hx, hy, 14 + hash(i) * 12), rgba('#ffffff', .4), { ink: null }); }
      const s = Math.min(w / 1250, h / 700);
      book(ctx, x + w * .56, y + h * .5, s, { open: 1, chap: o.chap, title: o.title, icon: o.icon, reveal, flip });
      const c = o.clawd ? o.clawd(lt) : {};
      clawd(ctx, x + w * .13, y + h * .9, 24 * s, { glasses: 1, eyes: 'look', lookX: 1, ...c });
      if (o.extra) o.extra(ctx, x, y, w, h, lt);
    },
  });
}
const CH_BG = { pc: '#cbbba6', fridge: '#e9dcc0', tv: '#cbb3c9' };

function drawFrame(ctx, t) {
  T = t; BOIL = Math.floor(t * 8); LWK = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  const s = SHOTS.find(s => t >= s.t0 && t < s.t1) || SHOTS[SHOTS.length - 1];
  if (!s) return;
  ctx.save(); s.fn(ctx, t, t - s.t0, s.t1 - s.t0); ctx.restore();
}
