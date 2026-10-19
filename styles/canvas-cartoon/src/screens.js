// screens.js: full-frame close-ups of a device ("inserts") and everything shown on screens:
// the pink e-book 《爱的说明书》, search box, letter editor, volume, incoming call, alarm, paper with a heart.
// Everything here is in screen space (1920 × 1080).

// Draw a device close-up. Returns the screen rectangle [x, y, w, h] for content.
// kind: 'pc' | 'phone' | 'fridge' | 'tv' | 'tablet'.  o.bg: wall colour behind, o.tilt, o.z (push-in), o.glowK (orange halo)
function insert(ctx, kind, o = {}) {
  ctx.fillStyle = o.bg || '#d9cbb8'; ctx.fillRect(0, 0, W, H);
  if (o.bgFn) o.bgFn(ctx);
  ctx.save();
  const z = o.z || 1, cx = W / 2 + (o.dx || 0), cy = H / 2 + (o.dy || 0);
  ctx.translate(cx, cy); ctx.scale(z, z); if (o.tilt) ctx.rotate(o.tilt); ctx.translate(-W / 2, -H / 2);
  let r;
  if (kind === 'pc') {
    shape(ctx, ptsRect(860, 990, 200, 120, 10), C.metalDk, { lw: 6 });
    shape(ctx, ptsRect(110, 40, 1700, 960, 34), C.dark, { lw: 7, j: 2 });
    r = [150, 78, 1620, 884];
  } else if (kind === 'phone') {
    shape(ctx, ptsRect(610, 20, 700, 1180, 80), '#2b2d36', { lw: 7, j: 2 });
    r = [646, 70, 628, 1080];
    shape(ctx, ptsRect(900, 36, 120, 22, 11), '#121318', { ink: null });
  } else if (kind === 'fridge') {
    ctx.fillStyle = '#eef2f5'; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 9; i++) line(ctx, [[i * 260 - 100, 0], [i * 260 + 200, H]], { lw: 30, col: rgba('#ffffff', .5), j: 0 });
    shape(ctx, ptsRect(1700, 120, 70, 840, 30), C.metalDk, { lw: 6 });
    shape(ctx, ptsRect(190, 120, 1360, 820, 40), '#c7ced6', { lw: 6 });
    r = [230, 160, 1280, 740];
  } else if (kind === 'tv') {
    shape(ctx, ptsRect(60, 50, 1800, 930, 18), '#1d1e25', { lw: 7, j: 2 });
    r = [96, 84, 1728, 862];
    shape(ctx, ptsRect(880, 990, 160, 30, 8), '#444', { lw: 5 });
  } else if (kind === 'tablet') {
    shape(ctx, ptsRect(170, 70, 1580, 940, 60), '#33353f', { lw: 7, j: 2 });
    r = [240, 130, 1440, 820];
  }
  if (o.glowK) { const lk = LWK; halo(ctx, r[0] - 30, r[1] - 30, r[2] + 60, r[3] + 60, o.glowK); LWK = lk; }
  ctx.save(); ctx.beginPath(); ctx.rect(...r); ctx.clip();
  const g = ctx.createLinearGradient(0, r[1], 0, r[1] + r[3]);
  g.addColorStop(0, o.c0 || '#2a3358'); g.addColorStop(1, o.c1 || '#3e4c80');
  ctx.fillStyle = g; ctx.fillRect(...r);
  if (o.content) o.content(ctx, ...r);
  // glass sheen
  ctx.fillStyle = 'rgba(255,255,255,.045)';
  ctx.beginPath(); ctx.moveTo(r[0], r[1] + r[3] * .55); ctx.lineTo(r[0] + r[2] * .42, r[1]); ctx.lineTo(r[0] + r[2] * .6, r[1]); ctx.lineTo(r[0], r[1] + r[3]); ctx.fill();
  ctx.restore();
  if (o.over) o.over(ctx, ...r);
  ctx.restore();
  return r;
}

// Desktop wallpaper + taskbar.
function desktop(ctx, x, y, w, h, o = {}) {
  const k = w / 1620;
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, o.c0 || '#1c2546'); g.addColorStop(1, o.c1 || '#2f2a55');
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  for (let i = 0; i < 4; i++) shape(ctx, ptsRect(x + 50 * k, y + (50 + i * 120) * k, 80 * k, 80 * k, 16 * k), rgba('#ffffff', .12), { ink: null });
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(x, y + h - 56 * k, w, 56 * k);
  text(ctx, '23:47', x + w - 80 * k, y + h - 28 * k, 26 * k, rgba('#ffffff', .8));
}

function searchBox(ctx, cx, cy, s, typed, caret, press) {
  const w = 900 * s, h = 110 * s;
  shape(ctx, ptsRect(cx - w / 2, cy - h / 2, w, h, h / 2), press ? '#fff3e0' : C.white, { lw: 6 });
  shape(ctx, ptsEll(cx - w / 2 + 62 * s, cy - 4 * s, 22 * s, 22 * s, 18), null, { lw: 6 });
  line(ctx, [[cx - w / 2 + 78 * s, cy + 12 * s], [cx - w / 2 + 96 * s, cy + 30 * s]], { lw: 7 });
  ctx.save(); ctx.font = `${56 * s}px ${FONT}`; const tw = ctx.measureText(typed).width; ctx.restore();
  text(ctx, typed, cx - w / 2 + 120 * s, cy + 3 * s, 56 * s, C.ink, { align: 'left' });
  if (caret && (T * 2.4 % 1) < .55) { ctx.fillStyle = C.ink; ctx.fillRect(cx - w / 2 + 124 * s + tw, cy - 30 * s, 5 * s, 60 * s); }
}

// The pink e-book. open: 0 closed cover, 1 open spread. title: right page text. chap: left page heading.
// flip: 0..1 a page turning over (right → left). s: scale.  (cx, cy) centre of the closed book / spread.
function book(ctx, cx, cy, s, o = {}) {
  const open = clamp(o.open ?? 1), pw = 380 * s, ph = 500 * s;
  ctx.save(); ctx.translate(cx, cy);
  if (o.rot) ctx.rotate(o.rot);
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(0, ph / 2 + 24 * s, pw * (1 + open) * .9, 22 * s, 0, 0, TAU); ctx.fill();
  if (open < 1) {
    // cover rotating open around the spine (left edge), showing the first page under it
    if (open > 0) pageSpread(ctx, 0, pw, ph, s, o, true);
    const k = Math.cos(open * Math.PI);           // 1 → -1
    ctx.save(); ctx.scale(k, 1);
    if (k > 0) cover(ctx, pw, ph, s, o);
    else { shape(ctx, ptsRect(0, -ph / 2, pw, ph, 14 * s), '#f2b9cb', { lw: 6 * s }); }
    ctx.restore();
  } else pageSpread(ctx, 0, pw, ph, s, o, false);
  ctx.restore();
}
function cover(ctx, pw, ph, s, o) {
  shape(ctx, ptsRect(0, -ph / 2, pw, ph, 16 * s), C.pink, { lw: 6 * s, j: 1.5 });
  shape(ctx, ptsRect(0, -ph / 2, 34 * s, ph, 8 * s), C.pinkDk, { lw: 5 * s });
  ctx.save(); ctx.translate(pw * .55, -ph * .08); ctx.rotate(-.18);
  shape(ctx, ptsHeart(0, 0, 110 * s), '#fff0f4', { lw: 6 * s, j: 3 });
  shape(ctx, ptsHeart(-6 * s, 4 * s, 70 * s), C.pinkDk, { lw: 4 * s, j: 3 });
  ctx.restore();
  text(ctx, '爱的说明书', pw * .56, ph * .3, 52 * s, '#fff', { outline: 9 * s, outCol: C.pinkDk });
  text(ctx, 'LOVE MANUAL', pw * .56, ph * .4, 22 * s, '#fff', { alpha: .85 });
}
function pageSpread(ctx, x, pw, ph, s, o, under) {
  shape(ctx, ptsRect(-pw - 14 * s, -ph / 2 - 10 * s, pw * 2 + 28 * s, ph + 20 * s, 18 * s), C.pinkDk, { lw: 6 * s });
  for (const side of [-1, 1]) {
    shape(ctx, ptsRect(side < 0 ? -pw : 0, -ph / 2, pw, ph, 8 * s), '#fffaf2', { lw: 5 * s });
    for (let i = 0; i < 11; i++) line(ctx, [[(side < 0 ? -pw : 0) + 30 * s, -ph / 2 + 70 * s + i * 38 * s], [(side < 0 ? 0 : pw) - 30 * s, -ph / 2 + 70 * s + i * 38 * s]], { lw: 1.6 * s, col: rgba('#e9a6b8', .45), j: 0 });
  }
  line(ctx, [[0, -ph / 2], [0, ph / 2]], { lw: 5 * s });
  if (under) return;
  const chap = o.chap, title = o.title, k = clamp(o.reveal ?? 1);
  if (chap) {
    text(ctx, chap, -pw / 2, -ph * .18, 78 * s, C.pinkDk, { alpha: k });
    if (o.icon) { ctx.save(); ctx.globalAlpha *= k; o.icon(ctx, -pw / 2, ph * .16, 90 * s); ctx.restore(); }
  }
  if (title) {
    // write the title on line by line, character by character
    const lines = title.split('\n'), n = [...title.replace(/\n/g, '')].length;
    let shown = Math.floor(k * n + .001);
    lines.forEach((ln, i) => {
      const chars = [...ln], vis = chars.slice(0, Math.max(0, shown)).join(''); shown -= chars.length;
      text(ctx, vis, -0 + 36 * s, -ph * .16 + i * 86 * s, 62 * s, C.ink, { align: 'left' });
    });
  }
  // a page in mid-turn
  if (o.flip > 0 && o.flip < 1) {
    const k2 = Math.cos(o.flip * Math.PI);
    ctx.save(); ctx.scale(k2, 1);
    shape(ctx, ptsRect(0, -ph / 2, pw, ph, 8 * s), k2 > 0 ? '#fffaf2' : '#f7ede0', { lw: 5 * s });
    ctx.restore();
  }
}

// Small chapter doodles for the left page.
const ICONS = {
  alarm(ctx, x, y, s) { shape(ctx, ptsEll(x, y, s * .45, s * .45, 22), C.yellow, { lw: 5 }); line(ctx, [[x, y], [x, y - s * .28], [x + s * .2, y - s * .05]], { lw: 5 }); shape(ctx, ptsEll(x - s * .38, y - s * .42, s * .14, s * .1, 10), C.red, { lw: 4 }); shape(ctx, ptsEll(x + s * .38, y - s * .42, s * .14, s * .1, 10), C.red, { lw: 4 }); },
  toast(ctx, x, y, s) { toastShape(ctx, x, y, s * .9, 0, true); },
  letter(ctx, x, y, s) { shape(ctx, ptsRect(x - s * .55, y - s * .35, s * 1.1, s * .7, 6), C.white, { lw: 5 }); line(ctx, [[x - s * .55, y - s * .35], [x, y + s * .05], [x + s * .55, y - s * .35]], { lw: 5 }); shape(ctx, ptsHeart(x, y + s * .12, s * .16), C.pinkDk, { lw: 3 }); },
  music(ctx, x, y, s) { note(ctx, x - s * .3, y + s * .2, s * .32, C.purple); note(ctx, x + s * .25, y + s * .05, s * .26, C.pinkDk, .2); },
  hug(ctx, x, y, s) { shape(ctx, ptsHeart(x, y, s * .45), C.pink, { lw: 5 }); line(ctx, ptsQuad([x - s * .6, y - s * .1], [x - s * .7, y + s * .5], [x - s * .1, y + s * .45], 8), { lw: 6, col: C.clay }); line(ctx, ptsQuad([x + s * .6, y - s * .1], [x + s * .7, y + s * .5], [x + s * .1, y + s * .45], 8), { lw: 6, col: C.clay }); },
};

// Toast slice. burnt: dark crust with a heart-shaped scorch in the middle. bite: 0..1 bite missing top-right.
function toastShape(ctx, x, y, s, rot = 0, heart = false, bite = 0, burnt = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const p = [];
  for (let i = 0; i <= 12; i++) { const a = Math.PI + i / 12 * Math.PI; p.push([Math.cos(a) * s * .55, -s * .15 + Math.sin(a) * s * .32]); }
  p.push([s * .48, s * .45], [-s * .48, s * .45]);
  shape(ctx, p, mix(C.toast, C.toastDk, burnt * .6), { lw: 4.5, j: .6 });
  const q = p.map(([a, b]) => [a * .78, b * .8 + s * .03]);
  shape(ctx, q, mix('#f4d49a', '#8a5a2c', burnt * .7), { ink: null, j: .6 });
  if (heart) shape(ctx, ptsHeart(0, s * .05, s * .24), '#5a3218', { ink: null, j: s * .012 });
  if (bite > 0) {
    ctx.save(); ctx.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(s * (.42 - i * .14), -s * (.42 - i * .1), s * .14 * bite, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  ctx.restore();
}

// Paper sheet (world or screen). heart: draw Clawd's crayon heart.
function paperSheet(ctx, x, y, w, rot, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(o.sx ?? 1, 1); if (o.alpha != null) ctx.globalAlpha *= o.alpha;
  const h = w * 1.3;
  shape(ctx, ptsRect(-w / 2, -h / 2, w, h, 2), o.col || C.paper, { lw: o.lw ?? 3, j: o.j ?? .5 });
  if (o.lines !== false) for (let i = 0; i < 5; i++) line(ctx, [[-w * .36, -h * .32 + i * h * .13], [w * (.36 - (i % 3) * .12), -h * .32 + i * h * .13]], { lw: (o.lw ?? 3) * .6, col: rgba(C.ink, .3), j: 0 });
  ctx.restore();
}

// Volume bar UI (phone close-up).
function volumeUI(ctx, x, y, w, h, level, max = 10) {
  const bx = x + w * .12, by = y + h * .12, bw = w * .76, bh = 90;
  shape(ctx, ptsRect(bx, by, bw, bh, 40), rgba('#000000', .45), { ink: null });
  text(ctx, '🔊', bx + 54, by + bh / 2, 42, C.white);
  for (let i = 0; i < max; i++) {
    const on = i < level;
    shape(ctx, ptsRect(bx + 110 + i * ((bw - 150) / max), by + 26, (bw - 150) / max - 8, 38, 8), on ? C.glow : rgba('#ffffff', .25), { ink: null });
  }
}

// Incoming call / in-call / ended. st: 'ring' | 'talk' | 'ended'; secs: call timer
function callUI(ctx, x, y, w, h, st, o = {}) {
  const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#3a2a48'); g.addColorStop(1, '#1b1a2a');
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  const cx = x + w / 2;
  text(ctx, st === 'ring' ? '来电' : st === 'talk' ? `通话中 00:0${Math.floor(o.secs || 0)}` : '通话已结束', cx, y + 110, 40, rgba('#ffffff', .8));
  // angry neighbour avatar
  const ay = y + 300, pulseK = st === 'ring' ? 1 + .06 * Math.sin(T * 18) : 1;
  ctx.save(); ctx.translate(cx, ay); ctx.scale(pulseK, pulseK);
  if (st === 'ring') for (let i = 0; i < 3; i++) { const k = (T * 1.2 + i / 3) % 1; ctx.beginPath(); ctx.arc(0, 0, 130 + k * 120, 0, TAU); ctx.strokeStyle = rgba('#ffffff', .35 * (1 - k)); ctx.lineWidth = 4; ctx.stroke(); }
  shape(ctx, ptsEll(0, 0, 125, 125, 30), '#e46a5a', { lw: 7 });
  line(ctx, [[-70, -34], [-24, -14]], { lw: 9 }); line(ctx, [[70, -34], [24, -14]], { lw: 9 });
  dot(ctx, -44, 6, 10, C.ink); dot(ctx, 44, 6, 10, C.ink);
  line(ctx, ptsQuad([-44, 70], [0, 40], [44, 70], 8), { lw: 8 });
  for (const sx of [-1, 1]) { const k = (T * 2 + (sx > 0 ? .5 : 0)) % 1; ctx.save(); ctx.globalAlpha *= 1 - k; shape(ctx, ptsEll(sx * 120, -110 - k * 60, 26 + k * 20, 18 + k * 12, 14), '#f0f0f0', { lw: 4 }); ctx.restore(); }
  ctx.restore();
  text(ctx, '楼下邻居', cx, ay + 200, 58, C.white);
  text(ctx, '302 室', cx, ay + 262, 34, rgba('#ffffff', .6));
  if (st === 'ring') {
    const pr = o.press || 0;
    shape(ctx, ptsEll(cx - 160, y + h - 170, 70, 70, 26), C.red, { lw: 6 });
    shape(ctx, ptsEll(cx + 160, y + h - 170, 70 * (1 - pr * .12), 70 * (1 - pr * .12), 26), C.green, { lw: 6 });
    text(ctx, '✆', cx - 160, y + h - 170, 64, C.white, { rot: 2.4 }); text(ctx, '✆', cx + 160, y + h - 170, 64, C.white);
  } else if (st === 'ended') {
    shape(ctx, ptsEll(cx, y + h - 170, 70, 70, 26), '#777', { lw: 6 });
    text(ctx, '✆', cx, y + h - 170, 64, C.white, { rot: 2.4 });
  }
}

// Alarm UI for the phone close-up. mins: minutes past 7:00 (0..30).
function alarmUI(ctx, x, y, w, h, mins, glowK = 0) {
  const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#2c2440'); g.addColorStop(1, '#4a3550');
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  const cx = x + w / 2;
  text(ctx, '闹钟', cx, y + 120, 44, rgba('#ffffff', .75));
  const m = Math.round(mins), tStr = `7:${String(m).padStart(2, '0')}`;
  text(ctx, tStr, cx, y + 360, 190, '#ffe9c4');
  if (glowK > 0) glow(ctx, cx, y + 360, 260, C.glow, glowK * .5);
  text(ctx, '明天 · 周六', cx, y + 500, 40, rgba('#ffffff', .6));
  shape(ctx, ptsRect(cx - 70, y + 580, 140, 70, 35), C.green, { lw: 5 });
  shape(ctx, ptsEll(cx + 32, y + 615, 26, 26, 18), C.white, { lw: 4 });
}
