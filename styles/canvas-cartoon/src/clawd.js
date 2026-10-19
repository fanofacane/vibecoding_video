// clawd.js: Clawd, drawn with Canvas 2D. Same blocky silhouette as the ClawdVideo Clawd:
// a 10u × 6u body, four stubby legs, two upright slit eyes, little side arms.
// (x, y) is the ground point between the feet; the body spans x -5u..5u, y -8u..-2u.
//
// o: eyes ('normal' | 'look' | 'star' | 'happy' | 'wide' | 'closed' | 'sad' | 'squeeze' | 'determined' | 'spiral'),
//    lookX/lookY (-1..1), glasses (0..1 how far on), mouth ('o' | 'smile' | 'open' | 'wavy' | 'flat'),
//    aL/aR arm angles (0 sideways, + raised), sq (squash, + flatter), dy (hop, in u, + up), rot, flip,
//    blush, sweat (0..1), heart (0..1 small heart above), splat (0..1 pressed flat against glass),
//    holdR(ctx,u) draws at the right arm tip, alpha, seed.

function clawd(ctx, x, y, u, o = {}) {
  if (u <= .05) return;
  const lw = Math.max(1.2, Math.min(5, u * .38));
  ctx.save();
  if (o.alpha != null) ctx.globalAlpha *= o.alpha;
  ctx.translate(x, y - (o.dy || 0) * u);
  if (o.rot) ctx.rotate(o.rot);
  const sq = o.sq || 0;
  ctx.scale((o.flip ? -1 : 1) * (1 + sq * .55), 1 - sq * .5);
  const st = { lw, ink: C.ink };
  const savedLWK = LWK; LWK = 1;

  if (o.splat) { splatClawd(ctx, u, o, lw); LWK = savedLWK; ctx.restore(); return; }

  // legs
  const legs = [-4, -2, 1, 3];
  legs.forEach((lx, i) => {
    let h = 2.2;
    if (o.walk != null) { const ph = Math.sin((o.walk + (i % 2 ? .5 : 0)) * TAU); if (ph > 0) h -= ph * .8; }
    shape(ctx, ptsRect(lx * u, -2.4 * u, u, h * u, u * .15), C.clayDk, { ...st, j: u * .03 });
  });
  // arms (pivot at the body side)
  const arm = (side, a) => {
    ctx.save(); ctx.translate(side * 4.8 * u, -4.6 * u); ctx.rotate(side * -a);
    shape(ctx, ptsRect(side < 0 ? -2.1 * u : 0, -.55 * u, 2.1 * u, 1.1 * u, u * .3), C.clay, { ...st, j: u * .03 });
    if (side > 0 && o.holdR) { ctx.translate(2.1 * u, 0); o.holdR(ctx, u); }
    if (side < 0 && o.holdL) { ctx.translate(-2.1 * u, 0); o.holdL(ctx, u); }
    ctx.restore();
  };
  arm(-1, o.aL ?? .15); arm(1, o.aR ?? .15);
  // body
  shape(ctx, ptsRect(-5 * u, -8 * u, 10 * u, 6 * u, u * .35), C.clay, { ...st, j: u * .04 });
  shape(ctx, ptsRect(-4.4 * u, -7.5 * u, 3.6 * u, 1.1 * u, u * .5), rgba(C.clayLt, .75), { ink: null, j: u * .03 });
  shape(ctx, ptsRect(-4.7 * u, -3.1 * u, 9.4 * u, .9 * u, u * .3), rgba(C.clayDk, .45), { ink: null, j: u * .02 });
  if (o.blush) for (const bx of [-3.6, 3.6]) shape(ctx, ptsEll(bx * u, -4.3 * u, .9 * u, .45 * u, 14), rgba(C.pinkDk, .55 * o.blush), { ink: null });
  eyes(ctx, u, o, lw);
  mouth(ctx, u, o.mouth, lw);
  if (o.glasses) glasses(ctx, u, o.glasses, lw);
  LWK = savedLWK;
  ctx.restore();

  // floating extras in un-squashed space
  const fx = x + (o.flip ? -1 : 1) * 5.6 * u, fy = y - (o.dy || 0) * u - 8.4 * u;
  if (o.sweat) {
    const k = clamp(o.sweat), sy = fy + 1.2 * u + k * 1.5 * u;
    shape(ctx, [[fx, sy - 1.3 * u], [fx + .7 * u, sy], [fx, sy + .55 * u], [fx - .7 * u, sy]].map(([a, b], i) => i === 1 || i === 3 ? [a, b] : [a, b]), '#9fd8f5', { lw: lw * .7, j: 0 });
  }
  if (o.heart) {
    const k = clamp(o.heart), hy = fy - k * 2 * u;
    ctx.save(); ctx.globalAlpha *= Math.min(1, k * 3) * (o.heartFade ?? 1);
    shape(ctx, ptsHeart(fx - u, hy, 1.4 * u * backOut(Math.min(1, k * 2))), C.pinkDk, { lw: lw * .7, j: .2 * u });
    ctx.restore();
  }
}

function eyes(ctx, u, o, lw) {
  const e = o.eyes || 'normal';
  const blink = (e === 'normal' || e === 'look') && ((T * .8 + (o.seed || 0) * 1.37) % 3.1) < .11;
  for (const ex of [-3, 2]) {
    const X = ex * u, Y = -7 * u, cx = X + .5 * u, cy = Y + u;
    const L = (pts, w = 1.25) => line(ctx, pts, { lw: lw * w, j: 0 });
    if (e === 'normal' || e === 'look') {
      const lx = (o.lookX || 0) * .45 * u, ly = (o.lookY || 0) * .4 * u;
      if (blink) L([[X - .2 * u, cy + .5 * u], [X + 1.2 * u, cy + .5 * u]]);
      else { ctx.fillStyle = C.ink; ctx.fillRect(X + lx, Y + ly, u, 2 * u); }
    } else if (e === 'wide') {
      ctx.fillStyle = C.ink; ctx.fillRect(X - .2 * u, Y - .4 * u, 1.4 * u, 2.6 * u);
      ctx.fillStyle = C.white; ctx.fillRect(X + .15 * u, Y - .05 * u, .45 * u, .55 * u);
    } else if (e === 'happy') L([[X - .4 * u, cy + .6 * u], [cx, cy - .6 * u], [X + 1.4 * u, cy + .6 * u]], 1.4);
    else if (e === 'closed') L([[X - .4 * u, cy], [cx, cy + .55 * u], [X + 1.4 * u, cy]], 1.3);
    else if (e === 'sad') L(ex < 0 ? [[X - .4 * u, cy - .3 * u], [X + 1.4 * u, cy + .5 * u]] : [[X - .4 * u, cy + .5 * u], [X + 1.4 * u, cy - .3 * u]], 1.3);
    else if (e === 'squeeze') L(ex < 0 ? [[X - .4 * u, cy - .8 * u], [X + 1.3 * u, cy], [X - .4 * u, cy + .8 * u]] : [[X + 1.4 * u, cy - .8 * u], [X - .3 * u, cy], [X + 1.4 * u, cy + .8 * u]], 1.3);
    else if (e === 'determined') { ctx.fillStyle = C.ink; ctx.beginPath(); ctx.moveTo(X - .2 * u, Y + (ex < 0 ? .2 : .9) * u); ctx.lineTo(X + 1.2 * u, Y + (ex < 0 ? .9 : .2) * u); ctx.lineTo(X + 1.2 * u, Y + 2 * u); ctx.lineTo(X - .2 * u, Y + 2 * u); ctx.fill(); }
    else if (e === 'star') {
      const s = 1.25 * u * (1 + .15 * Math.sin(T * 16));
      shape(ctx, ptsStar(cx, cy, s, 5, .45), C.yellow, { lw: lw * .8, j: 0 });
    } else if (e === 'spiral') {
      const p = []; for (let i = 0; i < 30; i++) { const a = i * .55 + T * 8, r = i / 30 * .9 * u; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
      line(ctx, p, { lw: lw * .8, j: 0 });
    } else if (e === 'heart') shape(ctx, ptsHeart(cx, cy + .1 * u, 1.1 * u), C.pinkDk, { lw: lw * .7, j: 0 });
  }
}

function mouth(ctx, u, m, lw) {
  if (!m) return;
  const L = p => line(ctx, p, { lw: lw, j: 0 });
  if (m === 'smile') L(ptsQuad([-1 * u, -4.6 * u], [0, -3.7 * u], [1 * u, -4.6 * u], 8));
  else if (m === 'o') shape(ctx, ptsEll(0, -4.2 * u, .45 * u, .55 * u, 12), C.ink, { ink: null });
  else if (m === 'open') shape(ctx, ptsEll(0, -4.3 * u, .9 * u, .8 * u, 16), '#5a2430', { lw: lw * .8, j: 0 });
  else if (m === 'flat') L([[-.8 * u, -4.3 * u], [.8 * u, -4.3 * u]]);
  else if (m === 'wavy') L([[-1.1 * u, -4.3 * u], [-.55 * u, -4.65 * u], [0, -4.3 * u], [.55 * u, -4.65 * u], [1.1 * u, -4.3 * u]]);
  else if (m === 'frown') L(ptsQuad([-.9 * u, -3.9 * u], [0, -4.7 * u], [.9 * u, -3.9 * u], 8));
}

// Pixel glasses: two black square frames with a bridge and a white glint pixel.
function glasses(ctx, u, k, lw) {
  ctx.save();
  ctx.translate(0, (1 - clamp(k)) * -3 * u);
  ctx.globalAlpha *= clamp(k * 2);
  ctx.fillStyle = C.ink;
  for (const ex of [-3, 2]) {
    const X = ex * u - .6 * u, Y = -7.6 * u, s = 2.2 * u, t = .35 * u;
    ctx.fillRect(X, Y, s, t); ctx.fillRect(X, Y + s + .1 * u, s, t); ctx.fillRect(X, Y, t, s + .45 * u); ctx.fillRect(X + s - t, Y, t, s + .45 * u);
    ctx.fillStyle = rgba('#bfe6ff', .35); ctx.fillRect(X + t, Y + t, s - 2 * t, s - t + .1 * u);
    ctx.fillStyle = C.white; ctx.fillRect(X + t + .1 * u, Y + t + .1 * u, .35 * u, .35 * u);
    ctx.fillStyle = C.ink;
  }
  ctx.fillRect(-1.4 * u, -7.0 * u, 2.8 * u, .3 * u);
  ctx.restore();
}

// Clawd pressed flat on the inside of the glass: wide, squished, arms and legs splayed.
function splatClawd(ctx, u, o, lw) {
  const k = clamp(o.splat), w = 5 * u * (1 + .45 * k), h = 3 * u * (1 - .25 * k), cy = -5 * u;
  for (const [sx, sy, a] of [[-1, -1, .5], [1, -1, -.5], [-1, 1, -.4], [1, 1, .4]]) {
    ctx.save(); ctx.translate(sx * w * .85, cy + sy * h * .7); ctx.rotate(a * sx * sy);
    shape(ctx, ptsRect(-1.2 * u, -.55 * u, 2.4 * u, 1.1 * u, .4 * u), sy < 0 ? C.clay : C.clayDk, { lw, j: 0 });
    ctx.restore();
  }
  shape(ctx, ptsRect(-w, cy - h, 2 * w, 2 * h, u * .9), C.clay, { lw, j: u * .05 });
  shape(ctx, ptsRect(-w * .8, cy - h * .8, w * .6, h * .35, u * .4), rgba(C.clayLt, .7), { ink: null });
  // squashed face
  for (const ex of [-1.6, 1.6]) {
    const X = ex * u * (1 + .4 * k), Y = cy - .3 * u;
    line(ctx, ex < 0 ? [[X - .9 * u, Y - .6 * u], [X + .6 * u, Y], [X - .9 * u, Y + .6 * u]] : [[X + .9 * u, Y - .6 * u], [X - .6 * u, Y], [X + .9 * u, Y + .6 * u]], { lw: lw * 1.2, j: 0 });
  }
  shape(ctx, ptsEll(0, cy + 1.2 * u, 1 * u * (1 + k * .5), .35 * u, 12), '#5a2430', { lw: lw * .7, j: 0 });
  for (const bx of [-3.2, 3.2]) shape(ctx, ptsEll(bx * u * (1 + .4 * k), cy + .9 * u, .9 * u, .35 * u, 12), rgba(C.pinkDk, .5), { ink: null });
  // glass smudge highlight
  ctx.save(); ctx.globalAlpha *= .3 * k; ctx.fillStyle = C.white;
  ctx.beginPath(); ctx.ellipse(-w * .45, cy - h * .45, w * .35, h * .22, -.3, 0, TAU); ctx.fill(); ctx.restore();
}
