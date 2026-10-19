// shots_c.js: the turn — the 100th way (62–80 s) and the ending, "just right" (80–90 s).

const EVENING = { col: '#ffd2a0', amt: .32 };
const AMBER = { col: '#ffae62', amt: .48 };
const SOFA_HIP = [4060, 792];

// Lying on the sofa, head to the left.
function sofaLying(ctx, o = {}) {
  human(ctx, SOFA_HIP[0], SOFA_HIP[1], { s: HS, rot: -1.42, legs: 'stand', aF: [.3, .3], aB: [-.2, .2], eyes: 'closed', mouth: 'flat', headTilt: .1, ...o });
}
// Sitting up on the sofa holding the phone. phone(ctx) draws the phone in the hand.
function sofaSitting(ctx, o = {}) {
  human(ctx, 3990, 772, { s: HS, legs: 'sit', aF: [2.15, .55], aB: [.3, .4], eyes: 'happy', mouth: 'smile', blush: .7, lookX: .6, headTilt: .08, ...o });
}
function handPhone(on = 1, heart = 0) {
  return c => {
    c.save(); c.rotate(-.25);
    shape(c, ptsRect(-14, -66, 44, 78, 8), '#2b2d36', { lw: 4 });
    if (on) {
      c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = rgba('#ffcf9a', .9 * on); c.fillRect(-10, -60, 36, 62); c.restore();
      glow(c, 8, -30, 90, '#ffcf9a', .5 * on);
      clawd(c, 8, -6, 2.4, { eyes: 'happy', heart });
    }
    c.restore();
  };
}

// ---------------------------------------------------------------- the 100th way
shot(62, 63.4, (ctx, t, lt) => {
  drawWorld(ctx, {
    cam: camLerp({ x: 2720, y: 660, z: 2.8 }, { x: 2700, y: 640, z: 2.5 }, ease(seg(lt, 0, 1.4))), sky: 'evening', grade: EVENING, phone: 'none',
    dev: { fridge: { letter: 1 } }, lamps: { k: 0 },
  });
  fill(ctx, '#000', 1 - ease(seg(lt, 0, 1.1)));
}, 'turn letter');
cue(62.0, 'pianoIn');

shot(63.4, 67, (ctx, t, lt) => {
  const door = ease(seg(t, 63.6, 64.0)) * (1 - ease(seg(t, 65.1, 65.5)));
  const cam = camLerp({ x: 4380, y: 640, z: 1.55 }, { x: 4080, y: 680, z: 1.7 }, ease(seg(t, 64.6, 66.6)));
  drawWorld(ctx, {
    cam, sky: 'evening', grade: EVENING, door, lamps: { l: 0 }, phone: PHONE_SPOTS.table,
    human: c => {
      if (t < 63.85) return;
      if (t < 65.0) {
        const k = seg(t, 63.85, 65.0);
        human(c, lerp(4720, 4170, k), STAND_Y, { s: HS, flip: true, walk: t * 1.6, lean: .32, eyes: 'half', mouth: 'flat', backpack: true, aF: [-.1, .1], aB: [.1, .1], headTilt: .15 });
      } else if (t < 65.55) {
        const k = easeIn(seg(t, 65.0, 65.55));
        human(c, lerp(4170, SOFA_HIP[0], k), lerp(STAND_Y, SOFA_HIP[1], k), { s: HS, flip: k < .3, rot: lerp(0, -1.42, k), eyes: 'closed', mouth: 'o', aF: [lerp(0, 2.4, k), .2], aB: [lerp(0, -2, k), .2] });
      } else {
        const bounce = Math.sin((t - 65.55) * 14) * 8 * Math.exp(-(t - 65.55) * 4);
        sofaLying(c, { headDy: bounce * .5, aF: [2.6, .3], aB: [.5, .2] });
      }
    },
    over: c => {
      if (t > 65.0) shape(c, ptsRect(4300, 846, 60, 74, 12), '#7c6a8f', { lw: 4 });   // dropped backpack
      if (t > 65.7 && t < 66.8) text(c, '呼——', 3880, 600 - (t - 65.7) * 30, 44, C.ink, { alpha: 1 - seg(t, 66.3, 66.8) });
    },
  });
}, 'turn home');
cue(63.6, 'door'); cue(64.0, 'steps'); cue(65.5, 'flop'); cue(65.2, 'doorClose');

const QUIET_HOPS = [[68.6, 'lampL'], [70.4, 'speakerL'], [72.2, 'ac'], [74.0, 'phone']];
// The living room during the quiet sequence. Shared by the wide shot and the AC close-up.
function quietState(t, cam) {
  const R = route(t, 'tablet', QUIET_HOPS);
  const dim = ease(seg(t, 68.9, 70.3));
  const S = {
    cam, sky: t < 70 ? 'evening' : 'dusk', grade: { col: mix(EVENING.col, AMBER.col, dim), amt: lerp(EVENING.amt, AMBER.amt, dim) },
    lamps: { l: lerp(.9, .5, dim) }, lampCol: mix('#fff3dc', '#ffc46b', dim),
    curt: { l: lerp(1, .5, ease(seg(t, 67.2, 68.4))) }, curtCol: '#e79a8c', phone: PHONE_SPOTS.table,
    dev: {
      tablet: { on: t < 68.8 },
      speakerL: { on: t > 70.8, ring: t > 70.8 ? .35 : 0, ringCol: '#ffc46b' },
      ac: { temp: 28 - Math.round(4 * seg(t, 72.7, 73.8)), wind: seg(t, 72.6, 73.4), on: true },
      phone: { on: t > 74 },
    },
    human: c => sofaLying(c, { headDy: Math.sin(t * 1.6) * 1.5 }),
    over: c => { shape(c, ptsRect(4300, 846, 60, 74, 12), '#7c6a8f', { lw: 4 }); },
    emit: c => {
      // the faint halo on the curtains while they move
      const k = pulse(t, 67.1, 1.5) * .3;
      if (k > 0) halo(c, 3680, 200, 480, 380, k);
      // tiny piano notes from the speaker
      if (t > 70.8) for (let i = 0; i < 3; i++) { const q = ((t - 70.8) * .35 + i / 3) % 1; note(c, 4300 + Math.sin(q * 5 + i) * 30, 690 - q * 160, 12, '#ffd59a', .1); }
    },
  };
  useRoute(S, R, { glow: .3, all: { eyes: 'look', lookX: -1, lookY: .4, fy: 1.32, size: .9 } });
  for (const n of ['lampL', 'speakerL']) if (S.dev[n]?.clawd) S.dev[n].clawd.size = .8;
  for (const h of S.hops) h.soft = 1;
  return S;
}

shot(67, 74, (ctx, t, lt) => {
  const wide = camLerp({ x: 3960, y: 560, z: 1.3 }, { x: 4020, y: 540, z: 1.38 }, seg(t, 67, 72));
  const cam = camLerp(wide, { x: 3960, y: 250, z: 2.6 }, ease(seg(t, 72.0, 72.7)));
  drawWorld(ctx, quietState(t, cam));
}, 'turn quiet');
QUIET_HOPS.forEach(([t0]) => cue(t0, 'hopSoft'));
cue(67.2, 'curtainSoft'); cue(68.9, 'dim'); cue(70.8, 'musicBox'); for (let i = 0; i < 4; i++) cue(72.85 + i * .28, 'beepSoft');

// Phone close-up: the alarm slides from 7:00 to 7:30. Half of Clawd peeks in from the corner.
shot(74, 76, (ctx, t, lt) => {
  const mins = 30 * ease(seg(lt, .5, 1.4));
  insert(ctx, 'phone', {
    bg: '#7a5236', glowK: .15,
    content(ctx, x, y, w, h) {
      alarmUI(ctx, x, y, w, h, mins, pulse(lt, .5, 1));
      const pk = easeOut(seg(lt, .1, .5));
      clawd(ctx, x + w * .8, y + h + 150 - pk * 110, 26, { eyes: lt > 1.5 ? 'happy' : 'look', lookX: -1, lookY: -.5 });
    },
  });
  tint(ctx, '#ffd9b0', .25);
}, 'turn alarm');
cue(74.5, 'scroll'); cue(75.4, 'tick');

shot(76, 80, (ctx, t, lt) => {
  const up = ease(seg(t, 78.0, 78.5));
  const push = easeIn(seg(t, 79.3, 80));
  const S = quietState(Math.min(t, 73.9), camLerp({ x: 3960, y: 700, z: 2.3 }, { x: 3990, y: 660, z: 2.5 }, seg(t, 76, 79)));
  S.dev.phone = { on: true };
  S.hops = []; for (const n in S.dev) if (S.dev[n].clawd) delete S.dev[n].clawd;
  S.dev.ac = { temp: 24, on: true };
  if (t > 78.0) S.phone = 'none';
  S.human = c => {
    if (up <= 0) {
      const open = t > 76.4, look = seg(t, 76.6, 77.7);
      sofaLying(c, { eyes: open ? (t > 77.7 ? 'happy' : 'dot') : 'closed', lookX: open ? Math.sin(look * TAU) : 0, mouth: t > 77.7 ? 'smile' : 'flat', blush: seg(t, 77.7, 78) * .6 });
    } else if (up < .5) {
      human(c, lerp(SOFA_HIP[0], 3990, up), lerp(SOFA_HIP[1], 772, up), { s: HS, rot: lerp(-1.42, 0, up * 2), legs: 'stand', eyes: 'happy', mouth: 'smile', aF: [1.4, .5], aB: [.3, .3] });
    } else sofaSitting(c, { mouth: t > 78.7 && t < 79.6 ? (Math.sin(t * 18) > 0 ? 'o' : 'smile') : 'smile', holdF: handPhone(1, seg(t, 79.4, 79.9)) });
  };
  zoomAbout(ctx, 1 + push * 1.6, W * .52, H * .42, () => drawWorld(ctx, S));
  caption(ctx, '谢谢你，Clawd。', seg(t, 78.6, 78.9) * (1 - seg(t, 79.7, 80)));
  fill(ctx, '#ffcf9a', push);
}, 'turn thanks');
cue(76.4, 'eyesOpen'); cue(78.6, 'thanks');

// ---------------------------------------------------------------- ending · just right
shot(80, 84, (ctx, t, lt) => {
  const rise = easeOut(seg(lt, 1.0, 1.8)), touch = lt > 1.8, hug = ease(seg(lt, 2.0, 2.6));
  const out = ease(seg(lt, 3.3, 4));
  fill(ctx, '#5a3a28');
  zoomAbout(ctx, 1 - out * .25, W / 2, H / 2, () => insert(ctx, 'phone', {
    bg: '#5a3a28', c0: '#ffd7a6', c1: '#f2a468', glowK: .2,
    content(ctx, x, y, w, h) {
      for (let i = 0; i < 10; i++) { const k = ((T * .15 + hash(i)) % 1); shape(ctx, ptsHeart(x + hash(i * 3) * w, y + h - k * h, 12 + hash(i) * 10), rgba('#ffffff', .35 * Math.sin(k * Math.PI)), { ink: null }); }
      const cx = x + w / 2, cy = y + 880;
      clawd(ctx, cx, cy, 34, {
        eyes: hug > .5 ? 'closed' : 'happy', mouth: 'smile', blush: .4 + hug * .5, heart: seg(lt, .3, 1.2), heartFade: 1 - seg(lt, 1.6, 2),
        sq: hug * .06, aL: hug > 0 ? -.6 : .3 + pulse(lt, .2, .6), aR: hug > 0 ? -.6 : .3 + pulse(lt, .2, .6),
      });
      if (hug > .6) for (let i = 0; i < 4; i++) { const k = ((T * .5 + i / 4) % 1); shape(ctx, ptsHeart(cx + (i - 1.5) * 90, cy - 330 - k * 260, 20), C.pinkDk, { lw: 3, j: 0, alpha: Math.sin(k * Math.PI) }); }
    },
    over(ctx, x, y, w, h) {
      // the human's finger, outside the glass
      const tipY = lerp(H + 260, 800, rise), cx = x + w / 2;
      if (rise > 0) {
        const press = touch ? 1 : 0;
        if (touch) { const k = seg(lt, 1.8, 2.6); ctx.beginPath(); ctx.arc(cx, tipY + 50, 90 + k * 160, 0, TAU); ctx.strokeStyle = rgba('#ffffff', .5 * (1 - k)); ctx.lineWidth = 6; ctx.stroke(); }
        shape(ctx, [[cx - 82, H + 300], [cx - 82, tipY + 70], [cx - 70, tipY + 10 + press * 6], [cx, tipY - 4 + press * 8], [cx + 70, tipY + 10 + press * 6], [cx + 82, tipY + 70], [cx + 82, H + 300]], C.skin, { lw: 7, j: 1 });
        shape(ctx, ptsRect(cx - 44, tipY + 26, 88, 70, 30), '#fbe6d6', { lw: 4 });
        line(ctx, [[cx - 50, tipY + 210], [cx + 40, tipY + 214]], { lw: 4, col: rgba(C.ink, .4) });
        glow(ctx, cx, tipY + 40, 200, '#ffe6c4', touch ? .5 : 0);
      }
      // Clawd's two paws around the finger
      if (hug > 0) for (const sx of [-1, 1]) {
        const px = cx + sx * lerp(150, 84, hug), py = tipY + 70;
        shape(ctx, ptsRect(px - 30, py - 22, 60, 44, 18), C.clay, { lw: 6 });
      }
    },
  }));
  fill(ctx, '#ffcf9a', 1 - seg(lt, 0, .5));
}, 'end finger');
cue(80.3, 'sparkle'); cue(81.8, 'touch'); cue(82.2, 'hug');

const ALL_SCREENS = ['pc', 'tv', 'tablet', 'fridge', 'phone', 'printer', 'micro', 'coffee', 'ac'];
shot(84, 90, (ctx, t, lt) => {
  const k = ease(seg(t, 83.9, 87.4));
  const cam = camLerp({ x: 4000, y: 700, z: 2.4 }, { x: 2400, y: 540, z: .37 }, k);
  const breath = .5 + .5 * Math.sin((t - 84) / 2.6 * TAU - Math.PI / 2);
  const dev = {};
  for (const n of ALL_SCREENS) dev[n] = { on: true, scr: (c, x, y, w, h) => { c.fillStyle = rgba('#ffcf8a', .35 + .5 * breath); c.fillRect(x, y, w, h); }, glow: .25 + .35 * breath };
  dev.fridge.letter = 1; dev.ac.temp = 24;
  dev.speakerL = { on: true, ring: .3 + .5 * breath, ringCol: '#ffc46b', glow: .2 + .3 * breath };
  dev.speakerB = { on: true, ring: .3 + .5 * breath, ringCol: '#ffc46b', glow: .2 + .3 * breath };
  drawWorld(ctx, {
    cam, sky: 'night', grade: AMBER, lamps: { l: .45, b: 0, k: 0 }, lampCol: '#ffc46b', curt: { l: .5, b: .2 }, phone: 'none', dev,
    human: c => sofaSitting(c, { eyes: 'happy', holdF: handPhone(.6 + .4 * breath) }),
    over: c => { shape(c, ptsRect(4300, 846, 60, 74, 12), '#7c6a8f', { lw: 4 }); },
  });
  // the line of handwriting
  const dark = ease(seg(t, 87.3, 88.2));
  fill(ctx, '#140c08', dark * .82);
  const msg = '第 100 种方法：刚刚好。', chars = [...msg], n = Math.floor(seg(t, 87.9, 89.0) * chars.length + .001);
  if (n > 0) {
    glow(ctx, W / 2, H / 2, 600, '#ffb060', .25 * dark);
    ctx.font = `104px ${FONT}`; const fw = ctx.measureText(msg).width;
    text(ctx, chars.slice(0, n).join(''), W / 2 - fw / 2, H / 2, 104, '#ffe6c2', { align: 'left' });
  }
  fill(ctx, '#000', ease(seg(t, 89.2, 90)));
}, 'end pull back');
cue(84.2, 'breath'); cue(87.9, 'write');
