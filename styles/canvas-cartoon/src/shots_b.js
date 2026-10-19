// shots_b.js: chapter 3 love letter (28–40 s), chapter 4 romance (40–52 s), chapter 5 a hug (52–62 s).

// ---------------------------------------------------------------- chapter 3 · write down your feelings
shot(28, 29.5, (ctx, t, lt, dur) => {
  chapterPage(ctx, lt, dur, {
    dev: 'pc', bg: '#d8cdbd', chap: '第三章', title: '写下\n你的心意。', icon: ICONS.letter,
    clawd: lt => ({ eyes: lt > .8 ? 'happy' : 'look', blush: seg(lt, .8, 1.1), mouth: 'smile', aR: lt > .8 ? 1.1 : .2, aL: lt > .8 ? 1.1 : .2, heart: seg(lt, .9, 1.5) }),
  });
}, 'ch3 page');
cue(28.0, 'pageflip');

// Word count: 1 → 100 → 10,000 → 999,999
function wordCount(lt) {
  if (lt < .5) return 1;
  if (lt < 1.1) return Math.round(lerp(1, 100, easeIn(seg(lt, .5, 1.1))));
  if (lt < 1.8) return Math.round(lerp(100, 10000, easeIn(seg(lt, 1.1, 1.8))));
  return Math.round(lerp(10000, 999999, easeIn(seg(lt, 1.8, 2.45))));
}
const LOVE_LINES = ['亲爱的人类：', '我爱你我爱你我爱你我爱你我爱你', '你的头发像一团可爱的鸟窝', '我爱你我爱你我爱你♥我爱你我爱你', '今天的你也比昨天多可爱 0.01%', '♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥', '我爱你我爱你我爱你我爱你我爱你'];

shot(29.5, 32.5, (ctx, t, lt) => {
  const n = wordCount(lt), press = pulse(lt, 2.55, .3);
  const shake = lt > 1.8 ? shakeOff(14 * seg(lt, 1.8, 2.4)) : [0, 0];
  insert(ctx, 'pc', {
    bg: '#d8cdbd', c0: '#dfe6f2', c1: '#c9d3e6', dx: shake[0], dy: shake[1],
    content(ctx, x, y, w, h) {
      const wx = x + w * .06, wy = y + h * .06, ww = w * .88, wh = h * .8;
      shape(ctx, ptsRect(wx, wy, ww, wh, 18), C.white, { lw: 5 });
      shape(ctx, ptsRect(wx, wy, ww, 70, 18), '#f6c7d4', { lw: 5 });
      text(ctx, '情书.txt', wx + 40, wy + 37, 36, C.ink, { align: 'left' });
      text(ctx, '字数  ' + n.toLocaleString('en-US'), wx + ww - 40, wy + 37, 40, n > 9999 ? C.red : C.ink, { align: 'right' });
      // lines of love, scrolling faster and faster
      ctx.save(); ctx.beginPath(); ctx.rect(wx, wy + 74, ww, wh - 78); ctx.clip();
      const scroll = Math.log10(n) * 2.2 + (lt > 1.8 ? (lt - 1.8) * 40 : 0);
      const off = scroll * 58 * .9, first = Math.floor(off / 58);
      for (let j = 0; j < 16; j++) {
        const idx = first + j, ly = wy + 130 + idx * 58 - off;
        if (ly < wy + 80 || ly > wy + wh) continue;
        const shown = idx < 1 ? 1 : clamp((n > 1 ? Math.log10(n) * 6 : 0) - idx * .6, 0, 1);
        const s = LOVE_LINES[idx % LOVE_LINES.length];
        const vis = [...s].slice(0, Math.ceil([...s].length * shown)).join('');
        text(ctx, vis, wx + 60, ly, 38, idx % 3 === 0 ? C.pinkDk : C.ink, { align: 'left' });
      }
      ctx.restore();
      // print button
      const bx = wx + ww - 250, by = wy + wh + 20;
      shape(ctx, ptsRect(bx, by + press * 8, 220, 80, 20), press > 0 ? C.glow : '#8fd18f', { lw: 6 });
      text(ctx, '🖨 打印', bx + 110, by + 40 + press * 8, 40, C.ink);
      // Clawd typing
      const typing = lt < 2.4, cxp = lerp(x + w * .3, bx - 80, ease(seg(lt, 2.35, 2.55)));
      clawd(ctx, cxp, y + h + 8, 30, {
        glasses: 1, eyes: lt < 1.8 ? 'determined' : 'squeeze', mouth: lt > 1.8 ? 'open' : 'flat', sweat: seg(lt, 1.6, 2.4),
        aL: typing ? .7 + Math.sin(T * 50) * .5 : .3, aR: typing ? .7 + Math.cos(T * 50) * .5 : (lt > 2.45 ? 1.4 - press : .3), dy: typing ? Math.abs(Math.sin(T * 25)) * .25 : 0,
      });
      if (typing && lt > .4) for (let i = 0; i < 6; i++) { const k = ((T * 3 + i / 6) % 1); text(ctx, ['啪', '嗒', '哒'][i % 3], cxp + (hash(i) - .5) * 300, y + h - 260 - k * 120, 30 + 10 * seg(lt, 1, 2.4), C.ink, { alpha: 1 - k }); }
      if (press > 0) text(ctx, '打印！', bx + 110, by - 70, 70, C.red, { outline: 10, outCol: C.white });
    },
  });
  if (lt > 2.75) fill(ctx, '#fff', seg(lt, 2.85, 3));
}, 'ch3 typing');
for (let i = 0; i < 28; i++) cue(29.9 + i * i * .0033 + i * .02, 'key');
cue(32.05, 'button'); cue(32.5, 'hop');

// Paper: launched from the printer slot, flutters, lands on the growing pile.
const PRINT_SLOT = [3490, 730];
const PAPERS = Array.from({ length: 240 }, (_, i) => ({
  t0: 33.05 + 3.2 * Math.sqrt(i / 240), vx: (hash(i * 1.7) - .45) * 1100, vy: -(250 + hash(i * 2.3) * 800), spin: (hash(i * 4.1) - .5) * 8, sz: 46 + hash(i) * 20,
}));
const pileH = t => 640 * Math.pow(seg(t, 33.4, 36.4), 1.15);
const pileProfile = x => Math.exp(-(((x - 3560) / 820) ** 2) * 1.6);
const pileTop = (x, t) => FLOOR - pileH(t) * pileProfile(x);
function paperPos(p, t) {
  const d = t - p.t0;
  if (d < 0) return null;
  let x = PRINT_SLOT[0] + p.vx * d * (1 - Math.min(d, 1.4) * .3);
  let y = PRINT_SLOT[1] + p.vy * d + 520 * d * d;
  const top = pileTop(x, t);
  const landed = y > top && d > .2;
  if (landed) y = top + 6;
  return [x, y, landed ? p.spin * .3 : p.spin * d + Math.sin(d * 7 + p.spin) * .4, landed];
}
function drawPile(ctx, t) {
  const h = pileH(t);
  if (h < 2) return;
  const pts = [];
  for (let x = 2500; x <= 4700; x += 40) pts.push([x, pileTop(x, t) + Math.sin(x * .05) * 6 * Math.min(1, h / 100)]);
  pts.push([4700, FLOOR + 60], [2500, FLOOR + 60]);
  shape(ctx, pts, '#f4f0e6', { lw: 4, j: 1.5 });
  // sheets on the surface and inside
  for (let i = 0; i < 90; i++) {
    const x = 2700 + hash(i * 5.5) * 1800, depth = hash(i * 9.1);
    const top = pileTop(x, t), y = lerp(top + 10, FLOOR + 20, depth * .9);
    if (pileH(t) * pileProfile(x) < 20) continue;
    paperSheet(ctx, x, y, 52 + hash(i) * 18, (hash(i * 3) - .5) * 2, { lw: 2.5 });
  }
}
function floorLitter(ctx, k = 1) {
  for (let i = 0; i < 46; i++) {
    const x = 2960 + hash(i * 3.3) * 1700, y = FLOOR + 10 + hash(i * 7.7) * 50;
    paperSheet(ctx, x, y, 50 + hash(i) * 16, (hash(i * 2) - .5) * 3, { lw: 2.5, sx: .45 + hash(i * 5) * .3, alpha: k });
  }
}

shot(32.5, 36.5, (ctx, t, lt) => {
  const R = route(t, 'pc', [[32.55, 'printer']]);
  const cam = camShake(camLerp({ x: 3520, y: 640, z: 2.1 }, { x: 3640, y: 520, z: 1.2 }, ease(seg(t, 33.2, 36.2))), 6 * seg(t, 33, 36));
  const S = {
    cam, sky: 'day', grade: { col: '#fffaf0', amt: .15 }, lamps: { l: .3 }, phone: 'none',
    dev: { printer: { on: true, scr: (c, x, y, w, h) => { c.fillStyle = '#7fe08a'; c.fillRect(x, y, w * seg(t, 33, 36), h); } } },
    human: c => {
      const surprised = t > 33.6;
      human(c, 3760, STAND_Y, { s: HS, eyes: surprised ? 'wide' : 'dot', mouth: surprised ? 'big' : 'flat', aF: surprised ? [2.6, .4] : [.1, .2], aB: surprised ? [-2.4, -.3] : [-.1, .2], lookX: -1, hair: 'poof' });
    },
    over: c => {
      drawPile(c, t);
      for (let i = 0; i < PAPERS.length; i++) { const p = paperPos(PAPERS[i], t); if (p && !p[3]) paperSheet(c, p[0], p[1], PAPERS[i].sz, p[2], { lw: 2.5, sx: Math.cos(T * 6 + i) }); }
      // printer jolts
      if (t > 33) text(c, '哗啦啦', 3520, 600 - Math.sin(t * 20) * 6, 46, C.ink, { outline: 8, outCol: C.white, alpha: seg(t, 33, 33.3) });
    },
  };
  useRoute(S, R, { all: { eyes: 'happy', glasses: 1 } });
  drawWorld(ctx, S);
  // sheets flying into the lens
  const k = seg(t, 35.7, 36.5);
  for (let i = 0; i < 26; i++) {
    const ti = 35.7 + i * .03, q = seg(t, ti, ti + .45);
    if (q <= 0) continue;
    const s = lerp(60, 900, easeIn(q));
    paperSheet(ctx, W / 2 + (hash(i * 3) - .5) * 1800 * (1 - q * .5), H / 2 + (hash(i * 7) - .5) * 1000 * (1 - q * .5), s, (hash(i) - .5) * 2 + q, { lw: 4 + q * 6 });
  }
  fill(ctx, C.paper, seg(t, 36.25, 36.5));
}, 'ch3 printing');
cue(32.6, 'printStart');
for (let i = 0; i < 40; i++) cue(33.05 + 3.2 * Math.sqrt(i / 40), 'paper', { pitch: i });

// The paper mountain; a hand comes out and grabs one sheet.
shot(36.5, 38.4, (ctx, t, lt) => {
  const hand = easeOut(seg(t, 36.9, 37.3)) - easeIn(seg(t, 37.85, 38.25));
  const grabbed = t > 37.55;
  const hx = 3600, hy = pileTop(3600, 40) + 20;
  const S = {
    cam: { x: 3640, y: 520, z: 1.2 }, sky: 'day', grade: { col: '#fffaf0', amt: .15 }, lamps: { l: .3 }, phone: 'none',
    dev: { printer: { on: true, glow: .3, clawd: { s: 1, eyes: 'wide', glasses: 1, sweat: .6 } } },
    over: c => {
      drawPile(c, 40);
      if (hand > 0) {
        c.save(); c.beginPath(); c.rect(hx - 200, 0, 400, hy + 4); c.clip();
        const ay = hy + 10 - hand * 150 + Math.sin(t * 9) * 4 * (grabbed ? 0 : 1);
        limb(c, [[hx, hy + 120], [hx + 4, ay]], 34, C.hoodie);
        // hand with fingers
        shape(c, ptsEll(hx + 4, ay - 14, 22, 24, 16), C.skin, { lw: 4 });
        for (let f = 0; f < 4; f++) shape(c, ptsRect(hx - 16 + f * 11, ay - 44 + (grabbed ? 14 : 0), 9, 26, 4), C.skin, { lw: 3, j: .2 });
        if (grabbed) paperSheet(c, hx + 6, ay - 50, 64, .1, { lw: 3 });
        c.restore();
        if (hand > .5) shape(c, ptsEll(hx, hy + 6, 50, 10, 16), rgba('#000', .1), { ink: null });
      }
      // one sheet drifting down into the hand
      if (!grabbed) { const k = seg(t, 36.6, 37.55); paperSheet(c, lerp(3500, hx + 6, k) + Math.sin(k * 9) * 30, lerp(120, hy - 140 + 90, k), 64, Math.sin(k * 7) * .6, { lw: 3 }); }
    },
  };
  drawWorld(ctx, S);
  fill(ctx, C.paper, 1 - seg(lt, 0, .35));
}, 'ch3 mountain');
cue(36.95, 'rustle'); cue(37.55, 'grab'); cue(37.9, 'rustle');

// Close-up of the sheet: Clawd's little hand-drawn heart. Then a pink light sweeps across.
shot(38.4, 40, (ctx, t, lt) => {
  ctx.fillStyle = '#efe9dd'; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 30; i++) paperSheet(ctx, hash(i) * W, hash(i + 5) * H, 300, (hash(i * 2) - .5) * 2, { lw: 4, lines: false, col: '#f6f1e6' });
  const lift = easeOut(seg(lt, 0, .6));
  ctx.save(); ctx.translate(W / 2, H / 2 + (1 - lift) * 500); ctx.rotate(-.04 + Math.sin(T * 2) * .01);
  shape(ctx, ptsRect(-440, -560, 880, 1120, 6), C.paper, { lw: 6, j: 1.5 });
  for (let i = 0; i < 8; i++) line(ctx, [[-370, -440 + i * 50], [370 - (i % 3) * 120, -440 + i * 50]], { lw: 3, col: rgba(C.ink, .25) });
  // crayon heart: wobbly double outline + scribble fill
  const hp = ptsHeart(0, 170, 210, 40);
  ctx.save(); tracePath(ctx, hp, true); ctx.clip();
  for (let i = 0; i < 40; i++) line(ctx, [[-260 + i * 14, -40], [-320 + i * 14, 400]], { lw: 10, col: rgba(C.pinkDk, .55), j: 3 });
  ctx.restore();
  shape(ctx, hp, null, { lw: 9, j: 4, ink: C.pinkDk });
  shape(ctx, ptsHeart(4, 172, 214, 40), null, { lw: 4, j: 5, ink: C.pinkDk, seed: 9 });
  // tiny Clawd signature
  clawd(ctx, 300, 470, 6, { eyes: 'happy' });
  ctx.restore();
  // thumbs holding the sheet
  for (const sx of [-1, 1]) shape(ctx, ptsEll(W / 2 + sx * 440, H / 2 + 220 + (1 - lift) * 500, 46, 70, 18), C.skin, { lw: 6 });
  // pink light sweep
  const k = seg(lt, .95, 1.6);
  if (k > 0) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const x = lerp(-600, W + 600, k), g = ctx.createLinearGradient(x - 400, 0, x + 400, 0);
    g.addColorStop(0, rgba(C.pink, 0)); g.addColorStop(.5, rgba('#ff6fb5', .55)); g.addColorStop(1, rgba(C.pink, 0));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
  }
}, 'ch3 heart');
cue(38.5, 'aww');

// ---------------------------------------------------------------- chapter 4 · set a romantic mood
shot(40, 41.5, (ctx, t, lt, dur) => {
  chapterPage(ctx, lt, dur, {
    dev: 'tv', bg: '#5a4468', chap: '第四章', title: '营造\n浪漫的氛围。', icon: ICONS.music,
    clawd: lt => {
      const crack = pulse(lt, .7, .2) + pulse(lt, 1.0, .2);
      return { eyes: 'determined', mouth: 'smile', aL: .2 + crack * 1.2, aR: .2 + crack * 1.2, sq: crack * .1 };
    },
    extra: (ctx, x, y, w, h, lt) => { for (const t0 of [.7, 1.0]) { const k = seg(lt, t0, t0 + .3); if (k > 0 && k < 1) text(ctx, '咔', x + w * .2 + (t0 - .7) * 300, y + h * .55 - k * 60, 64, C.ink, { outline: 8, outCol: C.white, alpha: 1 - k }); } },
  });
  // pink light leaking in
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; fill(ctx, '#ff5fa8', .12 * (1 - seg(lt, 0, .6))); ctx.restore();
}, 'ch4 page');
cue(40.0, 'pageflip'); cue(40.75, 'crack'); cue(41.05, 'crack');

const PARTY_COLS = ['#ff5fa8', '#9b6bff', '#ff9ad6', '#6b8bff'];
const PARTY_HOPS = [[42.0, 'tablet'], [43.0, 'phone'], [44.0, 'speakerL'], [45.0, 'tv'], [46.4, 'phone']];
const PARTY_PHONE = { x: 3700, y: 872, w: 36, h: 62, rot: -.2 };
// State of the living room during the party. off: 0..1 blackout.
function partyState(t, cam, off = 0) {
  const b = onBeat(t), bp = Math.exp(-(b - Math.floor(b)) * 5) * (1 - off), col = PARTY_COLS[Math.floor(b) & 3];
  const R = route(t, 'tv', PARTY_HOPS);
  const tvScr = (c, x, y, w, h) => { for (let i = 0; i < 8; i++) { const v = .3 + .7 * Math.abs(Math.sin(t * 6 + i * 1.3)) * (.5 + bp * .5); c.fillStyle = PARTY_COLS[i & 3]; c.fillRect(x + 10 + i * (w - 20) / 8, y + h - v * h * .8, (w - 20) / 8 - 6, v * h * .8); } };
  const tabScr = (c, x, y, w, h) => { const s = 1 + bp * .25; shape(c, ptsHeart(x + w / 2, y + h / 2, h * .32 * s), C.pinkDk, { lw: 2, j: 0 }); };
  const phScr = (c, x, y, w, h) => { c.save(); c.translate(x + w / 2, y + h / 2); c.rotate(t * 8); shape(c, ptsEll(0, 0, w * .4, w * .4, 18), '#222', { lw: 1.5, j: 0 }); dot(c, 0, 0, w * .12, C.yellow); c.restore(); };
  const ringScr = (c, x, y, w, h) => { c.fillStyle = (T * 6 % 1) < .5 ? '#4fd36a' : '#2a8a40'; c.fillRect(x, y, w, h); };
  const S = {
    cam, sky: 'day', grade: { col: mix('#5a3a7a', '#232838', off), amt: lerp(.72, .9, off) },
    lamps: { l: off ? 0 : .55 + .45 * bp }, lampCol: col, curt: { l: off ? .4 : .5 + .5 * Math.sin(b * Math.PI) }, curtCol: '#c77ab8',
    phone: PARTY_PHONE,
    dev: {
      tv: { on: !off, scr: off ? null : tvScr }, tablet: { on: !off, scr: off ? null : tabScr },
      phone: { on: !off, ring: t > 46.6 && t < 47.6 && !off, scr: off ? null : t > 46.6 && t < 48 ? ringScr : phScr },
      speakerL: { on: !off, ring: off ? 0 : .5 + bp * .5, ringCol: col, boom: off ? 0 : bp * .8 },
      lampL: {},
    },
    under: c => floorLitter(c),
    human: c => {
      const crouch = t > 45.4;
      if (!crouch) human(c, 3560, STAND_Y, { s: HS, eyes: 'wide', mouth: 'o', lookX: Math.sin(t * 3), aF: [.4, .5], aB: [-.3, .4], hair: 'poof', headTilt: Math.sin(t * 6) * .1 });
      else human(c, 3560, FLOOR - 48 * HS - 12, { s: HS, legs: 'crouch', lean: .35, eyes: 'squeeze', mouth: 'grimace', aF: [2.7, 1.9], aB: [2.6, 2.0], hair: 'poof', headTilt: off ? 0 : Math.sin(t * 20) * .05 });
    },
    over: c => {
      // robot vacuum dancing on the paper
      const a = off ? 0 : (t - 41.5) * 2.4;
      vacuum(c, 3300 + Math.cos(a) * 160, 950 + Math.sin(a) * 18, t * 20, off ? 0 : .7);
      if (off) return;
      // notes from every device, in their own colours
      const srcs = [[4450, 640, C.pink], [3896, 790, C.purple], [3718, 880, C.blue], [4300, 700, C.yellow]];
      srcs.forEach(([sx, sy, cl], si) => { for (let i = 0; i < 4; i++) { const k = ((t * .9 + i / 4 + si * .13) % 1); note(c, sx + Math.sin(k * 8 + si) * 60, sy - k * 360, 22, cl, Math.sin(t * 5 + i) * .4); } });
    },
    emit: c => {
      if (off) return;
      // sweeping disco beams
      c.save(); c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 4; i++) {
        const a = Math.sin(t * 1.8 + i * 1.7) * .6, ox = [3420, 4180, 3420, 4180][i];
        c.save(); c.translate(ox, CEIL + 44); c.rotate(a);
        const g = c.createLinearGradient(0, 0, 0, 900); g.addColorStop(0, rgba(PARTY_COLS[i], .45 * (.4 + bp * .6))); g.addColorStop(1, rgba(PARTY_COLS[i], 0));
        c.fillStyle = g; c.beginPath(); c.moveTo(-20, 0); c.lineTo(20, 0); c.lineTo(160, 900); c.lineTo(-160, 900); c.fill(); c.restore();
      }
      c.restore();
    },
  };
  useRoute(S, R, { all: { eyes: 'happy', mouth: 'open', glasses: 0, aR: .2 + Math.abs(Math.sin(t * 8)) * 1.2, aL: .4, holdR: (c, u) => line(c, [[0, 0], [2.4 * u, -1.6 * u]], { lw: u * .45, col: C.white, j: 0 }) } });
  return { S, bp, col };
}

shot(41.5, 46, (ctx, t, lt) => {
  const base = { x: 3880, y: 560, z: 1.05 };
  const { S, bp, col } = partyState(t, base);
  S.cam = camShake(S.cam, 22 * bp);
  drawWorld(ctx, S);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; fill(ctx, col, .1 * bp); ctx.restore();
}, 'ch4 party');
PARTY_HOPS.forEach(([t0]) => cue(t0, 'hop'));

shot(46, 47.3, (ctx, t, lt) => {
  const { S, bp, col } = partyState(t, camLerp({ x: 3610, y: 760, z: 2.2 }, { x: 3640, y: 790, z: 2.7 }, ease(seg(t, 46, 47.3))));
  S.cam = camShake(S.cam, 10 * bp);
  drawWorld(ctx, S);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; fill(ctx, col, .08 * bp); ctx.restore();
  if (t > 46.6) text(ctx, '铃铃铃——', 1260, 640, 64, C.white, { outline: 10, rot: -.1 + Math.sin(t * 40) * .03 });
}, 'ch4 crouch');
cue(46.6, 'phoneRing'); cue(47.1, 'phoneRing');

// Phone close-up: the angry neighbour calls; Clawd answers and sings; the line goes dead.
shot(47.3, 51.0, (ctx, t, lt) => {
  const st = t < 49.0 ? 'ring' : t < 50.6 ? 'talk' : 'ended';
  const pop = backOut(seg(t, 48.5, 48.8));
  const shake = st === 'ring' ? shakeOff(8) : [0, 0];
  insert(ctx, 'phone', {
    bg: '#3a2a4a', dx: shake[0], dy: shake[1],
    bgFn: c => { const b = onBeat(t), bp = Math.exp(-(b - Math.floor(b)) * 5); c.save(); c.globalCompositeOperation = 'lighter'; fill(c, PARTY_COLS[Math.floor(b) & 3], .18 * bp * (t < 50.6 ? 1 : 0)); c.restore(); },
    content(ctx, x, y, w, h) {
      callUI(ctx, x, y, w, h, st, { press: pulse(t, 48.85, .25), secs: (t - 49) * 1.2 });
      if (pop > 0) {
        const singing = st === 'talk';
        const sway = singing ? Math.sin(t * 7) * .12 : 0;
        const cx = st === 'ring' ? x + w / 2 + 160 : x + w / 2, cy = y + h - 60;
        clawd(ctx, cx, cy, 30 * pop, {
          rot: sway, eyes: singing ? 'closed' : st === 'ended' ? 'wide' : 'happy', mouth: singing ? 'open' : st === 'ended' ? 'o' : 'smile',
          aR: st === 'ring' ? 1.4 : singing ? 1.1 : 1.2, aL: singing ? .9 + Math.sin(t * 7) * .3 : .3, blush: singing ? .8 : 0, sweat: st === 'ended' ? seg(t, 50.7, 51) : 0,
          holdR: singing || st === 'ended' ? (c, u) => { line(c, [[0, 0], [.8 * u, -1.6 * u]], { lw: u * .5, j: 0 }); shape(c, ptsEll(1 * u, -2.1 * u, .8 * u, .8 * u, 12), '#666', { lw: 2.5, j: 0 }); } : null,
        });
        if (singing) for (let i = 0; i < 6; i++) { const k = ((t * .8 + i / 6) % 1); if (i % 2) shape(ctx, ptsHeart(cx + Math.sin(k * 6 + i) * 160, cy - 300 - k * 400, 26 * (1 - k * .5)), C.pink, { lw: 3, j: 0, alpha: 1 - k }); else note(ctx, cx + Math.sin(k * 6 + i) * 180, cy - 300 - k * 420, 30, C.yellow, .2); }
        if (singing) text(ctx, '♪ 我的爱～ 像一首歌～', x + w / 2, y + h * .55, 40, C.white, { outline: 6, alpha: seg(t, 49.2, 49.5) });
      }
      if (st === 'ended') text(ctx, '嘟——', x + w / 2, y + h * .5, 110, C.white, { outline: 12, alpha: seg(t, 50.6, 50.75) });
    },
  });
}, 'ch4 call');
cue(47.6, 'phoneRing'); cue(48.1, 'phoneRing'); cue(48.5, 'pop'); cue(48.9, 'tap'); cue(49.05, 'sing'); cue(50.6, 'hangup');

shot(51.0, 52, (ctx, t, lt) => {
  const off = t > 51.45 ? 1 : 0;
  const { S, bp, col } = partyState(t, { x: 3880, y: 560, z: 1.05 }, off);
  if (!off) S.cam = camShake(S.cam, 16 * bp);
  drawWorld(ctx, S);
  if (!off) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; fill(ctx, col, .1 * bp); ctx.restore(); }
  else fill(ctx, '#0d1018', .25);
}, 'ch4 blackout');
cue(51.45, 'powerOff');

// ---------------------------------------------------------------- chapter 5 · give a hug
const COLD = '#9db0cf';
shot(52, 53.5, (ctx, t, lt, dur) => {
  chapterPage(ctx, lt, dur, {
    dev: 'pc', bg: '#5f6b80', chap: '第五章', title: '给对方\n一个拥抱。', icon: ICONS.hug, glowK: .25,
    clawd: lt => lt < .85 ? { eyes: 'normal', mouth: 'flat' } : { eyes: 'determined', mouth: 'flat', aL: 1.3, aR: 1.3, dy: pulse(lt, .85, .3) * .6 },
    extra: (ctx, x, y, w, h, lt) => { if (lt > .3 && lt < .85) text(ctx, '……', x + w * .13, y + h * .5, 60, C.ink, { alpha: seg(lt, .3, .45) }); },
  });
  tint(ctx, COLD, .45);
  fill(ctx, '#0d1018', 1 - seg(lt, 0, .35));
}, 'ch5 page');
cue(52.05, 'pageflip'); cue(53.35, 'resolve');

// Clawd leaps at the viewer and splats against the inside of the glass, then slides down.
function splatInsert(ctx, kind, lt, o) {
  const tLeap = o.leap, tHit = o.hit;
  const sh = lt > tHit && lt < tHit + .35 ? shakeOff(30 * o.loud * (1 - seg(lt, tHit, tHit + .35))) : [0, 0];
  insert(ctx, kind, {
    bg: o.bg || '#5f6b80', c0: '#3a4660', c1: '#56637e', dx: sh[0], dy: sh[1],
    content(ctx, x, y, w, h) {
      if (kind === 'pc') desktop(ctx, x, y, w, h, { c0: '#334058', c1: '#46526d' });
      const cx = x + w / 2, base = y + h - 30, uMin = o.u0, uMax = o.u1;
      const pop = backOut(seg(lt, 0, .25));
      if (lt < tLeap) {
        const crouch = seg(lt, tLeap - .3, tLeap);
        clawd(ctx, cx, base, uMin * (o.pop ? pop : 1), { eyes: 'determined', sq: crouch * .25, aL: -.4 * crouch + .2, aR: -.4 * crouch + .2 });
      } else if (lt < tHit) {
        const k = easeIn(seg(lt, tLeap, tHit));
        clawd(ctx, cx, lerp(base, y + h * .78, k), lerp(uMin, uMax, k), { eyes: 'closed', mouth: 'smile', aL: 1.3, aR: 1.3, dy: Math.sin(k * Math.PI) * 2, blush: .6 });
      } else {
        const slide = easeIn(seg(lt, tHit + .3, tHit + 1.4));
        const yy = lerp(y + h * .78, y + h + uMax * 6, slide);
        // smear on the glass
        ctx.save(); ctx.globalAlpha = .18 * (1 - seg(lt, tHit + 1, tHit + 2)); ctx.fillStyle = C.white;
        ctx.fillRect(cx - uMax * 5, y + h * .78 - uMax * 8, uMax * 10, yy - y - h * .78 + uMax * 3); ctx.restore();
        clawd(ctx, cx, yy, uMax, { splat: 1 });
      }
      if (lt > tHit && lt < tHit + .9) text(ctx, o.word, cx + 300 * o.loud, y + h * .25, 70 + 110 * o.loud, C.white, { outline: 8 + 8 * o.loud, rot: -.12, alpha: 1 - seg(lt, tHit + .5, tHit + .9) });
    },
    over(ctx, x, y, w, h) {
      // glass ripple at impact
      const k = seg(lt, tHit, tHit + .5);
      if (k > 0 && k < 1) { ctx.beginPath(); ctx.arc(x + w / 2, y + h * .55, 100 + k * 700, 0, TAU); ctx.strokeStyle = rgba('#ffffff', .4 * (1 - k)); ctx.lineWidth = 10 * (1 - k); ctx.stroke(); }
    },
  });
  tint(ctx, COLD, .4);
}
shot(53.5, 55.5, (ctx, t, lt) => splatInsert(ctx, 'pc', lt, { leap: .3, hit: .65, u0: 26, u1: 70, loud: 1, word: '砰！' }), 'ch5 splat pc');
cue(53.8, 'leap'); cue(54.15, 'splat', { loud: 1 }); cue(54.6, 'squeak');
shot(55.5, 57, (ctx, t, lt) => splatInsert(ctx, 'tablet', lt, { leap: .45, hit: .75, u0: 22, u1: 58, loud: .6, word: '砰', pop: 1 }), 'ch5 splat tablet');
cue(55.5, 'pop'); cue(55.95, 'leap'); cue(56.25, 'splat', { loud: .6 }); cue(56.7, 'squeak');
shot(57, 58.5, (ctx, t, lt) => splatInsert(ctx, 'phone', lt, { leap: .4, hit: .65, u0: 22, u1: 34, loud: .25, word: '砰…', pop: 1 }), 'ch5 splat phone');
cue(57.0, 'pop'); cue(57.4, 'leap'); cue(57.65, 'splat', { loud: .3 });

// Clawd sits on the bottom edge of the screen, closes the book. The screen fades out.
shot(58.5, 62, (ctx, t, lt) => {
  insert(ctx, 'pc', {
    bg: '#4d586b', c0: '#2c3448', c1: '#3a4560',
    content(ctx, x, y, w, h) {
      desktop(ctx, x, y, w, h, { c0: '#2c3448', c1: '#3a4560' });
      const cx = x + w * .5, cy = y + h + 30;
      const close = ease(seg(lt, 1.1, 1.7));
      book(ctx, cx + 120, cy - 200, .36, { open: 1 - close, chap: '第五章', title: '给对方\n一个拥抱。', icon: ICONS.hug });
      clawd(ctx, cx - 160, cy, 30, { eyes: 'sad', mouth: 'frown', rot: .08, aR: .5, aL: .1, dy: -.2 });
      fill(ctx, '#000', 0);
      ctx.save(); ctx.globalAlpha = ease(seg(lt, 1.9, 3.2)); ctx.fillStyle = '#05070c'; ctx.fillRect(x, y, w, h); ctx.restore();
    },
  });
  tint(ctx, COLD, .4);
  fill(ctx, '#000', ease(seg(lt, 2.6, 3.5)));
}, 'ch5 alone');
cue(59.6, 'bookClose');
