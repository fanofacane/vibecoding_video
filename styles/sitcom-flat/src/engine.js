// engine.js: canvas, timing helpers and the flat sitcom-style building blocks (sky, clouds, petals, logos, text, bubbles).
// Every frame is a pure function of t: no state carries between frames, no Math.random().
const W = 1920, H = 1080, TAU = Math.PI * 2;

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, x) => a + (b - a) * x;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const easeOut = x => 1 - Math.pow(1 - clamp(x), 3);
const backOut = x => { x = clamp(x); const s = 2.2; return 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2); };
const hash = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

const C = {
  skyTop: '#5BAEF0', skyBot: '#D8EDFC', cloud: '#FFFFFF', cloudShade: '#D9E8F6',
  pink: '#F2558C', pinkDk: '#BE2C68', petal: '#F8A9C4', petalDk: '#EE7FA6',
  ink: '#1E1E24', grey: '#8A8F99', paper: '#F2EFEA', userBlue: '#2F6BFF'
};
const FONT = (px, w = 900) => `${w} ${px}px "Noto Sans SC", "WenQuanYi Zen Hei", sans-serif`;

let ctx = null;

function mix(a, b, k) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16), c = i => Math.round(lerp((pa >> i) & 255, (pb >> i) & 255, clamp(k)));
  return '#' + ((1 << 24) + (c(16) << 16) + (c(8) << 8) + c(0)).toString(16).slice(1);
}

// ---------- backgrounds ----------
function sky(top = C.skyTop, bot = C.skyBot) {
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, top); g.addColorStop(1, bot);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
const PUFFS = [[0, 0, 1], [-.95, .2, .68], [.95, .22, .72], [-.45, -.42, .74], [.42, -.5, .8], [1.65, .38, .46], [-1.65, .4, .44]];
function cloud(x, y, r, shade = C.cloudShade, body = C.cloud) {
  for (const [col, dy] of [[shade, r * .14], [body, 0]]) {
    ctx.fillStyle = col; ctx.beginPath();
    for (const [px, py, pr] of PUFFS) { ctx.moveTo(x + px * r + pr * r, y + py * r + dy); ctx.arc(x + px * r, y + py * r + dy, pr * r, 0, TAU); }
    ctx.fill();
  }
}
// Drifting clouds plus a cloud bank along the bottom.
function cloudLayer(t, n = 7, seed = 0, bank = true) {
  for (let i = 0; i < n; i++) {
    const r = 70 + hash(i + seed) * 70, span = W + 600, x = ((hash(i * 3 + seed) * span + t * (14 + hash(i + 9) * 18)) % span) - 300;
    cloud(x, 120 + hash(i * 7 + seed) * 520, r);
  }
  if (bank) for (let i = 0; i < 14; i++) cloud(i * 150 - 40 + Math.sin(i * 1.7) * 30, H - 10 + Math.sin(i * 2.3) * 18, 90 + hash(i + 40) * 40);
}
// Cartoon city: pale buildings with window grids, tinted with `tint`.
function city(tint, t = 0) {
  const base = mix(tint, '#FFFFFF', .55), win = mix(tint, '#FFFFFF', .82);
  for (let i = 0; i < 9; i++) {
    const w = 190 + hash(i + 3) * 120, h = 420 + hash(i + 11) * 420, x = i * 230 - 60 + hash(i) * 40, y = H - h;
    ctx.fillStyle = base; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = win;
    for (let gx = x + 22; gx < x + w - 40; gx += 52) for (let gy = y + 26; gy < H; gy += 58) ctx.fillRect(gx, gy, 34, 38);
  }
}

// ---------- sakura petals ----------
function petal(x, y, s, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s * (.6 + .4 * Math.abs(Math.cos(rot * 1.3))));
  const g = ctx.createLinearGradient(0, -1, 0, 1); g.addColorStop(0, C.petal); g.addColorStop(1, C.petalDk);
  ctx.fillStyle = g; ctx.beginPath();
  ctx.moveTo(0, 1); ctx.bezierCurveTo(-1.1, .3, -.8, -.9, -.15, -.95); ctx.lineTo(0, -.75); ctx.lineTo(.15, -.95); ctx.bezierCurveTo(.8, -.9, 1.1, .3, 0, 1);
  ctx.fill(); ctx.restore();
}
function petals(t, n = 46, alpha = 1) {
  ctx.save(); ctx.globalAlpha = alpha;
  for (let i = 0; i < n; i++) {
    const near = hash(i + 5) > .86, s = near ? 34 + hash(i) * 22 : 9 + hash(i + 1) * 15, vy = 70 + hash(i + 2) * 90 + (near ? 80 : 0);
    const period = (H + 300) / vy, y = (((t + hash(i + 3) * period) % period) * vy) - 150;
    const x = (hash(i + 4) * (W + 500)) - y * .3 + Math.sin(t * 1.1 + i) * 40;
    if (near) ctx.filter = 'blur(5px)';
    petal(x, y, s, t * (hash(i + 6) * 3 - 1.5) + i);
    if (near) ctx.filter = 'none';
  }
  ctx.restore();
}

// ---------- logos ----------
// Brand logo centred at (x, y), `size` px wide. Colours follow each brand's usual mark.
function logo(key, x, y, size, o = {}) {
  const L = LOGOS[key], s = size / 24;
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.scale(o.k ?? 1, o.k ?? 1); ctx.globalAlpha = o.alpha ?? 1;
  ctx.translate(-size / 2, -size / 2); ctx.scale(s, s);
  if (o.shadow !== false) { ctx.shadowColor = 'rgba(30,40,80,.18)'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 1.2 / s * size / 24; }
  for (const [d, col] of L.paths) {
    const p = new Path2D(d);
    let fill = col || o.ink || C.ink;
    if (key === 'gemini') {
      const g = ctx.createConicGradient(-Math.PI / 4, 12, 12);
      g.addColorStop(0, '#4285F4'); g.addColorStop(.3, '#4285F4'); g.addColorStop(.42, '#EA4335'); g.addColorStop(.55, '#FBBC04');
      g.addColorStop(.75, '#34A853'); g.addColorStop(.9, '#4285F4'); g.addColorStop(1, '#4285F4'); fill = g;
    }
    ctx.fillStyle = fill; ctx.fill(p, L.rule);
  }
  ctx.restore();
}

// ---------- text ----------
// Chunky title text with a darker extruded underside and a white rim.
function chunky(txt, x, y, px, col, dk, o = {}) {
  ctx.save(); ctx.translate(x, y); const k = o.k ?? 1; ctx.scale(k, k); ctx.globalAlpha = o.alpha ?? 1;
  ctx.font = FONT(px); ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.lineWidth = px * .12; ctx.strokeStyle = '#FFFFFF'; ctx.strokeText(txt, 0, px * .06);
  ctx.fillStyle = dk; for (let d = px * .06; d > 0; d -= 2) ctx.fillText(txt, 0, d);
  ctx.fillStyle = col; ctx.fillText(txt, 0, 0);
  ctx.restore();
}
function text(txt, x, y, px, col, o = {}) {
  ctx.save(); ctx.font = FONT(px, o.weight || 900); ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle'; ctx.globalAlpha = o.alpha ?? 1;
  ctx.fillStyle = col; ctx.fillText(txt, x, y); ctx.restore();
}
function textW(txt, px, w = 900) { ctx.save(); ctx.font = FONT(px, w); const m = ctx.measureText(txt).width; ctx.restore(); return m; }

// ---------- chat ----------
function rrect(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
// side: 'user' (right, blue) or 'ai' (left, white with a brand-coloured rim). k: pop-in progress 0..1.
function bubble(txt, side, y, col, k = 1, x0 = null) {
  if (k <= 0) return;
  const px = 58, pad = 34, w = textW(txt, px, 800) + pad * 2, h = px + pad * 1.4;
  const x = x0 ?? (side === 'user' ? W - 120 - w : 560);
  ctx.save(); ctx.translate(x + (side === 'user' ? w : 0), y + h / 2); ctx.scale(backOut(k), backOut(k)); ctx.translate(-(x + (side === 'user' ? w : 0)), -(y + h / 2));
  ctx.shadowColor = 'rgba(0,0,0,.12)'; ctx.shadowOffsetY = 6;
  rrect(x, y, w, h, 26); ctx.fillStyle = side === 'user' ? C.userBlue : '#FFFFFF'; ctx.fill();
  ctx.shadowColor = 'transparent';
  if (side !== 'user') { ctx.lineWidth = 5; ctx.strokeStyle = col; ctx.stroke(); }
  text(txt, x + w / 2, y + h / 2 + 2, px, side === 'user' ? '#FFFFFF' : C.ink, { weight: 800 });
  ctx.restore();
}
function typingDots(x, y, col, t) {
  rrect(x, y, 150, 86, 26); ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = col; ctx.stroke();
  for (let i = 0; i < 3; i++) { ctx.fillStyle = C.grey; ctx.beginPath(); ctx.arc(x + 45 + i * 30, y + 43 - Math.max(0, Math.sin(t * 9 - i * .9)) * 10, 9, 0, TAU); ctx.fill(); }
}
// Small black counter pill (top-left), e.g. 今日已重做 ×20,001.
function counterPill(label, n, k = 1) {
  if (k <= 0) return;
  ctx.save(); ctx.translate(60, 50); ctx.scale(backOut(k), backOut(k));
  rrect(0, 0, 420, 70, 35); ctx.fillStyle = '#16161A'; ctx.fill();
  text(label, 34, 36, 32, '#FFFFFF', { align: 'left' }); text('×' + n.toLocaleString('en-US'), 390, 36, 30, '#F7C948', { align: 'right' });
  ctx.restore();
}
