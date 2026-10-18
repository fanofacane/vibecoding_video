// components.js: the reusable scenes of the style — opening title, character intro card, chat segment,
// episode banner, end card — plus the music grid that every cut snaps to.
// Everything reads the current work's config from the global WORK (see works/_template/work.js).

// ---------- music grid ----------
// beat: seconds per beat; vocals: time the first sung line starts (a downbeat); phraseBeats: beats per lyric line.
const M = () => Object.assign({ beat: .5, vocals: 6, phraseBeats: 8, fill: [] }, WORK.music);
const P = n => +(M().vocals + n * M().phraseBeats * M().beat).toFixed(3);   // start of lyric phrase n (0 = first sung line)
const onBeat = k => M().vocals - k * M().beat;                             // k beats before the vocals come in
const snap = x => Math.max(.2, Math.round(x / M().beat) * M().beat);       // round a local time onto the beat grid
const beatPulse = (t, k = 7) => { const x = (t - M().vocals) / M().beat; return Math.exp(-(x - Math.floor(x)) * k); };

// ---------- title motif ----------
// A pink roof line that draws itself in and ends in a heart. roof: 'house' (apartment gable) or 'palace' (upturned eaves).
const ROOFS = {
  house: 'M420 250 L760 250 L960 120 L1160 250 L1500 250',
  palace: 'M420 250 L700 250 Q690 226 668 198 Q770 212 850 140 L1070 140 Q1150 212 1252 198 Q1230 226 1220 250 L1500 250 M850 140 q-14 -22 8 -34 M1070 140 q14 -22 -8 -34',
};
function roofLine(p, heartK, dy = 0) {
  ctx.save(); ctx.translate(0, dy); ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = C.pink;
  const L = 1800; ctx.setLineDash([L, L]); ctx.lineDashOffset = L * (1 - clamp(p)); ctx.stroke(new Path2D(ROOFS[WORK.roof || 'house']));
  ctx.restore();
  if (heartK > 0) {
    const k = backOut(heartK); ctx.save(); ctx.translate(1420, 205 + dy); ctx.scale(k * 2.1, k * 2.1);
    ctx.lineWidth = 3.4; ctx.strokeStyle = C.pink; ctx.beginPath();
    ctx.moveTo(0, 8); ctx.bezierCurveTo(-14, -2, -10, -14, 0, -7); ctx.bezierCurveTo(10, -14, 14, -2, 0, 8); ctx.stroke(); ctx.restore();
  }
}
// Title letters pop in one per `step` seconds from t0 (spaces take a slot but draw nothing).
function titleText(t, t0, y = 420, px = 190, step = .3) {
  const T = WORK.title, full = textW(T, px); let x = W / 2 - full / 2;
  [...T].forEach((ch, i) => {
    const w = textW(ch, px), k = seg(t, t0 + i * step, t0 + .22 + i * step);
    if (k > 0 && ch !== ' ') chunky(ch, x + w / 2, y, px, C.pink, C.pinkDk, { k: backOut(k) });
    x += w;
  });
}

// ---------- opening (instrumental intro, 0 → P(0)) ----------
// Roof line, then the title one letter per beat, then each cast logo one per beat, all finished a beat before
// the vocals. The drum fill times in WORK.music.fill make the logo row hop. Squeezes itself if the intro is short.
function opening(t) {
  const cast = WORK.cast, n = [...WORK.title].length, need = n + cast.length + 4;
  const beat = Math.min(M().beat, M().vocals / need), at = k => M().vocals - k * beat;
  sky(); cloudLayer(t); petals(t, 40);
  roofLine(seg(t, .1, Math.max(.4, at(n + cast.length + 2))), seg(t, at(n + cast.length + 2), at(n + cast.length + 2) + .3));
  titleText(t, at(n + cast.length + 1), 420, 190, beat);
  const gap = Math.min(260, 1700 / cast.length), x0 = W / 2 - gap * (cast.length - 1) / 2;
  const hop = M().fill.reduce((a, f) => a + (t >= f ? Math.exp(-(t - f) * 14) : 0), 0);
  cast.forEach((c, i) => {
    const s = at(cast.length + 1 - i), k = seg(t, s, s + .3); if (k <= 0) return;
    logo(c.key, x0 + i * gap, 690 - beatPulse(t) * 8 - hop * 40, 150, { k: backOut(k) });
    text(c.role, x0 + i * gap, 812, 44, c.col, { alpha: k });
    text(c.name, x0 + i * gap, 860, 30, C.grey, { alpha: k, weight: 800 });
  });
  petals(t + 40, 8, .9);
}

// ---------- character intro card ----------
// 爱情公寓-style credit: 角色名 + 演员（饰） on a brand-colour ribbon, a big personality tag typed on a slanted bar,
// the logo floating over a brand-tinted cartoon city.
function introCard(c, t, lt) {
  sky(mix(c.col, '#FFFFFF', .62), mix(c.col, '#FFFFFF', .88));
  city(c.col, t); cloudLayer(t, 4, 7, false);
  logo(c.key, 1430 + Math.sin(lt * 2.2) * 10, 450 + Math.sin(lt * 3.1) * 14 - beatPulse(t) * 12, 400, { k: backOut(seg(lt, 0, .35)), rot: Math.sin(lt * 1.6) * .05 });
  logo(c.key, 330, 230, 120, { k: backOut(seg(lt, .15, .45)), rot: Math.sin(lt * 2.5) * .12 });
  const rk = easeOut(seg(lt, .1, .4)), rx = lerp(-760, 70, rk);
  ctx.beginPath(); ctx.moveTo(rx, 520); ctx.lineTo(rx + 700, 520); ctx.lineTo(rx + 670, 640); ctx.lineTo(rx - 30, 640); ctx.closePath();
  ctx.fillStyle = c.col; ctx.fill();
  text(c.role, rx + 60, 582, 78, '#FFFFFF', { align: 'left' });
  text(c.name + '（饰）', rx + 60 + textW(c.role, 78) + 30, 594, 40, mix(c.col, '#FFFFFF', .75), { align: 'left', weight: 800 });
  const bk = easeOut(seg(lt, .2, .5)), bx = lerp(-1300, -40, bk);
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.15)'; ctx.shadowOffsetY = 10;
  ctx.beginPath(); ctx.moveTo(bx, 660); ctx.lineTo(bx + 1260, 660); ctx.lineTo(bx + 1210, 850); ctx.lineTo(bx, 850); ctx.closePath();
  const g = ctx.createLinearGradient(0, 660, 0, 850); g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, '#E4E6EA'); ctx.fillStyle = g; ctx.fill(); ctx.restore();
  const [a, b] = c.tag, all = a + b, n = Math.floor(clamp((lt - .55) / .14, 0, all.length));
  let x = 100;
  [...all].slice(0, n).forEach((ch, i) => { const px = 150, w = textW(ch, px); text(ch, x + w / 2, 756, px, i < a.length ? C.ink : c.col); x += w + 6; });
}
const card = key => (t, lt) => introCard(byKey(key), t, lt);

// ---------- chat segment ----------
// WORK.chats[name] = { tint, msgs, counter?: [label, n0, at1, at2], sfx?: [[text, x, y, px, colour, at], ...], banner? }
// Message, counter and sfx times are snapped to the beat once. banner: show WORK.episode over the first 1.4 s.
function chat(name) {
  const c = WORK.chats[name], o = {};
  if (!c.snapped) {
    c.snapped = true;
    for (const m of c.msgs) m.at = snap(m.at);
    if (c.counter) { c.counter[2] = snap(c.counter[2]); c.counter[3] = snap(c.counter[3]); }
    for (const f of c.sfx || []) f[5] = snap(f[5]);
  }
  return (t, lt) => {
    sky(mix(c.tint, '#FFFFFF', .84), mix(c.tint, '#FFFFFF', .94));
    chatScene(c.msgs, lt, Object.assign(o, { noDots: !!c.counter }));
    if (c.counter) { const [label, n0, a, b] = c.counter; counterPill(label, n0 + (lt >= b ? 2 : lt >= a ? 1 : 0), seg(lt, a - .1, a + .2)); }
    for (const [s, x, y, px, col, at] of c.sfx || []) sfx(s, x, y, px, col, lt, at);
    if (c.banner) episodeBanner(lt);
  };
}
function episodeBanner(lt) {
  const k = seg(lt, 0, .3) * (1 - seg(lt, 1.1, 1.4)); if (k <= 0 || !WORK.episode) return;
  ctx.fillStyle = `rgba(255,240,246,${.85 * k})`; ctx.fillRect(0, 0, W, H);
  chunky(WORK.episode, W / 2, H / 2, 110, C.pink, C.pinkDk, { k: backOut(seg(lt, 0, .3)), alpha: k });
}

// ---------- end card ----------
function endCard(t, lt) {
  sky(); cloudLayer(t); petals(t, 40);
  roofLine(1, 1, 40);
  titleText(lt + 10, 0, 460);
  text(WORK.disclaimer || '纯属虚构', W / 2, 720, 48, C.grey, { alpha: seg(lt, .4, .8), weight: 800 });
}
