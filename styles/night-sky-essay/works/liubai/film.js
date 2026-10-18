// film.js: 《留白》, the whole film (about 3 minutes). Storyboard: creative_materials/2026-10-18_留白_分镜草案/分镜脚本.md
//
//   A1  0:00  lovers: day 1 live → four years scroll by → day 1460 live, she talks and I answer in a word
//   A2  0:29  an ordinary friend: 127 days of silence → “在吗” → talking till 2 a.m. → same night, 9 vs 186 messages
//   WL  0:54  the two windows copy into 50 in 3-D space; the camera dives in and the messages burst out
//   TT  0:58  title
//   SE  1:02  the sea of words: flight → collapse into brush-offs; the words fall and become blocks
//   Z   1:13  the explainer (charts and moving type, white): blocks → Gottman → formula → three factors
//             (new information, curiosity, ease) → together → what to do
//   EN  2:57  back to black: a real question, end card
//
// Every frame is a pure function of t. Scenes draw themselves when t is inside their window.

const F = 1000;
const MIN = (h, m) => h * 60 + m;
const hhmm = m => { m = ((Math.round(m) % 1440) + 1440) % 1440; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };
const dayDate = day => new Date(Date.UTC(2022, 9, 20) + (day - 1) * 864e5);
const dateText = (day, mins) => { const d = dayDate(day); return `${d.getUTCFullYear()}年${d.getUTCMonth() + 1}月${d.getUTCDate()}日  ${hhmm(mins)}`; };
const dateDots = day => { const d = dayDate(day); return `${d.getUTCFullYear()} . ${String(d.getUTCMonth() + 1).padStart(2, '0')} . ${String(d.getUTCDate()).padStart(2, '0')}`; };
const liveItems = (date, msgs) => [date, ...msgs.map(([at, who, text]) => ({ who, text, at }))];

// Scene start times.
const A1 = 0, A2 = 29.0, WL = 54.0, TT = 57.6, SE = 61.8, Z = SE + 11.0;   // Z: the explainer starts

// ================================================================ shared pieces

// The left-hand dashboard: date, a big serif number, two small rows.
function dash(ctx, o) {
  if (o.a <= 0) return;
  ctx.save(); ctx.globalAlpha *= o.a;
  if (o.date) label(ctx, o.date, { t: 9, t0: 0, x: 150, y: 290, size: 20, spacing: 3 });
  if (o.over) label(ctx, o.over, { t: 9, t0: 0, x: 150, y: 290, size: 18 });
  ctx.font = `500 190px ${SERIF}`; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = COL.ink;
  ctx.shadowColor = 'rgba(237,232,228,.2)'; ctx.shadowBlur = 40;
  ctx.fillText(o.big, 140, 470); ctx.shadowBlur = 0;
  (o.rows || []).forEach((r, i) => label(ctx, r, { t: 9, t0: 0, x: 150, y: 535 + i * 37, size: 18, color: i ? COL.dim : COL.ink }));
  ctx.restore();
}

// Name above a chat; while the other side types it turns into “对方正在输入…”.
function header(ctx, t, cx, y, name, typing = []) {
  let k = 0;
  for (const [a, b] of typing) k = Math.max(k, seg(t, a, a + .15) * (1 - seg(t, b - .1, b)));
  ctx.save(); ctx.globalAlpha *= 1 - k;
  label(ctx, name, { t: 9, t0: 0, x: cx, y, size: 20, align: 'center', color: COL.ink });
  ctx.restore();
  if (k > 0) {
    ctx.save(); ctx.globalAlpha *= k;
    label(ctx, '对 方 正 在 输 入 ' + '.'.repeat(1 + Math.floor(t * 3) % 3), { t: 9, t0: 0, x: cx, y, size: 20, align: 'center', color: COL.dim });
    ctx.restore();
  }
}

// A chat panel centred on (cx, cy): header, rule, column; optional frame (used once the windows multiply).
// o: { t, cx, cy, name, items, typing, y0 (relative to cy; omitted = live), frame, a, itemT (time for items) }
const PANEL = { w: 640, top: -390, bot: 400, head: -428 };
function panelLiveY(ctx, items, t) { return Math.min(PANEL.top + 20, PANEL.bot - 30 - chatHeight(ctx, items, t)); }
function panel(ctx, o) {
  ctx.save(); ctx.globalAlpha *= o.a ?? 1;
  const x = o.cx - PANEL.w / 2, top = o.cy + PANEL.top, bot = o.cy + PANEL.bot;
  if (o.frame > 0) {
    roundRect(ctx, x - 40, o.cy - 470, PANEL.w + 80, 900, 30);
    ctx.fillStyle = `rgba(10,11,14,${.92 * o.frame})`; ctx.fill();
    ctx.strokeStyle = `rgba(237,232,228,${.3 * o.frame})`; ctx.lineWidth = 4; ctx.stroke();
  }
  header(ctx, o.t, o.cx, o.cy + PANEL.head, o.name, o.typing || []);
  ctx.fillStyle = COL.line; ctx.fillRect(x, o.cy + PANEL.head + 24, PANEL.w, 1);
  const it = o.itemT ?? o.t;
  const y0 = o.cy + (o.y0 ?? panelLiveY(ctx, o.items, it));
  ctx.save(); ctx.beginPath(); ctx.rect(x - 40, top - 10, PANEL.w + 80, bot - top + 40); ctx.clip();
  chatColumn(ctx, { t: it, x, w: PANEL.w, top, bot, items: o.items, y0, fade: o.fade ?? 100 });
  ctx.restore();
  ctx.restore();
}

// Narration helpers: left column, right column, centre.
const NL = (ctx, t, text, t0, out, y, o = {}) => narr(ctx, text, { t, t0, out, x: 148, y, size: 40, stagger: .05, ...o });
const NR = (ctx, t, text, t0, out, y, o = {}) => narr(ctx, text, { t, t0, out, x: 1010, y, size: 50, stagger: .05, ...o });
const NC = (ctx, t, text, t0, out, y, o = {}) => narr(ctx, text, { t, t0, out, x: W / 2, y, size: 44, align: 'center', stagger: .05, ...o });

// Closing line of a chapter: big centred words on black.
function closing(ctx, t, t0, t1, a, b) {
  const k = seg(t, t0 - .3, t0 + .2) * (1 - seg(t, t1 - .4, t1));
  if (k <= 0) return;
  ctx.save(); ctx.globalAlpha *= k; backdrop(ctx, { t, lift: .5 }); ctx.restore();
  NC(ctx, t, a, t0 + .1, t1 - .5, 500, { size: 56 });
  NC(ctx, t, b, t0 + .9, t1 - .5, 600, { size: 56, color: COL.warm });
}

const SHORT = ['嗯', '好的', '我知道了', '1', '晚安', '早安', '吃了', '吃了没', '哦', '嗯嗯', '好', '行', '收到', '哈哈', '到了', '在', '知道了', '早', '随便', '都行'];

// ================================================================ A1 · lovers

const COLX = 1060, COLW = 680, TOP = 140, BOT = 1030, LEFTX = 170;
const T2 = A1 + 9.0, T3 = A1 + 18.0;

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
].map(([at, w, x]) => [A1 + at, w, x]);

const HISTORY = (() => {
  const early = [['them', '周末去看海吧！我查好路线了'], ['me', '好呀，我带相机'], ['them', '你猜我在楼下看到了什么，一只橘猫在追自己的尾巴转了十几圈'], ['me', '想你'],
    ['them', '今天被组长夸了，开心到想转圈'], ['me', '我做了红烧肉，失败了，但是很好笑'], ['them', '下雨了，你带伞没有？没带的话我去接你'], ['me', '明天想吃什么，我早点下班'],
    ['them', '我刚刚路过我们第一次见面的那家店'], ['me', '今天地铁上有人在唱歌，唱得超好听，我差点坐过站']];
  const mid = [['them', '晚上吃什么？'], ['me', '随便，都行'], ['me', '我下班了'], ['them', '好累'], ['me', '你先睡'], ['them', '记得带伞'], ['them', '周末去哪'], ['me', '再说吧'], ['them', '今天加班'], ['me', '好']];
  const late = [['them', '到了吗'], ['me', '到了'], ['them', '吃了吗'], ['me', '吃了'], ['me', '嗯'], ['me', '好'], ['them', '晚安'], ['me', '晚安'], ['them', '早'], ['me', '早']];
  const out = [];
  for (let di = 0; di < 76; di++) {
    const day = Math.round(2 + 1456 * (di / 75) ** 1.25);
    out.push({ date: dateText(day, MIN(19 + Math.floor(hash(di) * 4), Math.floor(hash(di + 5) * 60))), day });
    const pool = day < 300 ? early : day < 900 ? mid : late, n = day < 300 ? 6 : day < 900 ? 4 : 2 + Math.floor(hash(di) * 2);
    for (let j = 0; j < n; j++) { const [who, text] = pool[Math.floor(hash(di * 31 + j * 7) * pool.length)]; out.push({ who, text, day }); }
  }
  return out;
})();

const LATE = [
  [1.1, 'them', '今天公司楼下新开了一家面包店，排了好长的队'],
  [2.0, 'them', '我排了二十分钟，买到了最后一个可颂！'],
  [3.6, 'me', '嗯'],
  [4.4, 'them', '下次带你去？'],
  [5.6, 'me', '好'],
  [6.4, 'them', '你今天怎么样'],
  [7.5, 'me', '还行'],
  [9.6, 'them', '那早点睡吧'],
  [10.1, 'me', '晚安'],
].map(([at, w, x]) => [T3 + at, w, x]);
const LOVE_TYPING = [
  ...DAY1.filter(([, who]) => who === 'them').map(([at], i) => [at - (i < 3 ? .8 : .3), at]),
  ...[[.4, 1.1], [1.3, 2.0], [3.9, 4.4], [5.9, 6.4], [7.9, 8.9], [9.1, 9.6]].map(([a, b]) => [T3 + a, T3 + b])];
const LATE_MINS = [[0, MIN(22, 41)], [3.6, MIN(22, 52)], [5.6, MIN(22, 58)], [7.5, MIN(23, 6)], [9.6, MIN(23, 15)]].map(([a, m]) => [T3 + a, m]);

const LOVE = [
  { date: dateText(1, MIN(22, 13)), day: 1 },
  ...DAY1.map(([at, who, text]) => ({ who, text, at, day: 1 })),
  ...HISTORY,
  { date: dateText(1460, MIN(22, 41)), day: 1460 },
  ...LATE.map(([at, who, text]) => ({ who, text, at, day: 1460 })),
];
const LOVE_DAY1 = LOVE.slice(0, DAY1.length + 1);
// Only the last night, for the split screen and the copies.
const LOVE_TONIGHT = [{ date: dateText(1460, MIN(22, 41)) }, ...LATE.map(([, who, text]) => ({ who, text }))];

function loveY(ctx, t) {
  const day1 = tt => Math.min(TOP + 20, BOT - 30 - chatHeight(ctx, LOVE_DAY1, tt));
  if (t < T2) return day1(t);
  if (t < T3) return lerp(day1(T2), BOT - 30 - chatHeight(ctx, LOVE, T3), easeInOut(seg(t, T2, T3)));
  return BOT - 30 - chatHeight(ctx, LOVE, t);
}
function stampAt(ctx, y0, t) {
  let y = y0, cur = LOVE[0];
  for (const it of chatLayout(ctx, LOVE)) {
    const k = it.at === undefined ? 1 : easeOut(seg(t, it.at, it.at + .35));
    if (y > 600) break;
    if (it.date && k > 0) cur = it;
    y += it.h * k;
  }
  return cur;
}
const swap = t => easeInOut(seg(t, T2, T2 + 1.0)) * (1 - easeInOut(seg(t, T3 - 1.2, T3)));

function sceneLovers(ctx, t) {
  const a = 1 - seg(t, A2 - .6, A2);
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  backdrop(ctx, { t, cx: W * .3 });
  const y0 = loveY(ctx, t), speed = Math.abs(y0 - loveY(ctx, t - 1 / 30)) * 30;
  const sw = swap(t), x = lerp(COLX, LEFTX, sw);
  ctx.fillStyle = COL.line; ctx.fillRect(940, 140, 1, 800);
  // Dashboard.
  let day, clock, today;
  if (t < T3 - 1) { day = 1; clock = hhmm(lerp(MIN(22, 13), MIN(25, 47), easeIn(seg(t, .6, T2)))); today = Math.round(lerp(31, 212, easeIn(seg(t, .5, T2)))); }
  else { day = 1460; let m = MIN(22, 41); for (const [at, mm] of LATE_MINS) if (t >= at) m = mm; clock = hhmm(m); today = LATE.filter(([at]) => at <= t).length; }
  dash(ctx, { a: 1 - sw, date: dateDots(day), big: clock, rows: [`在 一 起 第  ${day}  天`, `今 日 消 息  ${today}`] });
  header(ctx, t, x + COLW / 2, 92, '小 鹿', LOVE_TYPING);
  ctx.fillStyle = COL.line; ctx.fillRect(x, 116, COLW, 1);
  const items = t < T2 ? LOVE_DAY1 : LOVE;
  const trail = clamp(speed / 2500);
  for (let g = 4; g >= 1 && trail > .05; g--) chatColumn(ctx, { t, x, w: COLW, top: TOP, bot: BOT, items, y0: y0 + g * speed / 70, a: .13 * trail });
  chatColumn(ctx, { t, x, w: COLW, top: TOP, bot: BOT, items, y0 });
  // Narration.
  NL(ctx, t, '刚在一起的时候，', .9, 4.3, 700);
  NL(ctx, t, '什么都想告诉你。', 1.9, 4.3, 762);
  NL(ctx, t, '一杯洒了的奶茶，', 4.7, T2 - .5, 700);
  NL(ctx, t, '也能聊到凌晨两点。', 5.6, T2 - .5, 762);
  NR(ctx, t, '后来，我们每天都在聊。', T2 + .8, T2 + 3.7, 470);
  NR(ctx, t, '早安，晚安，到了吗，吃了吗。', T2 + 1.8, T2 + 3.7, 548, { size: 32, weight: 400, color: COL.dim, stagger: .035 });
  NR(ctx, t, '聊天成了一种习惯，', T2 + 4.0, T2 + 6.3, 470);
  NR(ctx, t, '像每天都要打的卡。', T2 + 4.9, T2 + 6.3, 548, { size: 32, weight: 400, color: COL.dim, stagger: .035 });
  NR(ctx, t, '记录越来越长，', T2 + 6.5, T3 - 1.3, 470, { size: 46 });
  NR(ctx, t, '能说的却越来越少：', T2 + 7.1, T3 - 1.3, 548, { size: 32, weight: 400, color: COL.dim, stagger: .035 });
  NR(ctx, t, '到了。嗯。晚安。', T2 + 7.6, T3 - 1.3, 668, { size: 70, weight: 400, stagger: .14, tail: .7 });
  if (sw > 0) { ctx.save(); ctx.globalAlpha *= sw; label(ctx, `第  ${stampAt(ctx, y0, t).day}  天    ${dateDots(stampAt(ctx, y0, t).day)}`, { t: 9, t0: 0, x: 1014, y: 770, size: 17 }); ctx.restore(); }
  NL(ctx, t, '第一千四百六十天，', T3 + .4, T3 + 3.4, 700);
  NL(ctx, t, '我们还是每天都在聊。', T3 + 1.3, T3 + 3.4, 762);
  NL(ctx, t, '她说了很多，', T3 + 3.8, T3 + 7.2, 700);
  NL(ctx, t, '我只回了几个字。', T3 + 4.8, T3 + 7.2, 762);
  NL(ctx, t, '不是不爱了，', T3 + 7.6, A2 - .6, 700);
  NL(ctx, t, '只是不知道还能聊什么。', T3 + 8.6, A2 - .6, 762, { tail: .5 });
  ctx.restore();
}

// ================================================================ A2 · an ordinary friend

const B1 = A2 + 5.0, B2 = A2 + 19.0, B3 = A2 + 25.0;     // “在吗”, split screen, end
const FRIEND_OLD = [{ date: '2026年6月12日  20:03' }, { who: 'them', text: '下次回来请你吃饭！' }, { who: 'me', text: '好啊，一言为定' }];
const FRIEND_MSGS = (() => {
  const m = [
    [.6, 'them', '在吗'], [1.2, 'me', '在！！'], [1.9, 'them', '跟你说个事，我辞职了'], [2.4, 'me', '？？？什么时候'],
    [3.1, 'them', '上个月。现在在大理开了个小民宿'], [3.6, 'them', '你还记得大二说要去的洱海吗'], [4.0, 'them', '我真的去了'],
    [4.4, 'me', '等等，我要从头听'], [4.8, 'them', '说来话长哈哈哈'], [5.1, 'me', '那就慢慢说，我今晚不睡了'],
  ];
  const fast = [['them', '还养了只狗，叫“学分”'], ['me', '为什么叫学分'], ['them', '因为当年挂科啊'], ['me', '哈哈哈哈哈哈'], ['them', '对了老王结婚了你知道吗'],
    ['me', '不知道！！和谁'], ['them', '和隔壁班那个学委'], ['me', '我就说他们有情况'], ['them', '我上个月还去爬了雪山'], ['them', '山顶冷到怀疑人生'],
    ['me', '照片发我'], ['them', '你呢，最近怎么样'], ['me', '换了个组，天天加班'], ['them', '那你来大理住几天'], ['me', '真的可以吗'],
    ['them', '房间给你留着'], ['me', '那我年底去'], ['them', '一言为定'], ['me', '这次真的一言为定']];
  fast.forEach(([who, text], i) => m.push([5.5 + 6.4 * (i / fast.length) ** .8, who, text]));
  m.push([12.6, 'me', '几点了'], [13.2, 'them', '两点多了'], [13.7, 'me', '这么快'], [14.3, 'them', '下次再聊！'], [14.8, 'me', '好，晚安']);
  return m.map(([at, w, x]) => [B1 + at, w, x]);
})();
const FRIEND = [...FRIEND_OLD, { date: '今天  21:47', at: B1 + .2 }, ...FRIEND_MSGS.map(([at, who, text]) => ({ who, text, at }))];
const FRIEND_TYPING = FRIEND_MSGS.filter(([, w]) => w === 'them').slice(0, 5).map(([at]) => [at - .5, at]);

function sceneFriend(ctx, t) {
  const a = seg(t, A2 - .3, A2 + .5);
  if (a <= 0 || t > WL + .1) return;
  ctx.save(); ctx.globalAlpha *= a;
  backdrop(ctx, { t, cx: W * .3 });
  const l = t - A2, split = easeInOut(seg(t, B2, B2 + 1.2));
  // Dashboard on the left until the split.
  if (split < 1) {
    ctx.save(); ctx.globalAlpha *= 1 - split;
    ctx.fillStyle = COL.line; ctx.fillRect(940, 140, 1, 800);
    if (t < B1) {
      const n = Math.round(127 * easeOut(seg(l, .6, 3.2)));
      dash(ctx, { a: 1 - seg(t, B1 - .3, B1), over: '距 离 上 次 聊 天', big: `${n} 天`, rows: ['老 周', '大 学 室 友'] });
    } else {
      const m = lerp(MIN(21, 47), MIN(26, 14), easeIn(seg(t, B1 + .5, B1 + 12.6)));
      const today = Math.min(186, Math.round(lerp(0, 186, easeIn(seg(t, B1 + .4, B1 + 13.6)))));
      dash(ctx, { a: seg(t, B1, B1 + .4), date: '2026 . 10 . 18', big: hhmm(m), rows: ['此 刻', `今 日 消 息  ${today}`] });
    }
    NL(ctx, t, '我和他，', A2 + 1.2, B1 - .2, 700);
    NL(ctx, t, '四个月没说过话。', A2 + 2.0, B1 - .2, 762);
    NL(ctx, t, '一句“在吗”，', B1 + 1.0, B1 + 6.4, 700);
    NL(ctx, t, '就聊到了凌晨两点。', B1 + 2.0, B1 + 6.4, 762);
    NL(ctx, t, '没有谁必须回复谁，', B1 + 6.8, B2 - .4, 700);
    NL(ctx, t, '可每一句，都想接下去。', B1 + 7.8, B2 - .4, 762);
    ctx.restore();
  }
  // The friend's window: right side, then the right half of the split.
  const fcx = lerp(COLX + COLW / 2 - 40 + 40, 1420, split), cy = lerp(560, 560, split);
  panel(ctx, { t, cx: fcx, cy, name: '老 周', items: FRIEND, typing: FRIEND_TYPING, fade: 90 });
  // Split screen: the lovers' same night slides in on the left.
  if (split > 0) {
    panel(ctx, { t: 99, cx: lerp(-400, 500, split), cy, name: '小 鹿', items: LOVE_TONIGHT, a: split });
    ctx.fillStyle = COL.line; ctx.fillRect(960, 160 + (1 - split) * 400, 1, 780 * split);
    label(ctx, '同 一 个 晚 上', { t, t0: B2 + .8, x: W / 2, y: 50, size: 18, align: 'center', color: COL.ink, spacing: 4 });
    label(ctx, '小 鹿  ·  今 日  9  条', { t, t0: B2 + 1.4, x: 500, y: 1010, size: 18, align: 'center' });
    label(ctx, '老 周  ·  今 日  186  条', { t, t0: B2 + 1.8, x: 1420, y: 1010, size: 18, align: 'center' });
  }
  ctx.restore();
}

// ================================================================ WL · the 50 windows

// The two windows of the split screen hang in 3-D space with 48 copies around them. The originals sit
// exactly where they were on screen (camera at z = −F, scale 1). Copies slide out, the camera pulls back and
// turns until the wall fills the frame, then dives in; brush-off replies burst out toward the lens.
// Plenty of history above every copy, so each can keep pulling back through it.
const WALL_LOVE = [...HISTORY, ...HISTORY];
const WALL_FRIEND = (() => { const m = FRIEND_MSGS.map(([, who, text]) => ({ who, text })); return Array.from({ length: 16 }, () => m).flat(); })();
const ORIG_LOVE = [...WALL_LOVE, ...LOVE_TONIGHT], ORIG_FRIEND = [...WALL_FRIEND, ...FRIEND];
const SLOTS = (() => {
  const out = [], SX = 920, SY = 1040;
  for (let r = 0; r < 5; r++) for (let c = 0; c < 10; c++) {
    const i = r * 10 + c, orig = r === 2 && (c === 4 || c === 5);
    out.push({ i, X: (c - 4.5) * SX, Y: (r - 2) * SY, Z: orig ? 0 : (hash(i + 3) - .5) * 900, orig, lover: c < 5,
      order: Math.hypot(c - 4.5, (r - 2) * 1.3) + hash(i) * .6 });
  }
  return out;
})();
function wallCam(d) {
  const back = easeInOut(seg(d, .1, 1.7)), dive = seg(d, 1.6, 3.6) ** 2.2;
  return { x: -dive * 700, y: -60 * back + dive * 500, z: -F * Math.exp(lerp(0, Math.log(4.6), back)) + dive * 7400, yaw: .14 * Math.sin(Math.PI * .5 * back) - dive * .2, roll: -.035 * back + .03 * dive };
}
function project(cam, X, Y, Z) {
  const px = X - cam.x, pz = Z - cam.z, c = Math.cos(cam.yaw), s = Math.sin(cam.yaw);
  const x = px * c - pz * s, z = px * s + pz * c, y = Y - cam.y;
  if (z < 60) return null;
  const k = F / z;
  return { x: W / 2 + x * k, y: H / 2 + y * k, k, z };
}
function sceneWall(ctx, t) {
  if (t < WL || t > TT + .3) return;
  const d = t - WL, cam = wallCam(d), fade = 1 - seg(d, 2.9, 3.6);
  backdrop(ctx, { t });
  ctx.save();
  ctx.translate(W / 2, H / 2); ctx.rotate(cam.roll); ctx.translate(-W / 2, -H / 2);
  const list = [];
  for (const sl of SLOTS) {
    const k = sl.orig ? 1 : easeOut(seg(d, .2 + sl.order * .13, .75 + sl.order * .13));
    if (k <= 0) continue;
    // Copies slide out of the nearer original.
    const ox = sl.lover ? -460 : 460, P = project(cam, lerp(ox, sl.X, k), sl.Y * k, sl.Z * k);
    if (P) list.push({ sl, P, k });
  }
  list.sort((a, b) => b.P.z - a.P.z);
  for (const { sl, P, k } of list) {
    if (P.x < -P.k * 600 || P.x > W + P.k * 600 || P.y < -P.k * 700 || P.y > H + P.k * 700) continue;
    const fog = clamp(1.3 - P.z / 8000) * seg(P.z, 60, 500);
    ctx.save();
    ctx.translate(P.x, P.y); ctx.scale(P.k, P.k);
    // Every window pulls back through its history (older messages come down from the top), faster and faster.
    const v = sl.orig ? 500 : 1300 + hash(sl.i) * 900, run = Math.max(0, d - .5);
    let items, y0;
    if (sl.orig) {
      // Same picture as the split screen at first: tonight's chat where it was, the history waiting above it.
      const base = sl.lover ? LOVE_TONIGHT : FRIEND, pre = sl.lover ? WALL_LOVE : WALL_FRIEND;
      items = sl.lover ? ORIG_LOVE : ORIG_FRIEND;
      y0 = panelLiveY(ctx, base, 99) - chatHeight(ctx, pre, 99) + v * run * run;
    } else {
      items = sl.lover ? WALL_LOVE : WALL_FRIEND;
      const Hh = chatHeight(ctx, items, 99);
      y0 = -Hh + 900 + hash(sl.i + 40) * Hh * .2 + v * run * run;
    }
    panel(ctx, { t: 99, cx: 0, cy: 0, name: sl.lover ? '小 鹿' : '老 周', items, y0,
      frame: sl.orig ? seg(d, .05, .6) : 1, a: fog * (sl.orig ? 1 : seg(k, 0, .4)) * fade, fade: 80 });
    ctx.restore();
  }
  ctx.restore();
  for (let j = 0; j < 240; j++) {
    const t0 = WL + 1.9 + hash(j) * 1.5, q = seg(t, t0, t0 + 1.3);
    if (q <= 0 || q >= 1) continue;
    const sl = SLOTS[Math.floor(hash(j + 9) * 50)];
    const P = project(wallCam(t0 - WL), sl.X + (hash(j + 1) - .5) * 600, sl.Y + (hash(j + 2) - .5) * 800, sl.Z);
    if (!P) continue;
    const e = easeIn(q), x = P.x + (P.x - W / 2) * e * 1.6, y = P.y + (P.y - H / 2) * e * 1.6;
    looseBubble(ctx, { who: hash(j + 3) < .5 ? 'me' : 'them', text: SHORT[j % SHORT.length] }, x, y, { s: (.4 + P.k) * (1 + e * 3.4), a: seg(q, 0, .12) * (1 - seg(q, .6, 1)) });
  }
}

// ================================================================ TT · title

function sceneTitle(ctx, t) {
  if (t < TT - .3 || t > SE + .4) return;
  const a = seg(t, TT - .3, TT + .3) * (1 - seg(t, SE - .3, SE + .4));
  ctx.save(); ctx.globalAlpha *= a; backdrop(ctx, { t, lift: .6 }); ctx.restore();
  label(ctx, '一 部 关 于 聊 天 记 录 的 短 片', { t, t0: TT + .3, out: SE - .5, x: W / 2, y: 410, size: 16, align: 'center', spacing: 3 });
  narr(ctx, '留白', { t, t0: TT + .2, out: SE - .5, x: W / 2, y: 590, size: 180, align: 'center', stagger: .35, glow: COL.warm });
  narr(ctx, '为什么最亲的人话越来越少，普通朋友却总有得聊', { t, t0: TT + 1.2, out: SE - .5, x: W / 2, y: 690, size: 28, weight: 400, align: 'center', color: COL.dim, stagger: .025 });
}

// ================================================================ SE · the sea of words

const POOL = [...SHORT, ...SHORT, '今天第一次见你，紧张到把奶茶洒了', '周末去看海吧', '想你', '晚安，明天见', '你猜我在楼下看到了什么',
  '一只橘猫在追自己的尾巴', '今天被组长夸了', '我做了红烧肉，失败了', '下雨了，我去接你', '晚上吃什么', '我下班了', '好累', '你先睡', '记得带伞',
  '到家了吗', '早点睡', '路上小心', '在开会', '晚点说', '新开了一家面包店', '买到了最后一个可颂'];
const BIG = ['嗯', '好的', '晚安', '我知道了', '1', '好'];
const UNSAID = ['其实那天很想被抱一下', '最近有点害怕变老', '想过辞职', '想重新开始弹琴', '对未来有了新的打算', '一首歌听了一百遍', '想去一次冰岛', '不再那么在乎别人的眼光'];
const UNSAID_POS = [[420, 300], [1480, 260], [300, 760], [1600, 720], [960, 880], [1180, 420]];

function seaCamZ(t, t0) {
  let z = -400;
  for (let x = t0; x < t; x += 1 / 60) z += (x < t0 + 5.0 ? lerp(1900, 1200, ease(seg(x, t0, t0 + 5))) : lerp(1200, 0, easeOut(seg(x, t0 + 5.0, t0 + 7.6)))) / 60;
  return z;
}

// Dim stars that keep changing between unsaid sentences. light: { index: t0 } turns one warm and bright.
function unsaidStars(ctx, t, a, light = {}, texts = UNSAID) {
  if (a <= 0) return;
  ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  UNSAID_POS.forEach(([x, y], i) => {
    const lt = light[i] !== undefined ? ease(seg(t, light[i], light[i] + 1.4)) : 0;
    const txt = lt > .3 && light.text?.[i] ? light.text[i] : starText(i * 17 + 5, t * .8, texts, texts, null).text;
    ctx.globalAlpha = a * (.55 + .45 * lt) * (.85 + .15 * Math.sin(t * 1.3 + i));
    ctx.font = `400 ${26 + 14 * lt}px ${SERIF}`;
    ctx.shadowColor = lt ? 'rgba(243,217,166,.8)' : 'rgba(237,232,228,.3)'; ctx.shadowBlur = 10 + 30 * lt;
    ctx.fillStyle = lt ? COL.warm : '#b9b4ae';
    ctx.fillText(txt, x + Math.sin(t * .2 + i) * 12, y + Math.cos(t * .17 + i) * 8);
  });
  ctx.restore();
}

function sceneSea(ctx, t) {
  if (t < SE - .7 || t > Z + .4) return;
  const s = t - SE, a = seg(s, -.7, .5) * (1 - seg(t, Z - .4, Z + .3));
  ctx.save(); ctx.globalAlpha *= a;
  backdrop(ctx, { t, stars: .6, lift: .4 });
  const cam = { x: -380 * s - 140 * Math.sin(s * .7), y: -260 * s, z: seaCamZ(t, SE) };
  const hole = { x: W / 2, y: 560, r: 600, k: (seg(s, .6, 1.2) * (1 - seg(s, 5.4, 6.0)) + seg(s, 7.0, 7.6)) };
  sea3d(ctx, { t, cam, pool: POOL, big: BIG, collapse: { t0: SE + 5.6, to: SHORT }, a: 1 - seg(s, 9.6, 10.8), hole });
  ctx.restore();
  NC(ctx, t, '四年，十几万句话。', SE + .8, SE + 5.2, 500, { size: 66, halo: true });
  NC(ctx, t, '它们没有消失，', SE + 2.2, SE + 5.2, 600, { size: 40, color: COL.dim, halo: true });
  NC(ctx, t, '只是一层一层，沉在了这里。', SE + 3.1, SE + 5.2, 662, { size: 40, color: COL.dim, halo: true });
  NC(ctx, t, '到后来，说得最多的，', SE + 6.6, SE + 9.8, 470, { color: COL.dim, halo: true });
  NC(ctx, t, '嗯。好的。知道了。', SE + 7.6, SE + 9.8, 610, { size: 96, stagger: .2, tail: .45, halo: true });
}


// ================================================================ the explainer: charts and moving type

const S1 = Z + 9.0, S2 = Z + 10.4, S3 = Z + 25.0, S4 = Z + 30.0, S5 = Z + 41.0;   // flip, Gottman, formula, time, Granovetter
const F2 = Z + 52.0, F3 = Z + 66.0, CB = Z + 82.0, AD = Z + 92.0, EN = Z + 105.0, ED = EN + 11.5, DUR = EN + 17.5;

const P = { bg: '#eceef1', bg2: '#f6f7f9', ink: '#1c1e23', dim: '#878b94', faint: '#c9ccd2', blue: '#3d6cf0', pill: '#25272c' };
const tag = (ctx, t, text, t0, x, y, o = {}) => label(ctx, text, { t, t0, x, y, size: 15, spacing: 2, color: P.dim, ...o });
const count = (t, t0, t1, to, dec = 0) => (to * easeOut(seg(t, t0, t1))).toFixed(dec);
const ink = (ctx, t, text, t0, x, y, o = {}) => narr(ctx, text, { t, t0, x, y, size: 40, color: P.ink, stagger: .045, ...o });

function whiteBackdrop(ctx) {
  const g = ctx.createRadialGradient(W * .5, H * .45, 100, W * .5, H * .5, W * .75);
  g.addColorStop(0, P.bg2); g.addColorStop(1, P.bg);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
function bigNumber(ctx, text, x, y, size, color, a = 1, align = 'left') {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  ctx.font = `400 ${size}px ${SERIF}`; ctx.fillStyle = color; ctx.textBaseline = 'alphabetic'; ctx.textAlign = align;
  ctx.fillText(text, x, y);
  ctx.restore();
}
function bracket(ctx, x0, x1, y, k, color, down = true) {
  if (k <= 0) return;
  const d = down ? 8 : -8;
  ctx.strokeStyle = color; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x0, y + d); ctx.lineTo(x0, y); ctx.lineTo(lerp(x0, x1, k), y); if (k > .98) ctx.lineTo(x1, y + d); ctx.stroke();
}

// ---------------------------------------------------------------- blocks (dark): what the messages carried

// One block = 10 messages. Lovers: 4200 blocks over 1460 days; the share that only “keeps in touch” grows.
const LB = { x: 880, y: 560, cols: 140, rows: 30, cell: 6.4 };
const FB = { x: 880, y: 380, n: 19 };
const maintainShare = day => clamp(.15 + .8 * (day / 1460) ** .7, 0, .96);

function sceneBlocks(ctx, t) {
  const l = t - Z;
  // The brush-offs of the sea fall and settle into the lovers' band.
  for (let i = 0; i < 260; i++) {
    const t0 = Z - 1.2 + hash(i) * .8, k = seg(t, t0, t0 + 1.3);
    if (k <= 0 || k >= 1) continue;
    const c = Math.floor(hash(i + 3) * LB.cols), r = Math.floor(hash(i + 5) * LB.rows);
    const sx = hash(i + 7) * W, sy = hash(i + 9) * H * .7, e = easeInOut(k);
    ctx.globalAlpha = (1 - seg(k, .85, 1)) * .9; ctx.fillStyle = hash(i) < .6 ? P.blue : COL.ink;
    const sz = lerp(10, LB.cell - 1.4, e);
    ctx.fillRect(lerp(sx, LB.x + c * LB.cell, e), lerp(sy, LB.y + r * LB.cell, e), sz, sz);
  }
  ctx.globalAlpha = 1;
  label(ctx, '老 朋 友', { t: l, t0: .4, x: FB.x, y: FB.y - 22, size: 16, color: COL.ink, spacing: 3 });
  label(ctx, `1 个 晚 上  ·  ${count(l, .6, 2.2, 186)} 条`, { t: l, t0: .6, x: FB.x + 110, y: FB.y - 22, size: 15, color: COL.dim, spacing: 1.5 });
  label(ctx, '恋 人', { t: l, t0: .8, x: LB.x, y: LB.y - 22, size: 16, color: COL.ink, spacing: 3 });
  label(ctx, `1460 天  ·  约 ${Number(count(l, 1.0, 3.2, 42000)).toLocaleString('en-US')} 条`, { t: l, t0: 1.0, x: LB.x + 90, y: LB.y - 22, size: 15, color: COL.dim, spacing: 1.5 });
  label(ctx, '每 格 = 10 条 消 息  ·  片 中 示 例', { t: l, t0: 1.4, x: LB.x + LB.cols * LB.cell, y: LB.y + LB.rows * LB.cell + 70, size: 13, color: COL.faint, align: 'right' });
  for (let i = 0; i < FB.n; i++) {
    const k = seg(l, .6 + i * .05, .9 + i * .05); if (k <= 0) continue;
    ctx.globalAlpha = k; ctx.fillStyle = COL.ink;
    ctx.fillRect(FB.x + i * LB.cell, FB.y, LB.cell - 1.4, LB.cell - 1.4);
  }
  const sweep = seg(l, 3.6, 7.0);
  for (let c = 0; c < LB.cols; c++) {
    const day = (c + .5) / LB.cols * 1460, show = seg(l, 1.0 + c * .016, 1.3 + c * .016);
    if (show <= 0) continue;
    const coloured = sweep * LB.cols > c;
    for (let r = 0; r < LB.rows; r++) {
      const isMaint = hash(c * 31 + r * 7) < maintainShare(day);
      ctx.globalAlpha = show * (coloured ? 1 : .55);
      ctx.fillStyle = coloured && isMaint ? P.blue : COL.ink;
      ctx.fillRect(LB.x + c * LB.cell, LB.y + r * LB.cell, LB.cell - 1.4, LB.cell - 1.4);
    }
  }
  ctx.globalAlpha = 1;
  const lk = seg(l, 3.8, 7.0);
  if (lk > 0) {
    ctx.save(); ctx.strokeStyle = COL.ink; ctx.lineWidth = 2; ctx.beginPath();
    for (let c = 0; c <= LB.cols * lk; c++) {
      const v = 1 - maintainShare(c / LB.cols * 1460), x = LB.x + c * LB.cell, y = LB.y - 20 - 90 * v;
      c ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke(); ctx.restore();
    label(ctx, '带 新 内 容 的 消 息 占 比', { t: l, t0: 4.0, x: LB.x, y: LB.y - 118, size: 13, color: COL.dim });
  }
  const x0 = LB.x + LB.cols * LB.cell * .3, x1 = LB.x + LB.cols * LB.cell, yb = LB.y + LB.rows * LB.cell + 14;
  bracket(ctx, x0, x1, yb, easeOut(seg(l, 6.4, 7.2)), P.blue, false);
  label(ctx, '维 持 联 系', { t: l, t0: 6.8, x: (x0 + x1) / 2, y: yb + 30, size: 16, align: 'center', color: P.blue, spacing: 3 });
  label(ctx, '一 个 常 见 的 解 释 ：', { t: l, t0: 1.6, x: 140, y: 440, size: 18, color: COL.dim });
  narr(ctx, '“到了”“嗯”“晚安”', { t: l, t0: 2.2, x: 136, y: 520, size: 50, stagger: .06 });
  narr(ctx, [['只是在', COL.ink], ['维持联系', P.blue], ['，', COL.ink]], { t: l, t0: 3.4, x: 136, y: 592, size: 50, stagger: .06 });
  narr(ctx, '不算真正的交流。', { t: l, t0: 4.6, x: 136, y: 664, size: 50, stagger: .06 });
  label(ctx, '语 言 学 里 叫 “ 寒 暄 交 流 ”', { t: l, t0: 6.2, x: 140, y: 740, size: 15, color: COL.dim });
  label(ctx, 'phatic communion  ·  Malinowski, 1923', { t: l, t0: 6.5, x: 140, y: 768, size: 14, color: COL.faint, spacing: 1 });
}

// A wave of tiles flips across the frame; each tile changes colour as it turns over.
function flip(ctx, t, t0, t1, from, to, reverse = false) {
  const k = seg(t, t0, t1), cs = 120;
  for (let gx = 0; gx < W / cs; gx++) for (let gy = 0; gy < Math.ceil(H / cs); gy++) {
    const fx = reverse ? 1 - gx / (W / cs) : gx / (W / cs);
    const d = fx * .7 + hash(gx * 13 + gy) * .15, p = seg(k, d, d + .25);
    if (p <= 0) continue;
    const sy = Math.abs(Math.cos(Math.PI * p));
    ctx.fillStyle = p < .5 ? from : to;
    ctx.fillRect(gx * cs, gy * cs + cs / 2 * (1 - sy), cs + 1, cs * sy + 1);
  }
}

// ---------------------------------------------------------------- Gottman

function bidGrid(ctx, t, x0, y0, rate, t0, seed, cols = 10, rows = 10, gx = 50, gy = 30) {
  const n = cols * rows, order = Array.from({ length: n }, (_, i) => i).sort((a, b) => hash(a + seed) - hash(b + seed));
  const rank = new Map(order.map((v, i) => [v, i])), need = Math.round(rate * n / 100);
  for (let i = 0; i < n; i++) {
    const c = i % cols, r = Math.floor(i / cols), x = x0 + c * gx, y = y0 + r * gy;
    const k = easeOut(seg(t, t0 + i * .012, t0 + i * .012 + .3));
    if (k <= 0) continue;
    ctx.save(); ctx.globalAlpha *= k;
    roundRect(ctx, x, y, 34 * k, 12, 6); ctx.fillStyle = P.pill; ctx.fill();
    ctx.restore();
    const rk = rank.get(i), dt = t0 + 1.6 + rk * .028;
    if (rk < need && t > dt) { const p = backOut(seg(t, dt, dt + .25)); ctx.fillStyle = P.blue; ctx.beginPath(); ctx.arc(x + 42, y + 6, 4.2 * p, 0, 7); ctx.fill(); }
  }
}
const caughtAt = (t, t0, rate) => Math.min(rate, Math.max(0, Math.floor((t - t0 - 1.6) / .028) + 1));

function sceneGottman(ctx, t) {
  if (t < S2 || t > S3 + .2) return;
  const out = 1 - seg(t, S3 - .6, S3);
  ctx.save(); ctx.globalAlpha *= out;
  ink(ctx, t, '这只说对了一半。', S2 + .3, 140, 150, { stagger: .07 });
  tag(ctx, t, 'G O T T M A N   ·   新 婚 夫 妻 追 踪 研 究', S2 + 1.2, 142, 212);
  ink(ctx, t, '一方随口“搭话”时，另一方有没有接住——', S2 + 1.5, 140, 268, { size: 34, stagger: .035 });
  ink(ctx, t, '6 年后回访：', S2 + 2.9, 140, 318, { size: 34 });
  ctx.save(); ctx.globalAlpha *= seg(t, S2 + 2.6, S2 + 3.0);
  roundRect(ctx, 1520, 200, 30, 11, 5.5); ctx.fillStyle = P.pill; ctx.fill();
  ctx.fillStyle = P.blue; ctx.beginPath(); ctx.arc(1535, 232, 4, 0, 7); ctx.fill();
  ctx.restore();
  tag(ctx, t, '一 次 搭 话', S2 + 2.7, 1566, 211, { color: P.ink });
  tag(ctx, t, '被 接 住', S2 + 2.8, 1566, 238, { color: P.ink });
  const g0 = S2 + 3.4;
  tag(ctx, t, '仍 在 一 起 的 夫 妻', g0, 142, 395, { color: P.ink, size: 16 });
  tag(ctx, t, '已 经 离 婚 的 夫 妻', g0 + .4, 1002, 395, { color: P.ink, size: 16 });
  bidGrid(ctx, t, 140, 420, 86, g0, 11);
  bidGrid(ctx, t, 1000, 420, 33, g0 + .4, 47);
  bigNumber(ctx, `${caughtAt(t, g0, 86)}%`, 670, 700, 120, P.blue, seg(t, g0 + 1.4, g0 + 1.8));
  bigNumber(ctx, `${caughtAt(t, g0 + .4, 33)}%`, 1530, 700, 120, P.ink, seg(t, g0 + 1.8, g0 + 2.2));
  tag(ctx, t, '的 搭 话 被 接 住', g0 + 1.6, 674, 732, { size: 13 });
  tag(ctx, t, '的 搭 话 被 接 住', g0 + 2.0, 1534, 732, { size: 13 });
  tag(ctx, t, '数 据 ： Gottman 实 验 室 ， 130 对 新 婚 夫 妻 ， 6 年 后 回 访', g0 + 2.6, 142, 1030, { size: 12, color: P.faint, spacing: 1 });
  narr(ctx, [['“废话”没有错，它们是关系的', P.ink], ['脉搏', P.blue], ['。', P.ink]], { t, t0: S2 + 8.4, x: 140, y: 860, size: 40, stagger: .05 });
  ctx.restore();
  const k = seg(t, S2 + 11.2, S2 + 11.6);
  if (k > 0) {
    ctx.save(); ctx.globalAlpha *= k * out; whiteBackdrop(ctx); ctx.restore();
    narr(ctx, '所以问题不在“废话”太多，', { t, t0: S2 + 11.6, out: S3 - .5, x: W / 2, y: 500, size: 52, align: 'center', color: P.ink, stagger: .05 });
    narr(ctx, [['而在——', P.ink], ['新东西太少', P.blue], ['。', P.ink]], { t, t0: S2 + 12.6, out: S3 - .5, x: W / 2, y: 600, size: 52, align: 'center', stagger: .08 });
  }
}

// ---------------------------------------------------------------- the formula, and its three factors

const FACTORS = ['新 信 息', '好 奇 心', '轻 松'];
// Factor levels once each section has been explained: [daily, occasional].
const LEVELS = [[.12, .92], [.25, .85], [.2, .9]];
const FACTOR_DONE = [S5 + 9.5, F3 - 1.5, CB - 1.5];

function formula(ctx, t, t0, y, size, a = 1) {
  const parts = [['话题', P.ink, 0], ['≈', P.dim, .4], ['新信息', P.blue, .8], ['×', P.dim, 1.3], ['好奇心', P.blue, 1.6], ['×', P.dim, 2.1], ['轻松', P.blue, 2.4]];
  ctx.save(); ctx.globalAlpha *= a;
  ctx.font = `500 ${size}px ${SERIF}`; ctx.textBaseline = 'alphabetic';
  const gap = size * .45, widths = parts.map(([s]) => ctx.measureText(s).width), total = widths.reduce((s, w) => s + w, 0) + gap * (parts.length - 1);
  let x = W / 2 - total / 2;
  parts.forEach(([s, c, d], i) => {
    const k = easeOut(seg(t, t0 + d, t0 + d + .5));
    ctx.save(); ctx.globalAlpha *= k; ctx.fillStyle = c; ctx.fillText(s, x, y - (1 - k) * 40); ctx.restore();
    x += widths[i] + gap;
  });
  ctx.restore();
}

function sceneFormula(ctx, t) {
  const a = seg(t, S3, S3 + .3) * (1 - seg(t, S4 - .5, S4));
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  formula(ctx, t, S3 + .3, 470, 76);
  FACTORS.forEach((s, i) => {
    const bx = 560 + i * 300, k = seg(t, S3 + 2.8 + i * .2, S3 + 3.2 + i * .2);
    ctx.save(); ctx.globalAlpha *= k; ctx.strokeStyle = P.faint; ctx.lineWidth = 1.5; roundRect(ctx, bx, 600, 220, 14, 7); ctx.stroke(); ctx.restore();
    tag(ctx, t, s, S3 + 2.8 + i * .2, bx + 110, 650, { align: 'center', color: P.ink, size: 16 });
  });
  ctx.restore();
}

// Small panel in the top-right corner while the three factors are explained: two thin bars per factor.
function factorHud(ctx, t) {
  const a = seg(t, S4 + .2, S4 + .8) * (1 - seg(t, CB - .6, CB - .1));
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  const x = 1440, y = 70;
  tag(ctx, t, '天 天 联 系', 0, x, y + 6, { size: 12, color: P.ink });
  tag(ctx, t, '偶 尔 联 系', 0, x + 170, y + 6, { size: 12, color: P.blue });
  FACTORS.forEach((s, i) => {
    const yy = y + 34 + i * 30, k = easeOut(seg(t, FACTOR_DONE[i], FACTOR_DONE[i] + .8));
    tag(ctx, t, s, 0, x - 20, yy + 9, { size: 12, align: 'right', color: P.ink });
    for (const [j, col] of [[0, P.ink], [1, P.blue]]) {
      const bx = x + j * 170;
      ctx.fillStyle = 'rgba(28,30,35,.08)'; ctx.fillRect(bx, yy, 140, 8);
      ctx.fillStyle = col; ctx.fillRect(bx, yy, 140 * LEVELS[i][j] * k, 8);
    }
  });
  ctx.restore();
}

// ---------------------------------------------------------------- factor 1: new information needs time

const AX = { x0: 220, x1: 1700, y0: 860, y1: 400, days: 90, max: 36 };
const ramp = d => 60 * (1 - Math.exp(-d / 120));
const daily = d => (d % 1) * 2.6;   // a day's worth of news, exaggerated so the teeth are visible

function sceneArea(ctx, t) {
  const a = seg(t, S4, S4 + .4) * (1 - seg(t, S5 - .6, S5));
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  const X = d => AX.x0 + (AX.x1 - AX.x0) * d / AX.days, Y = v => AX.y0 - (AX.y0 - AX.y1) * v / AX.max;
  tag(ctx, t, '因 素 一  ·  新 信 息', S4 + .1, 142, 92, { color: P.blue });
  const ax = easeOut(seg(t, S4 + .2, S4 + .9));
  ctx.strokeStyle = P.ink; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(AX.x0, AX.y0); ctx.lineTo(lerp(AX.x0, AX.x1, ax), AX.y0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(AX.x0, AX.y0); ctx.lineTo(AX.x0, lerp(AX.y0, AX.y1 - 30, ax)); ctx.stroke();
  [0, 30, 60, 90].forEach((d, i) => tag(ctx, t, String(d), S4 + .5 + i * .1, X(d), AX.y0 + 34, { align: 'center', color: P.ink, size: 15 }));
  tag(ctx, t, '距 离 上 次 聊 天 的 天 数', S4 + .8, AX.x1, AX.y0 + 72, { align: 'right' });
  tag(ctx, t, '可 以 分 享 的 新 鲜 事', S4 + .8, AX.x0 - 6, AX.y1 - 48);
  tag(ctx, t, '示 意', S4 + .8, AX.x1, AX.y1 - 48, { align: 'right', color: P.faint });
  const reveal = easeInOut(seg(t, S4 + 1.2, S4 + 5.2)) * AX.days;
  if (reveal > 0) {
    ctx.beginPath(); ctx.moveTo(X(0), Y(0));
    for (let d = 0; d <= reveal; d += .5) ctx.lineTo(X(d), Y(ramp(d)));
    ctx.lineTo(X(reveal), Y(0)); ctx.closePath(); ctx.fillStyle = 'rgba(61,108,240,.12)'; ctx.fill();
    ctx.beginPath(); for (let d = 0; d <= reveal; d += .5) d ? ctx.lineTo(X(d), Y(ramp(d))) : ctx.moveTo(X(d), Y(ramp(d)));
    ctx.strokeStyle = P.blue; ctx.lineWidth = 3; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(X(0), Y(0));
    for (let d = 0; d <= reveal; d += .05) ctx.lineTo(X(d), Y(daily(d)));
    ctx.strokeStyle = P.ink; ctx.lineWidth = 1.6; ctx.stroke();
  }
  if (t > S4 + 4.6) {
    ctx.save(); ctx.globalAlpha *= seg(t, S4 + 4.6, S4 + 5.0);
    ctx.strokeStyle = P.ink; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X(40), Y(0) - 14); ctx.lineTo(X(40) + 40, Y(0) - 70); ctx.stroke();
    ctx.restore();
    tag(ctx, t, '天 天 联 系 ： 每 次 聊 天 都 清 零', S4 + 4.6, X(40) + 48, Y(0) - 76, { color: P.ink, size: 16 });
  }
  if (t > S4 + 5.2) {
    ctx.save(); ctx.globalAlpha *= seg(t, S4 + 5.2, S4 + 5.6);
    ctx.fillStyle = P.blue; ctx.beginPath(); ctx.arc(X(90), Y(ramp(90)), 6, 0, 7); ctx.fill();
    ctx.restore();
    tag(ctx, t, '三 个 月 联 系 一 次', S4 + 5.2, X(90) - 12, Y(ramp(90)) - 26, { color: P.blue, size: 16, align: 'right' });
  }
  ink(ctx, t, '天天聊，新鲜事刚冒出来，就说完了；', S4 + 1.6, 140, 170);
  narr(ctx, [['隔一段时间，零碎的小事，才', P.ink], ['攒成一个故事', P.blue], ['。', P.ink]], { t, t0: S4 + 5.4, x: 140, y: 235, size: 40, stagger: .045 });
  ctx.restore();
}

function sceneBars(ctx, t) {
  const a = seg(t, S5, S5 + .4) * (1 - seg(t, F2 - .6, F2));
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  tag(ctx, t, 'G R A N O V E T T E R   ·   1 9 7 3   ·   找 到 新 工 作 的 人', S5 + .2, 142, 130);
  ink(ctx, t, '那条关键的消息，是谁告诉你的？', S5 + .5, 140, 200, { size: 44, stagger: .05 });
  const bars = [['经 常 见 面', '每 周 至 少 两 次', 16.7, P.ink], ['偶 尔 见 面', '一 年 一 次 以 上', 55.6, P.blue], ['很 少 见 面', '一 年 一 次 或 更 少', 27.8, P.blue]];
  const base = 860, hmax = 460, bw = 220;
  bars.forEach(([name, sub, v, c], i) => {
    const x = 480 + i * 400, t0 = S5 + 1.6 + i * .35, k = easeOut(seg(t, t0, t0 + 1.0)), h = hmax * v / 60 * k;
    ctx.fillStyle = c; ctx.fillRect(x, base - h, bw, h);
    if (k > 0) bigNumber(ctx, `${(v * k).toFixed(1)}%`, x, base - h - 20, 64, c);
    tag(ctx, t, name, t0, x + bw / 2, base + 40, { align: 'center', color: P.ink, size: 18 });
    tag(ctx, t, sub, t0, x + bw / 2, base + 68, { align: 'center', size: 13 });
  });
  ctx.fillStyle = P.ink; ctx.fillRect(420, base, 1160 * easeOut(seg(t, S5 + 1.2, S5 + 1.8)), 1.5);
  const bk = easeOut(seg(t, S5 + 4.0, S5 + 4.8)), x0 = 880, x1 = 1300 + bw, yb = base - hmax * 55.6 / 60 - 120;
  bracket(ctx, x0, x1, yb, bk, P.blue);
  bigNumber(ctx, '84%', (x0 + x1) / 2 - 90, yb - 24, 80, P.blue, seg(t, S5 + 4.6, S5 + 5.0));
  tag(ctx, t, '来 自 不 常 见 面 的 人', S5 + 4.9, (x0 + x1) / 2 + 110, yb - 40, { color: P.blue, size: 16 });
  tag(ctx, t, '基 数 ： 通 过 熟 人 找 到 工 作 的 54 人', S5 + 3.0, 1780, 1036, { size: 12, color: P.faint, spacing: 1, align: 'right' });
  narr(ctx, '另一项研究发现：重新联系多年没联系的旧识，得到的信息比现有联系人更新颖。', { t, t0: S5 + 6.2, x: 140, y: 1000, size: 26, color: P.dim, stagger: .02 });
  tag(ctx, t, 'Levin, Walter & Murnighan, 2011', S5 + 7.4, 142, 1036, { size: 13, spacing: 1, color: P.faint });
  ctx.restore();
}

// ---------------------------------------------------------------- factor 2: curiosity — closeness makes us assume

function sceneCuriosity(ctx, t) {
  const a = seg(t, F2, F2 + .4) * (1 - seg(t, F3 - .6, F3));
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  tag(ctx, t, '因 素 二  ·  好 奇 心', F2 + .1, 142, 92, { color: P.blue });
  ink(ctx, t, '越亲近，越容易觉得——', F2 + .4, 140, 170);
  narr(ctx, [['“', P.ink], ['不用说你也懂', P.blue], ['”。', P.ink]], { t, t0: F2 + 1.4, x: 140, y: 240, size: 56, stagger: .08 });
  tag(ctx, t, 'S A V I T S K Y   等   ·   2 0 1 1   ·   亲 密 沟 通 偏 差', F2 + 2.4, 142, 320);
  ink(ctx, t, '实验：用一句有歧义的话，分别向配偶和陌生人传达一个特定的意思。', F2 + 2.8, 140, 372, { size: 26, color: P.dim, stagger: .02 });
  // Two groups of bars: expected vs actual understanding.
  const base = 880, hmax = 380, bw = 150;
  const groups = [['以 为 对 方 能 懂', 640, [[.9, P.blue, '配 偶'], [.55, P.faint, '陌 生 人']], F2 + 4.2], ['实 际 听 懂', 1220, [[.55, P.blue, '配 偶'], [.55, P.faint, '陌 生 人']], F2 + 5.6]];
  groups.forEach(([name, gx, bars, t0]) => {
    bars.forEach(([v, c, who], j) => {
      const x = gx + j * (bw + 30), k = easeOut(seg(t, t0 + j * .25, t0 + j * .25 + .9)), h = hmax * v * k;
      ctx.fillStyle = c; ctx.fillRect(x, base - h, bw, h);
      tag(ctx, t, who, t0 + j * .25, x + bw / 2, base + 32, { align: 'center', size: 14, color: P.ink });
    });
    tag(ctx, t, name, t0, gx + bw + 15, base + 72, { align: 'center', size: 17, color: P.ink });
  });
  ctx.fillStyle = P.ink; ctx.fillRect(560, base, 1000 * easeOut(seg(t, F2 + 3.8, F2 + 4.4)), 1.5);
  // The gap: how much closeness inflates the expectation.
  const gk = easeOut(seg(t, F2 + 7.0, F2 + 7.8));
  if (gk > 0) {
    const ya = base - hmax * .9, yb = base - hmax * .55, xa = 640 + bw / 2, xb = 1220 + bw / 2;
    ctx.save(); ctx.setLineDash([6, 6]); ctx.strokeStyle = P.blue; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(xa, ya); ctx.lineTo(lerp(xa, xb, gk), ya); ctx.stroke(); ctx.setLineDash([]);
    if (gk > .95) {
      ctx.beginPath(); ctx.moveTo(xb, ya); ctx.lineTo(xb, yb - 6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(xb - 7, yb - 14); ctx.lineTo(xb, yb - 4); ctx.lineTo(xb + 7, yb - 14); ctx.stroke();
    }
    ctx.restore();
    tag(ctx, t, '高 估', F2 + 7.6, xb + 22, (ya + yb) / 2 + 6, { color: P.blue, size: 18 });
  }
  tag(ctx, t, '示 意 ： 柱 高 只 表 示 结 论 。 原 文 ： 对 配 偶 和 对 陌 生 人 的 实 际 准 确 率 ， 统 计 上 没 有 差 别', F2 + 6.4, 1780, 1036, { size: 12, color: P.faint, spacing: 1, align: 'right' });
  ink(ctx, t, '天天在一起，我们停止了追问，', F2 + 8.6, 140, 980, { size: 36 });
  narr(ctx, [['因为', P.ink], ['以为自己都知道', P.blue], ['。', P.ink]], { t, t0: F2 + 10.0, x: 660, y: 980, size: 36, stagger: .05 });
  ctx.restore();
}

// ---------------------------------------------------------------- factor 3: ease — expectation vs surprise

function sceneEase(ctx, t) {
  const a = seg(t, F3, F3 + .4) * (1 - seg(t, CB - .6, CB));
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  tag(ctx, t, '因 素 三  ·  轻 松', F3 + .1, 142, 92, { color: P.blue });
  ink(ctx, t, '亲密关系里，每句话都带着期待。', F3 + .4, 140, 170);
  // Left: two timelines (story numbers).
  tag(ctx, t, '等 待 回 复 的 时 间  ·  片 中 示 例', F3 + 1.4, 142, 300);
  const L = { x0: 140, x1: 860 };
  const rows = [['恋 人', 420, F3 + 1.8], ['普 通 朋 友', 700, F3 + 6.8]];
  rows.forEach(([name, y, t0]) => {
    const k = easeOut(seg(t, t0, t0 + .8));
    tag(ctx, t, name, t0, L.x0, y - 40, { color: P.ink, size: 16 });
    ctx.fillStyle = P.ink; ctx.fillRect(L.x0, y, (L.x1 - L.x0) * k, 1.5);
    ctx.save(); ctx.globalAlpha *= k; roundRect(ctx, L.x0 - 6, y - 6, 34, 12, 6); ctx.fillStyle = P.pill; ctx.fill(); ctx.restore();
  });
  // Lovers: the clock runs, and the follow-ups pile up.
  const run = seg(t, F3 + 2.4, F3 + 5.8), secs = Math.floor(easeIn(run) * (47 * 60 + 12));
  if (run > 0) {
    const mx = lerp(L.x0 + 60, L.x1, run);
    ctx.fillStyle = P.blue; ctx.fillRect(L.x0 + 40, 419, mx - L.x0 - 40, 3);
    bigNumber(ctx, `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`, L.x1, 395, 64, P.blue, 1, 'right');
    [['？', .3], ['怎么不回', .55], ['已读不回是吧', .8]].forEach(([s, p], i) => {
      if (run < p) return;
      const k = backOut(seg(t, F3 + 2.4 + p * 3.4, F3 + 2.7 + p * 3.4));
      const x = lerp(L.x0 + 60, L.x1, p);
      ctx.save(); ctx.globalAlpha *= clamp(k); ctx.font = `400 22px ${SANS}`;
      const w = ctx.measureText(s).width + 26;
      roundRect(ctx, x - w / 2, 440 + i * 6, w, 36, 6); ctx.fillStyle = P.pill; ctx.fill();
      ctx.fillStyle = '#e8e8ea'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s, x, 459 + i * 6);
      ctx.restore();
    });
  }
  // Friends: a long, calm line; two days later, “没事！”.
  const fk = seg(t, F3 + 7.4, F3 + 8.6);
  if (fk > 0) {
    bigNumber(ctx, '2 天', L.x1, 675, 64, P.ink, fk, 'right');
    const k = backOut(seg(t, F3 + 8.4, F3 + 8.8));
    ctx.save(); ctx.globalAlpha *= clamp(k); ctx.font = `400 22px ${SANS}`;
    roundRect(ctx, L.x1 - 96, 720, 96, 36, 6); ctx.fillStyle = P.blue; ctx.fill();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('没事！', L.x1 - 48, 739);
    ctx.restore();
  }
  // Right: Liu et al. — reaching out is appreciated more than we think.
  ctx.fillStyle = P.faint; ctx.fillRect(1000, 280, 1, 560 * seg(t, F3 + 1.0, F3 + 1.6));
  tag(ctx, t, 'L I U   等   ·   2 0 2 2   ·   1 3 个 实 验 ， 近 6 0 0 0 人', F3 + 3.0, 1080, 300);
  ink(ctx, t, '偶尔主动联系一个人，对方有多高兴？', F3 + 3.4, 1080, 360, { size: 28, stagger: .03 });
  const base = 760, bw = 160;
  [['你 以 为', .5, P.faint, F3 + 4.6], ['实 际 上', .82, P.blue, F3 + 5.2]].forEach(([s, v, c, t0], j) => {
    const x = 1140 + j * 230, h = 300 * v * easeOut(seg(t, t0, t0 + .9));
    ctx.fillStyle = c; ctx.fillRect(x, base - h, bw, h);
    tag(ctx, t, s, t0, x + bw / 2, base + 32, { align: 'center', size: 15, color: P.ink });
  });
  const gk = seg(t, F3 + 6.2, F3 + 6.8);
  if (gk > 0) {
    const xg = 1140 + 230 + bw + 26, ya = base - 300 * .82, yb = base - 300 * .5;
    ctx.save(); ctx.globalAlpha *= gk; ctx.strokeStyle = P.blue; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(xg, ya); ctx.lineTo(xg + 10, ya); ctx.lineTo(xg + 10, yb); ctx.lineTo(xg, yb); ctx.stroke(); ctx.restore();
    tag(ctx, t, '被 低 估', F3 + 6.4, xg + 22, (ya + yb) / 2 + 6, { color: P.blue, size: 16 });
  }
  tag(ctx, t, '越 久 没 联 系 、 关 系 越 远 ， 低 估 得 越 多', F3 + 7.4, 1080, 830, { color: P.ink, size: 16 });
  tag(ctx, t, '示 意 ： 只 表 示 方 向 和 差 距', F3 + 7.6, 1780, 1036, { size: 12, color: P.faint, spacing: 1, align: 'right' });
  narr(ctx, [['普通朋友之间没有这本账，偶尔联系，每句话都是', P.ink], ['惊喜', P.blue], ['。', P.ink]], { t, t0: F3 + 10.4, x: 140, y: 980, size: 36, stagger: .04 });
  ctx.restore();
}

// ---------------------------------------------------------------- together, and what to do

function sceneTogether(ctx, t) {
  const a = seg(t, CB, CB + .4) * (1 - seg(t, AD - .6, AD));
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  formula(ctx, t, CB + .1, 220, 56);
  const rows = [['天 天 联 系', 0, P.ink, 430], ['偶 尔 联 系', 1, P.blue, 650]];
  rows.forEach(([name, j, col, y], ri) => {
    const t0 = CB + 1.4 + ri * 1.4;
    tag(ctx, t, name, t0, 300, y + 12, { color: col, size: 20, align: 'right' });
    FACTORS.forEach((f, i) => {
      const x = 360 + i * 300, k = easeOut(seg(t, t0 + i * .2, t0 + i * .2 + .7));
      ctx.fillStyle = 'rgba(28,30,35,.08)'; ctx.fillRect(x, y, 240, 22);
      ctx.fillStyle = col; ctx.fillRect(x, y, 240 * LEVELS[i][j] * k, 22);
      if (ri === 0) tag(ctx, t, f, CB + 1.2, x + 120, 380, { align: 'center', size: 15, color: P.ink });
      if (i < 2) tag(ctx, t, '×', t0 + .6, x + 270, y + 18, { align: 'center', size: 20, color: P.dim });
    });
    // The product: a circle whose area is the result.
    const prod = LEVELS.reduce((p, l) => p * l[j], 1), k = easeOut(seg(t, t0 + 1.0, t0 + 1.8));
    tag(ctx, t, '=', t0 + 1.0, 1290, y + 18, { align: 'center', size: 22, color: P.dim });
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(1420, y + 11, Math.max(3, Math.sqrt(prod) * 120) * k, 0, 7); ctx.fill();
  });
  tag(ctx, t, '话 题', CB + 1.2, 1420, 380, { align: 'center', size: 15, color: P.ink });
  tag(ctx, t, '示 意', CB + 1.2, 1780, 1036, { size: 12, color: P.faint, align: 'right' });
  ink(ctx, t, '话少，不是因为不爱了，', CB + 4.8, 140, 900, { size: 46 });
  narr(ctx, [['是因为', P.ink], ['没有留白', P.blue], ['。', P.ink]], { t, t0: CB + 6.2, x: 140, y: 980, size: 46, stagger: .07 });
  ctx.restore();
}

function sceneAdvice(ctx, t) {
  const a = seg(t, AD, AD + .4) * (1 - seg(t, EN - 1.9, EN - 1.5));
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  tag(ctx, t, '那 么 ，', AD + .2, 142, 200, { size: 18, color: P.ink });
  const items = [
    [['接住每一句“废话”', P.blue], ['——那是关系的脉搏。', P.ink]],
    [['偶尔问一个真问题', P.blue], ['，而不是“吃了吗”。', P.ink]],
    [['给彼此留一点白', P.blue], ['，让新鲜事有时间长出来。', P.ink]],
  ];
  items.forEach((parts, i) => {
    const y = 360 + i * 200, t0 = AD + .8 + i * 2.6;
    bigNumber(ctx, String(i + 1), 140, y + 8, 64, P.faint, seg(t, t0 - .2, t0 + .2));
    narr(ctx, parts, { t, t0, x: 220, y, size: 46, stagger: .05 });
    // A tiny echo of the chart behind each point, on the right.
    const k = seg(t, t0 + .8, t0 + 1.6), x = 1380;
    ctx.save(); ctx.globalAlpha *= k;
    if (i === 0) { for (let j = 0; j < 7; j++) { roundRect(ctx, x + j * 46, y - 22, 30, 11, 5.5); ctx.fillStyle = P.pill; ctx.fill(); if (j !== 3) { ctx.fillStyle = P.blue; ctx.beginPath(); ctx.arc(x + j * 46 + 37, y - 16, 4, 0, 7); ctx.fill(); } } }
    if (i === 1) { ctx.strokeStyle = P.blue; ctx.lineWidth = 3; ctx.beginPath(); for (let d = 0; d <= 1; d += .02) { const px = x + d * 320, py = y - 10 - 60 * (1 - Math.exp(-d * 2)) * k; d ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke(); }
    if (i === 2) {
      ctx.strokeStyle = P.ink; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y);
      for (let d = 0; d <= 8; d += .05) ctx.lineTo(x + d * 18, y - (d % 1) * 12); ctx.stroke();
      ctx.strokeStyle = P.blue; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 150, y); ctx.quadraticCurveTo(x + 260, y - 10, x + 320, y - 70 * k); ctx.stroke();
    }
    ctx.restore();
  });
  ctx.restore();
}

// ---------------------------------------------------------------- the ending (black again)

const ASK = (() => {
  const m = [[1.0, 'me', '最近在想什么？'],
    [6.6, 'them', '其实，我最近想重新开始弹琴。小时候学了六年，后来觉得没用就放下了。前几天路过琴行，在门口站了好久。'],
    [8.2, 'me', '你弹给我听'], [8.9, 'them', '好']];
  return liveItems({ date: '2026年10月19日  22:30' }, m.map(([at, w, x]) => [EN + at, w, x]));
})();
const ASK_TYPING = [[1.8, 3.0], [3.6, 4.4], [5.0, 6.6], [8.5, 8.9]].map(([a, b]) => [EN + a, EN + b]);

function sceneEnding(ctx, t) {
  if (t < EN - .1) return;
  const k = 1 - seg(t, ED - .5, ED);
  if (k > 0) {
    ctx.save(); ctx.globalAlpha *= k;
    backdrop(ctx, { t, cx: W * .3 });
    ctx.fillStyle = COL.line; ctx.fillRect(940, 140, 1, 800);
    const m = MIN(22, 30) + Math.floor(6 * easeIn(seg(t, EN + 1.0, EN + 6.6)));
    dash(ctx, { a: seg(t, EN, EN + .5), date: '2026 . 10 . 19', big: hhmm(m), rows: ['在 一 起 第  1461  天', `今 日 消 息  ${ASK.filter(x => x.at && x.at <= t).length}`] });
    panel(ctx, { t, cx: 1400, cy: 560, name: '小 鹿', items: ASK, typing: ASK_TYPING, a: seg(t, EN, EN + .5) });
    NL(ctx, t, '第一千四百六十一天，', EN + .6, EN + 5.4, 700);
    NL(ctx, t, '我问了一个真正的问题。', EN + 1.5, EN + 5.4, 762);
    NL(ctx, t, '原来她一直有话想说，', EN + 7.2, ED - .6, 700);
    NL(ctx, t, '只是我很久没有问了。', EN + 8.2, ED - .6, 762, { color: COL.warm });
    ctx.restore();
  }
  if (t >= ED - .3) {
    ctx.save(); ctx.globalAlpha *= seg(t, ED - .3, ED + .4); backdrop(ctx, { t, lift: .6 }); ctx.restore();
    narr(ctx, '留白', { t, t0: ED + .3, x: W / 2, y: 560, size: 180, align: 'center', stagger: .35, glow: COL.warm });
    narr(ctx, '最亲的人，也需要一点“好久不见”。', { t, t0: ED + 1.6, x: W / 2, y: 680, size: 32, weight: 400, align: 'center', color: COL.dim, stagger: .04 });
  }
}

// ================================================================ frame

const WHITE_FROM = S1 + .7, WHITE_TO = EN - 1.0;   // when the frame is mostly white (for the vignette)

function drawFrame(ctx, t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
  const white = t >= S2 && t < EN - 1.5;
  if (white) whiteBackdrop(ctx); else { ctx.fillStyle = COL.bg0; ctx.fillRect(0, 0, W, H); }
  if (t < Z) {
    if (t < A2 + .1) sceneLovers(ctx, t);
    sceneFriend(ctx, t);
    sceneWall(ctx, t);
    sceneTitle(ctx, t);
  }
  sceneSea(ctx, t);
  if (t >= Z - 1.3 && t < S2) {
    if (t >= Z - .3) { ctx.save(); ctx.globalAlpha = seg(t, Z - .3, Z + .3); backdrop(ctx, { t, lift: .5 }); ctx.restore(); }
    sceneBlocks(ctx, t);
  }
  if (t >= S1 && t < S2) flip(ctx, t, S1, S2, '#15161a', P.bg);
  if (white) {
    sceneGottman(ctx, t); sceneFormula(ctx, t); sceneArea(ctx, t); sceneBars(ctx, t);
    sceneCuriosity(ctx, t); sceneEase(ctx, t); sceneTogether(ctx, t); sceneAdvice(ctx, t);
    factorHud(ctx, t);
  }
  if (t >= EN - 1.5 && t < EN) flip(ctx, t, EN - 1.5, EN - .1, P.bg, '#060709', true);
  sceneEnding(ctx, t);
  const black = 1 - seg(t, 0, .6) + seg(t, DUR - 1.2, DUR);
  if (black > 0) { ctx.fillStyle = `rgba(0,0,0,${clamp(black)})`; ctx.fillRect(0, 0, W, H); }
  finish(ctx, t, t > WHITE_FROM && t < WHITE_TO ? { vignette: .1 } : {});
}

// ================================================================ sound

const CUES = (() => {
  const c = [];
  const send = list => list.forEach(([at]) => c.push({ t: at, kind: 'send', gain: .9 }));
  send(DAY1); send(LATE); send(FRIEND_MSGS);
  c.push({ t: WL + 1.95, kind: 'boom' }, { t: WL + 2.0, kind: 'shimmer' });
  c.push({ t: TT + .2, kind: 'chord', notes: [146.8, 220, 293.7, 370] });
  c.push({ t: SE - .3, kind: 'swell', dur: 6.0 }, { t: SE + 7.6, kind: 'note', f: 220 });
  c.push({ t: S1, kind: 'whoosh' }, { t: S2 + .3, kind: 'note', f: 523.3 });
  for (const x of [S3 + .3, S4, S5, F2, F3, CB, AD]) c.push({ t: x, kind: 'whoosh' });
  c.push({ t: S5 + 4.6, kind: 'note', f: 659.3 }, { t: CB + 6.2, kind: 'note', f: 523.3 });
  c.push({ t: EN - 1.5, kind: 'whoosh' });
  send(ASK.filter(x => x.at).map(x => [x.at]));
  c.push({ t: ED + .3, kind: 'chord', notes: [130.8, 196, 261.6, 329.6] });
  return c.sort((a, b) => a.t - b.t);
})();

const PAD = [
  [0.3, [110, 164.8, 261.6, 329.6]], [4.3, [98, 146.8, 246.9, 293.7]],
  [T2 + .5, [87.3, 130.8, 220, 261.6]], [T2 + 4.5, [82.4, 123.5, 196, 246.9]],
  [T3 + .3, [87.3, 130.8, 220]], [T3 + 5.3, [82.4, 123.5, 196]],
  [A2 + .4, [98, 146.8, 220]], [B1 + .3, [110, 164.8, 261.6, 329.6]], [B1 + 4.3, [123.5, 185, 293.7]], [B1 + 8.3, [110, 164.8, 277.2]],
  [B2 + .4, [98, 146.8, 246.9]],
  [SE + 6.6, [73.4, 110, 174.6]], [Z + .3, [87.3, 130.8, 220]], [Z + 4.3, [82.4, 123.5, 196]],
  ...Array.from({ length: Math.ceil((EN - S2) / 4) }, (_, i) => [S2 + .2 + i * 4, [[130.8, 196, 261.6, 329.6], [110, 164.8, 261.6, 329.6], [116.5, 174.6, 293.7], [98, 146.8, 246.9, 293.7]][i % 4]]),
  [EN + .3, [98, 146.8, 220]], [EN + 6.6, [110, 164.8, 261.6, 329.6]],
];

const CUT = { dur: DUR, cues: CUES, pad: PAD, drawFrame };
