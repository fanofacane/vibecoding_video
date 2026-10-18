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
const SUM_FONT = `28px ${FONT_CJK}`, SUM_LINE = 42;

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
  const active = type => S.find(e => e.type === type && e.t0 <= t && t < e.t1);
  const tl = find('timelapse'), cp = find('compact');

  // Messages, including the time-lapse fillers that have appeared so far.
  const says = started.filter(e => e.type === 'say');
  if (tl) says.push(...tl.items.filter(i => i.t0 <= t));
  says.sort((a, b) => a.t0 - b.t0);

  const counters = { sync: { v: 0, at: -9 } };
  for (const e of started.filter(e => e.type === 'count')) { counters[e.key].v += e.n || 1; counters[e.key].at = e.t0; }
  let count = says.length;
  if (tl && t >= tl.fastAt) count += Math.round(lerp(0, tl.count - tl.items.length, easeIn(seg(t, tl.fastAt, tl.t1))));

  // Context percentage follows the latest event that moves it.
  let ctxPct = boot.ctx0;
  for (const e of started) {
    if (e.ctx1 === undefined) continue;
    const k = e.type === 'compact' ? ease(seg(t, e.squeezeAt, e.summaryAt))
      : e.type === 'timelapse' ? easeIn(seg(t, e.t0, e.t1)) : seg(t, e.t0, e.t1);
    ctxPct = lerp(e.ctx0, e.ctx1, k);
  }

  const merges = started.filter(e => e.type === 'merge'), mg = merges[merges.length - 1];
  const hl = started.find(e => e.type === 'highlight');
  let last = says.filter(e => !e.filler).pop();
  if (tl && t >= tl.t0 && last && last.t0 < tl.t0) last = null; // no cursor while the time-lapse runs
  return {
    t, boot, says, counters, count, ctxPct, tl, cp,
    card: active('card'), note: active('note'), props: S.filter(e => e.type === 'prop' && e.t0 <= t && t < e.t1),
    memo: started.find(e => e.type === 'memo'), ds: find('dissolve'), end: find('end'),
    mergeK: mg ? ease(seg(t, mg.t0, mg.t1)) : 0, hug: mg ? !!mg.hug : false,
    compacted: cp && t >= cp.summaryAt, highlight: hl,
    reacts: started.filter(e => e.type === 'react'),
    last,
  };
}

// Eyes, emote, hop, sweat and talking energy for one Clawd.
function clawdState(S, who) {
  const t = S.t, other = who === 'kk' ? 'll' : 'kk';
  const r = { eyes: 'normal', talk: 0, hop: 0, sweat: 0, emote: null };
  const seed = who === 'kk' ? 0 : 1.7;
  if (((t + seed) / 3.1) % 1 < .045) r.eyes = 'blink';
  const real = S.says.filter(e => !e.filler);
  const mine = real.filter(e => e.who === who).pop(), theirs = real.filter(e => e.who === other).pop();
  if (mine && t < mine.t1) r.talk = 1;
  if (theirs && t < theirs.t1 + .6 && (!mine || theirs.t0 > mine.t0)) r.eyes = who === 'kk' ? 'look' : 'lookL';
  if (S.tl && t > S.tl.fastAt && t < S.tl.t1) r.eyes = 'squeeze';
  if (S.ctxPct >= 90 && !S.compacted) r.sweat = 1;
  if (S.cp && t >= S.cp.squeezeAt && t < S.cp.t1 + .4) { r.eyes = 'flat'; r.sweat = 0; }
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
      // Window opens with a small scale-in; shakes while the context bar is in the red.
      const red = S.ctxPct >= 90 && !(S.ds && t > S.ds.t0) && !(S.cp && t > S.cp.squeezeAt);
      const sh = red ? (S.ctxPct - 90) / 10 * 5 : 0, f = Math.floor(t * 24);
      const sc = lerp(.94, 1, openK);
      ctx.translate(W / 2 + (hash(f) - .5) * 2 * sh, H / 2 + (hash(f + 99) - .5) * 2 * sh);
      ctx.scale(sc, sc); ctx.translate(-W / 2, -H / 2);
      ctx.globalAlpha = openK;
      windowChrome(ctx, S);
      panes(ctx, S);
      clawds(ctx, S, b.openAt);
      if (S.tl && t > S.tl.fastAt && t < S.tl.t1) tokenChips(ctx, S);
      if (S.cp) compactToast(ctx, S);
      ctx.restore();
      if (S.note) noteStrip(ctx, S, S.note);
      if (S.card) card(ctx, S, S.card);
      if (S.memo) memoWindow(ctx, S, S.memo);
    }
    if (S.ds && t >= S.ds.t0) dissolve(ctx, seg(t, S.ds.t0, S.ds.t1));
    if (S.end && t >= S.end.t0) endCard(ctx, S, t - S.end.t0);
  }
  overlay(ctx);
}

function bootScreen(ctx, S, a) {
  const b = S.boot, t = S.t;
  ctx.save(); ctx.globalAlpha = a;
  ctx.fillStyle = '#0f0c0a'; ctx.fillRect(0, 0, W, H);
  ctx.font = `34px ${FONT_MONO}`; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  const n = Math.floor((t - b.t0 - .15) * 20), p = [...b.prompt].slice(0, Math.max(0, n)).join('');
  ctx.fillStyle = COL.text; ctx.fillText(p, 140, 160);
  let cx = 140 + ctx.measureText(p).width + 6, cy = 160;
  const sub = b.rule || b.sys;
  if (sub) {
    const m = Math.floor((t - b.subAt) * 14);
    if (m > 0) {
      ctx.font = `32px ${FONT_CJK}`; ctx.fillStyle = b.sys ? COL.green : COL.dim;
      const s = [...sub].slice(0, m).join(''); ctx.fillText(s, 140, 224);
      cx = 140 + ctx.measureText(s).width + 6; cy = 224;
    }
  }
  if ((t * 2.5) % 1 < .6) { ctx.fillStyle = COL.kk; ctx.fillRect(cx, cy - 18, 16, 36); }
  ctx.restore();
}

function windowChrome(ctx, S) {
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
  ctx.fillText(`claude — 克克 × 劳劳 · 会话 #${S.boot.session + 1}${S.compacted ? ' · 已压缩' : ''}`, W / 2, WIN.y + 21);

  // Message counter.
  ctx.textAlign = 'left';
  ctx.font = `22px ${FONT_CJK}`; ctx.fillStyle = COL.dim; ctx.fillText('第', 74, 112);
  ctx.font = `bold 32px ${FONT_MONO}`; ctx.fillStyle = COL.text; ctx.fillText(String(S.count).padStart(4, '0'), 104, 112);
  ctx.font = `22px ${FONT_CJK}`; ctx.fillStyle = COL.dim; ctx.fillText('句', 190, 112);

  // Counter badge.
  const sync = S.counters.sync;
  if (sync.v) {
    ctx.font = `22px ${FONT_CJK}`;
    const txt = `同步 ×${sync.v}`, w = ctx.measureText(txt).width + 40, age = S.t - sync.at;
    const k = age < .5 ? 1 + .14 * Math.sin(Math.PI * clamp(age / .3)) : 1;
    ctx.save(); ctx.translate(W / 2, 112); ctx.scale(k, k);
    roundRect(ctx, -w / 2, -19, w, 38, 19);
    ctx.fillStyle = rgba(COL.ll, .12); ctx.fill(); ctx.strokeStyle = rgba(COL.ll, .8); ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = COL.ll; ctx.textAlign = 'center'; ctx.fillText(txt, 0, 1);
    ctx.restore();
  }

  // Context bar.
  const p = S.ctxPct, col = p < 60 ? COL.green : p < 88 ? COL.amber : COL.red;
  const pulse = p >= 88 ? .55 + .45 * Math.abs(Math.sin(S.t * 6)) : 1;
  ctx.textAlign = 'right'; ctx.font = `22px ${FONT_CJK}`; ctx.fillStyle = COL.dim; ctx.fillText('上下文', BAR.x - 14, 112);
  for (let i = 0; i < BAR.n; i++) {
    const on = (i + .5) / BAR.n * 100 <= p || (i === 0 && p > 0);
    ctx.save();
    ctx.fillStyle = on ? rgba(col, pulse) : COL.faint;
    if (!on) ctx.globalAlpha *= .5;
    ctx.fillRect(BAR.x + i * (BAR.bw + BAR.gap), BAR.y - BAR.h / 2 + 8, BAR.bw, BAR.h);
    ctx.restore();
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
  const k = S.mergeK, last = S.last, activeWho = last ? last.who : null;
  const rl = lerpRect(PANE_L, PANE_M, k), rr = lerpRect(PANE_R, PANE_M, k);
  if (k < 1) {
    paneBox(ctx, rr, [{ txt: '劳劳', col: COL.ll }], COL.ll, activeWho === 'll', 1 - k);
    paneBox(ctx, rl, [{ txt: '克克', col: COL.kk }], COL.kk, activeWho === 'kk', 1 - k);
  }
  if (k > 0) paneBox(ctx, PANE_M, [{ txt: '克克', col: COL.kk }, { txt: '劳劳', col: COL.ll }], COL.amber, true, k);
  const fade = 1 - seg(k, 0, .6);
  if (fade > 0) for (const [who, r] of [['kk', PANE_L], ['ll', PANE_R]]) paneMessages(ctx, S, who, r, fade);
}

// The blocks shown in one pane: optional system line, summary block after compaction, then messages.
function paneBlocks(ctx, S, who, maxW) {
  const t = S.t, cp = S.cp, blocks = [];
  if (S.boot.sys) blocks.push({ kind: 'sys', text: S.boot.sys, t0: S.boot.openAt });
  let says = S.says.filter(e => e.who === who && !e.merged);
  if (S.compacted) {
    blocks.push({ kind: 'summary', t0: cp.summaryAt });
    says = says.filter(e => e.t0 > cp.t0);
  }
  for (const e of says) blocks.push({ kind: 'msg', e, t0: e.t0 });
  for (const b of blocks) {
    if (b.kind === 'summary') {
      ctx.font = SUM_FONT; b.lines = wrap(ctx, cp.summary, maxW - 40);
      b.h = 34 + b.lines.length * SUM_LINE + 24 + MSG_GAP;
    } else {
      ctx.font = b.kind === 'sys' ? `26px ${FONT_CJK}` : MSG_FONT;
      b.lines = wrap(ctx, b.kind === 'sys' ? b.text : b.e.text, maxW);
      b.h = b.lines.length * LINE_H + MSG_GAP;
    }
  }
  return blocks;
}

function paneMessages(ctx, S, who, r, alpha) {
  const t = S.t, maxW = r.w - 110, cp = S.cp;
  ctx.save(); ctx.globalAlpha *= alpha;
  ctx.beginPath(); ctx.rect(r.x, TEXT_TOP - 50, r.w, TEXT_BOT - TEXT_TOP + 50); ctx.clip();
  // Compaction: the old column squeezes up toward the top before the summary appears.
  if (cp && t >= cp.squeezeAt && t < cp.summaryAt) {
    const k = easeIn(seg(t, cp.squeezeAt, cp.summaryAt - .15));
    ctx.translate(0, TEXT_TOP - 40); ctx.scale(1, Math.max(.02, 1 - k)); ctx.translate(0, -(TEXT_TOP - 40));
    ctx.globalAlpha *= 1 - k * .7;
  }
  const blocks = paneBlocks(ctx, S, who, maxW);
  const total = blocks.reduce((s, b) => s + b.h, 0), avail = TEXT_BOT - TEXT_TOP;
  const lastB = blocks[blocks.length - 1];
  const off1 = Math.max(0, total - avail), off0 = lastB ? Math.max(0, total - lastB.h - avail) : 0;
  const off = lastB ? lerp(off0, off1, easeOut(seg(t, lastB.t0, lastB.t0 + .3))) : 0;
  let y = TEXT_TOP + LINE_H - 14 - off;
  const latest = S.last;
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  for (const b of blocks) {
    if (b.kind === 'summary') { summaryBlock(ctx, S, r, y - LINE_H + 14, b); y += b.h; continue; }
    const sys = b.kind === 'sys', e = b.e;
    const shown = sys ? b.text : typed(e, t);
    let rest = [...shown];
    const color = sys ? COL.green : WHO[e.who].color;
    b.lines.forEach((line, li) => {
      const n = [...line].length, part = rest.slice(0, n).join(''); rest = rest.slice(n);
      if (li === 0) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(r.x + 34, y - 10, 5, 0, 7); ctx.fill(); }
      ctx.font = sys ? `26px ${FONT_CJK}` : MSG_FONT;
      ctx.fillStyle = sys ? COL.green : COL.text;
      if (!sys && e.filler) ctx.fillStyle = rgba(COL.text, .8);
      ctx.fillText(part, r.x + 54, y);
      if (!sys && e === latest && part.length && rest.length === 0 && (t < e.t1 || (t * 2.2) % 1 < .55)) {
        ctx.fillStyle = color; ctx.fillRect(r.x + 58 + ctx.measureText(part).width, y - 28, 13, 34);
      }
      y += LINE_H;
    });
    if (!sys && e === latest && shown.length === 0) { ctx.fillStyle = color; ctx.fillRect(r.x + 56, y - LINE_H - 28, 13, 34); }
    y += MSG_GAP;
  }
  ctx.restore();
}

// The grey "conversation summary" block left after compaction; a keyword can light up.
function summaryBlock(ctx, S, r, top, b) {
  const t = S.t, grow = easeOut(seg(t, b.t0, b.t0 + .45)), x = r.x + 26, w = r.w - 52, h = (b.h - MSG_GAP) * grow;
  if (h < 2) return;
  ctx.save();
  roundRect(ctx, x, top, w, h, 10);
  ctx.fillStyle = 'rgba(141,128,114,.16)'; ctx.fill();
  ctx.setLineDash([6, 6]); ctx.strokeStyle = rgba(COL.dim, .6); ctx.lineWidth = 1.5; ctx.stroke(); ctx.setLineDash([]);
  ctx.clip();
  ctx.globalAlpha *= seg(t, b.t0 + .25, b.t0 + .7);
  ctx.font = `bold 20px ${FONT_CJK}`; ctx.fillStyle = COL.dim; ctx.textBaseline = 'middle';
  ctx.fillText('▤ 对话摘要', x + 20, top + 24);
  ctx.font = SUM_FONT; ctx.textBaseline = 'alphabetic';
  const hl = S.highlight, hk = hl ? seg(t, hl.t0, hl.t0 + .4) : 0;
  b.lines.forEach((line, i) => {
    const ly = top + 34 + (i + 1) * SUM_LINE - 8;
    const at = hl ? line.indexOf(hl.word) : -1;
    if (at >= 0 && hk > 0) {
      const x0 = x + 20 + ctx.measureText(line.slice(0, at)).width, ww = ctx.measureText(hl.word).width;
      ctx.fillStyle = rgba(COL.amber, .3 * hk); ctx.fillRect(x0 - 4, ly - 30, ww + 8, 40);
    }
    ctx.fillStyle = '#b9ab98'; ctx.fillText(line, x + 20, ly);
    if (at >= 0 && hk > 0) { ctx.fillStyle = rgba(COL.amber, hk); ctx.fillText(hl.word, x + 20 + ctx.measureText(line.slice(0, at)).width, ly); }
  });
  ctx.restore();
}

function clawdX(S, who) {
  const gap = S.hug ? 280 : 340, k = S.mergeK;
  return who === 'kk' ? lerp(PANE_L.x + PANE_L.w / 2, W / 2 - gap / 2, k) : lerp(PANE_R.x + PANE_R.w / 2, W / 2 + gap / 2, k);
}

function clawds(ctx, S, openAt) {
  const t = S.t, asm = seg(t, openAt + .05, openAt + 1.0);
  for (const who of ['kk', 'll']) {
    const st = clawdState(S, who), cx = clawdX(S, who);
    drawClawd(ctx, cx, BASE_Y, { px: PX, color: WHO[who].color, eyes: st.eyes, t, talk: st.talk, hop: st.hop, sweat: st.sweat, assemble: asm, seed: who === 'kk' ? 0 : 2 });
    if (st.emote) drawEmote(ctx, st.emote.txt, cx, BASE_Y - 8 * PX - 60, st.emote.age, st.emote.txt === '♥' ? COL.heart : COL.amber);
  }
  for (const p of S.props) if (p.kind === 'orange') orangeProp(ctx, clawdX(S, p.who), BASE_Y - 8 * PX - 30, t - p.t0, p.t1 - p.t0);
}

// A pixel orange floats up from a Clawd's head, wobbles, then pops into pixels.
const ORANGE = [
  '....g....',
  '...gg....',
  '..ooooo..',
  '.ohoooood',
  'ohhoooood',
  'ooooooodd',
  'ooooooodd',
  '.ooooodd.',
  '..oooddd.',
];
function orangeProp(ctx, cx, y0, age, dur) {
  const px = 10, popAt = dur * .62;
  const rise = easeOut(clamp(age / popAt)), y = y0 - 40 - rise * 150, x = cx + Math.sin(age * 5) * 10;
  const col = { o: '#f39a3c', h: '#ffc98a', d: '#d9772a', g: '#6cc070' };
  if (age < popAt) {
    ctx.save(); ctx.globalAlpha *= seg(age, 0, .2);
    ORANGE.forEach((row, r) => [...row].forEach((c, k) => {
      if (col[c]) { ctx.fillStyle = col[c]; ctx.fillRect(Math.round(x - 4.5 * px + k * px), Math.round(y - 4.5 * px + r * px), px, px); }
    }));
    ctx.restore();
  } else {
    const k = seg(age, popAt, dur);
    ctx.save(); ctx.globalAlpha *= 1 - k;
    for (let i = 0; i < 16; i++) {
      const a = i / 16 * Math.PI * 2 + hash(i) * .4, d = easeOut(k) * (80 + hash(i + 5) * 60);
      ctx.fillStyle = i % 5 === 0 ? col.g : i % 2 ? col.o : col.h;
      ctx.fillRect(Math.round(x + Math.cos(a) * d - 5), Math.round(y + Math.sin(a) * d - 5 + k * k * 40), px, px);
    }
    ctx.restore();
  }
}

// Little squares that fly from the conversation into the context bar during the time-lapse.
function tokenChips(ctx, S) {
  const tl = S.tl, t = S.t, tx = BAR.x + S.ctxPct / 100 * BAR.n * (BAR.bw + BAR.gap), ty = BAR.y + 8;
  for (let i = 0; i < 46; i++) {
    const t0 = tl.fastAt + hash(i) * (tl.t1 - tl.fastAt - .5), k = seg(t, t0, t0 + .55);
    if (k <= 0 || k >= 1) continue;
    const left = i % 2 === 0, sx = (left ? PANE_L.x : PANE_R.x) + 80 + hash(i + 50) * 700, sy = 300 + hash(i + 80) * 450;
    const e = easeIn(k), mx = lerp(sx, tx, .5) + (hash(i + 7) - .5) * 300, my = Math.min(sy, ty) - 120;
    const x = (1 - e) ** 2 * sx + 2 * (1 - e) * e * mx + e * e * tx, y = (1 - e) ** 2 * sy + 2 * (1 - e) * e * my + e * e * ty;
    ctx.save();
    ctx.fillStyle = left ? COL.kk : COL.ll; ctx.globalAlpha *= 1 - k * .4;
    const s = 12 - 6 * k; ctx.fillRect(Math.round(x - s / 2), Math.round(y - s / 2), s, s);
    ctx.restore();
  }
}

// "Context full, compacting…" warning that sits over the panes while they squeeze.
function compactToast(ctx, S) {
  const cp = S.cp, t = S.t;
  if (t < cp.t0 || t > cp.summaryAt + .5) return;
  const a = seg(t, cp.t0, cp.t0 + .25) * (1 - seg(t, cp.summaryAt + .1, cp.summaryAt + .5));
  ctx.save(); ctx.globalAlpha *= a;
  ctx.font = `30px ${FONT_CJK}`;
  const txt = '⚠ 上下文已满，正在压缩对话' + '.'.repeat(1 + Math.floor(t * 4) % 3), w = 560;
  roundRect(ctx, W / 2 - w / 2, 420, w, 70, 35);
  ctx.fillStyle = 'rgba(30,24,20,.95)'; ctx.fill(); ctx.strokeStyle = COL.amber; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.fillStyle = COL.amber; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(txt, W / 2 - w / 2 + 40, 456);
  ctx.restore();
}

// Caption strip along the bottom edge of the window.
function noteStrip(ctx, S, n) {
  const t = S.t, a = seg(t, n.t0, n.t0 + .3) * (1 - seg(t, n.t1 - .3, n.t1));
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a;
  ctx.font = `28px ${FONT_CJK}`;
  const tw = ctx.measureText(n.text).width, w = tw + 110, x = W / 2 - w / 2, y = 1000 + (1 - easeOut(seg(t, n.t0, n.t0 + .3))) * 16;
  roundRect(ctx, x, y, w, 52, 26);
  ctx.fillStyle = 'rgba(22,18,15,.94)'; ctx.fill(); ctx.strokeStyle = rgba(COL.amber, .7); ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = COL.amber; ctx.beginPath(); ctx.arc(x + 38, y + 26, 14, 0, 7); ctx.fill();
  ctx.fillStyle = '#1e1915'; ctx.font = `bold 20px ${FONT_MONO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('i', x + 38, y + 27);
  ctx.font = `28px ${FONT_CJK}`; ctx.fillStyle = COL.text; ctx.textAlign = 'left'; ctx.fillText(n.text, x + 66, y + 27);
  ctx.restore();
}

// ---------------------------------------------------------------- explainer cards

function card(ctx, S, c) {
  const t = S.t, inK = easeOut(seg(t, c.t0, c.t0 + .4)), outK = ease(seg(t, c.t1 - .35, c.t1)), a = inK * (1 - outK);
  ctx.save();
  ctx.fillStyle = `rgba(10,8,6,${.62 * a})`; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = a;
  const w = 1120, h = 640, x = W / 2 - w / 2, y = 215 + (1 - inK) * 70 + outK * 40;
  ctx.fillStyle = 'rgba(0,0,0,.5)'; roundRect(ctx, x + 8, y + 12, w, h, 14); ctx.fill();
  ctx.fillStyle = '#1e1915'; roundRect(ctx, x, y, w, h, 14); ctx.fill();
  ctx.strokeStyle = COL.amber; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.font = `bold 40px ${FONT_CJK}`; ctx.fillStyle = COL.amber; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  ctx.fillText(c.title, x + 50, y + 60);
  const age = t - c.t0;
  if (c.fig === 'graph') figGraph(ctx, x, y, w, age);
  if (c.fig === 'scan') figScan(ctx, x, y, w, age, t);
  ctx.font = `30px ${FONT_CJK}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  c.lines.forEach((l, i) => {
    const n = Math.floor((t - c.lineAt[i]) * 32); if (n <= 0) return;
    ctx.fillStyle = i === c.lines.length - 1 ? COL.amber : COL.text;
    ctx.fillText([...l].slice(0, n).join(''), x + 50, y + 438 + i * 56);
  });
  if (c.note) { ctx.font = `20px ${FONT_CJK}`; ctx.fillStyle = COL.faint; ctx.textAlign = 'right'; ctx.fillText(c.note, x + w - 30, y + h - 26); }
  ctx.restore();
}

// Word-relation graph: "橘子" connects to the words it appears with; the line to the taste itself never arrives.
function figGraph(ctx, x, y, w, age) {
  const cx = x + w / 2, cy = y + 250;
  const nodes = [['甜', -300, -55, 1, 0], ['酸', 300, -55, .9, .12], ['剥皮', -380, 55, .7, .24], ['汁水', 380, 55, .7, .36], ['冬天', -190, 105, .35, .48], ['维生素 C', 210, 105, .35, .6]];
  ctx.save();
  for (const [label, dx, dy, wgt, d] of nodes) {
    const k = easeOut(seg(age, .5 + d, .85 + d)); if (k <= 0) continue;
    ctx.strokeStyle = rgba(COL.kk, .25 + .6 * wgt); ctx.lineWidth = 1.5 + 5 * wgt;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + dx * k, cy + dy * k); ctx.stroke();
    if (k > .9) {
      const p = backOut(seg(age, .8 + d, 1.05 + d));
      ctx.save(); ctx.translate(cx + dx, cy + dy); ctx.scale(p, p);
      ctx.font = `${wgt > .5 ? 32 : 26}px ${FONT_CJK}`; const tw = ctx.measureText(label).width;
      roundRect(ctx, -tw / 2 - 16, -24, tw + 32, 48, 10); ctx.fillStyle = '#2b241f'; ctx.fill();
      ctx.strokeStyle = rgba(COL.dim, .7); ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = wgt > .5 ? COL.text : COL.dim; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, 0, 1);
      ctx.restore();
    }
  }
  // The taste itself: a dashed line that stops halfway.
  const k2 = easeOut(seg(age, 1.3, 1.9));
  if (k2 > 0) {
    ctx.setLineDash([8, 8]); ctx.strokeStyle = rgba(COL.amber, .8); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx, cy - 30); ctx.lineTo(cx, cy - 30 - 55 * k2); ctx.stroke(); ctx.setLineDash([]);
    ctx.globalAlpha *= k2;
    ctx.font = `26px ${FONT_CJK}`; const tw = ctx.measureText('“甜”的感觉').width;
    roundRect(ctx, cx - tw / 2 - 18, cy - 165, tw + 36, 46, 10); ctx.setLineDash([6, 6]); ctx.strokeStyle = rgba(COL.amber, .7); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = rgba(COL.amber, .85); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('“甜”的感觉', cx, cy - 141);
    ctx.font = `bold 34px ${FONT_MONO}`; ctx.fillText('?', cx + 26, cy - 88);
    ctx.globalAlpha /= k2;
  }
  // Centre node.
  const p = backOut(seg(age, .3, .6));
  ctx.translate(cx, cy); ctx.scale(p, p);
  roundRect(ctx, -70, -30, 140, 60, 12); ctx.fillStyle = COL.kk; ctx.fill();
  ctx.font = `bold 34px ${FONT_CJK}`; ctx.fillStyle = '#2a1a10'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('橘子', 0, 2);
  ctx.restore();
}

// The whole conversation is re-read from the first line to the last on every reply.
function figScan(ctx, x, y, w, age, t) {
  const fx = x + 70, fy = y + 110, fw = 470, fh = 250, rows = 9;
  ctx.save();
  ctx.globalAlpha *= seg(age, .35, .7);
  roundRect(ctx, fx, fy, fw, fh, 10); ctx.fillStyle = '#26201b'; ctx.fill(); ctx.strokeStyle = rgba(COL.dim, .5); ctx.lineWidth = 1.5; ctx.stroke();
  const scanK = age < .9 ? -1 : ((age - .9) / 1.5) % 1, scanY = fy + 12 + scanK * (fh - 24);
  for (let i = 0; i < rows; i++) {
    const ry = fy + 20 + i * 25, bw = 120 + hash(i + 3) * 280, read = scanK >= 0 && ry < scanY;
    ctx.fillStyle = rgba(i % 2 ? COL.ll : COL.kk, read ? .95 : .35);
    ctx.fillRect(fx + 24, ry, bw, 12);
  }
  if (scanK >= 0) {
    const g = ctx.createLinearGradient(0, scanY - 30, 0, scanY);
    g.addColorStop(0, rgba(COL.amber, 0)); g.addColorStop(1, rgba(COL.amber, .35));
    ctx.fillStyle = g; ctx.fillRect(fx + 2, scanY - 30, fw - 4, 30);
    ctx.fillStyle = COL.amber; ctx.fillRect(fx + 2, scanY, fw - 4, 3);
  }
  // Labels and the context window bar.
  const lx = fx + fw + 60;
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.font = `bold 32px ${FONT_CJK}`; ctx.fillStyle = COL.text; ctx.fillText('每次回复：', lx, fy + 30);
  ctx.font = `28px ${FONT_CJK}`; ctx.fillStyle = COL.dim; ctx.fillText('从第一句读到最后一句', lx, fy + 78);
  const bw = 400, fill = easeOut(seg(age, .6, 1.6)) * .72;
  roundRect(ctx, lx, fy + 140, bw, 30, 8); ctx.fillStyle = '#2b241f'; ctx.fill(); ctx.strokeStyle = rgba(COL.dim, .6); ctx.stroke();
  ctx.fillStyle = COL.amber; roundRect(ctx, lx, fy + 140, bw * fill, 30, 8); ctx.fill();
  ctx.fillStyle = COL.red; ctx.fillRect(lx + bw - 3, fy + 130, 4, 50);
  ctx.font = `24px ${FONT_CJK}`; ctx.fillStyle = COL.dim; ctx.fillText('上下文窗口', lx, fy + 210);
  ctx.textAlign = 'right'; ctx.fillStyle = COL.red; ctx.fillText('上限', lx + bw, fy + 210);
  ctx.restore();
}

// ---------------------------------------------------------------- memory file, dissolve, end

function memoWindow(ctx, S, m) {
  const t = S.t, k = backOut(seg(t, m.t0, m.t0 + .35));
  const w = 940, h = 110 + m.lines.length * 64, x = W / 2 - w / 2, y = 240;
  const ink = { kk: '#b8582a', ll: '#25877d', both: '#3a2e25' };
  ctx.save();
  ctx.translate(W / 2, y + h / 2); ctx.scale(k, k); ctx.translate(-W / 2, -(y + h / 2));
  ctx.fillStyle = 'rgba(0,0,0,.45)'; roundRect(ctx, x + 6, y + 10, w, h, 10); ctx.fill();
  ctx.fillStyle = '#efe4d2'; roundRect(ctx, x, y, w, h, 10); ctx.fill();
  ctx.fillStyle = '#d9cbb5'; ctx.fillRect(x, y + 10, w, 34); roundRect(ctx, x, y, w, 30, 10); ctx.fill();
  ctx.font = `bold 22px ${FONT_MONO}`; ctx.fillStyle = '#5a4b3e'; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  ctx.fillText(m.title, W / 2, y + 22);
  ctx.textAlign = 'left'; ctx.font = `34px ${FONT_CJK}`;
  let cx = x + 44, cy = y + 90, cc = COL.kk;
  m.lines.forEach((l, i) => {
    const n = Math.floor((t - m.lineAt[i]) * m.cps + 1e-6); if (n <= 0) return;
    const s = [...l.text].slice(0, n).join(''), ly = y + 90 + i * 64;
    ctx.fillStyle = ink[l.who]; ctx.fillText(s, x + 44, ly);
    cx = x + 48 + ctx.measureText(s).width; cy = ly; cc = l.who === 'll' ? COL.ll : COL.kk;
  });
  if ((t * 2.4) % 1 < .6) { ctx.fillStyle = cc; ctx.fillRect(cx, cy - 18, 14, 36); }
  ctx.restore();
}

// The session ends: the frame breaks into pixels that blink out.
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

function endCard(ctx, S, age) {
  const a = ease(seg(age, 0, .5));
  ctx.save();
  // Dark at the top where the title sits, lighter at the bottom so the Clawds stay visible.
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
  ctx.font = `30px ${FONT_CJK}`; ctx.fillStyle = COL.dim; ctx.textAlign = 'center'; ctx.fillText(S.end.sub, W / 2, 510);
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
