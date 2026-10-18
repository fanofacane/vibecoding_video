// clawd.js: the pixel Clawd sprite and its expressions.
// The sprite is a 14 × 8 grid. Body: cols 2–11, rows 0–5. Arms: cols 0–1 and 12–13, rows 3–4.
// Legs: cols 3, 5, 8, 10, rows 6–7. Eye pixels are drawn on top of the body.

const CLAWD_BODY = (() => {
  const p = [];
  for (let r = 0; r < 6; r++) for (let c = 2; c < 12; c++) p.push([c, r]);
  for (let r = 3; r < 5; r++) for (const c of [0, 1, 12, 13]) p.push([c, r]);
  for (let r = 6; r < 8; r++) for (const c of [3, 5, 8, 10]) p.push([c, r]);
  return p;
})();

// Eye pixel sets, mirrored for the right eye (left eye around col 4, right eye around col 9).
const EYES = {
  normal: [[4, 1], [4, 2]],
  blink: [[4, 2]],
  wide: [[4, 1], [4, 2], [4, 3]],
  happy: [[3, 2], [4, 1], [5, 2]],
  squeeze: [[3, 1], [4, 2], [3, 3]],  // > <  overwhelmed
  heart: [[3, 1], [5, 1], [3, 2], [4, 2], [5, 2], [4, 3]],
  look: [[5, 1], [5, 2]],          // looking toward the right
  lookL: [[3, 1], [3, 2]],         // looking toward the left
};
const mirrorEye = ([c, r]) => [13 - c, r];

// Draw Clawd with its feet on baseY, centred on cx.
// o: { px, color, eyes, t, talk (0..1 talking energy), hop (0..1 surprise hop), sweat, alpha, assemble (0..1), seed }
function drawClawd(ctx, cx, baseY, o) {
  const px = o.px || 16, t = o.t || 0, alpha = o.alpha ?? 1;
  if (alpha <= 0) return;
  // Pixel-stepped idle bob plus a talking bounce and a surprise hop.
  const bob = Math.round(Math.sin(t * 2.2 + (o.seed || 0)) * .5) * px * .5;
  const talk = (o.talk || 0) * Math.abs(Math.sin(t * 15)) * px * .75;
  const hop = (o.hop || 0) * px * 2.2;
  const squash = 1 + (o.squash || 0) * .12;
  const x0 = Math.round(cx - 7 * px), y0 = Math.round(baseY - 8 * px - bob - talk - hop);

  ctx.save();
  ctx.globalAlpha = alpha;
  // Soft glow and ground shadow.
  const g = ctx.createRadialGradient(cx, baseY - 4 * px, px, cx, baseY - 4 * px, 11 * px);
  g.addColorStop(0, rgba(o.color, .16)); g.addColorStop(1, rgba(o.color, 0));
  ctx.fillStyle = g; ctx.fillRect(cx - 12 * px, baseY - 15 * px, 24 * px, 18 * px);
  ctx.fillStyle = 'rgba(0,0,0,.35)';
  ctx.beginPath(); ctx.ellipse(cx, baseY + px * .4, 6.5 * px * (1 - hop / px * .04), px * .55, 0, 0, Math.PI * 2); ctx.fill();

  ctx.translate(cx, y0 + 8 * px); ctx.scale(squash, 1 / squash); ctx.translate(-cx, -(y0 + 8 * px));
  const asm = o.assemble ?? 1, seed = o.seed || 0;
  const cell = (c, r, col, i) => {
    let x = x0 + c * px, y = y0 + r * px;
    if (asm < 1) {
      const k = easeOut(clamp(asm * 1.6 - hash(i + seed * 97) * .6));
      x = lerp(x + (hash(i * 3 + seed) - .5) * 900, x, k);
      y = lerp(y + (hash(i * 7 + seed) - .5) * 600, y, k);
      if (k <= 0) return;
    }
    ctx.fillStyle = col; ctx.fillRect(Math.round(x), Math.round(y), px, px);
  };
  // Body with a subtle top highlight and bottom shade, like a lit sprite.
  CLAWD_BODY.forEach(([c, r], i) => {
    const shade = r === 0 ? 1.08 : r >= 5 ? .86 : 1;
    cell(c, r, shadeHex(o.color, shade), i);
  });
  if (asm >= .7) {
    const eyes = EYES[o.eyes || 'normal'] || EYES.normal;
    const eyeCol = o.eyes === 'heart' ? COL.heart : COL.eye;
    const right = o.eyes === 'look' ? eyes.map(([c, r]) => [c + 5, r])
      : o.eyes === 'lookL' ? eyes.map(([c, r]) => [c + 5, r]) : eyes.map(mirrorEye);
    ctx.globalAlpha = alpha * seg(asm, .7, 1);
    [...eyes, ...right].forEach(([c, r]) => { ctx.fillStyle = eyeCol; ctx.fillRect(x0 + c * px, y0 + r * px, px, px); });
    if (o.sweat) {
      ctx.globalAlpha = alpha * o.sweat;
      ctx.fillStyle = COL.sweat;
      const dy = Math.round((1 - o.sweat) * 2) * px * .5;
      ctx.fillRect(x0 + 12 * px, y0 - 1 * px + dy, px * .75, px * .75);
      ctx.fillRect(x0 + 12 * px - px * .25, y0 + dy - px * .25, px * 1.25, px);
    }
  }
  ctx.restore();
}

// Multiply a hex colour's brightness.
function shadeHex(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const f = v => clamp(Math.round(v * k), 0, 255);
  return `rgb(${f(n >> 16 & 255)},${f(n >> 8 & 255)},${f(n & 255)})`;
}

// A small emote ("!!", "?", "…") that pops above a Clawd's head.
function drawEmote(ctx, txt, x, y, age, color) {
  if (age < 0 || age > 1.6) return;
  const k = backOut(clamp(age / .25)), a = 1 - seg(age, 1.2, 1.6);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.translate(x, y - 10 * k); ctx.scale(k, k);
  ctx.font = `bold 54px ${FONT_MONO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillText(txt, 3, 3);
  ctx.fillStyle = color; ctx.fillText(txt, 0, 0);
  ctx.restore();
}
