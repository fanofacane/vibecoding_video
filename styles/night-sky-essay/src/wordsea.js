// wordsea.js: chat words floating like stars. Frequent words are big and bright,
// the things never quite said are small and dim, tucked in a corner.
//
// A word: { text, x, y (world px, screen-sized at zoom 1), size, d (depth, 1 = screen plane, >1 farther),
//           color, a (base brightness 0..1), glow? }
// cam: { x, y, z } world point at screen centre, and zoom.
// o: { t, words, cam, burst: { x, y, t0 } (words fly out from this point), light: { text: t0 } (brighten),
//      focus (0..1, dims the rest and brings the hidden words forward) }

// Muted, mostly warm whites with faint tints, so the sea stays quiet on near-black.
const PASTEL = ['#ece6da', '#d9c9ab', '#b9b1a4', '#c8b7b0', '#aab4bb', '#d6c39d', '#bdb7c8', '#e3d8c4'];

function wordSea(ctx, o) {
  const t = o.t, cam = o.cam, words = o.words;
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  // Far words first.
  const order = words.map((w, i) => i).sort((a, b) => words[b].d - words[a].d);
  for (const i of order) {
    const w = words[i], par = 1 / w.d;
    // Slow drift, different per word.
    const wx = w.x + Math.sin(t * .15 + i) * 18 * par, wy = w.y + Math.cos(t * .12 + i * 1.3) * 10 * par;
    let sx = W / 2 + (wx - cam.x) * cam.z * par, sy = H / 2 + (wy - cam.y) * cam.z * par;
    let a = w.a, k = 1;
    if (o.burst) {
      // Fly out from the burst point; small words leave later.
      const d0 = o.burst.t0 + hash(i + 3) * .9 + (1 - w.a) * .5;
      k = easeOut(seg(t, d0, d0 + 1.7));
      if (k <= 0) continue;
      sx = lerp(o.burst.x, sx, k); sy = lerp(o.burst.y, sy, k);
      a *= seg(k, 0, .3);
    }
    const lit = o.light && o.light[w.text] !== undefined ? ease(seg(t, o.light[w.text], o.light[w.text] + 1.2)) : 0;
    // focus (0..1): everything else dims while the hidden words come forward.
    if (o.focus) a = w.hidden ? lerp(a, .85, o.focus) : a * (1 - .65 * o.focus);
    a = lerp(a, 1, lit);
    const tw = .85 + .15 * Math.sin(t * (.8 + hash(i) * 1.5) + i * 2);
    const size = w.size * cam.z * par * lerp(.6, 1, k) * (1 + .15 * lit);
    if (size < 4 || sx < -400 || sx > W + 400 || sy < -200 || sy > H + 200) continue;
    ctx.globalAlpha = clamp(a * tw);
    ctx.font = `${w.size > 60 ? 700 : 500} ${size}px ${w.serif ? SERIF : SANS}`;
    const glow = w.glow || lit > 0 || (w.hidden && o.focus > .5);
    if (glow) { ctx.shadowColor = rgba(lit ? COL.warm : w.color, .8); ctx.shadowBlur = size * .5 * (lit ? 1.4 : 1); }
    ctx.fillStyle = lit ? COL.warm : w.color;
    ctx.fillText(w.text, sx, sy);
    if (glow) ctx.shadowBlur = 0;
  }
  ctx.restore();
}

// Build a deterministic field: `big` words near the middle, `fill` words scattered, `hidden` in a corner.
function makeSea({ big, fill, hidden, corner, seed = 0 }) {
  const words = [];
  big.forEach(([text, size, x, y], i) => words.push({ text, size, x, y, d: 1, color: i === 0 ? COL.ink : PASTEL[(i + 1) % PASTEL.length], a: .95, glow: true }));
  for (let i = 0; i < 150; i++) {
    const r = hash(i * 7 + seed), text = fill[i % fill.length];
    const d = 1 + hash(i * 3 + seed + 1) * 1.6;
    let x = hash(i * 11 + seed + 2) * W * 1.5 - W * .25, y = hash(i * 13 + seed + 3) * H * 1.4 - H * .2;
    // Keep the corner a little quieter so the hidden words read.
    if (Math.hypot(x - corner.x, y - corner.y) < 260) x -= 420;
    words.push({ text, size: 18 + r * 26, x, y, d, color: PASTEL[i % PASTEL.length], a: .25 + hash(i + seed + 9) * .45 });
  }
  hidden.forEach(([text, dx, dy], i) => words.push({ text, size: 17, x: corner.x + dx, y: corner.y + dy, d: 1, color: PASTEL[(i + 4) % PASTEL.length], a: .38, serif: true, hidden: true }));
  return words;
}
