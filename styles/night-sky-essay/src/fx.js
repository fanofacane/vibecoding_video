// fx.js: the night sky behind everything, the film-grain overlay, and narration text.

// Deep navy sky with three layers of faint stars that twinkle and drift slowly.
// o: { t, drift (px/s), bright (0..1), cx, cy (sky glow centre) }
function sky(ctx, o = {}) {
  const t = o.t || 0, bright = o.bright ?? 1;
  const g = ctx.createRadialGradient(o.cx ?? W * .5, o.cy ?? H * .9, 50, W * .5, H * .6, W * .85);
  g.addColorStop(0, COL.sky2); g.addColorStop(.45, COL.sky1); g.addColorStop(1, COL.sky0);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (bright <= 0) return;
  for (let i = 0; i < 260; i++) {
    const layer = i % 3, sp = (o.drift ?? 4) * (layer + 1) * .5;
    const x = ((hash(i) * W - t * sp) % W + W) % W, y = hash(i + 500) * H;
    const tw = .55 + .45 * Math.sin(t * (1 + hash(i + 9) * 2) + i);
    const r = [.8, 1.2, 1.8][layer] * (hash(i + 77) < .05 ? 1.8 : 1);
    ctx.fillStyle = `rgba(220,230,255,${(.12 + .3 * hash(i + 3)) * tw * bright})`;
    ctx.fillRect(x, y, r, r);
  }
}

let GRAIN = null;
// Vignette plus a light grain that changes every frame (seeded by frame number).
function finish(ctx, t) {
  if (!GRAIN) {
    GRAIN = [];
    for (let k = 0; k < 4; k++) {
      const c = document.createElement('canvas'); c.width = 480; c.height = 270;
      const g = c.getContext('2d'), img = g.createImageData(480, 270);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = hash(i * .25 + k * 99991) * 255;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 8;
      }
      g.putImageData(img, 0, 0); GRAIN.push(c);
    }
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
  const v = ctx.createRadialGradient(W / 2, H / 2, H * .38, W / 2, H / 2, H * 1.05);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.55)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  ctx.drawImage(GRAIN[Math.floor(t * 24) % 4], 0, 0, W, H);
}

// Narration: serif text that appears character by character (each fades in and rises a little),
// and fades out as a block. Wraps to maxW. Returns the block height.
// o: { x, y, t, t0, out (fade-out start), size, maxW, align, color, weight, lineH, stagger, glow (colour), halo (dark backing) }
function narr(ctx, text, o) {
  const t = o.t, size = o.size || 54, lineH = o.lineH || size * 1.55, stagger = o.stagger ?? .055;
  const outK = o.out !== undefined ? 1 - ease(seg(t, o.out, o.out + .5)) : 1;
  if (t < o.t0 || outK <= 0) return 0;
  ctx.save();
  ctx.font = `${o.weight || 600} ${size}px ${SERIF}`;
  ctx.textBaseline = 'alphabetic';
  const lines = wrap(ctx, text, o.maxW || 1e9);
  let n = 0;
  lines.forEach((line, li) => {
    const lw = ctx.measureText(line).width;
    let x = o.align === 'center' ? o.x - lw / 2 : o.align === 'right' ? o.x - lw : o.x;
    const y = o.y + li * lineH;
    for (const ch of line) {
      const k = seg(t, o.t0 + n * stagger, o.t0 + n * stagger + .45);
      if (k > 0) {
        ctx.globalAlpha = easeOut(k) * outK;
        if (o.glow) { ctx.shadowColor = rgba(o.glow, .6); ctx.shadowBlur = 24; }
        else if (o.halo) { ctx.shadowColor = 'rgba(4,6,16,.95)'; ctx.shadowBlur = 22; }
        ctx.fillStyle = o.color || COL.ink;
        ctx.fillText(ch, x, y + (1 - easeOut(k)) * 14);
      }
      x += ctx.measureText(ch).width; n++;
    }
  });
  ctx.restore();
  return lines.length * lineH;
}

// Time at which narration of `text` (from t0) has fully appeared.
const narrEnd = (text, t0, stagger = .055) => t0 + [...text].length * stagger + .45;
