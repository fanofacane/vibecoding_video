// chat.js: group-chat scenes. A chat is a list of messages with appear times; layout, typing dots and
// auto-scroll are all computed from the local time `lt`, so any frame can be rendered on its own.
//
// Message: { at, who, text, kind, typing, doc }
//   who: 'user' (the human, right side) | a cast key | 'all' (whole cast)
//   kind: 'text' (default) | 'note' (grey system line, e.g. 已深度思考) | 'doc' (document card, see docCard)
//   text markup: [..] is a censored swear (black bar, red text); {..} is highlighted in the speaker colour.
//   typing: seconds of "…" before a cast message (default .7; 0 to skip).
// Names come from WORK.user.name, WORK.group.all and each cast member's role.

const CHAT = { top: 150, bottom: H - 46, px: 58, lh: 76, pad: 32, maxW: 1180, gap: 28, avatar: 116, side: 206 };

// ---------- avatars ----------
function crown(x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = '#F7C531'; ctx.strokeStyle = '#B77F00'; ctx.lineWidth = 3; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(-34, 22); ctx.lineTo(-38, -16); ctx.lineTo(-18, 2); ctx.lineTo(0, -28); ctx.lineTo(18, 2); ctx.lineTo(38, -16); ctx.lineTo(34, 22); ctx.closePath();
  ctx.fill(); ctx.stroke();
  for (const [px, py, c] of [[-38, -18, '#E8453C'], [0, -30, '#2F6BFF'], [38, -18, '#E8453C'], [0, 8, '#10A37F']]) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(px, py, 6, 0, TAU); ctx.fill(); }
  ctx.restore();
}
// Generic user avatar: a person silhouette.
function person(x, y, s, col = '#5B7FD6') {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = col;
  ctx.beginPath(); ctx.arc(0, -12, 18, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, 28, 32, 22, 0, Math.PI, 0); ctx.fill(); ctx.restore();
}
const AVATARS = { crown: (x, y) => crown(x, y + 4, 1), person: (x, y) => person(x, y, 1) };
const byKey = k => WORK.cast.find(c => c.key === k);
function avatar(who, x, y, k = 1) {
  const r = CHAT.avatar / 2, user = who === 'user';
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ctx.shadowColor = 'rgba(0,0,0,.12)'; ctx.shadowOffsetY = 5;
  ctx.fillStyle = user ? '#FFF4CC' : '#FFFFFF'; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
  ctx.shadowColor = 'transparent';
  if (user) AVATARS[WORK.user.avatar || 'person'](0, 0);
  else if (who === 'all') WORK.cast.slice(0, 6).forEach((c, i) => logo(c.key, (i % 3 - 1) * 30, (Math.floor(i / 3) - .5) * 34, 30, { shadow: false }));
  else logo(who, 0, 0, 74, { shadow: false });
  ctx.restore();
}
const whoName = who => who === 'user' ? WORK.user.name : who === 'all' ? WORK.group.all : byKey(who).role;
const whoCol = who => who === 'user' ? C.userBlue : who === 'all' ? C.pink : byKey(who).col;

// ---------- rich text ----------
// Parse [swear] and {highlight} markup into per-character runs, then wrap to maxW.
function richChars(txt, hl) {
  const out = []; let mode = null;
  for (const ch of txt) {
    if (ch === '[') { mode = 'swear'; continue; } if (ch === ']' || ch === '}') { mode = null; continue; } if (ch === '{') { mode = 'hl'; continue; }
    out.push({ ch, col: mode === 'swear' ? '#E8453C' : mode === 'hl' ? hl : null });
  }
  return out;
}
const NO_LINE_START = '，。：；！？、）」”’…—,.:;!?)';
function wrapRich(chars, px, maxW) {
  // balance lines so the last one isn't a lonely word: re-wrap at the average width when that keeps the line count
  const first = wrapOnce(chars, px, maxW);
  if (first.length < 2) return first;
  const total = first.reduce((a, l) => a + l.w, 0), even = wrapOnce(chars, px, total / first.length + px * 1.2);
  return even.length === first.length ? even : first;
}
function wrapOnce(chars, px, maxW) {
  ctx.save(); ctx.font = FONT(px, 800);
  const lines = [[]]; let w = 0;
  for (const c of chars) {
    const cw = ctx.measureText(c.ch).width;
    if (w + cw > maxW && lines[lines.length - 1].length && !NO_LINE_START.includes(c.ch)) { lines.push([]); w = 0; }
    c.w = cw; lines[lines.length - 1].push(c); w += cw;
  }
  ctx.restore();
  return lines.map(l => ({ chars: l, w: l.reduce((a, c) => a + c.w, 0) }));
}

// ---------- document card ----------
// A paper card for the thing being argued about. doc = { header, text, mark?, fix?, stamp? }
//   mark: index of a character to circle in red (pointing out a mistake)
//   fix:  { index, to } strikes that character out and pops the replacement above it
//   stamp: { text, col?, at? } slams a rubber stamp onto the card (at = seconds after the card appears)
const DOC = { w: 760, h: 230 };
function docCard(x, y, d, lt) {
  const { w, h } = DOC;
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.15)'; ctx.shadowOffsetY = 8;
  rrect(x, y, w, h, 18); ctx.fillStyle = '#FFF7E3'; ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.lineWidth = 6; ctx.strokeStyle = '#C8413A'; rrect(x + 14, y + 14, w - 28, h - 28, 10); ctx.stroke();
  if (d.header) text(d.header, x + w / 2, y + 52, 30, '#C8413A', { weight: 800 });
  const px = 64, chars = [...d.text], tw = textW(d.text, px); let cx = x + w / 2 - tw / 2;
  chars.forEach((ch, i) => {
    const cw = textW(ch, px), mid = cx + cw / 2, fixed = d.fix && d.fix.index === i, marked = d.mark === i;
    if (fixed) {
      const k = seg(lt, .35, .6);
      text(ch, mid, y + 140, px, C.grey, { alpha: 1 - k * .6 });
      ctx.strokeStyle = '#E8453C'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(mid - 34, y + 140); ctx.lineTo(mid - 34 + 68 * seg(lt, .1, .35), y + 140); ctx.stroke();
      if (k > 0) { ctx.save(); ctx.translate(mid, y + 92); ctx.scale(backOut(k), backOut(k)); text(d.fix.to, 0, 0, 58, '#10A37F'); ctx.restore(); }
    } else text(ch, mid, y + 140, px, marked ? '#E8453C' : C.ink);
    if (marked) { const p = seg(lt, .2, .7); ctx.strokeStyle = '#E8453C'; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(mid, y + 140, 50, 46, -.3, -1.2, -1.2 + TAU * p); ctx.stroke(); }
    cx += cw;
  });
  if (d.stamp) { const a = d.stamp.at ?? .2; stamp(d.stamp.text, x + w - 120, y + 172, seg(lt, a, a + .2), d.stamp.col); }
  ctx.restore();
  return h;
}
function stamp(txt, x, y, k, col = '#E8453C') {
  if (k <= 0) return; const s = lerp(2.2, 1, easeOut(k));
  ctx.save(); ctx.translate(x, y); ctx.rotate(-.18); ctx.scale(s, s); ctx.globalAlpha = clamp(k * 2);
  ctx.strokeStyle = col; ctx.lineWidth = 5; rrect(-96, -36, 192, 72, 10); ctx.stroke();
  text(txt, 0, 2, 44, col); ctx.restore();
}

// ---------- layout ----------
function layoutChat(msgs) {
  let y = CHAT.top; const items = [];
  for (const m of msgs) {
    const typing = m.who !== 'user' && (m.kind || 'text') === 'text' ? (m.typing ?? .7) : 0;
    let h, lines = null;
    if (m.kind === 'note') h = 54;
    else if (m.kind === 'doc') h = 42 + DOC.h;
    else { lines = wrapRich(richChars(m.text, whoCol(m.who)), CHAT.px, CHAT.maxW); h = 42 + lines.length * CHAT.lh + CHAT.pad * 1.3; }
    items.push({ m, y, h, lines, appear: m.at - typing, typing });
    y += h + CHAT.gap;
  }
  // scroll target after each item appears (monotonic), eased in when that item appears
  let prev = 0;
  for (const it of items) { const tgt = Math.max(prev, it.y + it.h - CHAT.bottom); it.dScroll = tgt - prev; prev = tgt; }
  return items;
}

// Draw a chat at local time lt. o.title overrides the group name in the top bar.
function chatScene(msgs, lt, o = {}) {
  const items = o._items || (o._items = layoutChat(msgs));
  const scroll = items.reduce((a, it) => a + it.dScroll * ease((lt - it.appear) / .35), 0);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 120, W, H - 120); ctx.clip(); ctx.translate(0, -scroll);
  for (const it of items) {
    if (lt < it.appear) break;
    const { m } = it, right = m.who === 'user', k = seg(lt, it.appear, it.appear + .22);
    if (m.kind === 'note') { text('✓ ' + m.text, CHAT.side, it.y + 24, 32, C.grey, { align: 'left', weight: 500, alpha: k }); continue; }
    const ax = right ? W - 110 : 110;
    avatar(m.who, ax, it.y + CHAT.avatar / 2, backOut(k));
    text(whoName(m.who), right ? W - CHAT.side : CHAT.side, it.y + 14, 30, C.grey, { align: right ? 'right' : 'left', weight: 800, alpha: k });
    const by = it.y + 42;
    if (lt < m.at) { typingDots(CHAT.side, by, whoCol(m.who), lt); continue; }
    const pk = backOut(seg(lt, m.at, m.at + .25));
    if (m.kind === 'doc') {
      const x = right ? W - CHAT.side - DOC.w : CHAT.side, ox = x + (right ? DOC.w : 0);
      ctx.save(); ctx.translate(ox, by); ctx.scale(pk, pk); ctx.translate(-ox, -by);
      docCard(x, by, m.doc, lt - m.at); ctx.restore(); continue;
    }
    const bw = Math.max(...it.lines.map(l => l.w)) + CHAT.pad * 2, bh = it.lines.length * CHAT.lh + CHAT.pad * 1.3;
    const bx = right ? W - CHAT.side - bw : CHAT.side;
    ctx.save(); ctx.translate(right ? bx + bw : bx, by); ctx.scale(pk, pk); ctx.translate(-(right ? bx + bw : bx), -by);
    ctx.shadowColor = 'rgba(0,0,0,.1)'; ctx.shadowOffsetY = 6; rrect(bx, by, bw, bh, 26);
    ctx.fillStyle = right ? C.userBlue : '#FFFFFF'; ctx.fill(); ctx.shadowColor = 'transparent';
    if (!right) { ctx.lineWidth = 5; ctx.strokeStyle = whoCol(m.who); ctx.stroke(); }
    it.lines.forEach((l, li) => {
      let x = bx + CHAT.pad; const y = by + CHAT.pad * .65 + CHAT.lh * (li + .5);
      for (const c of l.chars) {
        if (c.col === '#E8453C') { ctx.fillStyle = '#16161A'; ctx.fillRect(x, y - 28, c.w, 56); }
        text(c.ch, x + c.w / 2, y + 2, CHAT.px, c.col === '#E8453C' ? '#FF6B6B' : c.col || (right ? '#FFFFFF' : C.ink), { weight: 800 });
        x += c.w;
      }
    });
    ctx.restore();
  }
  ctx.restore();
  // top bar
  ctx.save(); ctx.fillStyle = 'rgba(255,255,255,.93)'; ctx.fillRect(0, 0, W, 120);
  ctx.fillStyle = 'rgba(0,0,0,.06)'; ctx.fillRect(0, 120, W, 3);
  text('‹', 70, 58, 64, C.ink, { weight: 500 }); text(o.title || WORK.group.name, W / 2, 60, 44, C.ink, { weight: 800 }); if (!o.noDots) text('···', W - 80, 52, 50, C.ink);
  ctx.restore();
}

// Comic overlay text: pops in at `at`, wobbles, fades out after `life`.
function sfx(txt, x, y, px, col, lt, at, o = {}) {
  const a = lt - at, life = o.life ?? 1.4; if (a < 0 || a > life) return;
  const k = backOut(seg(a, 0, .22)), alpha = 1 - seg(a, life - .25, life);
  ctx.save(); ctx.translate(x, y); ctx.rotate((o.rot ?? -.08) + Math.sin(a * 22) * .04 * (1 - a / life));
  chunky(txt, 0, 0, px, col, o.dk || mix(col, '#000000', .35), { k, alpha }); ctx.restore();
}
