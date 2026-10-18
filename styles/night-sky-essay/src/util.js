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
  bg0: '#050505', bg1: '#0b0b0b', bg2: '#131312',     // near-black with a warm grey lift in the middle
  ink: '#ece6da', dim: '#8a857c', faint: '#4a4741',
  me: '#ece4d6', meText: '#1a1814',                     // my bubbles: warm white, glowing
  them: '#29292b', themText: '#d8d3ca',                 // their bubbles: dark grey
  warm: '#f3d9a6', line: 'rgba(236,230,218,.12)',
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
