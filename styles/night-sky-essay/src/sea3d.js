// sea3d.js: a three-dimensional sea of chat sentences. The camera flies through it (forward, and drifting
// sideways or up), sentences rush past the lens, and every sentence keeps changing: it decodes into a new
// line every few seconds, one character at a time. A "collapse" can turn every sentence into one word.
//
// sea3d(ctx, o) with o: { t, cam: { x, y, z }, pool: [sentences], big: [short words shown larger],
//                          collapse: { t0, to } (from t0 every star decodes into `to`, a word or a list), a,
//                          hole: { x, y, r, k } (dim stars around a point, e.g. behind narration) }

const SEA3D = { n: 300, depth: 6000, spanX: 3800, spanY: 2300, f: 1000 };
const SCRAMBLE = '的了我你在吗是好嗯到家今天晚安吃饭想说话没有什么时候一下明天去看海猫雨路上班累睡';

// Text of star i at time t: cycles through the pool, decoding character by character on each change.
function starText(i, t, pool, big, collapse) {
  const period = 2.4 + hash(i * 3 + 1) * 3.2, phase = hash(i * 5 + 2) * period;
  const isBig = hash(i * 7 + 3) < .12;
  const list = isBig ? big : pool;
  const pick = c => list[Math.floor(hash(i * 13 + c * 7.31) * list.length)];
  const c = Math.floor((t + phase) / period), into = (t + phase) - c * period;
  let prev = pick(c - 1), next = pick(c), k = seg(into, 0, .55);
  if (collapse && t > collapse.t0) {
    const s = collapse.t0 + hash(i + 99) * 1.1;
    const to = Array.isArray(collapse.to) ? collapse.to[Math.floor(hash(i * 3 + 7) * collapse.to.length)] : collapse.to;
    if (t > s) { prev = next; next = to; k = seg(t, s, s + .45); }
  }
  if (k >= 1) return { text: next, big: isBig || (collapse && t > collapse.t0 + 1.6) };
  // Decode: the first part already shows the new line, then a few scrambling characters, then the old tail.
  const n = Math.max([...prev].length, [...next].length), done = Math.floor(k * (n + 2));
  let s = '';
  const pa = [...prev], na = [...next], q = Math.floor(t * 18);
  for (let j = 0; j < n; j++) {
    if (j < done - 2) s += na[j] ?? '';
    else if (j < done) s += SCRAMBLE[Math.floor(hash(i * 31 + j + q * 7) * SCRAMBLE.length)];
    else s += pa[j] ?? '';
  }
  return { text: s, big: isBig };
}

function sea3d(ctx, o) {
  const t = o.t, cam = o.cam, S = SEA3D;
  const stars = [];
  for (let i = 0; i < S.n; i++) {
    const x0 = (hash(i) - .5) * S.spanX, y0 = (hash(i + 1000) - .5) * S.spanY, z0 = hash(i + 2000) * S.depth;
    // Wrap around the camera so the space never runs out.
    const rx = ((x0 - cam.x) % S.spanX + S.spanX * 1.5) % S.spanX - S.spanX / 2;
    const ry = ((y0 - cam.y) % S.spanY + S.spanY * 1.5) % S.spanY - S.spanY / 2;
    const dz = ((z0 - cam.z) % S.depth + S.depth) % S.depth;
    if (dz < 40) continue;
    stars.push({ i, rx, ry, dz });
  }
  stars.sort((a, b) => b.dz - a.dz);
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const s of stars) {
    const p = S.f / s.dz, sx = W / 2 + s.rx * p, sy = H / 2 + s.ry * p;
    if (sx < -900 || sx > W + 900 || sy < -400 || sy > H + 400) continue;
    const st = starText(s.i, t, o.pool, o.big, o.collapse);
    const base = st.big ? 90 : 34 + hash(s.i + 7) * 22, size = base * p;
    if (size < 3) continue;
    // Fade in from the far end, fade out just before passing the camera.
    // Depth fog: far lines are faint, near ones bright; the nearest grow huge and soft as they pass the lens.
    let a = seg(S.depth - s.dz, 0, 1600) * seg(s.dz, 70, 520) * (o.a ?? 1);
    a *= clamp(.04 + 1.0 * Math.min(1, p * 1.1) ** 1.3) * (.6 + .4 * hash(s.i + 11));
    if (o.hole && o.hole.k > 0) a *= 1 - o.hole.k * (1 - seg(Math.hypot(sx - o.hole.x, (sy - o.hole.y) * 1.6), o.hole.r * .5, o.hole.r));
    if (a <= .01) continue;
    ctx.globalAlpha = a;
    ctx.font = `${st.big ? 600 : 400} ${size}px ${st.big ? SERIF : SANS}`;
    const near = p > .9;
    if (near || st.big) { ctx.shadowColor = 'rgba(243,217,166,.45)'; ctx.shadowBlur = Math.min(40, size * .35); }
    ctx.fillStyle = PASTEL[s.i % PASTEL.length];
    ctx.fillText(st.text, sx, sy);
    ctx.shadowBlur = 0;
  }
  ctx.restore();
}
