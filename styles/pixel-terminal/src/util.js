// util.js: math, easing, deterministic randomness and text helpers shared by every scene.
// Every frame must be a pure function of time t: never use Math.random() or carry state between frames.

const W = 1920, H = 1080;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ease = k => k * k * (3 - 2 * k);
const easeOut = k => 1 - (1 - k) ** 3;
const easeIn = k => k ** 3;
const backOut = k => { const c = 1.7; return 1 + (c + 1) * (k - 1) ** 3 + c * (k - 1) ** 2; };
const hash = i => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

const FONT_CJK = '"Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", "Noto Sans SC", "WenQuanYi Zen Hei", sans-serif';
const FONT_MONO = 'Consolas, "SF Mono", Menlo, "DejaVu Sans Mono", "WenQuanYi Zen Hei Mono", monospace';

const COL = {
  bg: '#16120f', win: '#2a2420', winHi: '#332b26', edge: '#4d4139', title: '#221d1a',
  text: '#e9ddcb', dim: '#8d8072', faint: '#5c5148',
  kk: '#e5895c', ll: '#5fc4b8', amber: '#e8b04a', red: '#de5a4f', green: '#79c47a',
  eye: '#2a2018', heart: '#ff6f8e', sweat: '#9fd8f0',
};

// Hex colour with alpha (0..1).
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
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
