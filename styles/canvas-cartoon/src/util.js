// util.js: math, easing, deterministic noise and the hand-drawn shape helpers every other file uses.
// Rule: every frame is a pure function of time. Never use Math.random(); use hash(i) instead.

const W = 1920, H = 1080, TAU = Math.PI * 2;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ease = k => k * k * (3 - 2 * k);
const easeOut = k => 1 - (1 - k) ** 3;
const easeIn = k => k ** 3;
const backOut = k => { const c = 2.2; return 1 + (c + 1) * (k - 1) ** 3 + c * (k - 1) ** 2; };
const elastic = k => k <= 0 ? 0 : k >= 1 ? 1 : 1 - Math.cos(k * 9) * Math.exp(-k * 6);
const pulse = (t, a, len) => { const k = (t - a) / len; return k < 0 || k > 1 ? 0 : Math.sin(Math.PI * k); };
const hash = i => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const noise1 = x => { const i = Math.floor(x), f = x - i; return lerp(hash(i), hash(i + 1), ease(f)); };

// Frame globals, set by drawFrame.
let T = 0;        // current time in seconds
let BOIL = 0;     // hand-drawn line "boil": the wobble pattern changes 8 times a second
let LWK = 1;      // line-width factor so outlines keep a steady on-screen weight under camera zoom

const FONT = '"KuaiLe", "WenQuanYi Zen Hei", "Noto Sans CJK SC", "Microsoft YaHei", "PingFang SC", sans-serif';

const C = {
  ink: '#3b2b25', paper: '#fbf6ec',
  clay: '#d97757', clayDk: '#b45a3c', clayLt: '#f2a585', glow: '#ff9a4a',
  skin: '#f6d5b8', skinDk: '#e2b493', hair: '#4a352c', hoodie: '#8aa3c9', hoodieDk: '#6d86ad', pants: '#5d6378',
  pink: '#f59ab5', pinkDk: '#d9668c', cream: '#fff4dc', white: '#ffffff',
  screen: '#20263a', screenLt: '#36405e', metal: '#c9cdd4', metalDk: '#9aa0aa', dark: '#2d2f38',
  wood: '#c99566', woodDk: '#a47149', toast: '#d9a25b', toastDk: '#7a4a24', coffee: '#6b4329',
  red: '#e2574c', green: '#6cc070', blue: '#5aa6e8', yellow: '#f7cf55', purple: '#9a6bd8',
};

const rgba = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`;
};
const mix = (h1, h2, k) => {
  const a = parseInt(h1.slice(1), 16), b = parseInt(h2.slice(1), 16);
  const ch = s => Math.round(lerp(a >> s & 255, b >> s & 255, k));
  return '#' + ((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1);
};

// ---------- point lists ----------
function ptsRect(x, y, w, h, r = 0) {
  r = Math.min(r, w / 2, h / 2);
  if (r <= 0) return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  const p = [], n = 5;
  const corner = (cx, cy, a0) => { for (let i = 0; i <= n; i++) { const a = a0 + i / n * Math.PI / 2; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
  corner(x + w - r, y + r, -Math.PI / 2); corner(x + w - r, y + h - r, 0);
  corner(x + r, y + h - r, Math.PI / 2); corner(x + r, y + r, Math.PI);
  return p;
}
function ptsEll(cx, cy, rx, ry, n = 24, a0 = 0) {
  const p = [];
  for (let i = 0; i < n; i++) { const a = a0 + i / n * TAU; p.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
  return p;
}
function ptsHeart(cx, cy, s, n = 28) {
  const p = [];
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU, hx = 16 * Math.sin(a) ** 3, hy = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a));
    p.push([cx + hx * s / 16, cy + hy * s / 16]);
  }
  return p;
}
function ptsStar(cx, cy, r, n = 5, inner = .45, a0 = -Math.PI / 2) {
  const p = [];
  for (let i = 0; i < n * 2; i++) { const a = a0 + i / (n * 2) * TAU, rr = i % 2 ? r * inner : r; p.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
  return p;
}

// Subdivide long edges so the wobble runs along them, then nudge every point.
function wobble(pts, amt, seed, closed = true) {
  if (amt <= 0) return pts;
  const out = [], step = 26 * LWK, m = closed ? pts.length : pts.length - 1;
  for (let i = 0; i < m; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], d = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.floor(d / step));
    for (let k = 0; k < n; k++) out.push([lerp(a[0], b[0], k / n), lerp(a[1], b[1], k / n)]);
  }
  if (!closed) out.push(pts[pts.length - 1]);
  const s = seed + BOIL * 17.31;
  return out.map((p, i) => [p[0] + (hash(s + i * 3.17) - .5) * 2 * amt, p[1] + (hash(s + i * 5.91 + 40) - .5) * 2 * amt]);
}
function tracePath(ctx, pts, closed) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  if (closed) ctx.closePath();
}

// Filled, ink-outlined, slightly wobbly shape. o: { lw, ink (null for no outline), j (wobble), seed, alpha }
function shape(ctx, pts, fill, o = {}) {
  const lw = (o.lw ?? 4) * LWK, j = (o.j ?? 1.2) * LWK;
  const seed = o.seed ?? (pts.length * 7.7 + Math.round(Math.abs(pts[0][0] - pts[1 % pts.length][0]) + Math.abs(pts[0][1] - pts[2 % pts.length][1])) * .37);
  const p = wobble(pts, j, seed, true);
  if (o.alpha != null) { ctx.save(); ctx.globalAlpha *= o.alpha; }
  tracePath(ctx, p, true);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (o.ink !== null && lw > 0) { ctx.strokeStyle = o.ink || C.ink; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.stroke(); }
  if (o.alpha != null) ctx.restore();
}
// Open ink line.
function line(ctx, pts, o = {}) {
  const lw = (o.lw ?? 4) * LWK, j = (o.j ?? 1) * LWK;
  const p = wobble(pts, j, o.seed ?? pts.length * 3.3, false);
  tracePath(ctx, p, false);
  ctx.strokeStyle = o.col || C.ink; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
}
// Smooth arc helper for curves (quadratic through a control point), returned as points.
function ptsQuad(a, c, b, n = 12) {
  const p = [];
  for (let i = 0; i <= n; i++) { const k = i / n; p.push([(1 - k) ** 2 * a[0] + 2 * (1 - k) * k * c[0] + k * k * b[0], (1 - k) ** 2 * a[1] + 2 * (1 - k) * k * c[1] + k * k * b[1]]); }
  return p;
}
function dot(ctx, x, y, r, col) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = col; ctx.fill(); }

// Soft additive glow.
function glow(ctx, x, y, r, col, a = 1) {
  if (a <= 0.003 || r <= 0) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(col, .55 * a)); g.addColorStop(.45, rgba(col, .22 * a)); g.addColorStop(1, rgba(col, 0));
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, 2 * r, 2 * r); ctx.restore();
}
// The orange "Clawd is driving this" halo around a device box.
function halo(ctx, x, y, w, h, a) {
  if (a <= .01) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const pad = 18 * LWK;
  for (let i = 3; i >= 1; i--) {
    ctx.strokeStyle = rgba(C.glow, .16 * a * (4 - i) / 3);
    ctx.lineWidth = pad * i * .55;
    ctx.beginPath(); ctx.roundRect(x - 4 * LWK, y - 4 * LWK, w + 8 * LWK, h + 8 * LWK, 14 * LWK); ctx.stroke();
  }
  ctx.restore();
  glow(ctx, x + w / 2, y + h / 2, Math.max(w, h) * .9, C.glow, .35 * a);
}

// Text with optional ink outline.
function text(ctx, s, x, y, size, col, o = {}) {
  ctx.save();
  ctx.font = `${o.weight || ''} ${size}px ${o.font || FONT}`;
  ctx.textAlign = o.align || 'center'; ctx.textBaseline = o.base || 'middle';
  if (o.alpha != null) ctx.globalAlpha *= o.alpha;
  if (o.rot) { ctx.translate(x, y); ctx.rotate(o.rot); x = 0; y = 0; }
  if (o.outline) { ctx.lineWidth = o.outline; ctx.strokeStyle = o.outCol || C.ink; ctx.lineJoin = 'round'; ctx.strokeText(s, x, y); }
  ctx.fillStyle = col; ctx.fillText(s, x, y);
  ctx.restore();
}

// Music note glyph drawn as shapes.
function note(ctx, x, y, s, col, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  shape(ctx, ptsEll(0, 0, s * .55, s * .42, 14, -.4), col, { lw: 3, j: .4 });
  line(ctx, [[s * .5, -s * .05], [s * .5, -s * 1.6], [s * 1.1, -s * 1.2]], { lw: 4, j: .3 });
  ctx.restore();
}
