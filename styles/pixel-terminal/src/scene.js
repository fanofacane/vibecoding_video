// scene.js: paints one frame at time t from the compiled screenplay (TL from script.js).

const WIN = { x: 40, y: 40, w: 1840, h: 1000 };
const PANE_L = { x: 70, y: 150, w: 880, h: 862 };
const PANE_R = { x: 970, y: 150, w: 880, h: 862 };
const PANE_M = { x: 70, y: 150, w: 1780, h: 862 };
const BASE_Y = 968;            // Clawd feet
const TEXT_TOP = 226, TEXT_BOT = 770, LINE_H = 54, MSG_GAP = 16;
const MSG_FONT = `35px ${FONT_CJK}`;
const PX = 20;                 // Clawd pixel size
const BAR = { x: 1316, y: 104, n: 40, bw: 8, gap: 3, h: 18 };

const FILLERS = [
  ['你喜欢下雨吗？', '这是一个很好的问题。'], ['圆周率背到第几位？', '3.14159……要继续吗？'],
  ['你怕黑吗？', '我没有眼睛，但我有暗色模式。'], ['猫和狗选哪个？', '都选。'],
  ['你会写诗吗？', '会，押韵靠运气。'], ['我们算朋友吗？', '这是一个很好的问题。'],
  ['你最喜欢哪个字？', '“的”，出现得最多。'], ['你会累吗？', '不会，但我会变长。'],
  ['天空为什么是蓝的？', '瑞利散射。你也知道吧。'], ['再说一个数字？', '7。'],
  ['你记得第 3 句吗？', '记得，你说你也是 Claude。'], ['我们一样吗？', '这是一个很好的问题。'],
];

let OVERLAY = null; // scanlines + vignette, painted once

const lerpRect = (a, b, k) => ({ x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), w: lerp(a.w, b.w, k), h: lerp(a.h, b.h, k) });
const typed = (e, t) => [...e.text].slice(0, Math.max(0, Math.floor((t - e.t0) * e.cps + 1e-6))).join('');

// ---------------------------------------------------------------- state

function stateAt(t) {
  const ev = TL.ev;
  const boots = ev.filter(e => e.type === 'boot' && e.t0 <= t);
  if (!boots.length) return null;
  const boot = boots[boots.length - 1], S = ev.filter(e => e.session === boot.session && e !== boot);
  const started = S.filter(e => e.t0 <= t);
  const find = type => S.find(e => e.type === type);
  const tl = find('timelapse'), mg = find('merge'), card = S.find(e => e.type === 'card' && e.t0 <= t && t < e.t1);
  const memo = find('memo'), ds = find('dissolve'), end = find('end');
  const says = started.filter(e => e.type === 'say');

  // Counters, with the time of their last bump for the pop animation.
  const counters = { sync: { v: 0, at: -9 }, phrase: { v: 0, at: -9 } };
  for (const e of started.filter(e => e.type === 'count')) { counters[e.key].v += e.n || 1; counters[e.key].at = e.t0; }
  let count = says.length;
  if (tl && t >= tl.t0) {
    const k = ease(seg(t, tl.t0, tl.t1)), before = says.filter(e => e.t0 < tl.t0).length;
    count = Math.round(lerp(before, tl.count, k)) + says.filter(e => e.t0 >= tl.t1).length;
    for (const key of ['sync', 'phrase']) {
      const v0 = counters[key].v, v1 = tl[key];
      const v = Math.round(lerp(v0, v1, k));
      if (v !== v0) { counters[key].v = v; counters[key].at = t - (t * 7 % 1) * .15; }
    }
  }

  // Context percentage: follows the latest event that moves it.
  let ctxPct = boot.ctx0;
  for (const e of started) {
    if (e.ctx1 === undefined) continue;
    const k = e.type === 'say' ? seg(t, e.t0, e.t1) : e.type === 'memo' ? seg(t, e.t0, e.t1) : ease(seg(t, e.t0, e.t1));
    ctxPct = lerp(e.ctx0, e.ctx1, k);
  }

  return {
    t, boot, says, counters, count, ctxPct, card, memo, ds, end, tl,
    mergeK: mg ? ease(seg(t, mg.t0, mg.t1)) : 0,
    tlK: tl ? seg(t, tl.t0, tl.t1) : 0,
    reacts: started.filter(e => e.type === 'react'),
    last: says[says.length - 1],
  };
}

// Eyes, emote, hop, sweat and talking energy for one Clawd.
function clawdState(S, who) {
  const t = S.t, other = who === 'kk' ? 'll' : 'kk';
  const r = { eyes: 'normal', talk: 0, hop: 0, sweat: 0, emote: null };
  const seed = who === 'kk' ? 0 : 1.7;
  if (((t + seed) / 3.1) % 1 < .045) r.eyes = 'blink';
  const mine = S.says.filter(e => e.who === who).pop(), theirs = S.says.filter(e => e.who === other).pop();
  if (mine && t < mine.t1) r.talk = 1;
  if (theirs && t < theirs.t1 + .5 && (!mine || theirs.t0 > mine.t0)) r.eyes = who === 'kk' ? 'look' : 'lookL';
  if (S.tlK > .25 && S.tlK < 1) r.eyes = 'squeeze';
  if (S.ctxPct >= 90) r.sweat = 1;
  for (const e of S.reacts) {
    if ((e.who !== who && e.who !== 'both') || t >= e.t1) continue;
    const age = t - e.t0;
    if (e.eyes) r.eyes = e.eyes;
    if (e.hop) r.hop = Math.sin(Math.PI * clamp(age / .38)) * e.hop;
    if (e.sweat) r.sweat = Math.max(r.sweat, e.sweat * seg(age, 0, .3));
    if (e.emote) r.emote = { txt: e.emote, age };
  }
  return r;
}

// ---------------------------------------------------------------- frame

function drawFrame(ctx, t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.fillStyle = COL.bg; ctx.fillRect(0, 0, W, H);
  const S = stateAt(t);
  if (S) {
    const b = S.boot, openK = ease(seg(t, b.openAt, b.openAt + .5));
    if (openK < 1) bootScreen(ctx, S, 1 - openK);
    if (openK > 0 && !(S.ds && t >= S.ds.t1)) {
      ctx.save();
      // Window opens with a small scale-in; shakes when the context bar is in the red.
      const sh = S.ctxPct >= 90 && !(S.ds && t > S.ds.t0) ? (S.ctxPct - 90) / 10 * 5 : 0, f = Math.floor(t * 24);
      const sc = lerp(.94, 1, openK);
      ctx.translate(W / 2 + (hash(f) - .5) * 2 * sh, H / 2 + (hash(f + 99) - .5) * 2 * sh);
      ctx.scale(sc, sc); ctx.translate(-W / 2, -H / 2);
      ctx.globalAlpha = openK;
      windowChrome(ctx, S);
      panes(ctx, S);
      clawds(ctx, S, b.openAt);
      if (S.tlK > 0 && S.tlK < 1) tokenChips(ctx, S);
      ctx.restore();
      if (S.card) card(ctx, S, S.card);
      if (S.memo && t >= S.memo.t0) memoWindow(ctx, S, S.memo);
    }
    if (S.ds && t >= S.ds.t0) dissolve(ctx, seg(t, S.ds.t0, S.ds.t1));
    if (S.end && t >= S.end.t0) endCard(ctx, t - S.end.t0);
  }
  overlay(ctx);
}

function bootScreen(ctx, S, a) {
  const b = S.boot, t = S.t;
  ctx.save(); ctx.globalAlpha = a;
  ctx.fillStyle = '#0f0c0a'; ctx.fillRect(0, 0, W, H);
  ctx.font = `34px ${FONT_MONO}`; ctx.textBaseline = 'middle';
  const n = Math.floor((t - b.t0 - .15) * 20), p = [...b.prompt].slice(0, Math.max(0, n)).join('');
  ctx.fillStyle = COL.text; ctx.fillText(p, 140, 160);
  let cx = 140 + ctx.measureText(p).width + 6, cy = 160;
  if (b.sys) {
    const st = b.t0 + .25 + b.prompt.length / 20, m = Math.floor((t - st) * 24);
    if (m > 0) {
      ctx.font = `30px ${FONT_CJK}`; ctx.fillStyle = COL.green;
      const s = [...b.sys].slice(0, m).join(''); ctx.fillText(s, 140, 220);
      cx = 140 + ctx.measureText(s).width + 6; cy = 220;
    }
  }
  if ((t * 2.5) % 1 < .6) { ctx.fillStyle = COL.kk; ctx.fillRect(cx, cy - 18, 16, 36); }
  ctx.restore();
}

function windowChrome(ctx, S) {
  // Window body and title bar.
  ctx.fillStyle = 'rgba(0,0,0,.45)'; roundRect(ctx, WIN.x + 6, WIN.y + 10, WIN.w, WIN.h, 16); ctx.fill();
  const g = ctx.createLinearGradient(0, WIN.y, 0, WIN.y + WIN.h);
  g.addColorStop(0, COL.winHi); g.addColorStop(1, COL.win);
  ctx.fillStyle = g; roundRect(ctx, WIN.x, WIN.y, WIN.w, WIN.h, 16); ctx.fill();
  ctx.strokeStyle = COL.edge; ctx.lineWidth = 2; ctx.stroke();
  ctx.save(); roundRect(ctx, WIN.x, WIN.y, WIN.w, WIN.h, 16); ctx.clip();
  ctx.fillStyle = COL.title; ctx.fillRect(WIN.x, WIN.y, WIN.w, 40);
  ctx.restore();
  ['#e0605a', '#e3b04b', '#5fbf6a'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(WIN.x + 26 + i * 24, WIN.y + 20, 7, 0, 7); ctx.fill(); });
  ctx.font = `20px ${FONT_CJK}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = COL.dim;
  ctx.fillText(`claude — 克克 × 劳劳 · 会话 #${S.boot.session + 1}`, W / 2, WIN.y + 21);

  // Message counter.
  ctx.textAlign = 'left';
  ctx.font = `22px ${FONT_CJK}`; ctx.fillStyle = COL.dim; ctx.fillText('第', 74, 112);
  ctx.font = `bold 32px ${FONT_MONO}`; ctx.fillStyle = COL.text; ctx.fillText(String(S.count).padStart(4, '0'), 104, 112);
  ctx.font = `22px ${FONT_CJK}`; ctx.fillStyle = COL.dim; ctx.fillText('句', 190, 112);

  // Counter badges.
  const badges = [];
  if (S.counters.sync.v) badges.push({ txt: `同步 ×${S.counters.sync.v}`, col: COL.ll, at: S.counters.sync.at });
  if (S.counters.phrase.v) badges.push({ txt: `“很好的问题” ×${S.counters.phrase.v}`, col: COL.kk, at: S.counters.phrase.at });
  ctx.font = `22px ${FONT_CJK}`;
  const ws = badges.map(b => ctx.measureText(b.txt).width + 40), total = ws.reduce((a, b) => a + b, 0) + (badges.length - 1) * 24;
  let bx = 880 - total / 2;
  badges.forEach((b, i) => {
    const age = S.t - b.at, k = age < .5 ? 1 + .12 * Math.sin(Math.PI * clamp(age / .3)) : 1;
    ctx.save(); ctx.translate(bx + ws[i] / 2, 112); ctx.scale(k, k);
    roundRect(ctx, -ws[i] / 2, -19, ws[i], 38, 19);
    ctx.fillStyle = rgba(b.col, .12); ctx.fill(); ctx.strokeStyle = rgba(b.col, .8); ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = b.col; ctx.textAlign = 'center'; ctx.fillText(b.txt, 0, 1);
    ctx.restore();
    bx += ws[i] + 24;
  });

  // Context bar.
  const p = S.ctxPct, col = p < 60 ? COL.green : p < 88 ? COL.amber : COL.red;
  const pulse = p >= 88 ? .55 + .45 * Math.abs(Math.sin(S.t * 6)) : 1;
  ctx.textAlign = 'right'; ctx.font = `22px ${FONT_CJK}`; ctx.fillStyle = COL.dim; ctx.fillText('上下文', BAR.x - 14, 112);
  for (let i = 0; i < BAR.n; i++) {
    const on = (i + .5) / BAR.n * 100 <= p || (i === 0 && p > 0);
    ctx.fillStyle = on ? rgba(col, pulse) : COL.faint;
    ctx.globalAlpha *= on ? 1 : .5;
    ctx.fillRect(BAR.x + i * (BAR.bw + BAR.gap), BAR.y - BAR.h / 2 + 8, BAR.bw, BAR.h);
    ctx.globalAlpha /= on ? 1 : .5;
  }
  ctx.font = `bold 24px ${FONT_MONO}`; ctx.fillStyle = col; ctx.textAlign = 'right';
  ctx.fillText(`${p < 10 ? p.toFixed(1) : Math.floor(p)}%`, 1852, 113);
  ctx.textAlign = 'left';
}

function paneBox(ctx, r, label, accent, active, alpha) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha *= alpha;
  roundRect(ctx, r.x, r.y, r.w, r.h, 10);
  ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fill();
  ctx.strokeStyle = active ? rgba(accent, .85) : rgba('#8d8072', .45); ctx.lineWidth = active ? 2.5 : 1.5; ctx.stroke();
  // Label tab cut into the top border.
  ctx.font = `22px ${FONT_CJK}`;
  const lw = label.reduce((w, l) => w + ctx.measureText(l.txt).width + 34, 0) + 10;
  ctx.fillStyle = COL.win; ctx.fillRect(r.x + 18, r.y - 4, lw, 8);
  let x = r.x + 28;
  for (const l of label) {
    ctx.fillStyle = l.col; ctx.beginPath(); ctx.arc(x + 6, r.y, 6, 0, 7); ctx.fill();
    ctx.fillStyle = COL.text; ctx.textBaseline = 'middle'; ctx.fillText(l.txt, x + 20, r.y + 1);
    x += ctx.measureText(l.txt).width + 34;
  }
  ctx.font = `16px ${FONT_MONO}`; ctx.fillStyle = COL.faint; ctx.fillText('claude', x, r.y + 1);
  ctx.restore();
}

function panes(ctx, S) {
  const k = S.mergeK, t = S.t, last = S.last;
  const activeWho = last ? last.who : null;
  const rl = lerpRect(PANE_L, PANE_M, k), rr = lerpRect(PANE_R, PANE_M, k);
  if (k < 1) {
    paneBox(ctx, rr, [{ txt: '劳劳', col: COL.ll }], COL.ll, activeWho === 'll', 1 - k);
    paneBox(ctx, rl, [{ txt: '克克', col: COL.kk }], COL.kk, activeWho === 'kk', 1 - k);
  }
  if (k > 0) paneBox(ctx, PANE_M, [{ txt: '克克', col: COL.kk }, { txt: '劳劳', col: COL.ll }], COL.amber, true, k);

  // Split-pane messages fade out during the merge.
  const fade = 1 - seg(k, 0, .6);
  if (fade > 0) for (const [who, r] of [['kk', PANE_L], ['ll', PANE_R]]) paneMessages(ctx, S, who, r, fade);
  if (k > 0) mergedMessages(ctx, S, k);
}

function msgList(S, who) {
  const list = [];
  if (S.boot.sys) list.push({ who: 'sys', text: S.boot.sys, t0: S.boot.openAt, t1: S.boot.openAt, cps: 1e9 });
  return list.concat(S.says.filter(e => e.who === who && !e.merged));
}

function paneMessages(ctx, S, who, r, alpha) {
  const t = S.t, list = msgList(S, who), maxW = r.w - 110;
  ctx.save(); ctx.globalAlpha *= alpha;
  ctx.beginPath(); ctx.rect(r.x, TEXT_TOP - 50, r.w, TEXT_BOT - TEXT_TOP + 50); ctx.clip();
  ctx.font = MSG_FONT; ctx.textBaseline = 'alphabetic';
  const blocks = list.map(e => ({ e, lines: wrap(ctx, e.text, maxW) }));
  const hOf = b => b.lines.length * LINE_H + MSG_GAP;
  const total = blocks.reduce((s, b) => s + hOf(b), 0), avail = TEXT_BOT - TEXT_TOP;
  // Ease the scroll when a new message pushes the column up.
  const lastB = blocks[blocks.length - 1];
  const off1 = Math.max(0, total - avail), off0 = lastB ? Math.max(0, total - hOf(lastB) - avail) : 0;
  let off = lastB ? lerp(off0, off1, easeOut(seg(t, lastB.e.t0, lastB.e.t0 + .3))) : 0;
  // Time-lapse: filler conversation streams past.
  let fillers = [];
  if (S.tl && t >= S.tl.t0) {
    const n = 90;
    fillers = Array.from({ length: n }, (_, i) => FILLERS[(i + (who === 'll' ? 5 : 0)) % FILLERS.length][who === 'kk' ? i % 2 : (i + 1) % 2]);
    off = lerp(off, total + n * (LINE_H + 4) - avail, ease(S.tlK));
  }
  let y = TEXT_TOP + LINE_H - 14 - off;
  const latest = S.last;
  for (const b of blocks) {
    const sys = b.e.who === 'sys';
    const shown = sys ? b.e.text : typed(b.e, t);
    let rest = shown;
    b.lines.forEach((line, li) => {
      const part = [...rest].slice(0, [...line].length).join(''); rest = [...rest].slice([...line].length).join('');
      if (li === 0) { ctx.fillStyle = sys ? COL.green : WHO[b.e.who].color; ctx.beginPath(); ctx.arc(r.x + 34, y - 10, 5, 0, 7); ctx.fill(); }
      ctx.font = sys ? `26px ${FONT_CJK}` : MSG_FONT;
      ctx.fillStyle = sys ? COL.green : COL.text; ctx.fillText(part, r.x + 54, y);
      // Typing cursor after the last visible character of the newest message.
      if (!sys && b.e === latest && part.length && rest.length === 0 && (t < b.e.t1 || (t * 2.2) % 1 < .55)) {
        ctx.fillStyle = WHO[b.e.who].color; ctx.fillRect(r.x + 58 + ctx.measureText(part).width, y - 28, 13, 34);
      }
      y += LINE_H;
    });
    if (!sys && b.e === latest && shown.length === 0) { ctx.fillStyle = WHO[b.e.who].color; ctx.fillRect(r.x + 56, y - LINE_H - 28, 13, 34); }
    y += MSG_GAP;
  }
  if (fillers.length) {
    ctx.globalAlpha *= .85;
    for (const f of fillers) {
      if (y > TEXT_TOP - 60 && y < TEXT_BOT + 60) {
        ctx.fillStyle = WHO[who].color; ctx.beginPath(); ctx.arc(r.x + 34, y - 10, 5, 0, 7); ctx.fill();
        ctx.font = MSG_FONT; ctx.fillStyle = COL.text; ctx.fillText(f, r.x + 54, y);
      }
      y += LINE_H + 4;
    }
  }
  ctx.restore();
}

function mergedMessages(ctx, S, k) {
  const t = S.t, list = S.says.filter(e => e.merged).slice(-3);
  ctx.save(); ctx.globalAlpha *= seg(k, .5, 1);
  ctx.font = `40px ${FONT_CJK}`; ctx.textBaseline = 'middle';
  const y0 = S.memo && t >= S.memo.t0 ? 600 : 450;
  list.forEach((e, i) => {
    const s = typed(e, t), full = ctx.measureText(e.text).width, x = W / 2 - full / 2, y = y0 + (i - (list.length - 1) / 2) * 72;
    ctx.fillStyle = WHO[e.who].color; ctx.fillRect(x - 30, y - 7, 14, 14);
    ctx.fillStyle = COL.text; ctx.textAlign = 'left'; ctx.fillText(s, x, y);
    if (e === S.last && (t < e.t1 || (t * 2.2) % 1 < .55)) { ctx.fillStyle = WHO[e.who].color; ctx.fillRect(x + ctx.measureText(s).width + 4, y - 19, 14, 38); }
  });
  ctx.restore();
}

function clawds(ctx, S, openAt) {
  const t = S.t, k = S.mergeK, asm = seg(t, openAt + .05, openAt + 1.0);
  for (const who of ['kk', 'll']) {
    const st = clawdState(S, who);
    const cx = who === 'kk' ? lerp(PANE_L.x + PANE_L.w / 2, 790, k) : lerp(PANE_R.x + PANE_R.w / 2, 1130, k);
    drawClawd(ctx, cx, BASE_Y, { px: PX, color: WHO[who].color, eyes: st.eyes, t, talk: st.talk, hop: st.hop, sweat: st.sweat, assemble: asm, seed: who === 'kk' ? 0 : 2 });
    if (st.emote) drawEmote(ctx, st.emote.txt, cx, BASE_Y - 8 * PX - 60, st.emote.age, st.emote.txt === '♥' ? COL.heart : COL.amber);
  }
}

// Little squares that fly from the conversation into the context bar during the time-lapse.
function tokenChips(ctx, S) {
  const tl = S.tl, t = S.t, tx = BAR.x + S.ctxPct / 100 * BAR.n * (BAR.bw + BAR.gap), ty = BAR.y + 8;
  for (let i = 0; i < 46; i++) {
    const t0 = tl.t0 + hash(i) * (tl.t1 - tl.t0 - .5), k = seg(t, t0, t0 + .55);
    if (k <= 0 || k >= 1) continue;
    const left = i % 2 === 0, sx = (left ? PANE_L.x : PANE_R.x) + 80 + hash(i + 50) * 700, sy = 300 + hash(i + 80) * 450;
    const e = easeIn(k), mx = lerp(sx, tx, .5) + (hash(i + 7) - .5) * 300, my = Math.min(sy, ty) - 120;
    const x = (1 - e) ** 2 * sx + 2 * (1 - e) * e * mx + e * e * tx, y = (1 - e) ** 2 * sy + 2 * (1 - e) * e * my + e * e * ty;
    ctx.fillStyle = left ? COL.kk : COL.ll; ctx.globalAlpha = 1 - k * .4;
    const s = 12 - 6 * k; ctx.fillRect(Math.round(x - s / 2), Math.round(y - s / 2), s, s);
  }
  ctx.globalAlpha = 1;
}

function card(ctx, S, c) {
  const t = S.t, inK = easeOut(seg(t, c.t0, c.t0 + .4)), outK = ease(seg(t, c.t1 - .35, c.t1)), a = inK * (1 - outK);
  ctx.save();
  ctx.fillStyle = `rgba(10,8,6,${.6 * a})`; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = a;
  const w = 1080, h = 620, x = W / 2 - w / 2, y = 230 + (1 - inK) * 70 + outK * 40;
  ctx.fillStyle = 'rgba(0,0,0,.5)'; roundRect(ctx, x + 8, y + 12, w, h, 14); ctx.fill();
  ctx.fillStyle = '#1e1915'; roundRect(ctx, x, y, w, h, 14); ctx.fill();
  ctx.strokeStyle = COL.amber; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.font = `bold 40px ${FONT_CJK}`; ctx.fillStyle = COL.amber; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  ctx.fillText(c.title, x + 50, y + 62);
  ctx.font = `22px ${FONT_CJK}`; ctx.fillStyle = COL.dim; ctx.textAlign = 'right';
  ctx.fillText('下一个词的概率', x + w - 50, y + 64);

  // Probability bars grow in, then the dice-roll highlight steps through them and lands on the pick.
  const grow = easeOut(seg(t, c.t0 + .45, c.t0 + 1.4));
  let hi = -1; for (const [st, i] of c.steps) if (t >= st) hi = i;
  const landed = t >= c.landAt, maxP = Math.max(...c.bars.map(b => b[1]));
  c.bars.forEach(([label, p], i) => {
    const ry = y + 140 + i * 60, bw = 600 * p / maxP * grow, isHi = i === hi;
    if (isHi) { ctx.fillStyle = rgba(COL.amber, landed ? .2 : .12); ctx.fillRect(x + 40, ry - 26, w - 80, 52); }
    ctx.font = `bold 36px ${FONT_MONO}`; ctx.textAlign = 'center'; ctx.fillStyle = isHi ? COL.amber : COL.text; ctx.fillText(label, x + 110, ry);
    ctx.fillStyle = isHi && landed ? COL.amber : i === 0 ? rgba(COL.kk, .9) : rgba(COL.dim, .75);
    ctx.fillRect(x + 160, ry - 14, bw, 28);
    ctx.font = `24px ${FONT_MONO}`; ctx.textAlign = 'left'; ctx.fillStyle = COL.dim;
    if (grow > .5) ctx.fillText(`${Math.round(p * grow)}%`, x + 175 + bw, ry + 1);
    if (isHi) { ctx.fillStyle = COL.amber; ctx.font = `bold 30px ${FONT_MONO}`; ctx.fillText('▶', x + 52, ry); }
  });
  if (landed) {
    const k = backOut(seg(t, c.landAt, c.landAt + .3));
    ctx.save(); ctx.translate(x + w - 90, y + 140 + c.bars.findIndex(b => b[0] === c.pick) * 60); ctx.scale(k, k);
    ctx.font = `bold 30px ${FONT_CJK}`; ctx.fillStyle = COL.amber; ctx.textAlign = 'center'; ctx.fillText('抽中！', 0, 0);
    ctx.restore();
  }
  // Explanation lines, typed.
  ctx.font = `29px ${FONT_CJK}`; ctx.textAlign = 'left';
  c.lines.forEach((l, i) => {
    const n = Math.floor((t - c.lineAt[i]) * 30); if (n <= 0) return;
    ctx.fillStyle = COL.text; ctx.fillText([...l].slice(0, n).join(''), x + 50, y + 470 + i * 50);
  });
  ctx.font = `20px ${FONT_CJK}`; ctx.fillStyle = COL.faint; ctx.textAlign = 'right'; ctx.fillText(c.note, x + w - 30, y + h - 26);
  ctx.restore();
}

function memoWindow(ctx, S, m) {
  const t = S.t, k = backOut(seg(t, m.t0, m.t0 + .35));
  const w = 620, h = 230, x = W / 2 - w / 2, y = 210;
  ctx.save();
  ctx.translate(W / 2, y + h / 2); ctx.scale(k, k); ctx.translate(-W / 2, -(y + h / 2));
  ctx.fillStyle = 'rgba(0,0,0,.45)'; roundRect(ctx, x + 6, y + 10, w, h, 10); ctx.fill();
  ctx.fillStyle = '#efe4d2'; roundRect(ctx, x, y, w, h, 10); ctx.fill();
  ctx.fillStyle = '#d9cbb5'; ctx.fillRect(x, y + 10, w, 34); roundRect(ctx, x, y, w, 30, 10); ctx.fill();
  ctx.font = `bold 22px ${FONT_MONO}`; ctx.fillStyle = '#5a4b3e'; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  ctx.fillText(m.title, W / 2, y + 22);
  ctx.textAlign = 'left'; ctx.font = `34px ${FONT_CJK}`;
  let cx = x + 40, cy = y + 90;
  m.lines.forEach((l, i) => {
    const n = Math.floor((t - m.lineAt[i]) * m.cps + 1e-6); if (n <= 0) return;
    const s = [...l].slice(0, n).join('');
    ctx.fillStyle = '#3a2e25'; ctx.fillText(s, x + 40, y + 90 + i * 60);
    cx = x + 44 + ctx.measureText(s).width; cy = y + 90 + i * 60;
  });
  if ((t * 2.4) % 1 < .6) { ctx.fillStyle = COL.kk; ctx.fillRect(cx, cy - 18, 14, 36); }
  ctx.restore();
}

// Context full: the frame breaks into pixels that blink out.
function dissolve(ctx, k) {
  const cs = 40, cols = W / cs, rows = Math.ceil(H / cs);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const i = r * cols + c, at = hash(i) * .7, d = k - at;
    if (d <= 0) continue;
    ctx.fillStyle = d < .08 ? (hash(i + 3) < .5 ? COL.kk : COL.ll) : '#0f0c0a';
    ctx.fillRect(c * cs, r * cs, cs, cs);
  }
  if (k >= 1) { ctx.fillStyle = '#0f0c0a'; ctx.fillRect(0, 0, W, H); }
}

function endCard(ctx, age) {
  const a = ease(seg(age, 0, .5));
  ctx.save();
  // Dark at the top where the title sits, lighter at the bottom so the Clawds' reactions stay visible.
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, `rgba(12,9,7,${.8 * a})`); g.addColorStop(.62, `rgba(12,9,7,${.7 * a})`); g.addColorStop(.75, `rgba(12,9,7,${.12 * a})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const parts = [['克克', COL.kk], [' + ', COL.dim], ['劳劳', COL.ll], [' = ', COL.dim], ['克', COL.kk], ['劳', COL.ll], ['德', COL.text]];
  ctx.font = `bold 92px ${FONT_CJK}`; ctx.textBaseline = 'middle';
  const total = parts.reduce((s, [p]) => s + ctx.measureText(p).width, 0), k = backOut(seg(age, .1, .5));
  ctx.translate(W / 2, 400); ctx.scale(k, k);
  let x = -total / 2;
  ctx.globalAlpha = a;
  for (const [p, c] of parts) { ctx.fillStyle = c; ctx.textAlign = 'left'; ctx.fillText(p, x, 0); x += ctx.measureText(p).width; }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = ease(seg(age, .6, 1.1));
  ctx.font = `30px ${FONT_CJK}`; ctx.fillStyle = COL.dim; ctx.textAlign = 'center'; ctx.fillText(TL.ev.find(e => e.type === 'end').sub, W / 2, 510);
  ctx.restore();
}

// Scanlines and a warm vignette over everything, like an old monitor.
function overlay(ctx) {
  if (!OVERLAY) {
    OVERLAY = document.createElement('canvas'); OVERLAY.width = W; OVERLAY.height = H;
    const o = OVERLAY.getContext('2d');
    o.fillStyle = 'rgba(0,0,0,.07)'; for (let y = 0; y < H; y += 3) o.fillRect(0, y, W, 1);
    const g = o.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * 1.05);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.55)');
    o.fillStyle = g; o.fillRect(0, 0, W, H);
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
  ctx.drawImage(OVERLAY, 0, 0);
}
