// broll.js: explainer pieces — the chapter card and small diagram animations.

// Chapter card (layout F): a huge outlined number top-left, title and subtitle beside it.
// o: { t, t0, out, num, title, sub }
function chapterCard(ctx, o) {
  const t = o.t, inK = seg(t, o.t0, o.t0 + .9), outK = o.out !== undefined ? ease(seg(t, o.out, o.out + .6)) : 0;
  if (inK <= 0 || outK >= 1) return;
  ctx.save();
  ctx.globalAlpha = 1 - outK;
  const x0 = 150, y0 = 380;
  // The number: outlined, slides up through a mask.
  ctx.save();
  ctx.beginPath(); ctx.rect(x0 - 20, y0 - 330, 700, 360); ctx.clip();
  ctx.font = `700 340px ${SERIF}`; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  const ny = y0 + (1 - easeOut(inK)) * 300 - outK * 40;
  ctx.lineWidth = 2.5; ctx.strokeStyle = rgba(COL.warm, .85); ctx.strokeText(o.num, x0, ny);
  ctx.fillStyle = rgba(COL.warm, .07); ctx.fillText(o.num, x0, ny);
  ctx.restore();
  // Rule and title.
  const lk = easeInOut(seg(t, o.t0 + .4, o.t0 + 1.2));
  ctx.fillStyle = rgba(COL.ink, .5); ctx.fillRect(x0 + 10, y0 + 50, 980 * lk, 2);
  narr(ctx, o.title, { t, t0: o.t0 + .7, x: x0 + 10, y: y0 + 150, size: 72, stagger: .045 });
  if (o.sub) narr(ctx, o.sub, { t, t0: o.t0 + 1.6, x: x0 + 14, y: y0 + 230, size: 30, weight: 400, color: COL.dim, stagger: .03 });
  ctx.restore();
}

// A falling drop of light: the "piece of news" that drips into cups. Returns its position.
function drop(ctx, x, y, r, a = 1) {
  ctx.save(); ctx.globalAlpha *= a;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
  g.addColorStop(0, rgba(COL.warm, .5)); g.addColorStop(1, rgba(COL.warm, 0));
  ctx.fillStyle = g; ctx.fillRect(x - r * 4, y - r * 4, r * 8, r * 8);
  ctx.fillStyle = COL.warm;
  ctx.beginPath(); ctx.moveTo(x, y - r * 2.2); ctx.quadraticCurveTo(x + r * 1.1, y - r * .2, x, y + r); ctx.quadraticCurveTo(x - r * 1.1, y - r * .2, x, y - r * 2.2); ctx.fill();
  ctx.restore();
}

// A row of daily cups: each day one drop falls in, and the cup is poured out the same day.
// o: { t, t0, n, x, y (cup bottom), gap, dayDur, label }
function dailyCups(ctx, o) {
  const t = o.t, cw = 74, chH = 104, gap = o.gap || 150;
  ctx.save();
  for (let i = 0; i < o.n; i++) {
    const cx = o.x + i * gap, d0 = o.t0 + i * o.dayDur;
    const appear = easeOut(seg(t, o.t0 - .4 + i * .08, o.t0 + .2 + i * .08));
    if (appear <= 0) continue;
    ctx.globalAlpha = appear;
    // Drop falls, cup fills a little, then tips and empties.
    const fall = seg(t, d0, d0 + .55), fill = easeOut(seg(t, d0 + .5, d0 + .8)), pour = seg(t, d0 + .95, d0 + 1.5);
    const level = 26 * fill * (1 - easeIn(pour));
    const tilt = Math.sin(Math.PI * pour) * .65;
    if (fall > 0 && fall < 1) drop(ctx, cx, lerp(o.y - 420, o.y - 30, easeIn(fall)), 9);
    ctx.save();
    ctx.translate(cx + cw / 2, o.y); ctx.rotate(tilt); ctx.translate(-(cx + cw / 2), -o.y);
    ctx.translate(-cw / 2, 0);
    // Liquid.
    if (level > .5) {
      const g = ctx.createLinearGradient(0, o.y - level, 0, o.y);
      g.addColorStop(0, rgba(COL.warm, .95)); g.addColorStop(1, rgba(COL.warm, .55));
      ctx.fillStyle = g; ctx.fillRect(cx + 5, o.y - level - 3, cw - 10, level);
    }
    // Glass.
    ctx.strokeStyle = rgba(COL.ink, .7); ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(cx - 4, o.y - chH); ctx.lineTo(cx, o.y); ctx.lineTo(cx + cw, o.y); ctx.lineTo(cx + cw + 4, o.y - chH); ctx.stroke();
    ctx.restore();
    // Spilled drops after pouring.
    if (pour > 0 && pour < 1) for (let k = 0; k < 4; k++) {
      const pk = seg(pour, .3 + k * .1, .8 + k * .05);
      if (pk > 0 && pk < 1) { ctx.fillStyle = rgba(COL.warm, (1 - pk) * .8); ctx.fillRect(cx + cw / 2 + 50 + pk * 30, o.y - 60 + pk * 70 + k * 6, 4, 4); }
    }
    ctx.font = `400 22px ${SANS}`; ctx.fillStyle = COL.dim; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(`第 ${i + 1} 天`, cx, o.y + 36);
  }
  ctx.restore();
}

// A big jar that fills slowly over months; the things saved up float out of it as chips.
// o: { t, t0, t1 (filling), cx, y (jar bottom), items: [text], itemsAt (first chip time), label }
function storyJar(ctx, o) {
  const t = o.t, jw = 260, jh = 300, x = o.cx - jw / 2, fill = easeInOut(seg(t, o.t0, o.t1)) * (jh - 16);
  const appear = seg(t, o.t0 - .6, o.t0);
  if (appear <= 0) return;
  ctx.save(); ctx.globalAlpha *= appear;
  // Liquid, with a faint line for every passing week.
  const g = ctx.createLinearGradient(0, o.y - fill, 0, o.y);
  g.addColorStop(0, rgba(COL.warm, .85)); g.addColorStop(1, rgba(COL.warm, .35));
  ctx.fillStyle = g; ctx.fillRect(x + 6, o.y - fill, jw - 12, fill - 3);
  ctx.fillStyle = 'rgba(6,7,9,.35)';
  for (let i = 1; i < 12; i++) { const ly = o.y - i * (jh - 16) / 12; if (o.y - ly < fill) ctx.fillRect(x + 6, ly, jw - 12, 1.5); }
  // Glass.
  ctx.strokeStyle = rgba(COL.ink, .75); ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x - 6, o.y - jh); ctx.lineTo(x, o.y); ctx.lineTo(x + jw, o.y); ctx.lineTo(x + jw + 6, o.y - jh); ctx.stroke();
  // A drop now and then.
  for (let i = 0; i < 9; i++) {
    const d0 = o.t0 + i * (o.t1 - o.t0) / 9, k = seg(t, d0, d0 + .5);
    if (k > 0 && k < 1) drop(ctx, o.cx, lerp(o.y - jh - 260, o.y - fill - 6, easeIn(k)), 8);
  }
  // Chips float up out of the jar and settle in an arc above it.
  (o.items || []).forEach((txt, i) => {
    const k = easeOut(seg(t, o.itemsAt + i * .35, o.itemsAt + i * .35 + .7));
    if (k <= 0) return;
    const ang = -Math.PI / 2 + (i - (o.items.length - 1) / 2) * .42;
    const tx = o.cx + Math.cos(ang) * 330, ty = o.y - jh / 2 + Math.sin(ang) * 300;
    const px = lerp(o.cx, tx, k), py = lerp(o.y - fill, ty, k);
    ctx.save(); ctx.globalAlpha *= k;
    ctx.font = `400 26px ${SANS}`;
    const tw = ctx.measureText(txt).width + 34;
    roundRect(ctx, px - tw / 2, py - 24, tw, 48, 8);
    ctx.shadowColor = 'rgba(243,217,166,.4)'; ctx.shadowBlur = 20;
    ctx.fillStyle = COL.me; ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = COL.meText; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, px, py + 1);
    ctx.restore();
  });
  ctx.restore();
}
