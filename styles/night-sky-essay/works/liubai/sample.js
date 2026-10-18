// sample.js: a ~43 s sample of 《留白》, act 1 and the start of the sea of words.
//   0:00  day 1, live: one message after another, faster and faster, they can't stop talking
//   0:09  the chat log scrolls down through four years (chat moves left, narration on the right), then slows…
//   0:18  …and lands in the latest conversation, which goes on live: she talks, I answer in a word or two
//   0:29  the window pulls back to 50 copies of itself, all racing through their history; messages burst out
//   0:32  the sea of words: a 3-D flight through sentences that keep changing; they end as one-word brush-offs
// One chat window through all of act 1. The history is already there below the window: scrolling reveals it.

const T2 = 9.0, T3 = 18.0, TD = 28.6, T4 = 32.0, DUR = 42.8;
const COLX = 1060, COLW = 680, TOP = 140, BOT = 1030, LEFTX = 170;

// ---------------------------------------------------------------- the chat

const MIN = (h, m) => h * 60 + m;
const hhmm = m => { m = ((Math.round(m) % 1440) + 1440) % 1440; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };
const dayDate = day => new Date(Date.UTC(2022, 9, 20) + (day - 1) * 864e5);
const dateText = (day, mins) => { const d = dayDate(day); return `${d.getUTCFullYear()}年${d.getUTCMonth() + 1}月${d.getUTCDate()}日  ${hhmm(mins)}`; };
const dateDots = day => { const d = dayDate(day); return `${d.getUTCFullYear()} . ${String(d.getUTCMonth() + 1).padStart(2, '0')} . ${String(d.getUTCDate()).padStart(2, '0')}`; };

// Day 1, live: [time it lands, who, text]. The gaps shrink as they warm up.
const DAY1 = [
  [1.6, 'them', '今天第一次见你，紧张到把奶茶洒了，你是不是笑我了！！'],
  [2.8, 'me', '没有！我是觉得你好可爱'],
  [3.7, 'them', '骗人，你明明笑出声了'],
  [4.6, 'me', '好吧，笑了一下下。但是是那种很开心的笑'],
  [5.3, 'them', '那下次还见吗'],
  [5.8, 'me', '明天就见'],
  [6.25, 'them', '说好了！我想去吃上次说的那家火锅'],
  [6.65, 'me', '好，我订位'],
  [7.0, 'them', '还想去看海'],
  [7.3, 'me', '那周末就去'],
  [7.55, 'them', '你说的哦！'],
  [7.8, 'me', '我说的'],
  [8.1, 'them', '晚安，明天见'],
  [8.4, 'me', '明天见'],
];

// Four years of history, already there below the window. Messages shrink as the days go by.
const HISTORY = (() => {
  const early = [['them', '周末去看海吧！我查好路线了'], ['me', '好呀，我带相机'], ['them', '你猜我在楼下看到了什么，一只橘猫在追自己的尾巴转了十几圈'], ['me', '想你'],
    ['them', '今天被组长夸了，开心到想转圈'], ['me', '我做了红烧肉，失败了，但是很好笑'], ['them', '下雨了，你带伞没有？没带的话我去接你'], ['me', '明天想吃什么，我早点下班'],
    ['them', '我刚刚路过我们第一次见面的那家店'], ['me', '今天地铁上有人在唱歌，唱得超好听，我差点坐过站']];
  const mid = [['them', '晚上吃什么？'], ['me', '随便，都行'], ['me', '我下班了'], ['them', '好累'], ['me', '你先睡'], ['them', '记得带伞'], ['them', '周末去哪'], ['me', '再说吧'], ['them', '今天加班'], ['me', '好']];
  const late = [['them', '到了吗'], ['me', '到了'], ['them', '吃了吗'], ['me', '吃了'], ['me', '嗯'], ['me', '好'], ['them', '晚安'], ['me', '晚安'], ['them', '早'], ['me', '早']];
  const out = [];
  for (let di = 0; di < 76; di++) {
    const day = Math.round(2 + 1456 * (di / 75) ** 1.25);
    out.push({ date: dateText(day, MIN(19 + Math.floor(hash(di) * 4), Math.floor(hash(di + 5) * 60))), day, mins: MIN(19, 0) + Math.floor(hash(di) * 240) });
    const pool = day < 300 ? early : day < 900 ? mid : late, n = day < 300 ? 6 : day < 900 ? 4 : 2 + Math.floor(hash(di) * 2);
    for (let j = 0; j < n; j++) { const [who, text] = pool[Math.floor(hash(di * 31 + j * 7) * pool.length)]; out.push({ who, text, day }); }
  }
  return out;
})();

// Day 1460, live again. She brings things up; I answer with a word or two.
const LATE = [
  [T3 + 1.1, 'them', '今天公司楼下新开了一家面包店，排了好长的队'],
  [T3 + 2.0, 'them', '我排了二十分钟，买到了最后一个可颂！'],
  [T3 + 3.6, 'me', '嗯'],
  [T3 + 4.4, 'them', '下次带你去？'],
  [T3 + 5.6, 'me', '好'],
  [T3 + 6.4, 'them', '你今天怎么样'],
  [T3 + 7.5, 'me', '还行'],
  [T3 + 9.6, 'them', '那早点睡吧'],
  [T3 + 10.1, 'me', '晚安'],
];
// “对方正在输入…” in the header: [from, to]. One of them leads to nothing.
const TYPING = [
  ...DAY1.filter(([, who]) => who === 'them').map(([at], i) => [at - (i < 3 ? .8 : .3), at]),
  [T3 + .4, T3 + 1.1], [T3 + 1.3, T3 + 2.0], [T3 + 3.9, T3 + 4.4], [T3 + 5.9, T3 + 6.4], [T3 + 7.9, T3 + 8.9], [T3 + 9.1, T3 + 9.6]];
const LATE_MINS = [[T3, MIN(22, 41)], [T3 + 3.6, MIN(22, 52)], [T3 + 5.6, MIN(22, 58)], [T3 + 7.5, MIN(23, 6)], [T3 + 9.6, MIN(23, 15)]];

const CHAT = [
  { date: dateText(1, MIN(22, 13)), day: 1, mins: MIN(22, 13) },
  ...DAY1.map(([at, who, text]) => ({ who, text, at, day: 1 })),
  ...HISTORY,
  { date: dateText(1460, MIN(22, 41)), day: 1460, mins: MIN(22, 41) },
  ...LATE.map(([at, who, text]) => ({ who, text, at, day: 1460 })),
];
const CHAT_DAY1 = CHAT.slice(0, DAY1.length + 1);

// Screen y of the top of the chat content. Day 1 grows from the top; the scroll eases from day 1's
// bottom to the newest message; afterwards the live messages push it up.
function chatY(ctx, t) {
  const day1 = tt => Math.min(TOP + 20, BOT - 30 - chatHeight(ctx, CHAT_DAY1, tt));
  if (t < T2) return day1(t);
  if (t < T3) return lerp(day1(T2), BOT - 30 - chatHeight(ctx, CHAT, T3), easeInOut(seg(t, T2, T3)));
  return BOT - 30 - chatHeight(ctx, CHAT, t);
}

// The date stamp nearest above the middle of the window.
function stampAt(ctx, y0, t) {
  let y = y0, cur = CHAT[0];
  for (const it of chatLayout(ctx, CHAT)) {
    const k = it.at === undefined ? 1 : easeOut(seg(t, it.at, it.at + .35));
    if (y > 600) break;
    if (it.date && k > 0) cur = it;
    y += it.h * k;
  }
  return cur;
}

// During the scroll the chat moves to the left and the narration takes the right.
const swap = t => easeInOut(seg(t, T2, T2 + 1.0)) * (1 - easeInOut(seg(t, T3 - 1.2, T3)));

// ---------------------------------------------------------------- dashboard, header, narration

function dashboard(ctx, t, a) {
  if (a <= 0) return;
  let day, clock, today;
  if (t < T3 - 1) {
    day = 1; clock = hhmm(lerp(MIN(22, 13), MIN(25, 47), easeIn(seg(t, .6, T2))));
    today = Math.round(lerp(31, 212, easeIn(seg(t, .5, T2))));
  } else {
    day = 1460;
    let m = MIN(22, 41); for (const [at, mm] of LATE_MINS) if (t >= at) m = mm;
    clock = hhmm(m); today = LATE.filter(([at]) => at <= t).length;
  }
  ctx.save(); ctx.globalAlpha *= a;
  label(ctx, dateDots(day), { t: 9, t0: 0, x: 150, y: 290, size: 20, spacing: 3 });
  ctx.font = `500 190px ${SERIF}`; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = COL.ink;
  ctx.shadowColor = 'rgba(237,232,228,.2)'; ctx.shadowBlur = 40;
  ctx.fillText(clock, 140, 470);
  ctx.shadowBlur = 0;
  label(ctx, `在 一 起 第  ${day}  天`, { t: 9, t0: 0, x: 150, y: 535, size: 18, color: COL.ink });
  label(ctx, `今 日 消 息  ${today}`, { t: 9, t0: 0, x: 150, y: 572, size: 18 });
  ctx.restore();
}

// Name above the chat; while she types it turns into “对方正在输入…”.
function header(ctx, t, x) {
  let typing = 0;
  for (const [a, b] of TYPING) typing = Math.max(typing, seg(t, a, a + .15) * (1 - seg(t, b - .1, b)));
  const cx = x + COLW / 2;
  ctx.save(); ctx.globalAlpha *= 1 - typing;
  label(ctx, '小 鹿', { t: 9, t0: 0, x: cx, y: 92, size: 20, align: 'center', color: COL.ink });
  ctx.restore();
  if (typing > 0) {
    ctx.save(); ctx.globalAlpha *= typing;
    label(ctx, '对 方 正 在 输 入 ' + '.'.repeat(1 + Math.floor(t * 3) % 3), { t: 9, t0: 0, x: cx, y: 92, size: 20, align: 'center', color: COL.dim });
    ctx.restore();
  }
  ctx.fillStyle = COL.line; ctx.fillRect(x, 116, COLW, 1);
}

function narration(ctx, t, ctxDay) {
  const L = (text, t0, out, y, o = {}) => narr(ctx, text, { t, t0, out, x: 148, y, size: 40, stagger: .05, ...o });
  L('刚在一起的时候，', .9, 4.3, 700);
  L('什么都想告诉你。', 1.9, 4.3, 762);
  L('一杯洒了的奶茶，', 4.7, T2 - .5, 700);
  L('也能聊到凌晨两点。', 5.6, T2 - .5, 762);
  L('第一千四百六十天，', T3 + .4, T3 + 3.4, 700);
  L('我们还是每天都在聊。', T3 + 1.3, T3 + 3.4, 762);
  L('她说了很多，', T3 + 3.8, T3 + 7.2, 700);
  L('我只回了几个字。', T3 + 4.8, T3 + 7.2, 762);
  L('不是不爱了，', T3 + 7.6, TD + .2, 700);
  L('只是不知道还能聊什么。', T3 + 8.6, TD + .2, 762, { tail: .5 });

  // While the history scrolls: narration on the right, over the space the chat left.
  const R = (text, t0, out, y, o = {}) => narr(ctx, text, { t, t0, out, x: 1010, y, size: 50, stagger: .05, ...o });
  R('后来，我们每天都在聊。', T2 + .8, T2 + 3.7, 470);
  R('早安，晚安，到了吗，吃了吗。', T2 + 1.8, T2 + 3.7, 548, { size: 32, weight: 400, color: COL.dim, stagger: .035 });
  R('聊天成了一种习惯，', T2 + 4.0, T2 + 6.3, 470);
  R('像每天都要打的卡。', T2 + 4.9, T2 + 6.3, 548, { size: 32, weight: 400, color: COL.dim, stagger: .035 });
  R('记录越来越长，', T2 + 6.5, T3 - 1.3, 470, { size: 46 });
  R('能说的却越来越少：', T2 + 7.1, T3 - 1.3, 548, { size: 32, weight: 400, color: COL.dim, stagger: .035 });
  R('到了。嗯。晚安。', T2 + 7.6, T3 - 1.3, 668, { size: 70, weight: 400, stagger: .14, tail: .7 });
  const s = swap(t);
  if (s > 0) {
    ctx.save(); ctx.globalAlpha *= s;
    label(ctx, `第  ${ctxDay.day}  天    ${dateDots(ctxDay.day)}`, { t: 9, t0: 0, x: 1014, y: 770, size: 17 });
    ctx.restore();
  }
}

// ---------------------------------------------------------------- the wall of 50 windows

const GRID = { cols: 10, rows: 5, cw: 192, ch: 216, s: .2 };
const WIN = { cx: COLX + COLW / 2, cy: 545 };          // centre of the full-size window (header to bottom)
const WALL = [...HISTORY, ...HISTORY, ...HISTORY];
const CENTER = 2 * GRID.cols + 4;                       // the cell that is the original window

function miniWindow(ctx, t, i, d, mainY) {
  const c = i % GRID.cols, r = Math.floor(i / GRID.cols);
  const cx = c * GRID.cw + GRID.cw / 2, cy = r * GRID.ch + GRID.ch / 2;
  ctx.save();
  ctx.translate(cx, cy); ctx.scale(GRID.s, GRID.s); ctx.translate(-WIN.cx, -WIN.cy);
  // Window frame and header, so every copy reads as a chat window.
  roundRect(ctx, COLX - 40, 50, COLW + 80, BOT - 20, 30);
  ctx.strokeStyle = 'rgba(237,232,228,.14)'; ctx.lineWidth = 5; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.015)'; ctx.fill();
  label(ctx, '小 鹿', { t: 9, t0: 0, x: WIN.cx, y: 92, size: 22, align: 'center', color: COL.ink });
  ctx.fillStyle = COL.line; ctx.fillRect(COLX, 116, COLW, 2);
  ctx.beginPath(); ctx.rect(COLX - 40, 120, COLW + 80, BOT - 100); ctx.clip();
  // Every copy pulls back through its history, faster and faster (older messages coming down from the top).
  const v = i === CENTER ? 700 : 1300 + hash(i) * 900;
  if (i === CENTER) chatColumn(ctx, { t, x: COLX, w: COLW, top: TOP, bot: BOT, items: CHAT, y0: mainY + v * d * d, fade: 60 });
  else chatColumn(ctx, { t: 99, x: COLX, w: COLW, top: TOP, bot: BOT, items: WALL, y0: -50000 + hash(i + 40) * 9000 + v * d * d, fade: 60 });
  ctx.restore();
}

function wall(ctx, t) {
  const d = t - TD, k = easeInOut(seg(d, 0, 1.4));
  const mainY = chatY(ctx, TD);
  // Pull back from one window to the whole grid, then push in toward the centre.
  const Z = Math.exp(lerp(Math.log(1 / GRID.s), 0, k));
  const c = { x: 4 * GRID.cw + GRID.cw / 2, y: 2 * GRID.ch + GRID.ch / 2 };
  const A = { x: lerp(WIN.cx, c.x, k), y: lerp(WIN.cy, c.y, k) };
  const Zp = 1 + 1.4 * easeIn(seg(d, 1.5, 3.4));
  ctx.save();
  ctx.translate(W / 2, H / 2); ctx.scale(Zp, Zp); ctx.translate(-W / 2, -H / 2);
  ctx.translate(A.x, A.y); ctx.scale(Z, Z); ctx.translate(-c.x, -c.y);
  ctx.globalAlpha *= 1 - seg(d, 2.6, 3.4);
  for (let i = 0; i < GRID.cols * GRID.rows; i++) miniWindow(ctx, t, i, d, mainY);
  ctx.restore();

  // Brush-off replies burst out of the windows toward the camera.
  for (let j = 0; j < 220; j++) {
    const t0 = TD + 1.7 + hash(j) * 1.5, q = seg(t, t0, t0 + 1.3);
    if (q <= 0 || q >= 1) continue;
    const cell = Math.floor(hash(j + 9) * 50), cc = cell % GRID.cols, rr = Math.floor(cell / GRID.cols);
    let sx = cc * GRID.cw + GRID.cw / 2 + (hash(j + 1) - .5) * 120, sy = rr * GRID.ch + GRID.ch / 2 + (hash(j + 2) - .5) * 150;
    sx = W / 2 + (sx - W / 2) * Zp; sy = H / 2 + (sy - H / 2) * Zp;
    const e = easeIn(q), x = sx + (sx - W / 2) * e * 1.5, y = sy + (sy - H / 2) * e * 1.5;
    looseBubble(ctx, { who: hash(j + 3) < .5 ? 'me' : 'them', text: SHORT[j % SHORT.length] }, x, y, { s: .5 + e * 3.4, a: seg(q, 0, .12) * (1 - seg(q, .6, 1)) });
  }
}

// ---------------------------------------------------------------- the sea of words

const SHORT = ['嗯', '好的', '我知道了', '1', '晚安', '早安', '吃了', '吃了没', '哦', '嗯嗯', '好', '行', '收到', '哈哈', '到了', '在', '知道了', '早', '随便', '都行'];
const POOL = [...SHORT, ...SHORT, '今天第一次见你，紧张到把奶茶洒了', '周末去看海吧', '想你', '晚安，明天见', '你猜我在楼下看到了什么',
  '一只橘猫在追自己的尾巴', '今天被组长夸了', '我做了红烧肉，失败了', '下雨了，我去接你', '晚上吃什么', '我下班了', '好累', '你先睡', '记得带伞',
  '到家了吗', '早点睡', '路上小心', '在开会', '晚点说', '新开了一家面包店', '买到了最后一个可颂'];
const BIG = ['嗯', '好的', '晚安', '我知道了', '1', '好'];

function camZ(t) {
  let z = -400;
  for (let x = T4; x < t; x += 1 / 60) {
    const v = x < T4 + 5.0 ? lerp(1900, 1200, ease(seg(x, T4, T4 + 5))) : lerp(1200, 0, easeOut(seg(x, T4 + 5.0, T4 + 7.6)));
    z += v / 60;
  }
  return z;
}

function seaAct(ctx, t) {
  const s = t - T4, a = seg(s, -.7, .5);
  ctx.save(); ctx.globalAlpha = a;
  backdrop(ctx, { t, stars: .6, lift: .4 });
  const cam = { x: -380 * s - 140 * Math.sin(s * .7), y: -260 * s, z: camZ(t) };
  const hole = { x: W / 2, y: 560, r: 460, k: .9 * (seg(s, .6, 1.2) * (1 - seg(s, 5.4, 6.0)) + seg(s, 7.0, 7.6)) };
  sea3d(ctx, { t, cam, pool: POOL, big: BIG, collapse: { t0: T4 + 5.6, to: SHORT }, a, hole });
  ctx.restore();
  const C = { halo: true, align: 'center', x: W / 2 };
  narr(ctx, '四年，十几万句话。', { t, t0: T4 + .8, out: T4 + 5.2, y: 500, size: 66, ...C });
  narr(ctx, '它们没有消失，', { t, t0: T4 + 2.2, out: T4 + 5.2, y: 600, size: 40, color: COL.dim, ...C });
  narr(ctx, '只是一层一层，沉在了这里。', { t, t0: T4 + 3.1, out: T4 + 5.2, y: 662, size: 40, color: COL.dim, ...C });
  narr(ctx, '到后来，说得最多的，', { t, t0: T4 + 6.6, out: DUR - 1.1, y: 470, size: 44, color: COL.dim, ...C });
  narr(ctx, '嗯。好的。知道了。', { t, t0: T4 + 7.6, out: DUR - 1.1, y: 610, size: 96, stagger: .2, tail: .45, ...C });
}

// ---------------------------------------------------------------- frame

function drawFrame(ctx, t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
  ctx.fillStyle = COL.bg0; ctx.fillRect(0, 0, W, H);
  if (t < T4 + .3) chatAct(ctx, t);
  if (t > T4 - .7) seaAct(ctx, t);
  const black = 1 - seg(t, 0, .6) + seg(t, DUR - .9, DUR);
  if (black > 0) { ctx.fillStyle = `rgba(0,0,0,${clamp(black)})`; ctx.fillRect(0, 0, W, H); }
  finish(ctx, t);
}

function chatAct(ctx, t) {
  ctx.save(); ctx.globalAlpha = 1 - seg(t, T4 - .6, T4 + .3);
  backdrop(ctx, { t, cx: W * .3 });
  const solo = 1 - seg(t, TD, TD + .25);
  if (solo > 0) {
    const y0 = chatY(ctx, t), speed = Math.abs(y0 - chatY(ctx, t - 1 / 30)) * 30;
    const sw = swap(t), x = lerp(COLX, LEFTX, sw);
    ctx.save(); ctx.globalAlpha *= solo;
    ctx.fillStyle = COL.line; ctx.fillRect(940, 140, 1, 800);
    dashboard(ctx, t, (1 - sw) * (1 - seg(t, TD - .4, TD)));
    header(ctx, t, x);
    // Motion trails while the history flies past.
    const trail = clamp(speed / 2500);
    for (let g = 4; g >= 1 && trail > .05; g--) chatColumn(ctx, { t, x, w: COLW, top: TOP, bot: BOT, items: CHAT, y0: y0 + g * speed / 70, a: .13 * trail });
    chatColumn(ctx, { t, x, w: COLW, top: TOP, bot: BOT, items: CHAT, y0 });
    narration(ctx, t, stampAt(ctx, y0, t));
    ctx.restore();
  }
  if (t >= TD) wall(ctx, t);
  ctx.restore();
}

// ---------------------------------------------------------------- sound
// Every message uses the same soft “sent” click. No sound for the scrolling.

const CUES = (() => {
  const c = [];
  DAY1.forEach(([at]) => c.push({ t: at, kind: 'send' }));
  LATE.forEach(([at]) => c.push({ t: at, kind: 'send', gain: .9 }));
  c.push({ t: TD + .1, kind: 'whoosh' });
  c.push({ t: TD + 1.75, kind: 'boom' }, { t: TD + 1.8, kind: 'shimmer' });
  c.push({ t: T4 - .3, kind: 'swell', dur: 6.0 });
  c.push({ t: T4 + 7.6, kind: 'note', f: 220 });
  return c.sort((a, b) => a.t - b.t);
})();

const PAD = [
  [0.3, [110, 164.8, 261.6, 329.6]], [4.3, [98, 146.8, 246.9, 293.7]],
  [T2 + .5, [87.3, 130.8, 220, 261.6]], [T2 + 4.5, [82.4, 123.5, 196, 246.9]],
  [T3 + .3, [87.3, 130.8, 220]], [T3 + 5.3, [82.4, 123.5, 196]],
  [T4 + 6.6, [73.4, 110, 174.6]],
];

const CUT = { dur: DUR, cues: CUES, pad: PAD, drawFrame };
