// world.js: the one apartment (bedroom | kitchen | living room) as a dollhouse cut-away, every smart device,
// the camera, colour grading and Clawd's Wi-Fi hop between screens.
//
// drawWorld(ctx, S) draws one frame of the apartment from a state object S built by a shot:
//   S.cam {x, y, z}            world point at the frame centre and zoom (1 = room height fills the frame)
//   S.sky 'night'|'day'|'evening'
//   S.grade {col, amt}         multiply tint over everything except light sources (time of day / mood)
//   S.lamps {b, k, l}          ceiling lamp level 0..1 per room; S.lampCol overrides the light colour
//   S.curt {b, l}              curtain openness 0..1 (bedroom, living room)
//   S.dev[name]                per-device state: { on, glow, scr(ctx,x,y,w,h), clawd:{s, ...clawdOpts}, ... }
//   S.phone {x, y, w, h, rot}  where the phone is this shot (default: bedroom nightstand dock)
//   S.under / S.human / S.over / S.emit (ctx)   shot-specific drawing hooks (world space)
//   S.hops                     result of route(): Clawd's hop arcs in flight
//   S.post(ctx)                screen-space hook after everything (flashes, captions)

const FLOOR = 920, CEIL = 50, WORLD_W = 4800;
const ROOMS = [
  { id: 'b', x0: 0, x1: 1500, wall: '#dfe3ee', trim: '#c4cadb', pattern: 'dots' },
  { id: 'k', x0: 1500, x1: 2900, wall: '#f3e6c9', trim: '#e0cfa9', pattern: 'tiles' },
  { id: 'l', x0: 2900, x1: 4800, wall: '#ecdcc8', trim: '#d9c4aa', pattern: 'stripes' },
];
const LAMPS = { b: [700], k: [2150], l: [3420, 4180] };

// Screen rectangles (world space) of every device Clawd can live in. The phone is filled in per frame.
const SCR = {
  speakerB: [1124, 712, 46, 22], curtainSw: [941, 482, 38, 30], lampB: [648, 66, 104, 26],
  fridge: [2636, 452, 128, 100], toaster: [1716, 650, 40, 22], coffee: [1898, 560, 74, 34], micro: [2226, 600, 54, 30],
  pc: [3082, 466, 216, 150], printer: [3552, 690, 40, 24], ac: [4004, 112, 52, 28], tablet: [3858, 786, 76, 54],
  tv: [4342, 572, 216, 142], speakerL: [4282, 712, 40, 20], lampL: [4128, 66, 104, 26],
};
const PHONE_SPOTS = {
  night: { x: 1064, y: 690, w: 44, h: 84, rot: -.08 },
  table: { x: 4040, y: 788, w: 32, h: 58, rot: .12 },
  floor: { x: 3930, y: 868, w: 36, h: 62, rot: -.25 },
};

function screenOf(S, name) {
  if (name === 'phone') { const p = S.phone; return [p.x + p.w * .1, p.y + p.h * .1, p.w * .8, p.h * .78]; }
  return SCR[name];
}

// ---------------------------------------------------------------- camera
function applyCam(ctx, cam) {
  const z = cam.z;
  ctx.translate(W / 2, H / 2);
  ctx.scale(z, z);
  ctx.translate(-cam.x, -cam.y);
  LWK = Math.pow(z, -.6);
}
// Camera that frames a world rectangle (x, y, w, h).
const frameRect = (x, y, w, h) => ({ x: x + w / 2, y: y + h / 2, z: Math.min(W / w, H / h) });
const camLerp = (a, b, k) => ({ x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: Math.exp(lerp(Math.log(a.z), Math.log(b.z), k)) });
const camShake = (c, amt, seed = 0) => ({ ...c, x: c.x + (noise1(T * 23 + seed) - .5) * amt / c.z, y: c.y + (noise1(T * 19 + 50 + seed) - .5) * amt / c.z });

// ---------------------------------------------------------------- Clawd routing between devices
// route(t, start, [[t0, dev], ...]): Clawd starts in `start`, hops to each dev at t0 (arrives HOP later).
const HOP = .5;
function route(t, start, hops) {
  let cur = start, s = 1, from = null, k = 0, fx = null;
  for (const [t0, to] of hops) {
    if (t < t0) break;
    if (t < t0 + HOP) { k = (t - t0) / HOP; fx = { from: cur, to, k }; break; }
    cur = to;
  }
  const scale = {};
  if (fx) {
    scale[fx.from] = 1 - easeIn(seg(fx.k, 0, .25));
    scale[fx.to] = backOut(seg(fx.k, .72, 1));
  } else {
    scale[cur] = 1;
    const last = hops.filter(h => h[0] <= t).pop();
    if (last) scale[cur] = backOut(seg(t - last[0], HOP * .72, HOP));
  }
  return { cur: fx ? fx.to : cur, scale, fx };
}
// Merge a route into S.dev (sets clawd scale and an orange glow on the device it is in).
function useRoute(S, R, opts = {}) {
  S.hops = R.fx ? [R.fx] : [];
  for (const [name, s] of Object.entries(R.scale)) {
    const d = S.dev[name] = S.dev[name] || {};
    d.clawd = { ...(opts[name] || opts.all || {}), ...(d.clawd || {}), s };
    d.on = d.on ?? true;
    d.glow = Math.max(d.glow || 0, s * (opts.glow ?? 1));
  }
}

// The hop: Clawd shrinks into a spark, rides a glowing Wi-Fi arc and pops open in the next screen.
function drawHop(ctx, S, h) {
  const a = screenOf(S, h.from), b = screenOf(S, h.to);
  if (!a || !b) return;
  const A = [a[0] + a[2] / 2, a[1] + a[3] / 2], B = [b[0] + b[2] / 2, b[1] + b[3] / 2];
  const dist = Math.hypot(B[0] - A[0], B[1] - A[1]);
  const Cp = [(A[0] + B[0]) / 2, Math.min(A[1], B[1]) - Math.max(120, dist * .35)];
  const k = seg(h.k, .15, .8), path = ptsQuad(A, Cp, B, 40);
  const at = q => { const i = q * 40, i0 = Math.floor(clamp(i, 0, 39)); return [lerp(path[i0][0], path[i0 + 1][0], i - i0), lerp(path[i0][1], path[i0 + 1][1], i - i0)]; };
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; if (h.soft) ctx.globalAlpha = .45;
  // the arc itself (dashed, fading behind the spark)
  const tail = Math.max(0, k - .55), headK = Math.min(1, k + .02);
  ctx.setLineDash([14 * LWK, 12 * LWK]); ctx.lineDashOffset = -T * 120;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let q = tail; q <= headK; q += .02) { const p = at(Math.min(q, headK)); q === tail ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]); }
  ctx.strokeStyle = rgba(C.glow, .75 * (1 - seg(h.k, .85, 1))); ctx.lineWidth = 5 * LWK; ctx.stroke();
  ctx.setLineDash([]);
  // spark
  if (h.k > .1 && h.k < .9) {
    const p = at(k);
    glow(ctx, p[0], p[1], 60 * LWK, C.glow, 1);
    dot(ctx, p[0], p[1], 9 * LWK, '#fff3d6');
    // little Wi-Fi rings around the spark
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath(); ctx.arc(p[0], p[1] + 8 * LWK, i * 12 * LWK, -Math.PI * .8, -Math.PI * .2);
      ctx.strokeStyle = rgba('#ffd9a8', .7 - i * .15); ctx.lineWidth = 3.5 * LWK; ctx.stroke();
    }
  }
  // pop at the start and at the destination
  for (const [P, k0] of [[A, 0], [B, .72]]) {
    const q = seg(h.k, k0, k0 + .28);
    if (q > 0 && q < 1) {
      ctx.beginPath(); ctx.arc(P[0], P[1], (10 + 50 * easeOut(q)) * LWK, 0, TAU);
      ctx.strokeStyle = rgba('#ffd9a8', .8 * (1 - q)); ctx.lineWidth = 6 * LWK * (1 - q) + 1; ctx.stroke();
      glow(ctx, P[0], P[1], 90 * LWK, C.glow, 1 - q);
    }
  }
  ctx.restore();
}

// ---------------------------------------------------------------- building & rooms
function drawSky(ctx, S) {
  const sky = S.sky || 'day';
  const cols = { night: ['#0d1430', '#1e2a52'], day: ['#a9d4f0', '#e4f2fb'], evening: ['#f0a560', '#f7d39a'], dusk: ['#2a2346', '#6a4a6e'] }[sky];
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, cols[0]); g.addColorStop(1, cols[1]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (sky === 'night' || sky === 'dusk') for (let i = 0; i < 70; i++) {
    const tw = .5 + .5 * Math.sin(T * 2 + i * 7);
    dot(ctx, hash(i) * W, hash(i + 99) * H * .9, 1 + hash(i + 7) * 1.6, rgba('#ffffff', .3 + .5 * tw));
  }
}

function drawRooms(ctx, S) {
  // building shell
  shape(ctx, ptsRect(-40, CEIL - 40, WORLD_W + 80, FLOOR - CEIL + 150, 8), '#5b4a42', { lw: 6, j: 1.5 });
  for (const r of ROOMS) {
    ctx.fillStyle = r.wall; ctx.fillRect(r.x0, CEIL, r.x1 - r.x0, FLOOR - CEIL);
    ctx.save(); ctx.beginPath(); ctx.rect(r.x0, CEIL, r.x1 - r.x0, FLOOR - CEIL); ctx.clip();
    ctx.fillStyle = rgba(r.trim, .55);
    if (r.pattern === 'dots') for (let y = CEIL + 40; y < FLOOR; y += 70) for (let x = r.x0 + (y / 70 % 2) * 35; x < r.x1; x += 70) { ctx.beginPath(); ctx.arc(x, y, 5, 0, TAU); ctx.fill(); }
    if (r.pattern === 'tiles') { ctx.fillStyle = '#fbf3e1'; ctx.fillRect(r.x0, 400, r.x1 - r.x0, 300); ctx.strokeStyle = rgba(r.trim, .9); ctx.lineWidth = 2; for (let y = 400; y <= 700; y += 50) { ctx.beginPath(); ctx.moveTo(r.x0, y); ctx.lineTo(r.x1, y); ctx.stroke(); } for (let x = r.x0; x < r.x1; x += 50) for (let y = 400; y < 700; y += 50) { ctx.beginPath(); ctx.moveTo(x + (y / 50 % 2) * 25, y); ctx.lineTo(x + (y / 50 % 2) * 25, y + 50); ctx.stroke(); } }
    if (r.pattern === 'stripes') for (let x = r.x0 + 30; x < r.x1; x += 90) ctx.fillRect(x, CEIL, 34, FLOOR - CEIL);
    ctx.restore();
    // skirting board and floor
    ctx.fillStyle = r.trim; ctx.fillRect(r.x0, FLOOR - 22, r.x1 - r.x0, 22);
  }
  ctx.fillStyle = '#c8976a'; ctx.fillRect(0, FLOOR, WORLD_W, 80);
  ctx.strokeStyle = rgba('#8a5f3d', .5); ctx.lineWidth = 3 * LWK;
  for (let x = 60; x < WORLD_W; x += 160) { ctx.beginPath(); ctx.moveTo(x, FLOOR); ctx.lineTo(x - 30, FLOOR + 80); ctx.stroke(); }
  line(ctx, [[0, FLOOR], [WORLD_W, FLOOR]], { lw: 4, j: .8 });
  line(ctx, [[0, CEIL], [WORLD_W, CEIL]], { lw: 4, j: .8 });
  // partition walls with open doorways
  for (const x of [1500, 2900]) {
    shape(ctx, ptsRect(x - 18, CEIL, 36, 270), '#cdb9a2', { lw: 4, j: .6 });
    line(ctx, [[x - 18, CEIL + 270], [x - 18, FLOOR]], { lw: 3, j: .6, col: rgba(C.ink, .35) });
    line(ctx, [[x + 18, CEIL + 270], [x + 18, FLOOR]], { lw: 3, j: .6, col: rgba(C.ink, .35) });
  }
}

function windowWithCurtains(ctx, x, y, w, h, open, S, sunny) {
  const sky = S.sky || 'day';
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  const cols = { night: ['#141c3c', '#2b3a6a'], day: ['#8fcaf0', '#d6eefc'], evening: ['#f29a58', '#f9d79e'], dusk: ['#3a2d55', '#7a5276'] }[sky];
  g.addColorStop(0, cols[0]); g.addColorStop(1, cols[1]);
  shape(ctx, ptsRect(x, y, w, h, 6), g, { lw: 6 });
  if (sky === 'night') { dot(ctx, x + w * .75, y + h * .25, 22, '#f6f1d0'); dot(ctx, x + w * .7, y + h * .22, 20, cols[0]); }
  if (sky === 'day') { dot(ctx, x + w * .7, y + h * .3, 36, '#fff7c2'); }
  line(ctx, [[x + w / 2, y], [x + w / 2, y + h]], { lw: 5 }); line(ctx, [[x, y + h * .5], [x + w, y + h * .5]], { lw: 5 });
  shape(ctx, ptsRect(x - 24, y + h - 4, w + 48, 18, 4), '#f4efe6', { lw: 4 });
  // rod and curtains
  line(ctx, [[x - 60, y - 22], [x + w + 60, y - 22]], { lw: 7 });
  const pw = lerp(w / 2 + 40, w * .16, clamp(open));
  for (const side of [-1, 1]) {
    const x0 = side < 0 ? x - 50 : x + w + 50 - pw;
    const sway = Math.sin(T * 1.3 + side) * 6;
    const pts = [[x0, y - 26], [x0 + pw, y - 26], [x0 + pw + sway, y + h + 40], [x0 + sway, y + h + 40]];
    shape(ctx, pts, S.curtCol || '#e79a8c', { lw: 4.5, j: 1 });
    for (let i = 1; i < 5; i++) line(ctx, [[x0 + pw * i / 5, y - 20], [x0 + pw * i / 5 + sway, y + h + 34]], { lw: 2.5, col: rgba(C.ink, .3), j: 1 });
  }
}

// ---------------------------------------------------------------- devices (base pass = body, emit pass = lit screen)
function devScreen(ctx, S, name, r, opts = {}) {
  const d = S.dev[name] || {};
  const [x, y, w, h] = r;
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  if (d.on || d.scr || d.clawd) {
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, opts.c0 || '#2a3358'); g.addColorStop(1, opts.c1 || '#3e4c80');
    ctx.fillStyle = d.bg || g; ctx.fillRect(x, y, w, h);
    if (d.scr) d.scr(ctx, x, y, w, h);
    if (d.clawd && d.clawd.s > .01) {
      const c = d.clawd, u = Math.min(w / 13, h / 11) * (c.size || 1) * c.s;
      const cx = x + w * (c.fx ?? .5), cy = y + h * (c.fy ?? .9);
      clawd(ctx, cx, cy, u, c);
    }
  }
  ctx.restore();
  if (d.on || d.scr || d.clawd) { ctx.strokeStyle = C.ink; ctx.lineWidth = 2.5 * LWK; ctx.strokeRect(x, y, w, h); }
}
function offGlass(ctx, [x, y, w, h]) {
  ctx.fillStyle = '#1b1d26'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.beginPath(); ctx.moveTo(x, y + h * .7); ctx.lineTo(x + w * .5, y); ctx.lineTo(x + w * .7, y); ctx.lineTo(x + w * .1, y + h); ctx.lineTo(x, y + h); ctx.fill();
  ctx.strokeStyle = C.ink; ctx.lineWidth = 2.5 * LWK; ctx.strokeRect(x, y, w, h);
}
const devGlow = (S, name) => (S.dev[name] && S.dev[name].glow) || 0;

const DEVICES = {
  phone(ctx, S, pass) {
    const p = S.phone;
    ctx.save(); ctx.translate(p.x + p.w / 2, p.y + p.h / 2); ctx.rotate(p.rot || 0); ctx.translate(-p.w / 2, -p.h / 2);
    const ring = S.dev.phone?.ring ? Math.sin(T * 60) * 2.5 : 0;
    ctx.translate(ring, 0);
    if (pass === 'base') shape(ctx, ptsRect(0, 0, p.w, p.h, p.w * .18), '#2b2d36', { lw: 4 });
    else {
      halo(ctx, 0, 0, p.w, p.h, devGlow(S, 'phone'));
      devScreen(ctx, S, 'phone', [p.w * .1, p.h * .1, p.w * .8, p.h * .78], { c0: '#3a2f5c', c1: '#6b4f8f' });
    }
    ctx.restore();
  },
  speakerB(ctx, S, pass) { speaker(ctx, S, pass, 'speakerB', 1120, 700, 54, 80); },
  speakerL(ctx, S, pass) { speaker(ctx, S, pass, 'speakerL', 4278, 700, 48, 80); },
  curtainSw(ctx, S, pass) {
    if (pass === 'base') shape(ctx, ptsRect(930, 470, 60, 76, 8), '#f4f1ea', { lw: 3.5 });
    else { halo(ctx, 930, 470, 60, 76, devGlow(S, 'curtainSw')); devScreen(ctx, S, 'curtainSw', SCR.curtainSw); }
  },
  lampB(ctx, S, pass) { lamp(ctx, S, pass, 'lampB', 700, S.lamps?.b ?? 0); },
  lampK(ctx, S, pass) { lamp(ctx, S, pass, 'lampK', 2150, S.lamps?.k ?? 0); },
  lampL(ctx, S, pass) { lamp(ctx, S, pass, 'lampL', 4180, S.lamps?.l ?? 0); lamp(ctx, S, pass, 'lampL2', 3420, S.lamps?.l ?? 0); },
  fridge(ctx, S, pass) {
    const d = S.dev.fridge || {}, open = d.open || 0;
    if (pass === 'base') {
      shape(ctx, ptsRect(2600, 360, 250, 560, 18), '#eef2f5', { lw: 5 });
      if (open > 0) {
        shape(ctx, ptsRect(2612, 372, 226, 536, 10), '#fffdf0', { lw: 4 });
        for (const y of [520, 660, 790]) line(ctx, [[2615, y], [2835, y]], { lw: 3 });
        shape(ctx, ptsRect(2640, 470, 50, 50, 8), '#f7e08c', { lw: 3 }); shape(ctx, ptsEll(2760, 620, 30, 34, 14), '#f2f2f2', { lw: 3 });
        shape(ctx, ptsRect(2660, 730, 40, 60, 6), '#ffffff', { lw: 3 }); shape(ctx, ptsEll(2780, 760, 28, 22, 14), C.red, { lw: 3 });
        // swung door, seen edge-on to the left
        const dw = lerp(250, 40, open);
        shape(ctx, ptsRect(2600 - (250 - dw) * .0 - dw * open * 1.2, 360, dw, 560, 14), '#e3e9ee', { lw: 5 });
      } else {
        line(ctx, [[2600, 600], [2850, 600]], { lw: 4 });
        shape(ctx, ptsRect(2810, 430, 14, 120, 6), C.metalDk, { lw: 3 });
        shape(ctx, ptsRect(2810, 650, 14, 140, 6), C.metalDk, { lw: 3 });
        shape(ctx, ptsRect(2626, 442, 148, 120, 10), '#c7ced6', { lw: 3.5 });
        if (d.letter) letterOnFridge(ctx, 2660, 640, d.letter);
      }
    } else if (!open) { halo(ctx, 2600, 360, 250, 560, devGlow(S, 'fridge') * .6); devScreen(ctx, S, 'fridge', SCR.fridge, { c0: '#ffd7a8', c1: '#ffb37a' }); }
    else halo(ctx, 2600, 360, 250, 560, devGlow(S, 'fridge') * .6);
  },
  toaster(ctx, S, pass) {
    if (pass === 'base') {
      shape(ctx, ptsRect(1690, 616, 124, 84, 26), '#e8e3dc', { lw: 4.5 });
      line(ctx, [[1712, 616], [1752, 616]], { lw: 8, col: C.ink }); line(ctx, [[1760, 616], [1798, 616]], { lw: 8, col: C.ink });
      shape(ctx, ptsRect(1798, 660, 22, 10, 4), C.dark, { lw: 2.5 });
    } else { halo(ctx, 1690, 616, 124, 84, devGlow(S, 'toaster')); devScreen(ctx, S, 'toaster', SCR.toaster); }
  },
  coffee(ctx, S, pass) {
    if (pass === 'base') {
      shape(ctx, ptsRect(1880, 540, 110, 160, 14), '#3d3f4a', { lw: 4.5 });
      shape(ctx, ptsRect(1892, 610, 86, 70, 8), '#262833', { lw: 3 });
      shape(ctx, ptsRect(1925, 610, 20, 16, 3), C.metalDk, { lw: 2.5 });
    } else { halo(ctx, 1880, 540, 110, 160, devGlow(S, 'coffee')); devScreen(ctx, S, 'coffee', SCR.coffee); }
  },
  micro(ctx, S, pass) {
    if (pass === 'base') {
      shape(ctx, ptsRect(2070, 580, 222, 120, 12), '#f0ece6', { lw: 4.5 });
      shape(ctx, ptsRect(2084, 594, 132, 92, 8), S.dev.micro?.on ? '#ffe9a6' : '#3a3d48', { lw: 3.5 });
      for (let i = 0; i < 3; i++) dot(ctx, 2252, 646 + i * 14, 4, C.metalDk);
    } else { halo(ctx, 2070, 580, 222, 120, devGlow(S, 'micro')); devScreen(ctx, S, 'micro', SCR.micro, { c0: '#1d3a2a', c1: '#24503a' }); }
  },
  pc(ctx, S, pass) {
    if (pass === 'base') {
      shape(ctx, ptsRect(3166, 630, 48, 50), C.metalDk, { lw: 4 });
      shape(ctx, ptsRect(3120, 676, 140, 14, 5), C.metal, { lw: 4 });
      shape(ctx, ptsRect(3070, 455, 240, 174, 12), C.dark, { lw: 5 });
    } else { halo(ctx, 3070, 455, 240, 174, devGlow(S, 'pc')); devScreen(ctx, S, 'pc', SCR.pc); }
  },
  printer(ctx, S, pass) {
    if (pass === 'base') {
      shape(ctx, ptsRect(3420, 678, 184, 82, 12), '#e9e7e2', { lw: 4.5 });
      shape(ctx, ptsRect(3440, 660, 120, 24, 4), '#ffffff', { lw: 3.5 });
      shape(ctx, ptsRect(3436, 726, 112, 12, 4), C.dark, { lw: 3 });
    } else { halo(ctx, 3420, 678, 184, 82, devGlow(S, 'printer')); devScreen(ctx, S, 'printer', SCR.printer); }
  },
  ac(ctx, S, pass) {
    const d = S.dev.ac || {};
    if (pass === 'base') {
      shape(ctx, ptsRect(3770, 92, 310, 76, 22), '#f7f7f4', { lw: 4.5 });
      line(ctx, [[3790, 150], [4060, 150]], { lw: 3, col: rgba(C.ink, .5) });
    } else {
      halo(ctx, 3770, 92, 310, 76, devGlow(S, 'ac'));
      devScreen(ctx, S, 'ac', SCR.ac, { c0: '#13202a', c1: '#13202a' });
      if (d.temp != null) text(ctx, d.temp + '°', SCR.ac[0] + SCR.ac[2] / 2 - (d.clawd?.s > .1 ? 6 : 0), SCR.ac[1] + SCR.ac[3] / 2 + 1, 20, '#8ff0ff');
      if (d.wind) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 4; i++) { const k = (T * .6 + i / 4) % 1; line(ctx, [[3830 + i * 60, 175 + k * 90], [3850 + i * 60 + 20, 190 + k * 90]], { lw: 3, col: rgba('#bfe9ff', .5 * Math.sin(k * Math.PI) * d.wind), j: 0 }); } ctx.restore(); }
    }
  },
  tablet(ctx, S, pass) {
    if (pass === 'base') { shape(ctx, ptsRect(3848, 776, 96, 74, 10), '#33353f', { lw: 4 }); line(ctx, [[3940, 846], [3960, 850]], { lw: 4 }); }
    else { halo(ctx, 3848, 776, 96, 74, devGlow(S, 'tablet')); devScreen(ctx, S, 'tablet', SCR.tablet, { c0: '#2b4a5c', c1: '#3e7088' }); }
  },
  tv(ctx, S, pass) {
    if (pass === 'base') {
      shape(ctx, ptsRect(4330, 560, 240, 166, 10), C.dark, { lw: 5 });
      line(ctx, [[4380, 726], [4370, 780]], { lw: 6 }); line(ctx, [[4520, 726], [4530, 780]], { lw: 6 });
    } else { halo(ctx, 4330, 560, 240, 166, devGlow(S, 'tv')); devScreen(ctx, S, 'tv', SCR.tv); }
  },
};

function speaker(ctx, S, pass, name, x, y, w, h) {
  const d = S.dev[name] || {}, boom = d.boom || 0;
  const sx = 1 + boom * .12 * Math.sin(T * 50), sy = 1 - boom * .08 * Math.sin(T * 50);
  ctx.save(); ctx.translate(x + w / 2, y + h); ctx.scale(sx, sy); ctx.translate(-(x + w / 2), -(y + h));
  if (pass === 'base') {
    shape(ctx, ptsRect(x, y, w, h, w * .3), '#4b4e5c', { lw: 4 });
    for (let i = 0; i < 4; i++) line(ctx, [[x + 8, y + 40 + i * 9], [x + w - 8, y + 40 + i * 9]], { lw: 2, col: rgba('#000', .3), j: 0 });
    shape(ctx, ptsEll(x + w / 2, y + 6, w / 2 - 2, 7, 18), '#2a2c35', { lw: 3 });
  } else {
    halo(ctx, x, y, w, h, devGlow(S, name));
    const lv = d.ring ?? (d.on ? .6 : 0);
    if (lv > 0) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.beginPath(); ctx.ellipse(x + w / 2, y + 6, w / 2 - 4, 5, 0, 0, TAU); ctx.strokeStyle = rgba(d.ringCol || '#7fd7ff', lv); ctx.lineWidth = 4 * LWK; ctx.stroke();
      ctx.restore(); glow(ctx, x + w / 2, y + 6, w * .9, d.ringCol || '#7fd7ff', lv * .7);
    }
    if (d.clawd && d.clawd.s > .01) clawd(ctx, x + w / 2, y + 34, (w / 15) * d.clawd.s, d.clawd);
  }
  ctx.restore();
}

function lamp(ctx, S, pass, name, cx, lv) {
  if (pass === 'base') {
    line(ctx, [[cx, CEIL], [cx, CEIL + 10]], { lw: 4 });
    shape(ctx, [[cx - 80, CEIL + 10], [cx + 80, CEIL + 10], [cx + 64, CEIL + 44], [cx - 64, CEIL + 44]], lv > .05 ? '#fff4d0' : '#e9e2d4', { lw: 4.5 });
  } else {
    const col = S.lampCol || '#ffe7a8';
    if (lv > 0) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(0, CEIL + 40, 0, FLOOR);
      g.addColorStop(0, rgba(col, .16 * lv)); g.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(cx - 64, CEIL + 44); ctx.lineTo(cx + 64, CEIL + 44); ctx.lineTo(cx + 420, FLOOR); ctx.lineTo(cx - 420, FLOOR); ctx.fill();
      ctx.restore();
      glow(ctx, cx, CEIL + 30, 260 * (.5 + lv * .5), col, lv);
      shape(ctx, [[cx - 80, CEIL + 10], [cx + 80, CEIL + 10], [cx + 64, CEIL + 44], [cx - 64, CEIL + 44]], mix('#fff4d0', '#ffffff', lv), { lw: 4.5 });
    }
    const d = S.dev[name];
    if (d) {
      halo(ctx, cx - 80, CEIL + 10, 160, 34, d.glow || 0);
      if (d.clawd && d.clawd.s > .01) clawd(ctx, cx, CEIL + 42, 2.6 * d.clawd.s, d.clawd);
    }
  }
}

// The love letter (one sheet with Clawd's little heart), taped to the fridge in the second half.
function letterOnFridge(ctx, x, y, k) {
  ctx.save(); ctx.translate(x + 50, y + 60); ctx.rotate(-.06); ctx.globalAlpha *= clamp(k);
  shape(ctx, ptsRect(-50, -62, 100, 124, 3), C.paper, { lw: 3.5 });
  for (let i = 0; i < 4; i++) line(ctx, [[-36, -40 + i * 14], [30 - (i % 2) * 18, -40 + i * 14]], { lw: 2, col: rgba(C.ink, .3), j: .5 });
  shape(ctx, ptsHeart(0, 28, 22), C.pinkDk, { lw: 3, j: 1.2 });
  shape(ctx, ptsRect(-16, -70, 32, 14), rgba('#f7e08c', .85), { lw: 2 });
  ctx.restore();
}

// ---------------------------------------------------------------- furniture
function furniture(ctx, S) {
  // bedroom
  windowWithCurtains(ctx, 420, 190, 440, 360, S.curt?.b ?? 0, S);
  shape(ctx, ptsRect(160, 560, 46, 360, 10), C.woodDk, { lw: 5 });                 // headboard
  shape(ctx, ptsRect(190, 760, 820, 110, 16), '#f7f3ee', { lw: 5 });                 // mattress
  shape(ctx, ptsRect(200, 850, 800, 70, 8), C.wood, { lw: 5 });                      // bed frame
  shape(ctx, ptsRect(984, 720, 26, 200, 8), C.woodDk, { lw: 5 });                    // footboard
  shape(ctx, ptsRect(1030, 776, 160, 144, 10), C.wood, { lw: 5 });                   // nightstand
  line(ctx, [[1040, 840], [1180, 840]], { lw: 3 }); dot(ctx, 1110, 812, 5, C.ink); dot(ctx, 1110, 878, 5, C.ink);
  shape(ctx, ptsRect(1060, 762, 52, 16, 4), '#3b3e4a', { lw: 3 });                   // phone dock
  shape(ctx, ptsEll(560, 935, 300, 22, 26), '#c9b7e0', { lw: 4 });                  // rug
  // kitchen
  shape(ctx, ptsRect(1620, 200, 720, 170, 10), '#f6efe2', { lw: 5 });                // upper cabinets
  for (let x = 1620 + 180; x < 2340; x += 180) line(ctx, [[x, 204], [x, 366]], { lw: 3 });
  shape(ctx, ptsRect(1600, 700, 980, 220, 8), '#f1e7d7', { lw: 5 });                // counter base
  shape(ctx, ptsRect(1590, 690, 1000, 24, 6), '#b8a58e', { lw: 5 });                 // counter top
  for (let x = 1600 + 196; x < 2580; x += 196) line(ctx, [[x, 716], [x, 916]], { lw: 3 });
  // living room
  windowWithCurtains(ctx, 3720, 230, 400, 320, S.curt?.l ?? 1, S);
  shape(ctx, ptsRect(2970, 690, 420, 26, 6), C.wood, { lw: 5 });                     // desk top
  shape(ctx, ptsRect(2990, 716, 26, 204, 4), C.woodDk, { lw: 4 }); shape(ctx, ptsRect(3344, 716, 26, 204, 4), C.woodDk, { lw: 4 });
  shape(ctx, ptsRect(3410, 760, 210, 160, 8), '#d7c2a6', { lw: 5 });                  // printer cabinet
  line(ctx, [[3420, 840], [3610, 840]], { lw: 3 });
  // sofa
  shape(ctx, ptsRect(3680, 640, 560, 150, 40), '#d98f6f', { lw: 5 });                 // back
  shape(ctx, ptsRect(3660, 760, 600, 130, 30), '#e7a183', { lw: 5 });                 // seat
  shape(ctx, ptsRect(3640, 700, 70, 190, 30), '#cf8466', { lw: 5 }); shape(ctx, ptsRect(4210, 700, 70, 190, 30), '#cf8466', { lw: 5 });
  line(ctx, [[3960, 770], [3960, 880]], { lw: 3, col: rgba(C.ink, .4) });
  // tv stand
  shape(ctx, ptsRect(4270, 780, 320, 140, 8), '#b88a62', { lw: 5 });
  line(ctx, [[4430, 790], [4430, 910]], { lw: 3 });
  // door
  const door = S.door || 0;
  shape(ctx, ptsRect(4630, 480, 160, 440, 6), '#3b3140', { lw: 5 });
  ctx.save(); ctx.translate(4630, 480); ctx.scale(lerp(1, .18, door), 1);
  shape(ctx, ptsRect(0, 0, 160, 440, 6), '#c0835a', { lw: 5 });
  shape(ctx, ptsRect(24, 30, 112, 160, 6), rgba('#000', .08), { lw: 3 }); shape(ctx, ptsRect(24, 230, 112, 180, 6), rgba('#000', .08), { lw: 3 });
  dot(ctx, 140, 250, 9, C.yellow);
  ctx.restore();
  // little plant by the door
  shape(ctx, ptsRect(4592, 860, 34, 60, 6), '#c56b4f', { lw: 4 });
  for (let i = 0; i < 4; i++) shape(ctx, ptsEll(4609 + (i - 1.5) * 12, 836 - i % 2 * 12, 10, 26, 12, i * .4 - .6), C.green, { lw: 3 });
}

function coffeeTable(ctx) {
  shape(ctx, ptsRect(3800, 846, 320, 22, 8), C.wood, { lw: 5 });
  shape(ctx, ptsRect(3820, 866, 18, 54), C.woodDk, { lw: 4 }); shape(ctx, ptsRect(4082, 866, 18, 54), C.woodDk, { lw: 4 });
}
function desktopProps(ctx, S) {
  shape(ctx, ptsRect(3110, 678, 160, 16, 4), '#e6e6e6', { lw: 3.5 });                    // keyboard
  shape(ctx, ptsRect(3020, 640, 40, 50, 8), '#f5f1ea', { lw: 4 });                         // mug
  line(ctx, ptsQuad([3020, 652], [3002, 664], [3020, 678], 6), { lw: 4 });
  // chair
  shape(ctx, ptsRect(3260, 780, 150, 22, 8), '#556070', { lw: 4 }); shape(ctx, ptsRect(3380, 610, 26, 180, 10), '#556070', { lw: 4 });
  line(ctx, [[3330, 802], [3330, 900]], { lw: 6 }); line(ctx, [[3280, 912], [3380, 912]], { lw: 6 });
}

// Robot vacuum (world space)
function vacuum(ctx, x, y, spin = 0, glowK = 0) {
  ctx.save(); ctx.translate(x, y);
  halo(ctx, -56, -26, 112, 40, glowK);
  shape(ctx, ptsEll(0, 0, 56, 18, 24), '#3c3f4a', { lw: 4 });
  shape(ctx, ptsEll(0, -6, 50, 12, 24), '#575b68', { lw: 3 });
  dot(ctx, Math.cos(spin) * 30, -6 + Math.sin(spin) * 6, 6, glowK > .1 ? C.glow : '#9fe3a0');
  ctx.restore();
}

// ---------------------------------------------------------------- the frame
function drawWorld(ctx, S) {
  S.dev = S.dev || {};
  S.phone = S.phone || PHONE_SPOTS.night;
  drawSky(ctx, S);
  ctx.save();
  applyCam(ctx, S.cam);
  drawRooms(ctx, S);
  furniture(ctx, S);
  for (const k in LAMPS) DEVICES['lamp' + k.toUpperCase()](ctx, S, 'base');
  if (S.under) S.under(ctx);
  desktopProps(ctx, S);
  for (const n of ['speakerB', 'curtainSw', 'fridge', 'toaster', 'coffee', 'micro', 'pc', 'printer', 'ac', 'tv', 'speakerL']) DEVICES[n](ctx, S, 'base');
  for (const n of ['curtainSw', 'toaster', 'coffee', 'micro', 'pc', 'printer', 'ac', 'tv']) if (!(n === 'fridge')) offGlass(ctx, SCR[n]);
  if (!(S.dev.fridge?.open > 0)) offGlass(ctx, SCR.fridge);
  if (S.human) S.human(ctx);
  coffeeTable(ctx);
  DEVICES.tablet(ctx, S, 'base');
  offGlass(ctx, SCR.tablet);
  if (S.phone !== 'none') { DEVICES.phone(ctx, S, 'base'); const p = S.phone; ctx.save(); ctx.translate(p.x + p.w / 2, p.y + p.h / 2); ctx.rotate(p.rot || 0); ctx.translate(-p.w / 2, -p.h / 2); offGlass(ctx, [p.w * .1, p.h * .1, p.w * .8, p.h * .78]); ctx.restore(); }
  if (S.over) S.over(ctx);
  ctx.restore();

  // colour grade (multiply) — light sources are drawn afterwards so they stay bright
  if (S.grade && S.grade.amt > 0) {
    ctx.save(); ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = rgba(S.grade.col, S.grade.amt); ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  ctx.save();
  applyCam(ctx, S.cam);
  for (const k in LAMPS) DEVICES['lamp' + k.toUpperCase()](ctx, S, 'emit');
  for (const n of ['speakerB', 'curtainSw', 'fridge', 'toaster', 'coffee', 'micro', 'pc', 'printer', 'ac', 'tv', 'speakerL', 'tablet']) DEVICES[n](ctx, S, 'emit');
  if (S.phone !== 'none') DEVICES.phone(ctx, S, 'emit');
  if (S.emit) S.emit(ctx);
  for (const h of S.hops || []) drawHop(ctx, S, h);
  ctx.restore();
  LWK = 1;
  if (S.post) S.post(ctx);
}
