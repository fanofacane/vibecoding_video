// human.js: the small human. One parametric rig drawn from the hip point (x, y).
// Standing feet sit HIP px below the hip at scale 1; the whole figure is about 300 px tall.
//
// o: s (scale), flip (true = faces left), rot (whole-body rotation about the hip),
//    legs: 'stand' | 'sit' | 'floor' | 'crouch' | 'none', walk (phase), kneeL/kneeR tweaks,
//    lean (torso tilt, + = forward), headTilt, headDy,
//    aF / aB: [shoulder, elbow] angles of the front / back arm, measured from straight down, + = forward,
//    eyes: 'dot' | 'closed' | 'squeeze' | 'spiral' | 'half' | 'wide' | 'happy' | 'zz',
//    mouth: 'none' | 'smile' | 'flat' | 'wavy' | 'o' | 'chew' | 'grimace' | 'drool', lookX, blush,
//    hair: 'messy' | 'poof', backpack, holdF(ctx) at the front hand, glow (screen light on the face, colour).

const HIP = 112;

function limb(ctx, pts, w, col) {
  const lk = LWK; LWK = 1;
  line(ctx, pts, { lw: w + 7, col: C.ink, j: 0 });
  line(ctx, pts, { lw: w, col, j: 0 });
  LWK = lk;
}
const polar = (x, y, a, len) => [x + Math.sin(a) * len, y + Math.cos(a) * len];

function human(ctx, x, y, o = {}) {
  const s = o.s ?? 1;
  ctx.save();
  ctx.translate(x, y);
  if (o.rot) ctx.rotate(o.rot);
  ctx.scale(s * (o.flip ? -1 : 1), s);
  const lk = LWK; LWK = lk / s;

  const lean = o.lean || 0, torso = 88;
  const sh = polar(0, 0, Math.PI - lean, torso);        // shoulder point (torso top)
  const legsMode = o.legs || 'stand';

  // legs
  const leg = (dx, front) => {
    const hx = dx, hy = 0;
    let knee, foot;
    if (legsMode === 'stand') {
      const ph = o.walk != null ? Math.sin((o.walk + (front ? 0 : .5)) * TAU) * .45 : 0;
      knee = polar(hx, hy, ph, 54); foot = polar(knee[0], knee[1], ph * .4 - (o.walk != null ? Math.max(0, -ph) * .6 : 0), 54);
    } else if (legsMode === 'sit') {
      knee = [hx + 54, hy + 4]; foot = [knee[0] + 6, knee[1] + 52];
    } else if (legsMode === 'floor') {
      knee = [hx + 50, hy - (front ? 14 : 6)]; foot = [knee[0] + 52, hy + 4];
    } else if (legsMode === 'crouch') {
      knee = [hx + 40, hy - 30]; foot = [hx + 30, hy + 48];
    } else return;
    limb(ctx, [[hx, hy], knee, foot], 30, C.pants);
    shape(ctx, ptsEll(foot[0] + 8, foot[1] + 2, 17, 9, 14), '#f2efe8', { lw: 3.5, j: .4 });
  };
  leg(-8, false); leg(8, true);

  // back arm
  const arm = (ang, shX, shY) => {
    const el = polar(shX, shY, ang[0], 44), hand = polar(el[0], el[1], ang[0] + ang[1], 40);
    return [[shX, shY], el, hand];
  };
  const aB = arm(o.aB || [.15, .2], sh[0] - 6, sh[1] + 12), aF = arm(o.aF || [-.1, .2], sh[0] + 6, sh[1] + 12);
  limb(ctx, aB, 24, C.hoodieDk); shape(ctx, ptsEll(aB[2][0], aB[2][1], 11, 11, 12), C.skinDk, { lw: 3.5, j: .3 });

  if (o.backpack) {
    ctx.save(); ctx.rotate(lean);
    shape(ctx, ptsRect(-62, -86, 40, 70, 12), '#7c6a8f', { lw: 4, j: .6 });
    ctx.restore();
  }
  // torso (hoodie)
  ctx.save(); ctx.rotate(lean);
  shape(ctx, [[-34, 8], [34, 8], [30, -torso + 6], [18, -torso - 4], [-18, -torso - 4], [-30, -torso + 6]], C.hoodie, { lw: 4.5, j: .8 });
  line(ctx, [[-14, -30], [14, -30]], { lw: 3, j: .4, col: rgba(C.ink, .6) });
  line(ctx, [[-6, -torso + 4], [-8, -torso + 30]], { lw: 3, j: .3 });
  line(ctx, [[6, -torso + 4], [8, -torso + 28]], { lw: 3, j: .3 });
  ctx.restore();

  // head
  const hc = polar(sh[0], sh[1], Math.PI - lean - (o.headTilt || 0) * .5, 44);
  hc[1] += o.headDy || 0;
  ctx.save(); ctx.translate(hc[0], hc[1]); ctx.rotate((o.headTilt || 0) + lean * .4);
  head(ctx, o);
  ctx.restore();

  // front arm
  limb(ctx, aF, 24, C.hoodie);
  shape(ctx, ptsEll(aF[2][0], aF[2][1], 11, 11, 12), C.skin, { lw: 3.5, j: .3 });
  if (o.holdF) { ctx.save(); ctx.translate(aF[2][0], aF[2][1]); o.holdF(ctx); ctx.restore(); }

  LWK = lk;
  ctx.restore();
}

function hairPts(r, poof, n = 26) {
  const p = [];
  if (poof) {               // exploded: spikes all round the top
    for (let i = 0; i <= n; i++) {
      const a = Math.PI * .92 + i / n * Math.PI * 1.16;
      const rr = r * (i % 2 ? 1.02 : 1.38 + hash(i * 3.1) * .22);
      p.push([Math.cos(a) * rr, Math.sin(a) * rr * 1.05 - 6]);
    }
  } else {                  // messy: soft bumps with a couple of stray tufts
    const m = 9;
    for (let i = 0; i <= m * 4; i++) {
      const a = Math.PI * .95 + i / (m * 4) * Math.PI * 1.1, ph = (i % 4) / 4;
      let rr = r * (1.06 + .1 * Math.sin(ph * Math.PI));
      if (i === 14 || i === 23) rr = r * 1.38;
      p.push([Math.cos(a) * rr, Math.sin(a) * rr - 2]);
    }
  }
  p.push([r * .9, -r * .05], [r * .55, -r * .4], [0, -r * .48], [-r * .5, -r * .36], [-r * .9, -r * .02]);
  return p;
}

function head(ctx, o) {
  const r = 48;
  shape(ctx, ptsEll(0, 0, r, r * .95, 30), C.skin, { lw: 4.5, j: .7 });
  if (o.glow) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(r * .7, 0, 0, r * .7, 0, r * 1.6); g.addColorStop(0, rgba(o.glow, .45)); g.addColorStop(1, rgba(o.glow, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); ctx.restore(); }
  shape(ctx, hairPts(r, o.hair === 'poof'), C.hair, { lw: 4, j: 1 });
  const lx = (o.lookX || 0) * 9 + 6, ey = 6;
  const e = o.eyes || 'dot';
  for (const ex of [-15, 15]) {
    const X = ex + lx;
    if (e === 'dot') dot(ctx, X, ey, 5, C.ink);
    else if (e === 'wide') { dot(ctx, X, ey, 7.5, C.ink); dot(ctx, X - 2, ey - 2.5, 2.2, C.white); }
    else if (e === 'closed' || e === 'zz') line(ctx, ptsQuad([X - 7, ey], [X, ey + 5], [X + 7, ey], 6), { lw: 3.5, j: 0 });
    else if (e === 'happy') line(ctx, ptsQuad([X - 7, ey + 3], [X, ey - 5], [X + 7, ey + 3], 6), { lw: 3.8, j: 0 });
    else if (e === 'half') { line(ctx, [[X - 7, ey - 2], [X + 7, ey - 2]], { lw: 3.5, j: 0 }); dot(ctx, X, ey + 1, 3.5, C.ink); }
    else if (e === 'squeeze') line(ctx, ex < 0 ? [[X - 6, ey - 6], [X + 5, ey], [X - 6, ey + 6]] : [[X + 6, ey - 6], [X - 5, ey], [X + 6, ey + 6]], { lw: 3.5, j: 0 });
    else if (e === 'spiral') { const p = []; for (let i = 0; i < 22; i++) { const a = i * .6 + T * 9 * (ex < 0 ? 1 : -1), rr = i / 22 * 8; p.push([X + Math.cos(a) * rr, ey + Math.sin(a) * rr]); } line(ctx, p, { lw: 2.5, j: 0 }); }
  }
  if (o.blush) for (const bx of [-24, 26]) shape(ctx, ptsEll(bx + lx, 20, 8, 4.5, 12), rgba(C.pinkDk, .45 * o.blush), { ink: null });
  const my = 26, mx = lx;
  const m = o.mouth || 'none';
  if (m === 'smile') line(ctx, ptsQuad([mx - 9, my - 2], [mx, my + 7], [mx + 9, my - 2], 8), { lw: 3.5, j: 0 });
  else if (m === 'flat') line(ctx, [[mx - 7, my], [mx + 7, my]], { lw: 3.5, j: 0 });
  else if (m === 'wavy') line(ctx, [[mx - 10, my], [mx - 5, my - 3], [mx, my], [mx + 5, my - 3], [mx + 10, my]], { lw: 3.2, j: 0 });
  else if (m === 'o') shape(ctx, ptsEll(mx, my + 1, 5, 6, 12), '#5a2430', { lw: 3, j: 0 });
  else if (m === 'big') shape(ctx, ptsEll(mx, my + 2, 9, 8, 14), '#5a2430', { lw: 3, j: 0 });
  else if (m === 'chew') { const k = Math.abs(Math.sin(T * 14)); shape(ctx, ptsEll(mx, my + 1, 7, 2 + 4 * k, 12), '#5a2430', { lw: 3, j: 0 }); }
  else if (m === 'grimace') { shape(ctx, ptsRect(mx - 10, my - 4, 20, 9, 3), C.white, { lw: 3, j: 0 }); line(ctx, [[mx - 10, my], [mx + 10, my]], { lw: 2, j: 0 }); }
  else if (m === 'drool') { line(ctx, [[mx - 6, my], [mx + 4, my + 2]], { lw: 3, j: 0 }); shape(ctx, ptsEll(mx + 6, my + 8, 3, 5, 10), '#bfe6ff', { lw: 2, j: 0 }); }
  if (o.sweat) shape(ctx, ptsEll(r * .85, -r * .5 + (o.sweat * 10), 5, 8, 12), '#9fd8f5', { lw: 2.5, j: 0 });
}

// Human asleep in bed: only the head on the pillow above the blanket edge, plus the blanket lump.
function humanInBed(ctx, x, y, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(o.s || 1, o.s || 1);
  ctx.save(); ctx.rotate(-1.35);
  head(ctx, { eyes: o.eyes || 'zz', mouth: o.mouth || 'drool', hair: o.hair || 'messy', lookX: .3 });
  ctx.restore();
  ctx.restore();
}

function zzz(ctx, x, y, s, t, a = 1) {
  for (let i = 0; i < 3; i++) {
    const k = ((t * .5 + i / 3) % 1);
    text(ctx, 'z', x + k * 40 * s + Math.sin(k * 6) * 6 * s, y - k * 70 * s, (18 + i * 6) * s, C.white, { alpha: a * Math.sin(k * Math.PI), outline: 4 * s });
  }
}
