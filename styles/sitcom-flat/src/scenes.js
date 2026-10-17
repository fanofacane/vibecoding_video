// scenes.js: the opening of the current example. Each scene(t, lt) paints the whole frame.

const TITLE = 'AI 甄嬛传';

// Pink palace-roof line that draws itself in, ending in a heart (the sitcom's roof-and-heart motif).
function roofLine(p, heartK) {
  ctx.save(); ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = C.pink;
  const path = new Path2D('M420 250 L700 250 Q690 226 668 198 Q770 212 850 140 L1070 140 Q1150 212 1252 198 Q1230 226 1220 250 L1500 250' +
    ' M850 140 q-14 -22 8 -34 M1070 140 q14 -22 -8 -34');
  const L = 1700; ctx.setLineDash([L, L]); ctx.lineDashOffset = L * (1 - clamp(p)); ctx.stroke(path);
  ctx.restore();
  if (heartK > 0) {
    const k = backOut(heartK); ctx.save(); ctx.translate(1420, 205); ctx.scale(k * 2.1, k * 2.1);
    ctx.lineWidth = 3.4; ctx.strokeStyle = C.pink; ctx.beginPath();
    ctx.moveTo(0, 8); ctx.bezierCurveTo(-14, -2, -10, -14, 0, -7); ctx.bezierCurveTo(10, -14, 14, -2, 0, 8); ctx.stroke(); ctx.restore();
  }
}

// 0–6 s: title types in over the sky, then the six logos pop up in a row.
function opening(t) {
  sky(); cloudLayer(t); petals(t, 40);
  roofLine(seg(t, .1, 1.1), seg(t, 2.3, 2.7));
  const chars = [...TITLE], px = 190, full = textW(TITLE, px); let x = W / 2 - full / 2;
  chars.forEach((ch, i) => {
    const w = textW(ch, px), k = seg(t, 1 + i * .25, 1.25 + i * .25);
    if (k > 0 && ch !== ' ') chunky(ch, x + w / 2, 420, px, C.pink, C.pinkDk, { k: backOut(k) });
    x += w;
  });
  const gap = 250, x0 = W / 2 - gap * 2.5;
  CAST.forEach((c, i) => {
    const k = seg(t, 3.4 + i * .35, 3.75 + i * .35); if (k <= 0) return;
    logo(c.key, x0 + i * gap, 700, 150, { k: backOut(k) });
    text(c.name, x0 + i * gap, 818, 40, C.ink, { alpha: k });
  });
  petals(t + 40, 8, .9);
}

// Character intro card: tinted city, big logo, coloured name ribbon, big tag that types in.
function introCard(c, t, lt) {
  sky(mix(c.col, '#FFFFFF', .62), mix(c.col, '#FFFFFF', .88));
  city(c.col, t); cloudLayer(t, 4, 7, false);
  logo(c.key, 1430 + Math.sin(lt * 2.2) * 10, 470 + Math.sin(lt * 3.1) * 14, 400, { k: backOut(seg(lt, 0, .35)), rot: Math.sin(lt * 1.6) * .05 });
  logo(c.key, 330, 260, 120, { k: backOut(seg(lt, .15, .45)), rot: Math.sin(lt * 2.5) * .12 });
  // name ribbon
  const rk = easeOut(seg(lt, .1, .4)), rx = lerp(-700, 70, rk);
  ctx.save(); ctx.beginPath(); ctx.moveTo(rx, 610); ctx.lineTo(rx + 640, 610); ctx.lineTo(rx + 610, 700); ctx.lineTo(rx - 30, 700); ctx.closePath();
  ctx.fillStyle = c.col; ctx.fill(); ctx.restore();
  text(c.name, rx + 70, 657, 60, '#FFFFFF', { align: 'left' });
  // tag bar
  const bk = easeOut(seg(lt, .2, .5)), bx = lerp(-1300, -40, bk);
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.15)'; ctx.shadowOffsetY = 10;
  ctx.beginPath(); ctx.moveTo(bx, 712); ctx.lineTo(bx + 1260, 712); ctx.lineTo(bx + 1210, 900); ctx.lineTo(bx, 900); ctx.closePath();
  const g = ctx.createLinearGradient(0, 712, 0, 900); g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, '#E4E6EA'); ctx.fillStyle = g; ctx.fill(); ctx.restore();
  const [a, b] = c.tag, all = a + b, n = Math.floor(clamp((lt - .55) / .12, 0, all.length));
  let x = 100;
  [...all].slice(0, n).forEach((ch, i) => {
    const px = 150, w = textW(ch, px);
    text(ch, x + w / 2, 808, px, i < a.length ? C.ink : c.col); x += w + 6;
  });
}

// Chat gag: the emperor asks; ChatGPT flatters and redoes everything.
function chatGag(t, lt) {
  const c = byKey('chatgpt');
  sky(mix(c.col, '#FFFFFF', .86), mix(c.col, '#FFFFFF', .94));
  logo(c.key, 330, 720 + Math.sin(lt * 3) * 8, 260, { rot: lt > 2.6 && lt < 3.2 ? Math.sin(lt * 40) * .06 : 0 });
  bubble('这标题不对，改改', 'user', 110, c.col, seg(lt, .1, .35));
  if (lt > .6 && lt < 1.3) typingDots(560, 290, c.col, lt);
  bubble('对对对！皇上圣明！', 'ai', 270, c.col, seg(lt, 1.3, 1.55));
  bubble('臣妾这就全部重做！', 'ai', 420, c.col, seg(lt, 2.2, 2.45));
  counterPill('今日已重做', Math.floor(20000 + Math.max(0, lt - 2.6) * 37), seg(lt, 2.5, 2.8));
}

// Example timeline: [start, end, fn(t, lt)].
const TIMELINE = [
  [0, 6, opening],
  [6, 9, (t, lt) => introCard(byKey('chatgpt'), t, lt)],
  [9, 13, chatGag],
];
const DUR = 13;
