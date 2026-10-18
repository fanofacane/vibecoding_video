// opening.js: the opening of 《留白》 on its own, for review (about 16 s).
// Three kinds of moving type only: lines pushed in from below (and kept, building a block), one word at a time
// filling the frame on the beat (then settling into a vertical column), and wipes that swap the whole page.
// Horizontal and vertical text are mixed so the frame is never just one line.

// Laid out on a 16 s timeline (TL) and played back in 5 s.
const TL_DUR = 16.0, DUR = 5.0, SPEED = TL_DUR / DUR;
const BLUE = '#3d6cf0';

// ---------------------------------------------------------------- helpers

// Lines pushed in from below; each new line nudges the earlier ones up. lines: [[text, t0, colour]]
function pushBlock(ctx, t, lines, x, y, size, lineH, a = 1) {
  ctx.save(); ctx.globalAlpha *= a;
  ctx.font = `500 ${size}px ${SERIF}`; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  lines.forEach(([text, t0, color], i) => {
    if (t < t0) return;
    const k = easeOut(seg(t, t0, t0 + .5));
    const up = lines.slice(i + 1).reduce((s, [, t1]) => s + easeOut(seg(t, t1, t1 + .5)), 0);
    ctx.save();
    ctx.globalAlpha *= k * (1 - .35 * clamp(up / 2));
    const parts = Array.isArray(text) ? text : [[text, color || COL.ink]];
    let xx = x;
    for (const [s, c] of parts) { ctx.fillStyle = c; ctx.fillText(s, xx, y + (1 - k) * 70 - up * lineH); xx += ctx.measureText(s).width; }
    ctx.restore();
  });
  ctx.restore();
}

// Vertical text: characters stacked top to bottom, centred on x. charA(i) → alpha per character.
function vtext(ctx, text, x, y, size, color, a = 1, charA = null, glow = null) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  ctx.font = `600 ${size}px ${SERIF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  if (glow) { ctx.shadowColor = glow; ctx.shadowBlur = size * .3; }
  [...text].forEach((ch, i) => {
    const ca = charA ? charA(i) : 1;
    if (ca <= 0) return;
    ctx.save(); ctx.globalAlpha *= ca; ctx.fillStyle = color; ctx.fillText(ch, x, y + i * size * 1.04); ctx.restore();
  });
  ctx.restore();
}

// Small editorial labels in the corners, so the page always has a frame.
function corners(ctx, t, a) {
  ctx.save(); ctx.globalAlpha *= a;
  label(ctx, '留 白  ·  序', { t, t0: .1, x: 90, y: 70, size: 15, color: COL.dim });
  label(ctx, '一 个 关 于 聊 天 的 问 题', { t, t0: .2, x: W - 90, y: 70, size: 15, color: COL.dim, align: 'right' });
  ctx.fillStyle = COL.line; ctx.fillRect(90, 90, (W - 180) * easeOut(seg(t, .1, 1.2)), 1);
  ctx.fillRect(90, H - 80, (W - 180) * easeOut(seg(t, .2, 1.3)), 1);
  label(ctx, '0 1', { t, t0: .3, x: 90, y: H - 50, size: 14, color: COL.faint });
  label(ctx, '2 0 2 6', { t, t0: .3, x: W - 90, y: H - 50, size: 14, color: COL.faint, align: 'right' });
  ctx.restore();
}

// ---------------------------------------------------------------- page 1: the pattern

const BEATS = [3.7, 4.3, 4.9, 5.5];
const WORDS = ['早安', '到了吗', '嗯', '晚安'];
const COLS_X = [1700, 1500, 1300, 1120];

function page1(ctx, t) {
  // Block A — the lovers: three lines pushed in, kept.
  vtext(ctx, '恋人', 104, 250, 22, COL.dim, seg(t, .3, .8));
  pushBlock(ctx, t, [
    ['你有没有发现——', .4],
    ['那个每天都在聊天的人，', 1.4],
    [[['话却', COL.ink], ['越来越少', BLUE], ['了。', COL.ink]], 2.4],
  ], 150, 480, 66, 92);

  // Block B — one word per beat: it first fills the frame, then settles into a vertical column on the right.
  WORDS.forEach((w, i) => {
    const b = BEATS[i];
    if (t < b) return;
    const f = seg(t, b + .28, b + .62), k = easeInOut(f);
    const settled = t > b + .62;
    const sizeBig = 300, sizeCol = 150;
    const n = [...w].length;
    const yBig = H / 2 - n * sizeBig * 1.04 / 2, yCol = 150;
    // While it fills the frame, everything else steps back.
    if (!settled) {
      const bounce = 1 + .12 * (1 - easeOut(seg(t, b, b + .2)));
      ctx.save();
      ctx.fillStyle = `rgba(6,7,9,${.88 * (1 - k)})`; ctx.fillRect(0, 0, W, H);
      ctx.translate(lerp(W / 2, COLS_X[i], k), lerp(yBig, yCol, k));
      ctx.scale(lerp(bounce, sizeCol / sizeBig, k), lerp(bounce, sizeCol / sizeBig, k));
      vtext(ctx, w, 0, 0, sizeBig, COL.ink, 1, null, 'rgba(237,232,228,.35)');
      ctx.restore();
    }
  });

  // Block C — the friend: three more lines pushed in under block A, in warm white.
  vtext(ctx, '老朋友', 104, 700, 22, COL.dim, seg(t, 6.2, 6.7));
  pushBlock(ctx, t, [
    ['反而是那个好久没联系的朋友，', 6.3],
    ['一句“在吗”，', 7.2],
    [[['就能聊到', COL.warm], ['凌晨两点', BLUE], ['。', COL.warm]], 8.1],
  ], 150, 930, 58, 84);
  // A thin rule between the two blocks.
  ctx.fillStyle = COL.line; ctx.fillRect(150, 580, 760 * easeOut(seg(t, 6.0, 6.8)), 1);
}

// The settled columns stay on screen through the wipe; on page 2 they shrink a little and pack to the right.
const COLS_X2 = [1790, 1650, 1510, 1370];
function columns(ctx, t) {
  const m = easeInOut(seg(t, 8.9, 9.9));
  WORDS.forEach((w, i) => {
    const b = BEATS[i];
    if (t <= b + .62) return;
    const older = BEATS.filter(x => x > b && t > x + .62).length;
    const a = lerp(1 - .45 * clamp(older / 2), .55, m);
    vtext(ctx, w, lerp(COLS_X[i], COLS_X2[i], m), lerp(150, 210, m), lerp(150, 120, m), i === 2 ? BLUE : COL.ink, a);
  });
}

// ---------------------------------------------------------------- page 2: the question

function page2(ctx, t) {
  // A big vertical 为什么 on the left, the question to its right.
  vtext(ctx, '为什么', 210, 200, 200, COL.ink, 1, i => seg(t, 9.6 + i * .12, 10.0 + i * .12), 'rgba(237,232,228,.25)');
  ctx.fillStyle = COL.line; ctx.fillRect(360, 200, 1, 680 * easeOut(seg(t, 9.8, 10.6)));
  ctx.save();
  ctx.font = `500 62px ${SERIF}`; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  const q1 = [['天天联系的人，话', COL.ink], ['越来越少', COL.dim], ['；', COL.ink]];
  let x = 420; for (const [s, c] of q1) { ctx.fillStyle = c; ctx.fillText(s, x, 430); x += ctx.measureText(s).width; }
  ctx.restore();
  // Second line arrives under a horizontal wipe moving down.
  const w2 = seg(t, 11.0, 11.7), by = lerp(470, 600, easeInOut(w2));
  if (w2 > 0) {
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, by); ctx.clip();
    ctx.font = `500 62px ${SERIF}`; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    const q2 = [['偶尔联系的人，却', COL.ink], ['越聊越多', COL.warm], ['？', BLUE]];
    let xx = 420; for (const [s, c] of q2) { ctx.fillStyle = c; if (s === '？') { ctx.shadowColor = 'rgba(61,108,240,.8)'; ctx.shadowBlur = 24; } ctx.fillText(s, xx, 560); ctx.shadowBlur = 0; xx += ctx.measureText(s).width; }
    ctx.restore();
    if (w2 < 1) { ctx.fillStyle = BLUE; ctx.shadowColor = 'rgba(61,108,240,.9)'; ctx.shadowBlur = 18; ctx.fillRect(400, by, 860, 2.5); ctx.shadowBlur = 0; }
  }
  // Supporting lines pushed in underneath, and a vertical note on the far right.
  pushBlock(ctx, t, [
    [[['这部片子想回答的，就是这个问题。', COL.dim]], 12.4],
    [[['先从一段', COL.dim], ['聊天记录', COL.ink], ['说起。', COL.dim]], 13.3],
  ], 424, 820, 38, 60);
}

// ---------------------------------------------------------------- frame

const WIPE1 = [8.9, 9.7];   // vertical bar sweeps left to right: page 1 → page 2

function drawFrame(ctx, real) {
  const t = real * SPEED;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
  ctx.fillStyle = COL.bg0; ctx.fillRect(0, 0, W, H);
  backdrop(ctx, { t, lift: .5 });
  const out = 1 - seg(t, TL_DUR - .8, TL_DUR - .1);
  ctx.save(); ctx.globalAlpha *= out;
  corners(ctx, t, 1);
  const w = seg(t, WIPE1[0], WIPE1[1]), bx = lerp(-20, 1300, easeInOut(w));
  if (t < WIPE1[1] + .1) { ctx.save(); ctx.beginPath(); ctx.rect(t > WIPE1[1] ? W : bx, 0, W, H); ctx.clip(); page1(ctx, t); ctx.restore(); }
  if (t > WIPE1[0]) { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, bx, H); ctx.clip(); page2(ctx, t); ctx.restore(); }
  columns(ctx, t);
  if (w > 0 && w < 1) { ctx.fillStyle = BLUE; ctx.shadowColor = 'rgba(61,108,240,.9)'; ctx.shadowBlur = 24; ctx.fillRect(bx - 1.5, 0, 3, H); ctx.shadowBlur = 0; }
  ctx.restore();
  const black = 1 - seg(real, 0, .15) + seg(real, DUR - .12, DUR);
  if (black > 0) { ctx.fillStyle = `rgba(0,0,0,${clamp(black)})`; ctx.fillRect(0, 0, W, H); }
  finish(ctx, real);
}

// ---------------------------------------------------------------- sound

const CUES = [
  ...BEATS.map((b, i) => ({ t: b / SPEED, kind: 'note', f: [523.3, 587.3, 392, 523.3][i] })),
  { t: WIPE1[0] / SPEED, kind: 'whoosh' }, { t: 11.0 / SPEED, kind: 'whoosh' },
  { t: 11.7 / SPEED, kind: 'chord', notes: [146.8, 220, 293.7, 370] },
];
const PAD = [[.05, [87.3, 130.8, 220]], [2.8, [110, 164.8, 261.6, 329.6]]];

const CUT = { dur: DUR, cues: CUES, pad: PAD, drawFrame };
