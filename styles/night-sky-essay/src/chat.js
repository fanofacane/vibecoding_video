// chat.js: chat logs as a column of bubbles floating on the backdrop (no phone frame).
// Their bubbles: dark grey on the left. Mine: warm white with a soft glow on the right.
//
// A chat is an array of items:
//   { who: 'me'|'them', text }      bubble
//   { date: '2026年4月18日 23:14' }  tiny centred time stamp
//   { who, typing: [t0, t1] }       “typing…” dots that appear at t0 and go away at t1 (no message has to follow)
// Any item may carry `at` (seconds): it fades in at that time and pushes the column up.

const BUB = { font: 22, line: 31, padX: 17, padY: 11, r: 7, maxW: 330, gap: 12, turn: 26, date: 54 };
const CHAT_LAYOUTS = new WeakMap();

function chatLayout(ctx, items) {
  if (CHAT_LAYOUTS.has(items)) return CHAT_LAYOUTS.get(items);
  ctx.save(); ctx.font = `400 ${BUB.font}px ${SANS}`;
  let prev = null;
  const out = items.map(it => {
    if (it.date) { prev = null; return { ...it, h: BUB.date }; }
    if (it.typing) return { ...it, bw: 84, bh: 44, space: BUB.gap, h: 44 + BUB.gap };
    const lines = wrap(ctx, it.text, BUB.maxW);
    const bw = Math.max(...lines.map(l => ctx.measureText(l).width)) + BUB.padX * 2;
    const bh = lines.length * BUB.line + BUB.padY * 2 - (BUB.line - BUB.font);
    const space = prev === null ? 0 : prev === it.who ? BUB.gap : BUB.turn;
    prev = it.who;
    return { ...it, lines, bw, bh, space, h: bh + space };
  });
  ctx.restore();
  CHAT_LAYOUTS.set(items, out);
  return out;
}

// One bubble with its top-left at (x, y).
function bubble(ctx, it, x, y, a = 1) {
  if (a <= 0) return;
  const me = it.who === 'me';
  ctx.save(); ctx.globalAlpha *= a;
  roundRect(ctx, x, y, it.bw, it.bh, BUB.r);
  if (me) { ctx.shadowColor = 'rgba(237,232,228,.42)'; ctx.shadowBlur = 26; }
  ctx.fillStyle = me ? COL.me : COL.them; ctx.fill();
  ctx.shadowColor = 'transparent';
  if (!me) { ctx.strokeStyle = 'rgba(255,255,255,.05)'; ctx.lineWidth = 1; ctx.stroke(); }
  ctx.font = `400 ${BUB.font}px ${SANS}`; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  ctx.fillStyle = me ? COL.meText : COL.themText;
  it.lines.forEach((l, i) => ctx.fillText(l, x + BUB.padX, y + BUB.padY + BUB.font * .86 + i * BUB.line));
  ctx.restore();
}

// o: { t, x (column left), w (column width), top, bot (visible band), items, scroll (0 = newest at the bottom,
//      1 = oldest at the top), fade (px of soft edge), a (alpha), dx (extra x shift), fromTop (start at the top),
//      y0 (screen y of the top of the content; overrides the automatic placement) }
// Returns the y of the bottom of the content.
function chatColumn(ctx, o) {
  const t = o.t, items = chatLayout(ctx, o.items), fade = o.fade ?? 120;
  const grow = it => it.typing ? easeOut(seg(t, it.typing[0], it.typing[0] + .25)) * (1 - ease(seg(t, it.typing[1] - .2, it.typing[1])))
    : it.at === undefined ? 1 : easeOut(seg(t, it.at, it.at + .35));
  let total = 0;
  for (const it of items) total += it.h * grow(it);
  const view = o.bot - o.top, maxOff = Math.max(0, total - view + 30);
  let y = o.bot - 30 - total + (o.scroll || 0) * maxOff;
  if (o.fromTop) y = Math.min(y, o.top + 20);   // a live chat starts at the top and scrolls once it is full
  if (o.y0 !== undefined) y = o.y0;             // or the caller places the top of the content itself
  ctx.save(); ctx.globalAlpha *= o.a ?? 1;
  for (const it of items) {
    const k = grow(it); if (k <= 0) continue;
    const top = y + (it.space || 0) * k;
    y += it.h * k;
    if (y < o.top - 60 || top > o.bot + 60) continue;
    const edge = seg(top - o.top, -20, fade) * seg(o.bot - (top + (it.bh || 20)), -20, fade);
    if (it.date) {
      ctx.save(); ctx.globalAlpha *= edge * k;
      label(ctx, it.date, { t: 1, t0: 0, x: o.x + o.w / 2, y: top + 33, size: 14, align: 'center', color: COL.dim, spacing: 1.5 });
      ctx.restore();
      continue;
    }
    const x = (it.who === 'me' ? o.x + o.w - it.bw : o.x) + (o.dx || 0);
    if (it.typing) { typingDots(ctx, it, x, top, t, edge * k); continue; }
    bubble(ctx, it, x, top + (1 - k) * 14, edge * k);
  }
  ctx.restore();
  return y;
}

// Height of the chat content at time t (items still to come count as zero).
function chatHeight(ctx, items, t) {
  let total = 0;
  for (const it of chatLayout(ctx, items)) {
    const k = it.typing ? 0 : it.at === undefined ? 1 : easeOut(seg(t, it.at, it.at + .35));
    total += it.h * k;
  }
  return total;
}

// Three bouncing dots in the speaker's bubble colour.
function typingDots(ctx, it, x, y, t, a) {
  if (a <= 0) return;
  const me = it.who === 'me';
  ctx.save(); ctx.globalAlpha *= a;
  roundRect(ctx, x, y, it.bw, it.bh, BUB.r);
  ctx.fillStyle = me ? rgba(COL.me, .85) : COL.them; ctx.fill();
  for (let i = 0; i < 3; i++) {
    const b = Math.max(0, Math.sin(t * 7 - i * .8));
    ctx.fillStyle = me ? rgba(COL.meText, .35 + .5 * b) : rgba(COL.themText, .3 + .55 * b);
    ctx.beginPath(); ctx.arc(x + 24 + i * 18, y + it.bh / 2 - b * 3, 4.5, 0, 7); ctx.fill();
  }
  ctx.restore();
}

// A bubble on its own (for messages that spill out of the column). (x, y) is its centre.
function looseBubble(ctx, it, x, y, o = {}) {
  const L = chatLayout(ctx, [it])[0], s = o.s ?? 1;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  bubble(ctx, L, -L.bw / 2, -L.bh / 2, o.a ?? 1);
  ctx.restore();
}
