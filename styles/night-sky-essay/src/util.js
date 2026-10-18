// util.js: math, easing, deterministic randomness, palette, fonts and text helpers.
// Every frame is a pure function of time t: never use Math.random() or keep state between frames.

const W = 1920, H = 1080;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ease = k => k * k * (3 - 2 * k);
const easeOut = k => 1 - (1 - k) ** 3;
const easeIn = k => k ** 3;
const easeInOut = k => k < .5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2;
const backOut = k => { const c = 1.6; return 1 + (c + 1) * (k - 1) ** 3 + c * (k - 1) ** 2; };
const hash = i => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

// Fonts are local subsets made by tools/fetch-fonts.mjs (fallbacks keep the page usable without them).
const SERIF = '"Noto Serif SC", "Songti SC", "SimSun", serif';
const SANS = '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", "WenQuanYi Zen Hei", sans-serif';

const COL = {
  sky0: '#060914', sky1: '#0c1330', sky2: '#16204a',
  ink: '#f2ebdf', dim: '#9aa3bf', faint: '#5d6688',
  me: '#4f8dff', partner: '#ff9a62', friend: '#4fd1c5',
  warm: '#ffd38a', red: '#ff5d6c',
  phone: '#0f1118', phoneEdge: '#2a2e3d', bubble: '#262a36', header: '#161925',
};

const rgba = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`;
};

// Split text into lines that fit maxW at the current ctx.font (character by character, so CJK wraps anywhere).
function wrap(ctx, text, maxW) {
  const lines = [];
  let cur = '';
  for (const ch of text) {
    if (ch === '\n') { lines.push(cur); cur = ''; continue; }
    if (cur && ctx.measureText(cur + ch).width > maxW) { lines.push(cur); cur = ''; }
    cur += ch;
  }
  lines.push(cur);
  return lines;
}

function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Run fn with the context translated/scaled/faded, then restore.
function withT(ctx, { x = 0, y = 0, s = 1, a = 1 } = {}, fn) {
  if (a <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha *= a; fn(); ctx.restore();
}
