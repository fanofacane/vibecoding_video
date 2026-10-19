// shots_a.js: opening (0–8 s), chapter 1 wake-up (8–18 s), chapter 2 breakfast (18–28 s).

const HS = 1.35;                       // human scale in the world
const STAND_Y = FLOOR - HIP * HS;      // hip height when standing on the floor
const NIGHT = { col: '#3a4890', amt: .9 };

// Human asleep at the desk, head on folded arms, lit by the monitor.
function deskSleeper(ctx, o = {}) {
  human(ctx, 3350, 772, {
    s: HS, flip: true, legs: 'sit', lean: .78, headTilt: -.45, headDy: -4,
    aB: [1.5, -2.7], aF: [1.4, -2.8], eyes: o.eyes || 'zz', mouth: 'drool', glow: o.glow ?? '#9fb6ff', ...o,
  });
}

// ---------------------------------------------------------------- 0 · night search
shot(0, 3, (ctx, t, lt) => {
  const cam = camLerp({ x: 3200, y: 600, z: 1.7 }, { x: 3190, y: 560, z: 2.5 }, ease(seg(lt, .3, 3)));
  drawWorld(ctx, {
    cam, sky: 'night', grade: NIGHT, curt: { b: .2, l: .25 },
    dev: { pc: { on: true, scr: (c, x, y, w, h) => desktop(c, x, y, w, h) } },
    phone: 'none',
    human: c => deskSleeper(c),
    emit: c => { glow(c, 3190, 540, 380, '#8fa8ff', .55); zzz(c, 3270, 560, 1.4, t); },
  });
  vignette(ctx, .6);
  fill(ctx, '#000', 1 - seg(lt, 0, 1.4));
}, 'night desk');

// Clawd peeks out, types the question, presses enter.
const Q = '怎么爱一个人';
shot(3, 5.5, (ctx, t, lt) => {
  const peek = easeOut(seg(lt, .05, .55)), look = seg(lt, .55, .75) - seg(lt, 1.0, 1.15);
  const nTyped = Math.floor(seg(lt, 1.1, 2.1) * Q.length + .001), enter = lt > 2.2;
  insert(ctx, 'pc', {
    bg: '#141a33', c0: '#1c2546', c1: '#2f2a55',
    content(ctx, x, y, w, h) {
      desktop(ctx, x, y, w, h);
      const box = backOut(seg(lt, .8, 1.1));
      if (box > 0) { ctx.save(); ctx.translate(x + w * .6, y + h * .45); ctx.scale(box, box); searchBox(ctx, 0, 0, 1.15, Q.slice(0, nTyped), !enter, enter && lt < 2.4); ctx.restore(); }
      const typing = lt > 1.1 && lt < 2.1;
      const cxw = lerp(x + w * .14, x + w * .24, ease(seg(lt, .8, 1.05)));
      clawd(ctx, cxw, y + h + lerp(300, 0, peek) - 10, 34, {
        eyes: lt < 1.15 ? 'look' : 'normal', lookX: look > 0 ? look : (lt > 1.1 ? .6 : 0), lookY: lt < 1.1 ? .5 : 0,
        aL: typing ? .6 + Math.sin(T * 40) * .4 : .1, aR: typing ? .6 + Math.cos(T * 40) * .4 : (enter && lt < 2.5 ? 1.2 : .1),
        mouth: lt > .5 && lt < 1 ? 'o' : null, dy: enter && lt < 2.45 ? .6 : 0,
      });
      if (lt > .5 && lt < 1.05) text(ctx, '嘘…', cxw + 220, y + h - 330, 56, rgba('#ffffff', .8));
    },
  });
  vignette(ctx, .5);
}, 'search');
for (let i = 0; i < Q.length; i++) cue(4.1 + i * 1 / Q.length, 'key');
cue(5.2, 'enter');
cue(3.1, 'peek');

// The pink book pops up; star eyes; pixel glasses; the cover opens.
shot(5.5, 8, (ctx, t, lt) => {
  const pop = backOut(seg(lt, 0, .35)), open = ease(seg(lt, 1.75, 2.25));
  const gl = ease(seg(lt, 1.25, 1.6)), reach = seg(lt, .75, 1.05) - seg(lt, 1.2, 1.4);
  const push = easeIn(seg(lt, 2.15, 2.5));
  zoomAbout(ctx, 1 + push * .25, W * .58, H * .5, () => insert(ctx, 'pc', {
    bg: '#141a33', c0: '#1c2546', c1: '#2f2a55',
    content(ctx, x, y, w, h) {
      desktop(ctx, x, y, w, h);
      ctx.save(); ctx.translate(x + w * .58, y + h * .5); ctx.scale(pop, pop);
      glow(ctx, 0, 0, 520, C.pink, .5 * pop);
      book(ctx, -380 * .9 * (1 - open) * 0 + 0, 0, .9, { open, chap: '第一章', title: '', icon: ICONS.alarm });
      ctx.restore();
      const star = lt > .3 && lt < 1.3;
      clawd(ctx, x + w * .17, y + h * .9, 26, {
        eyes: star ? 'star' : 'look', lookX: 1, dy: star ? Math.abs(Math.sin(lt * 9)) * 1.2 : 0, mouth: star ? 'open' : 'smile',
        aR: reach > 0 ? 1.4 * reach : .2, aL: star ? 1 : .2, glasses: gl,
        holdR: reach > .3 && gl < .1 ? (c, u) => { c.save(); c.rotate(-.3); c.fillStyle = C.ink; c.fillRect(-u, -2.6 * u, 2 * u, .5 * u); c.fillRect(1.4 * u, -2.6 * u, 2 * u, .5 * u); c.restore(); } : null,
      });
      if (star) for (let i = 0; i < 5; i++) { const k = (lt * 1.4 + i / 5) % 1; shape(ctx, ptsStar(x + w * .17 + Math.cos(i * 1.3) * 200 * k, y + h * .6 - k * 160, 16 * (1 - k)), C.yellow, { lw: 3, j: 0 }); }
    },
  }));
  fill(ctx, '#fffaf2', push * .9);
}, 'book appears');
cue(5.5, 'pop'); cue(5.8, 'sparkle'); cue(6.8, 'glint'); cue(7.3, 'pageflip');

// ---------------------------------------------------------------- chapter 1 · wake up gently
shot(8, 9.5, (ctx, t, lt, dur) => {
  chapterPage(ctx, lt, dur, {
    dev: 'pc', bg: '#2a2f4a', chap: '第一章', title: '温柔地\n叫醒对方。', icon: ICONS.alarm,
    clawd: lt => ({ dy: lt > .9 ? Math.abs(Math.sin((lt - .9) * 10)) * .5 : 0, eyes: lt > .9 ? 'happy' : 'look', mouth: 'smile', aR: lt > .9 ? .5 : .2 }),
  });
  fill(ctx, '#fffaf2', 1 - seg(lt, 0, .3));
  // the page melts into morning light
  const k = seg(lt, 1.1, 1.5);
  fill(ctx, '#fff6dc', easeIn(k));
}, 'ch1 page');
cue(8.0, 'pageflip'); cue(8.9, 'nod');

const BED_CAM = { x: 790, y: 520, z: 1.2 };
// close on the nightstand for the alarm and the speaker, then wide for curtains and lamp
const bedCam = t => camLerp(camLerp({ x: 720, y: 640, z: 1.6 }, { x: 760, y: 660, z: 1.75 }, seg(t, 9.5, 11.4)), BED_CAM, ease(seg(t, 11.45, 11.95)));
function blanket(ctx, lump = 0) {
  shape(ctx, [[330, 770], [480, 742], [700, 750 - lump * 10], [880, 748], [990, 762], [1000, 860], [320, 862]], '#9cc3e6', { lw: 5, j: 1.5 });
  for (let i = 0; i < 4; i++) line(ctx, [[420 + i * 150, 770], [440 + i * 150, 850]], { lw: 3, col: rgba(C.ink, .25), j: 1 });
}
function bedHuman(ctx, o = {}) {
  shape(ctx, ptsRect(220, 712, 170, 64, 30), C.white, { lw: 5 });   // pillow
  humanInBed(ctx, 300, 716, { s: HS * .95, ...o });
  blanket(ctx, o.lump || 0);
}
// Morning grading: dim blue before the curtains open, bright after.
function morningGrade(t) {
  const k = ease(seg(t, 12.0, 12.4));
  return { col: mix('#8d93c4', '#fff4e6', k), amt: lerp(.85, .2, k) };
}

shot(9.5, 16.5, (ctx, t, lt) => {
  const R = route(t, 'phone', [[10.5, 'speakerB'], [11.5, 'curtainSw'], [12.5, 'lampB'], [15.6, 'phone']]);
  const boom = pulse(t, 11.0, .9);
  const S = {
    cam: camShake(bedCam(t), boom * 30 + pulse(t, 14.2, .4) * 40 + pulse(t, 12.0, .3) * 12), sky: 'day',
    grade: morningGrade(t), curt: { b: ease(seg(t, 12.0, 12.35)), l: 1 },
    lamps: { b: easeIn(seg(t, 13.0, 13.7)) },
    dev: {
      phone: { ring: t > 9.9 && t < 10.6, on: true, scr: t > 9.9 && t < 10.6 ? (c, x, y, w, h) => { c.fillStyle = '#f7c25a'; c.fillRect(x, y, w, h); } : null },
      speakerB: { boom, ring: t > 10.9 && t < 12 ? 1 : 0, ringCol: C.glow, on: t > 10.9 },
      curtainSw: { on: t > 11.9 },
    },
    human: c => {
      if (t < 14.0) bedHuman(c, { eyes: t > 11.0 && t < 12 ? 'squeeze' : t > 12.1 ? 'squeeze' : 'zz', mouth: t > 11 ? 'wavy' : 'drool', lump: boom });
      else {
        // tumble out of bed and land on the floor
        shape(c, ptsRect(220, 712, 170, 64, 30), C.white, { lw: 5 });
        const k = seg(t, 14.0, 14.45);
        blanket(c, 0);
        if (k < 1) human(c, lerp(500, 640, k), lerp(720, 970, easeIn(k)), { s: HS, rot: lerp(-1.3, .2, k) + Math.sin(k * 9) * .3, legs: 'floor', hair: 'poof', eyes: 'wide', mouth: 'o', aF: [2.6, .3], aB: [-2.4, -.3] });
        else {
          const wob = Math.sin((t - 14.45) * 7) * .08 * Math.exp(-(t - 14.45) * .8);
          human(c, 640, 965, { s: HS, legs: 'floor', hair: 'poof', eyes: 'spiral', mouth: 'wavy', lean: -.1 + wob, headTilt: wob * 2, aF: [.9, .4], aB: [-.5, .3] });
          for (let i = 0; i < 4; i++) { const a = (t - 14.45) * 3 + i * TAU / 4; shape(c, ptsStar(700 + Math.cos(a) * 110, 660 + Math.sin(a) * 26, 16), C.yellow, { lw: 3, j: 0 }); }
        }
      }
    },
    over: c => {
      // the blasting symphony
      if (t > 10.9 && t < 12.1) for (let i = 0; i < 12; i++) {
        const k = ((t - 10.9) * 1.6 + i / 12) % 1, a = -2.6 + hash(i) * 2.2;
        note(c, 1146 + Math.cos(a) * 420 * k, 720 + Math.sin(a) * 330 * k, 24 + 14 * hash(i + 3), [C.red, C.purple, C.blue, C.pinkDk][i % 4], Math.sin(t * 10 + i) * .4);
      }
      if (t > 9.9 && t < 10.6) for (let i = 0; i < 3; i++) { const k = ((t - 9.9) * 2 + i / 3) % 1; note(c, 1090 + k * 60, 690 - k * 70, 14, C.ink, .2); }
      if (t > 10.9 && t < 12.0) for (let i = 0; i < 3; i++) { const k = ((t - 10.9) * 2.5 + i / 3) % 1; c.beginPath(); c.arc(1146, 740, 60 + k * 300, 0, TAU); c.strokeStyle = rgba(C.ink, .4 * (1 - k)); c.lineWidth = 6; c.stroke(); }
      if (t > 10.95 && t < 11.7) text(c, '咚——锵！！', 1150, 560, 70, C.yellow, { outline: 10, rot: -.08 + Math.sin(t * 30) * .03 });
      if (t > 9.95 && t < 10.55) text(c, '叮铃…', 1100, 640, 34, C.white, { outline: 6 });
      if (t > 14.42 && t < 15) text(c, '咚！', 760, 820, 80, C.white, { outline: 12, alpha: 1 - seg(t, 14.8, 15) });
    },
    emit: c => {
      // sunbeam once the curtains open
      const k = seg(t, 12.0, 12.4);
      if (k > 0) {
        c.save(); c.globalCompositeOperation = 'lighter';
        const g = c.createLinearGradient(640, 200, 520, 900); g.addColorStop(0, rgba('#fff2c0', .55 * k)); g.addColorStop(1, rgba('#fff2c0', 0));
        c.fillStyle = g; c.beginPath(); c.moveTo(430, 200); c.lineTo(860, 200); c.lineTo(760, 920); c.lineTo(160, 920); c.fill(); c.restore();
      }
    },
  };
  useRoute(S, R, { all: { eyes: 'look', lookX: -1, glasses: 0 } });
  if (S.dev.lampB?.clawd) Object.assign(S.dev.lampB.clawd, { eyes: t > 13.4 ? 'squeeze' : 'look', lookX: 0, lookY: 1 });
  if (S.dev.phone?.clawd && t > 15.5) Object.assign(S.dev.phone.clawd, { eyes: 'normal', sweat: seg(t, 15.8, 16.4) });
  drawWorld(ctx, S);
  // overexposure flash from the lamp
  const wf = seg(t, 13.3, 13.95) * (1 - seg(t, 14.0, 14.7));
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; fill(ctx, '#fff3d0', easeIn(wf)); ctx.restore();
  fill(ctx, '#ffffff', easeIn(seg(t, 13.6, 13.95)) * (1 - seg(t, 14.0, 14.6)));
  fill(ctx, '#fff6dc', 1 - seg(lt, 0, .5));
}, 'ch1 bedroom');
cue(10.0, 'alarm'); cue(10.5, 'hop'); cue(11.0, 'symphony'); cue(11.5, 'hop'); cue(12.0, 'curtain'); cue(12.5, 'hop');
cue(13.0, 'lampup'); cue(14.0, 'tumble'); cue(14.42, 'thud'); cue(14.6, 'dizzy'); cue(15.6, 'hop');

// Phone close-up: sweat drop, volume down one notch, then off to the kitchen.
shot(16.5, 18, (ctx, t, lt) => {
  const level = lt < .55 ? 10 : 9, out = seg(lt, .95, 1.4);
  insert(ctx, 'phone', {
    bg: '#f4e9d8', c0: '#3a2f5c', c1: '#6b4f8f',
    content(ctx, x, y, w, h) {
      volumeUI(ctx, x, y, w, h, level);
      if (lt > .5 && lt < .9) text(ctx, '－1', x + w * .78, y + h * .22, 60, C.glow, { outline: 8 });
      const s = 1 - easeIn(seg(out, 0, .35));
      clawd(ctx, x + w / 2, y + h * .78, 36 * s, { eyes: lt < .5 ? 'wide' : 'closed', mouth: 'wavy', sweat: seg(lt, 0, .8), aR: lt > .35 && lt < .7 ? 1.3 : .2, aL: .1, blush: .6 });
      if (out > .3) {
        const k = seg(out, .3, 1), px = lerp(x + w / 2, x + w + 300, k), py = y + h * .6 - Math.sin(k * Math.PI) * 400;
        glow(ctx, px, py, 120, C.glow, 1); dot(ctx, px, py, 16, '#fff3d6');
      }
    },
  });
  if (out > .3) { // the Wi-Fi arc leaving towards the kitchen
    const k = seg(out, .3, 1);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.setLineDash([24, 18]); ctx.lineDashOffset = -T * 300;
    ctx.beginPath(); const p = ptsQuad([960, 900], [1500, 100], [2300, 500], 30);
    p.slice(0, Math.ceil(30 * k) + 1).forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]));
    ctx.strokeStyle = rgba(C.glow, .8); ctx.lineWidth = 8; ctx.stroke(); ctx.restore();
  }
}, 'ch1 volume');
cue(17.05, 'tick'); cue(17.45, 'hop');

// ---------------------------------------------------------------- chapter 2 · a breakfast full of love
shot(18, 19.5, (ctx, t, lt, dur) => {
  chapterPage(ctx, lt, dur, {
    dev: 'fridge', bg: '#e9dcc0', chap: '第二章', title: '做一份\n爱心早餐。', icon: ICONS.toast,
    clawd: lt => ({ eyes: lt > .9 ? 'star' : 'look', mouth: lt > .9 ? 'open' : 'smile', aL: lt > .9 ? 1.2 : .2, aR: lt > .9 ? 1.2 : .2 }),
  });
  fill(ctx, '#fff', 1 - seg(lt, 0, .25));
}, 'ch2 page');
cue(18.0, 'pageflip');

const KITCHEN_CAM = { x: 2170, y: 610, z: 1.45 };
const TOAST_SLOT = [1735, 612];
const TOASTS = Array.from({ length: 9 }, (_, i) => ({ t0: 22.0 + i * .34, vx: (hash(i * 3.3) - .5) * 900, spin: (hash(i * 9.1) - .5) * 14, land: i === 8 }));
// Toast i at time t: up to the ceiling, bounce, fall to the counter or floor. The last one lands on the plate.
function toastPos(tt, i) {
  const q = TOASTS[i], dt = tt - q.t0;
  if (dt < 0) return null;
  const up = .32;
  if (dt < up) { const k = dt / up; return [TOAST_SLOT[0] + q.vx * .15 * k, lerp(TOAST_SLOT[1], CEIL + 30, easeOut(k)), q.spin * dt]; }
  const d2 = dt - up;
  if (q.land) { const k = clamp(d2 / .9); return [lerp(TOAST_SLOT[0] + q.vx * .15, 2460, k), lerp(CEIL + 30, 668, easeIn(k)) - Math.sin(k * Math.PI) * 120, lerp(q.spin * up, 0, k) + (k < 1 ? Math.sin(k * 20) * .3 : 0)]; }
  const x = TOAST_SLOT[0] + q.vx * (.15 + d2 * .9), y = Math.min(FLOOR + 30, CEIL + 30 + 1400 * d2 * d2);
  return [x, y, q.spin * (up + Math.min(d2, .7))];
}

shot(19.5, 25.5, (ctx, t, lt) => {
  const R = route(t, 'fridge', [[19.95, 'toaster'], [20.6, 'coffee'], [21.25, 'micro']]);
  const chaos = seg(t, 22, 22.4);
  const S = {
    cam: camShake(camLerp(KITCHEN_CAM, { x: 2120, y: 520, z: 1.2 }, ease(seg(t, 21.8, 22.6))), chaos * 10 + pulse(t, 25.15, .3) * 12),
    sky: 'day', grade: { col: '#ffd3a1', amt: .32 }, lamps: { k: .6 },
    dev: {
      fridge: { open: ease(seg(t, 19.55, 19.85)) * (1 - ease(seg(t, 21.0, 21.3))) },
      toaster: { on: t > 20.4, glow: t > 20.4 ? .8 : 0, scr: (c, x, y, w, h) => { c.fillStyle = C.red; c.fillRect(x, y, w, h); } },
      coffee: { on: t > 21.05, glow: t > 21.05 ? .8 : 0 },
      micro: { on: t > 21.7, glow: t > 21.7 ? .8 : 0, scr: (c, x, y, w, h) => text(c, t > 22.4 ? '叮!' : '0:3' + Math.max(0, 9 - Math.floor((t - 21.7) * 4)), x + w / 2, y + h / 2, 18, '#7dffa8') },
    },
    phone: 'none',
    human: c => {
      if (t < 22.3) return;
      const k = seg(t, 22.3, 22.8);
      const x = lerp(1430, 1590, easeOut(k));
      human(c, x, STAND_Y, { s: HS, walk: k < 1 ? t * 2.5 : null, aF: [3.0, .6], aB: [2.9, .7], eyes: 'squeeze', mouth: 'wavy', hair: 'poof', lean: -.08, headTilt: Math.sin(t * 12) * .06 });
    },
    over: c => {
      // coffee: stream, overflowing cup, counter spill, drips, floor puddle
      if (t > 21.05) {
        const pour = seg(t, 21.1, 21.3);
        line(c, [[1935, 626], [1935, 626 + 50 * pour]], { lw: 8, col: C.coffee, j: .5 });
        shape(c, ptsRect(1912, 652, 46, 44, 8), C.white, { lw: 4 });
        const over = seg(t, 22.0, 25.5);
        if (over > 0) {
          shape(c, ptsEll(1935, 694, 40 + 300 * over, 9, 20), C.coffee, { lw: 3.5 });
          for (let i = 0; i < 4; i++) { const k = ((t * 1.7 + i / 4) % 1); dot(c, 1915 + i * 12, 650 - k * 30, 5 * (1 - k), rgba('#ffffff', .7)); }
          for (let i = 0; i < 3; i++) { const dx = [1880, 2010, 2150][i], dk = seg(t, 22.6 + i * .4, 23.3 + i * .4); if (dk > 0) line(c, [[dx, 702], [dx + 4, 702 + 215 * dk]], { lw: 14, col: C.coffee, j: .8 }); }
          shape(c, ptsEll(2010, 938, 20 + 300 * seg(t, 23, 25.5), 18, 22), C.coffee, { lw: 3.5 });
        }
      }
      // plate
      shape(c, ptsEll(2460, 684, 70, 12, 20), C.white, { lw: 4 });
      // toasts
      for (let i = 0; i < TOASTS.length; i++) {
        const p = toastPos(t, i);
        if (p) toastShape(c, p[0], p[1], 64, p[2], i === 8, 0, .8);
      }
      // microwave dings
      if (t > 22.4) for (let i = 0; i < 6; i++) { const t0 = 22.4 + i * .5, k = seg(t, t0, t0 + .45); if (k > 0 && k < 1) text(c, '叮！', 2180 + (hash(i) - .5) * 220, 560 - k * 90, 46, C.yellow, { outline: 8, alpha: 1 - k * k }); }
    },
  };
  useRoute(S, R, { all: { eyes: 'happy', mouth: 'smile' } });
  if (S.dev.micro) S.dev.micro.shake = t > 22.4;
  drawWorld(ctx, S);
  fill(ctx, '#fff', 1 - seg(lt, 0, .2));
}, 'ch2 kitchen');
cue(19.55, 'fridge'); cue(19.95, 'hop'); cue(20.4, 'toasterOn'); cue(20.6, 'hop'); cue(21.05, 'beepOn'); cue(21.1, 'pour'); cue(21.25, 'hop'); cue(21.7, 'microOn');
TOASTS.forEach((q, i) => { cue(q.t0, 'toastPop', { pitch: i }); if (!q.land) cue(q.t0 + .32, 'bonk', { soft: 1 }); });
for (let i = 0; i < 6; i++) cue(22.4 + i * .5, 'ding');
cue(25.1, 'plate');

// Close-up: the heart-scorched toast, a bite, a complicated face; Clawd waits on the fridge screen.
shot(25.5, 28, (ctx, t, lt) => {
  const lift = ease(seg(t, 26.0, 26.5)), bite = t > 26.85 ? 1 : 0;
  const S = {
    cam: camLerp({ x: 2470, y: 640, z: 2.6 }, { x: 2500, y: 600, z: 2.2 }, ease(seg(t, 25.5, 28))), sky: 'day', grade: { col: '#ffd3a1', amt: .32 }, lamps: { k: .6 },
    dev: { fridge: { on: true, clawd: { s: 1, eyes: t > 26.9 ? 'wide' : 'look', lookX: -1, mouth: 'o', dy: t > 26.9 ? Math.abs(Math.sin(t * 8)) * .4 : 0, aL: .6, aR: .6 }, glow: .5 } },
    phone: 'none',
    under: c => {
      shape(c, ptsEll(2010, 935, 260, 14, 22), C.coffee, { lw: 3 });
      toastShape(c, 1840, 905, 60, .4, false, 0, .8); toastShape(c, 2700, 912, 60, -1.2, false, 0, .8);
    },
    human: c => {
      const ty = lerp(668, 0, 0);
      human(c, 2350, STAND_Y, {
        s: HS, aF: [lerp(.3, 2.4, lift), lerp(.3, .9, lift)], aB: [.1, .2], hair: 'poof',
        eyes: t < 26.9 ? 'dot' : 'half', mouth: t < 26.85 ? 'flat' : t < 27.6 ? 'chew' : 'wavy', lookX: t < 26 ? .8 : .3, sweat: t > 27.3 ? seg(t, 27.3, 28) : 0,
        holdF: lift > .02 ? c2 => toastShape(c2, 18, -10, 64, -.3, true, bite, .8) : null,
      });
    },
    over: c => {
      shape(c, ptsEll(2460, 684, 70, 12, 20), C.white, { lw: 4 });
      if (lift <= .02) toastShape(c, 2460, 668, 64, 0, true, 0, .8);
      if (t > 26.85 && t < 27.5) for (let i = 0; i < 6; i++) { const k = seg(t, 26.85, 27.4); dot(c, 2420 + i * 9 + k * 30 * (hash(i) - .5), 470 + k * 120 + i * 4, 3, C.toastDk); }
      if (t > 27.3) text(c, '……', 2300, 360, 54, C.ink);
    },
  };
  drawWorld(ctx, S);
}, 'ch2 toast');
cue(26.9, 'crunch'); cue(27.2, 'crunch'); cue(27.45, 'crunch'); cue(27.75, 'hop');
