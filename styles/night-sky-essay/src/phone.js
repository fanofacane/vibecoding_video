// phone.js: a phone showing a chat, and loose chat bubbles that float outside it.
//
// A chat is an array of items:
//   { who: 'me'|'them', text }            text bubble
//   { who, voice: 12 }                    voice message, 12 seconds
//   { who, image: true }                  photo placeholder
//   { date: '2022年3月14日' }              centred date chip
// Any item may carry `at` (seconds): it pops in at that time and pushes the chat up.

const PH = { w: 420, h: 860, r: 54, pad: 14, head: 92 };   // phone body in its own units
const CHAT_FONT = 23, CHAT_LINE = 33, BUB_MAX = 250, AV = 40;
const LAYOUTS = new WeakMap();

function chatLayout(ctx, items) {
  if (LAYOUTS.has(items)) return LAYOUTS.get(items);
  ctx.save(); ctx.font = `400 ${CHAT_FONT}px ${SANS}`;
  const out = items.map(it => {
    if (it.date) return { ...it, h: 52 };
    if (it.voice) return { ...it, bw: 90 + it.voice * 7, lines: null, h: 64 };
    if (it.image) return { ...it, bw: 190, h: 150 };
    const lines = wrap(ctx, it.text, BUB_MAX);
    const bw = Math.max(...lines.map(l => ctx.measureText(l).width)) + 34;
    return { ...it, lines, bw, h: lines.length * CHAT_LINE + 26 + 18 };
  });
  ctx.restore();
  LAYOUTS.set(items, out);
  return out;
}

// o: { cx, cy, s, t, name, accent, avatar, items, scroll (0 = pinned to bottom, 1 = top of history),
//      typing (bool), sub (header subtitle), glow, dimOthers }
function phone(ctx, o) {
  const t = o.t, s = o.s || 1, w = PH.w, h = PH.h;
  ctx.save();
  ctx.translate(o.cx, o.cy); ctx.scale(s, s); ctx.translate(-w / 2, -h / 2);
  // Glow and body.
  if (o.glow !== 0) {
    const g = ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, w * 1.1);
    g.addColorStop(0, rgba(o.accent, .18 * (o.glow ?? 1))); g.addColorStop(1, rgba(o.accent, 0));
    ctx.fillStyle = g; ctx.fillRect(-w * .6, -h * .3, w * 2.2, h * 1.6);
  }
  ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 20;
  roundRect(ctx, 0, 0, w, h, PH.r); ctx.fillStyle = '#05060a'; ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = COL.phoneEdge; ctx.lineWidth = 3; ctx.stroke();
  const sx = PH.pad, sy = PH.pad, sw = w - PH.pad * 2, sh = h - PH.pad * 2;
  roundRect(ctx, sx, sy, sw, sh, PH.r - PH.pad); ctx.save(); ctx.clip();
  ctx.fillStyle = COL.phone; ctx.fillRect(sx, sy, sw, sh);

  // Chat area.
  const top = sy + PH.head, bot = sy + sh - 70, items = chatLayout(ctx, o.items);
  const grow = it => it.at === undefined ? 1 : easeOut(seg(t, it.at, it.at + .28));
  let total = 18;
  for (const it of items) total += it.h * grow(it);
  if (o.typing) total += 62;
  const view = bot - top, maxOff = Math.max(0, total - view);
  const off = (o.scroll || 0) * maxOff;           // distance scrolled up from the bottom
  let y = bot - total + off;                       // top of the content
  ctx.save(); ctx.beginPath(); ctx.rect(sx, top, sw, bot - top); ctx.clip();
  let stickyDate = null;
  for (const it of items) {
    const k = grow(it); if (k <= 0) continue;
    const hh = it.h * k;
    if (y + hh > top - 200 && y < bot + 50) drawChatItem(ctx, it, sx, y, sw, k, o);
    if (it.date && y < top + 6) stickyDate = it.date;
    y += hh;
  }
  if (o.typing) drawTyping(ctx, sx, y + 6, t, o);
  ctx.restore();

  // Sticky date while scrolling through history.
  if (stickyDate && o.scroll > .02) {
    ctx.font = `500 18px ${SANS}`;
    const tw = ctx.measureText(stickyDate).width + 28;
    roundRect(ctx, sx + sw / 2 - tw / 2, top + 10, tw, 32, 16); ctx.fillStyle = 'rgba(40,44,58,.92)'; ctx.fill();
    ctx.fillStyle = COL.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(stickyDate, sx + sw / 2, top + 27);
  }

  // Header.
  ctx.fillStyle = COL.header; ctx.fillRect(sx, sy, sw, PH.head);
  ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fillRect(sx, sy + PH.head - 1, sw, 1);
  ctx.fillStyle = '#000'; roundRect(ctx, sx + sw / 2 - 55, sy + 8, 110, 30, 15); ctx.fill();   // camera island
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `500 25px ${SANS}`; ctx.fillStyle = COL.ink;
  ctx.fillText(o.name, sx + sw / 2, sy + 60 - (o.sub ? 6 : 0));
  if (o.sub) { ctx.font = `400 15px ${SANS}`; ctx.fillStyle = COL.dim; ctx.fillText(o.sub, sx + sw / 2, sy + 80); }
  ctx.font = `300 34px ${SANS}`; ctx.fillStyle = COL.dim; ctx.textAlign = 'left'; ctx.fillText('‹', sx + 18, sy + 58);

  // Input bar.
  ctx.fillStyle = COL.header; ctx.fillRect(sx, bot, sw, sy + sh - bot);
  roundRect(ctx, sx + 20, bot + 14, sw - 40, 40, 20); ctx.fillStyle = '#20232f'; ctx.fill();
  if (o.draft !== undefined) {
    ctx.font = `400 21px ${SANS}`; ctx.fillStyle = COL.ink; ctx.textAlign = 'left'; ctx.fillText(o.draft, sx + 40, bot + 35);
    if ((t * 2.2) % 1 < .6) { ctx.fillStyle = COL.me; ctx.fillRect(sx + 42 + ctx.measureText(o.draft).width, bot + 22, 2.5, 26); }
  }
  ctx.restore();   // screen clip
  ctx.restore();
}

function avatar(ctx, x, y, r, color, ch) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#10131c'; ctx.font = `600 ${r * .95}px ${SANS}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(ch, x, y + 1);
}

function drawChatItem(ctx, it, sx, y, sw, k, o) {
  ctx.save();
  ctx.globalAlpha *= k;
  if (it.date) {
    ctx.font = `400 16px ${SANS}`; ctx.fillStyle = COL.faint; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(it.date, sx + sw / 2, y + 26);
    ctx.restore(); return;
  }
  const me = it.who === 'me', col = me ? COL.me : COL.bubble;
  const ax = me ? sx + sw - 16 - AV / 2 : sx + 16 + AV / 2, ay = y + 9 + AV / 2;
  avatar(ctx, ax, ay, AV / 2, me ? COL.me : o.accent, me ? '我' : o.avatar);
  const bx = me ? ax - AV / 2 - 10 - it.bw : ax + AV / 2 + 10, by = y + 9, bh = it.h - 18;
  // Pop: scale from the avatar side.
  const p = .85 + .15 * backOut(k);
  ctx.translate(me ? bx + it.bw : bx, by); ctx.scale(p, p); ctx.translate(-(me ? bx + it.bw : bx), -by);
  roundRect(ctx, bx, by, it.bw, bh, 14); ctx.fillStyle = it.image ? '#30364a' : col; ctx.fill();
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  if (it.voice) {
    ctx.fillStyle = me ? '#fff' : COL.ink; ctx.font = `400 ${CHAT_FONT}px ${SANS}`;
    const wx = me ? bx + it.bw - 20 : bx + 18;
    for (let i = 0; i < 3; i++) { ctx.globalAlpha *= 1; ctx.fillRect(me ? wx - i * 7 - 3 : wx + i * 7, by + bh / 2 - 4 - i * 4, 3, 8 + i * 8); }
    ctx.textAlign = me ? 'left' : 'right';
    ctx.fillText(`${it.voice}″`, me ? bx + 16 : bx + it.bw - 16, by + bh / 2 + 8);
  } else if (it.image) {
    const g = ctx.createLinearGradient(bx, by, bx + it.bw, by + bh);
    g.addColorStop(0, rgba(o.accent, .55)); g.addColorStop(1, '#2b3150');
    ctx.fillStyle = g; roundRect(ctx, bx + 6, by + 6, it.bw - 12, bh - 12, 10); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.arc(bx + it.bw - 46, by + 40, 14, 0, 7); ctx.fill();
  } else {
    ctx.font = `400 ${CHAT_FONT}px ${SANS}`; ctx.fillStyle = me ? '#fff' : COL.ink;
    it.lines.forEach((l, i) => ctx.fillText(l, bx + 17, by + 32 + i * CHAT_LINE));
  }
  ctx.restore();
}

function drawTyping(ctx, sx, y, t, o) {
  const ax = sx + 16 + AV / 2;
  avatar(ctx, ax, y + 9 + AV / 2, AV / 2, o.accent, o.avatar);
  roundRect(ctx, ax + AV / 2 + 10, y + 9, 84, 44, 14); ctx.fillStyle = COL.bubble; ctx.fill();
  for (let i = 0; i < 3; i++) {
    const b = Math.max(0, Math.sin(t * 7 - i * .7));
    ctx.fillStyle = rgba(COL.ink, .4 + .5 * b);
    ctx.beginPath(); ctx.arc(ax + AV / 2 + 34 + i * 18, y + 31 - b * 4, 5, 0, 7); ctx.fill();
  }
}

// A chat bubble on its own, outside any phone (used when messages overflow the screen).
function looseBubble(ctx, text, x, y, o) {
  const s = o.s || 1;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha *= o.a ?? 1;
  ctx.font = `400 ${CHAT_FONT}px ${SANS}`;
  const tw = ctx.measureText(text).width, bw = tw + 34, bh = 50;
  ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8;
  roundRect(ctx, AV / 2 + 10, -bh / 2, bw, bh, 14); ctx.fillStyle = COL.bubble; ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = rgba(o.accent, .35); ctx.lineWidth = 1.5; ctx.stroke();
  avatar(ctx, 0, 0, AV / 2, o.accent, o.avatar);
  ctx.font = `400 ${CHAT_FONT}px ${SANS}`;
  ctx.fillStyle = COL.ink; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(text, AV / 2 + 27, 2);
  ctx.restore();
}
