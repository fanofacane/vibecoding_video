// fx.js: the backdrop, the grain overlay, narration text and tiny labels.

// Near-black backdrop with a soft warm-grey lift; optional sparse stars (for the sea of words).
// o: { t, cx, cy (lift centre), lift (0..1), stars (0..1) }
function backdrop(ctx, o = {}) {
  const t = o.t || 0;
  const g = ctx.createRadialGradient(o.cx ?? W * .5, o.cy ?? H * .45, 40, W * .5, H * .5, W * .75);
  g.addColorStop(0, o.lift === 0 ? COL.bg0 : COL.bg2); g.addColorStop(.5, COL.bg1); g.addColorStop(1, COL.bg0);
  ctx.save(); ctx.globalAlpha *= o.lift ?? 1; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
  const stars = o.stars || 0;
  if (stars <= 0) return;
  for (let i = 0; i < 180; i++) {
    const x = ((hash(i) * W - t * (2 + i % 3)) % W + W) % W, y = hash(i + 500) * H;
    const tw = .5 + .5 * Math.sin(t * (.7 + hash(i + 9) * 1.6) + i);
    ctx.fillStyle = `rgba(236,230,218,${(.06 + .22 * hash(i + 3)) * tw * stars})`;
    const r = hash(i + 77) < .06 ? 2 : 1.1;
    ctx.fillRect(x, y, r, r);
  }
}

let GRAIN = null;
// Vignette plus a light grain that changes every frame (seeded by frame number).
// o: { vignette (darkness at the edges, default .6; use ~.12 on white), grain (alpha per grain, default 10) }
function finish(ctx, t, o = {}) {
  if (!GRAIN) {
    GRAIN = [];
    for (let k = 0; k < 4; k++) {
      const c = document.createElement('canvas'); c.width = 640; c.height = 360;
      const g = c.getContext('2d'), img = g.createImageData(640, 360);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = hash(i * .25 + k * 99991) * 255;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 10;
      }
      g.putImageData(img, 0, 0); GRAIN.push(c);
    }
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
  const v = ctx.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * 1.0);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(0,0,0,${o.vignette ?? .6})`);
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  ctx.drawImage(GRAIN[Math.floor(t * 24) % 4], 0, 0, W, H);
}

// Narration: serif text that appears character by character (each fades in and rises a little),
// and fades out as a block. Wraps to maxW. Returns the block height.
// o: { x, y, t, t0, out (fade-out start), size, maxW, align, color, weight, lineH, stagger,
//      glow (colour), halo (dark backing), tail (0..1: the last characters fade toward dim, like a trailing voice) }
// text may be an array of [text, colour] parts, to colour single words (e.g. a highlighted keyword).
function narr(ctx, text, o) {
  let colors = null;
  if (Array.isArray(text)) { colors = text.flatMap(([s, c]) => [...s].map(() => c)); text = text.map(([s]) => s).join(''); }
  const t = o.t, size = o.size || 54, lineH = o.lineH || size * 1.55, stagger = o.stagger ?? .055;
  const outK = o.out !== undefined ? 1 - ease(seg(t, o.out, o.out + .5)) : 1;
  if (t < o.t0 || outK <= 0) return 0;
  ctx.save();
  ctx.font = `${o.weight || 500} ${size}px ${SERIF}`;
  ctx.textBaseline = 'alphabetic';
  const lines = wrap(ctx, text, o.maxW || 1e9), total = [...text].length;
  let n = 0;
  lines.forEach((line, li) => {
    const lw = ctx.measureText(line).width;
    let x = o.align === 'center' ? o.x - lw / 2 : o.align === 'right' ? o.x - lw : o.x;
    const y = o.y + li * lineH;
    for (const ch of line) {
      const k = seg(t, o.t0 + n * stagger, o.t0 + n * stagger + .5);
      if (k > 0) {
        const fadeTail = o.tail ? 1 - o.tail * seg(n / total, .45, 1) : 1;
        ctx.globalAlpha = easeOut(k) * outK * fadeTail;
        if (o.glow) { ctx.shadowColor = rgba(o.glow, .55); ctx.shadowBlur = size * .4; }
        else if (o.halo) { ctx.shadowColor = 'rgba(0,0,0,.95)'; ctx.shadowBlur = 24; }
        ctx.fillStyle = (colors && colors[n]) || o.color || COL.ink;
        ctx.fillText(ch, x, y + (1 - easeOut(k)) * size * .2);
      }
      x += ctx.measureText(ch).width; n++;
    }
  });
  ctx.restore();
  return lines.length * lineH;
}

// Tiny letter-spaced label, e.g. “此 刻” or “第 15 天”.
// o: { x, y, t, t0, out, size, align, color, spacing }
function label(ctx, text, o) {
  const t = o.t, a = seg(t, o.t0, o.t0 + .5) * (o.out !== undefined ? 1 - seg(t, o.out, o.out + .4) : 1);
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.font = `400 ${o.size || 17}px ${SANS}`; ctx.textBaseline = 'alphabetic';
  const sp = o.spacing ?? (o.size || 17) * .35, chars = [...text];
  const w = chars.reduce((s, c) => s + ctx.measureText(c).width + sp, -sp);
  let x = o.align === 'center' ? o.x - w / 2 : o.align === 'right' ? o.x - w : o.x;
  ctx.fillStyle = o.color || COL.dim;
  for (const c of chars) { ctx.fillText(c, x, o.y); x += ctx.measureText(c).width + sp; }
  ctx.restore();
}
