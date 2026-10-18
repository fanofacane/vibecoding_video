// film.js: 《留白》, the whole film (about 3 minutes). Storyboard: creative_materials/2026-10-18_留白_分镜草案/分镜脚本.md
//
//   A1  0:00  lovers: day 1 live → four years scroll by → day 1460 live, she talks and I answer in a word
//   A2  0:29  an ordinary friend: 127 days of silence → “在吗” → talking till 2 a.m. → same night, 9 vs 186 messages
//   WL  0:54  the two windows copy into 50 in 3-D space; the camera dives in and the messages burst out
//   TT  0:58  title
//   SE  1:02  the sea of words: flight → collapse into brush-offs → only the unsaid remain
//   R1–R4 1:18  four reasons, each: chapter card → animation → closing line
//   A5  2:20  twist (“嗯，灯给你留着”), a real question, the sea lights up again, end card
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
const A1 = 0, A2 = 29.0, WL = 54.0, TT = 57.6, SE = 61.8, R1 = 78.0, RL = 15.5, A5 = R1 + 4 * RL, DUR = A5 + 44.5;

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
  if (t < SE - .7 || t > R1 + .4) return;
  const s = t - SE, a = seg(s, -.7, .5) * (1 - seg(t, R1 - .5, R1 + .3));
  ctx.save(); ctx.globalAlpha *= a;
  backdrop(ctx, { t, stars: .6, lift: .4 });
  const cam = { x: -380 * s - 140 * Math.sin(s * .7), y: -260 * s, z: seaCamZ(t, SE) };
  const hole = { x: W / 2, y: 560, r: 600, k: (seg(s, .6, 1.2) * (1 - seg(s, 5.4, 6.0)) + seg(s, 7.0, 7.6)) };
  sea3d(ctx, { t, cam, pool: POOL, big: BIG, collapse: { t0: SE + 5.6, to: SHORT }, a: 1 - .92 * seg(s, 10.0, 11.4), hole });
  unsaidStars(ctx, t, seg(s, 10.6, 11.8));
  ctx.restore();
  NC(ctx, t, '四年，十几万句话。', SE + .8, SE + 5.2, 500, { size: 66, halo: true });
  NC(ctx, t, '它们没有消失，', SE + 2.2, SE + 5.2, 600, { size: 40, color: COL.dim, halo: true });
  NC(ctx, t, '只是一层一层，沉在了这里。', SE + 3.1, SE + 5.2, 662, { size: 40, color: COL.dim, halo: true });
  NC(ctx, t, '到后来，说得最多的，', SE + 6.6, SE + 9.8, 470, { color: COL.dim, halo: true });
  NC(ctx, t, '嗯。好的。知道了。', SE + 7.6, SE + 9.8, 610, { size: 96, stagger: .2, tail: .45, halo: true });
  NC(ctx, t, '而真正想说的，', SE + 11.6, R1 - .6, 520, { size: 50 });
  NC(ctx, t, '一句也没有发出去。', SE + 12.6, R1 - .6, 600, { size: 50, color: COL.warm });
}

// ================================================================ R1–R4 · four reasons

const chapterAt = n => R1 + n * RL;

function sceneReasons(ctx, t) {
  if (t < R1 - .3 || t > A5 + .4) return;
  const n = clamp(Math.floor((t - R1) / RL), 0, 3), c = t - chapterAt(n);
  const a = seg(t, R1 - .3, R1 + .3) * (1 - seg(t, A5 - .4, A5 + .2));
  ctx.save(); ctx.globalAlpha *= a; backdrop(ctx, { t }); ctx.restore();
  const cards = [
    ['01', '新鲜事，是慢慢长出来的', '天天在一起的人，为什么越聊越少？'],
    ['02', '越亲近，越有“应该”', '为什么跟最亲的人聊天，反而更累？'],
    ['03', '熟悉，让人停止好奇', '以为都知道了，就不再问了'],
    ['04', '距离，制造了话题', '为什么偶尔联系，反而有说不完的话？'],
  ];
  const [num, title, sub] = cards[n], T0 = chapterAt(n);
  chapterCard(ctx, { t, t0: T0 + .2, out: T0 + 2.6, num, title, sub });
  const va = seg(c, 2.9, 3.4) * (1 - seg(c, 12.2, 12.7));
  if (va > 0) { ctx.save(); ctx.globalAlpha *= va; [reason1, reason2, reason3, reason4][n](ctx, t, T0); ctx.restore(); }
  const closings = [['所以，普通朋友见面时，', '手里都捧着一整罐。'], ['恋人之间，每一句话都有分量，', '所以开口越来越难。'],
    ['我不是不在乎，', '我只是，很久没问过了。'], ['重叠得越多，', '能告诉对方的，就越少。']];
  closing(ctx, t, T0 + 12.6, T0 + RL, ...closings[n]);
}

// 01: one cup a day, emptied the same day — versus a jar that fills over three months.
function reason1(ctx, t, T0) {
  ctx.fillStyle = COL.line; ctx.fillRect(960, 200, 1, 640);
  label(ctx, '天 天 聊', { t, t0: T0 + 3.0, x: 480, y: 210, size: 20, align: 'center', color: COL.ink, spacing: 5 });
  label(ctx, '隔 三 个 月 聊 一 次', { t, t0: T0 + 3.0, x: 1440, y: 210, size: 20, align: 'center', color: COL.ink, spacing: 5 });
  dailyCups(ctx, { t, t0: T0 + 3.4, n: 7, x: 150, y: 700, gap: 110, dayDur: .9 });
  storyJar(ctx, { t, t0: T0 + 3.6, t1: T0 + 9.6, cx: 1440, y: 760, items: ['换了工作', '搬了家', '养了只狗', '去了洱海', '学会做饭'], itemsAt: T0 + 8.6 });
  NC(ctx, t, '天天聊，新鲜事刚冒出来，就说完了。', T0 + 3.6, T0 + 7.9, 950, { size: 38 });
  NC(ctx, t, '隔一段时间，零碎的小事，才攒成一个故事。', T0 + 8.1, T0 + 12.3, 950, { size: 38 });
}

// 02: a read message and a clock that keeps running — versus “抱歉刚看到哈哈” two days later.
function reason2(ctx, t, T0) {
  const L = [[3.4, 'them', '在干嘛？'], [5.0, 'them', '？'], [5.8, 'them', '怎么不回'], [6.6, 'them', '已读不回是吧'], [7.3, 'them', '算了'], [7.9, 'me', '刚在开会……'], [8.5, 'them', '嗯']]
    .map(([at, w, x]) => [T0 + at, w, x]);
  const R = [[9.4, 'me', '抱歉刚看到哈哈'], [9.9, 'them', '没事！'], [10.3, 'them', '我也经常这样'], [10.8, 'them', '对了你上次说的那本书我看完了']].map(([at, w, x]) => [T0 + at, w, x]);
  const left = liveItems({ date: '今天  15:02' }, L), right = [{ date: '6月12日  20:03' }, { who: 'them', text: '最近忙吗' }, { date: '两天后' , at: T0 + 9.0 }, ...R.map(([at, who, text]) => ({ who, text, at }))];
  ctx.save(); ctx.translate(-30, 40); ctx.scale(.86, .86);
  panel(ctx, { t, cx: 420, cy: 560, name: '小 鹿', items: left });
  panel(ctx, { t, cx: 1810, cy: 560, name: '老 周', items: right, a: seg(t, T0 + 8.6, T0 + 9.2) });
  ctx.restore();
  // The clock in the middle: how long the reply has kept her waiting.
  const wait = t < T0 + 7.9 ? lerp(0, 47 * 60 + 12, easeIn(seg(t, T0 + 3.6, T0 + 7.9))) : 47 * 60 + 12;
  const showL = seg(t, T0 + 3.5, T0 + 3.9) * (1 - seg(t, T0 + 8.6, T0 + 9.0)), showR = seg(t, T0 + 9.0, T0 + 9.4);
  ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = COL.ink;
  if (showL > 0) {
    ctx.globalAlpha *= showL;
    label(ctx, '她 在 等 你 回 复', { t: 9, t0: 0, x: W / 2 + 40, y: 420, size: 18, align: 'center' });
    ctx.font = `500 96px ${SERIF}`; ctx.fillStyle = t > T0 + 6 ? '#e8b4a8' : COL.ink;
    const s = Math.floor(wait); ctx.fillText(`${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`, W / 2 + 40, 530);
    ctx.globalAlpha /= showL;
  }
  if (showR > 0) {
    ctx.globalAlpha *= showR;
    label(ctx, '他 隔 了', { t: 9, t0: 0, x: W / 2 + 40, y: 420, size: 18, align: 'center' });
    ctx.font = `500 96px ${SERIF}`; ctx.fillText('2 天', W / 2 + 40, 530);
    label(ctx, '谁 也 没 有 介 意', { t: 9, t0: 0, x: W / 2 + 40, y: 580, size: 18, align: 'center' });
  }
  ctx.restore();
  NC(ctx, t, '晚回一会儿要解释，说错一句要哄。', T0 + 4.2, T0 + 8.6, 1010, { size: 36 });
  NC(ctx, t, '普通朋友之间，没有这本账。', T0 + 9.6, T0 + 12.3, 1010, { size: 36 });
}

// 03: the iceberg — what shows above the water, and the sea of words below it.
function reason3(ctx, t, T0) {
  const dive = easeInOut(seg(t, T0 + 6.6, T0 + 8.4)), off = dive * 760, WY = 560 - off;
  ctx.save();
  // Water below the line.
  const g = ctx.createLinearGradient(0, WY, 0, WY + 1400);
  g.addColorStop(0, 'rgba(40,52,66,.35)'); g.addColorStop(1, 'rgba(8,10,14,.2)');
  ctx.fillStyle = g; ctx.fillRect(0, WY, W, H + 800);
  ctx.fillStyle = 'rgba(237,232,228,.35)'; ctx.fillRect(0, WY, W, 1.5);
  // The iceberg: a small peak above the line, a huge body below.
  ctx.beginPath();
  ctx.moveTo(800, WY); ctx.lineTo(880, WY - 120); ctx.lineTo(960, WY - 190); ctx.lineTo(1040, WY - 110); ctx.lineTo(1120, WY);
  ctx.lineTo(1380, WY + 380); ctx.lineTo(1440, WY + 760); ctx.lineTo(1180, WY + 1150); ctx.lineTo(760, WY + 1180); ctx.lineTo(500, WY + 820); ctx.lineTo(560, WY + 380); ctx.closePath();
  ctx.fillStyle = 'rgba(237,232,228,.05)'; ctx.fill(); ctx.strokeStyle = 'rgba(237,232,228,.4)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.restore();
  const above = [['加班', 700, WY - 140], ['点外卖', 1220, WY - 120], ['追剧', 760, WY - 40], ['睡前刷手机', 1210, WY - 30]];
  above.forEach(([txt, x, y], i) => label(ctx, txt, { t, t0: T0 + 3.4 + i * .3, x, y, size: 26, align: 'center', color: COL.ink, spacing: 2 }));
  // Under water: lines that keep changing.
  const under = [[960, 340], [700, 520], [1180, 600], [860, 760], [1080, 880], [640, 940]];
  ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  under.forEach(([x, y], i) => {
    const k = seg(t, T0 + 7.6 + i * .25, T0 + 8.4 + i * .25);
    if (k <= 0) return;
    ctx.globalAlpha = k * .9;
    ctx.font = `400 ${30 + (i % 2) * 6}px ${SERIF}`; ctx.fillStyle = '#d9d4ce';
    ctx.shadowColor = 'rgba(237,232,228,.35)'; ctx.shadowBlur = 16;
    ctx.fillText(starText(i * 11 + 3, t * .9, UNSAID, UNSAID, null).text, x, y + 760 - off);
  });
  ctx.restore();
  NC(ctx, t, '天天在身边，我以为她的生活，我都知道。', T0 + 3.6, T0 + 6.6, 1000, { size: 38, halo: true });
  NC(ctx, t, '可水面以下，她一直在变——', T0 + 8.6, T0 + 12.3, 160, { size: 44, halo: true });
  NC(ctx, t, '想什么，怕什么，开始期待什么。', T0 + 9.6, T0 + 12.3, 225, { size: 34, color: COL.dim, halo: true });
}

// 04: two lives as circles — lovers almost fully overlapping, friends drifting apart and growing things to tell.
function reason4(ctx, t, T0) {
  const card = seg(t, T0 + 9.6, T0 + 10.2);
  ctx.save(); ctx.globalAlpha *= 1 - .8 * card;
  ctx.fillStyle = COL.line; ctx.fillRect(960, 200, 1, 640);
  label(ctx, '恋 人', { t, t0: T0 + 3.0, x: 480, y: 210, size: 20, align: 'center', color: COL.ink, spacing: 5 });
  label(ctx, '普 通 朋 友', { t, t0: T0 + 3.0, x: 1440, y: 210, size: 20, align: 'center', color: COL.ink, spacing: 5 });
  const circle = (x, y, r, fill) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = 'rgba(237,232,228,.55)'; ctx.lineWidth = 2; ctx.stroke(); };
  const grow = easeOut(seg(t, T0 + 3.2, T0 + 4.0));
  // Lovers: almost the same circle.
  circle(450, 520, 190 * grow, 'rgba(237,232,228,.06)'); circle(510, 520, 190 * grow, 'rgba(237,232,228,.06)');
  label(ctx, '嗯', { t, t0: T0 + 5.0, x: 480, y: 528, size: 24, align: 'center', color: COL.dim });
  // Friends: drift apart over “three months”; the parts that no longer overlap fill with things to tell.
  const apart = easeInOut(seg(t, T0 + 4.4, T0 + 7.2)), dx = lerp(30, 150, apart);
  circle(1440 - dx, 520, 190 * grow, 'rgba(237,232,228,.06)'); circle(1440 + dx, 520, 190 * grow, 'rgba(237,232,228,.06)');
  const chips = [['换了工作', -1], ['去了雪山', -1], ['老王结婚了', -1], ['养了只狗', 1], ['开了民宿', 1], ['想你来大理', 1]];
  chips.forEach(([txt, side], i) => {
    const k = seg(t, T0 + 6.4 + i * .3, T0 + 6.9 + i * .3);
    if (k <= 0) return;
    const row = i % 3, x = 1440 + side * (dx + 70), y = 440 + row * 80;
    label(ctx, txt, { t: 9, t0: 0, x, y, size: 22, align: 'center', color: COL.warm, spacing: 1 });
  });
  label(ctx, '三 个 月', { t, t0: T0 + 4.6, out: T0 + 7.6, x: 1440, y: 790, size: 16, align: 'center' });
  ctx.restore();
  NC(ctx, t, '天天在一起，两个人的生活几乎完全重叠。', T0 + 3.6, T0 + 6.4, 900, { size: 36 });
  NC(ctx, t, '分开一阵，就各自长出了对方不知道的部分。', T0 + 6.6, T0 + 9.5, 900, { size: 36 });
  // The research card.
  if (card > 0) {
    ctx.save(); ctx.globalAlpha *= card;
    roundRect(ctx, 380, 330, 1160, 380, 18); ctx.fillStyle = 'rgba(12,13,17,.94)'; ctx.fill(); ctx.strokeStyle = 'rgba(243,217,166,.5)'; ctx.lineWidth = 2; ctx.stroke();
    label(ctx, '一 项 研 究', { t: 9, t0: 0, x: 450, y: 395, size: 18, color: COL.warm, spacing: 4 });
    ctx.restore();
    narr(ctx, '研究者让人重新联系多年没联系的旧识，', { t, t0: T0 + 10.0, out: T0 + 12.3, x: 450, y: 480, size: 40 });
    narr(ctx, '发现他们常常带来比身边人更新鲜的信息。', { t, t0: T0 + 10.6, out: T0 + 12.3, x: 450, y: 550, size: 40, color: COL.warm });
    label(ctx, 'Levin,  Walter  &  Murnighan,  2011,  Dormant Ties: The Value of Reconnecting', { t, t0: T0 + 11.0, out: T0 + 12.3, x: 450, y: 650, size: 15, spacing: .5 });
  }
}

// ================================================================ A5 · twist and ending

const E1 = A5, E2 = A5 + 10.5, E3 = A5 + 31.0, E4 = A5 + 39.0;
const NIGHT = liveItems({ date: '2026年10月16日  01:12' }, [[E1 + 1.6, 'me', '加班到现在，刚出公司'], [E1 + 3.2, 'them', '嗯，灯给你留着']]);
const ASK = (() => {
  const m = [[2.0, 'me', '最近在想什么？'],
    [9.6, 'them', '其实，我最近想重新开始弹琴。小时候学了六年，后来觉得没用就放下了。前几天路过琴行，在门口站了好久。'],
    [11.4, 'me', '你弹给我听'], [12.3, 'them', '好'],
    [13.1, 'them', '那我明天去琴行问问'], [13.6, 'me', '我陪你去'], [14.1, 'them', '你还记得我说过小时候弹的那首曲子吗'],
    [14.6, 'me', '你没跟我说过'], [15.0, 'them', '那我讲给你听'], [15.4, 'them', '是外婆教我的第一首，那年我七岁'],
    [15.8, 'me', '嗯，你说，我在听'], [16.2, 'them', '她的手很暖，总是先弹一遍给我听'], [16.6, 'them', '后来她走了，我就不太想碰琴了'],
    [17.1, 'me', '那这次，我坐在旁边听'], [17.6, 'them', '好']];
  return liveItems({ date: '2026年10月19日  22:30' }, m.map(([at, w, x]) => [E2 + at, w, x]));
})();
const ASK_TYPING = [[3.0, 4.6], [5.4, 6.4], [7.2, 9.6], [12.0, 12.3], [12.8, 13.1], [13.8, 14.1]].map(([a, b]) => [E2 + a, E2 + b]);

function sceneEnding(ctx, t) {
  if (t < A5 - .3) return;
  const a = seg(t, A5 - .3, A5 + .4);
  ctx.save(); ctx.globalAlpha *= a;
  // 5-1: “嗯，灯给你留着”.
  if (t < E2 + .3) {
    const k = 1 - seg(t, E2 - .4, E2 + .3);
    ctx.save(); ctx.globalAlpha *= k;
    backdrop(ctx, { t, cx: W * .3 });
    ctx.fillStyle = COL.line; ctx.fillRect(940, 140, 1, 800);
    dash(ctx, { a: 1, date: '2026 . 10 . 16', big: '01:12', rows: ['在 一 起 第  1458  天', '加 班 到 深 夜'] });
    panel(ctx, { t, cx: 1400, cy: 560, name: '小 鹿', items: NIGHT, typing: [[E1 + 2.2, E1 + 3.2]] });
    NL(ctx, t, '可是，话少，', E1 + 4.2, E1 + 7.0, 700);
    NL(ctx, t, '就是不爱了吗？', E1 + 5.0, E1 + 7.0, 762);
    NL(ctx, t, '有些“嗯”，', E1 + 7.3, E2 - .4, 700, { glow: COL.warm });
    NL(ctx, t, '是不用解释的安心。', E1 + 8.0, E2 - .4, 762);
    ctx.restore();
  }
  // 5-2: a real question.
  if (t >= E2 - .3 && t < E3 + .6) {
    const k = seg(t, E2 - .3, E2 + .4) * (1 - seg(t, E3 - .4, E3 + .6));
    ctx.save(); ctx.globalAlpha *= k;
    backdrop(ctx, { t, cx: W * .3 });
    ctx.fillStyle = COL.line; ctx.fillRect(940, 140, 1, 800);
    const m = t < E2 + 9.6 ? MIN(22, 30) + Math.floor(6 * easeIn(seg(t, E2 + 2.0, E2 + 9.6))) : lerp(MIN(22, 36), MIN(23, 40), seg(t, E2 + 9.6, E2 + 20));
    const today = ASK.filter(x => x.at && x.at <= t).length;
    dash(ctx, { a: 1, date: '2026 . 10 . 19', big: hhmm(m), rows: ['在 一 起 第  1461  天', `今 日 消 息  ${today}`] });
    panel(ctx, { t, cx: 1400, cy: 560, name: '小 鹿', items: ASK, typing: ASK_TYPING });
    NL(ctx, t, '第一千四百六十一天，', E2 + .5, E2 + 5.4, 700);
    NL(ctx, t, '我问了一个真正的问题。', E2 + 1.4, E2 + 5.4, 762);
    NL(ctx, t, '她想了很久。', E2 + 5.8, E2 + 9.4, 700, { color: COL.dim });
    NL(ctx, t, '原来她一直有话想说，', E2 + 11.4, E3 - .6, 700);
    NL(ctx, t, '只是我很久没有问了。', E2 + 12.6, E3 - .6, 762, { color: COL.warm });
    ctx.restore();
  }
  // 5-3: back in the sea; the dim star lights up, then the others.
  if (t >= E3 - .3 && t < E4 + .4) {
    const k = seg(t, E3 - .3, E3 + .6) * (1 - seg(t, E4 - .4, E4 + .4));
    ctx.save(); ctx.globalAlpha *= k;
    backdrop(ctx, { t, stars: .8, lift: .4 });
    const lit = { 4: E3 + 1.2, 0: E3 + 3.0, 1: E3 + 3.4, 2: E3 + 3.8, 3: E3 + 4.2, 5: E3 + 4.6,
      text: { 4: '想重新开始弹琴', 0: '那首曲子是外婆教的', 1: '你弹给我听', 2: '我陪你去', 3: '那年我七岁', 5: '我坐在旁边听' } };
    unsaidStars(ctx, t, 1, lit);
    ctx.restore();
    NC(ctx, t, '留一点白，', E3 + 4.6, E4 - .5, 520, { size: 50, halo: true });
    NC(ctx, t, '想说的话，才有地方长出来。', E3 + 5.4, E4 - .5, 600, { size: 50, halo: true });
  }
  // 5-4: end card.
  if (t >= E4 - .3) {
    ctx.save(); ctx.globalAlpha *= seg(t, E4 - .3, E4 + .4); backdrop(ctx, { t, lift: .6 }); ctx.restore();
    narr(ctx, '留白', { t, t0: E4 + .3, x: W / 2, y: 560, size: 180, align: 'center', stagger: .35, glow: COL.warm });
    narr(ctx, '最亲的人，也需要一点“好久不见”。', { t, t0: E4 + 1.6, x: W / 2, y: 680, size: 32, weight: 400, align: 'center', color: COL.dim, stagger: .04 });
  }
  ctx.restore();
}

// ================================================================ frame

function drawFrame(ctx, t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
  ctx.fillStyle = COL.bg0; ctx.fillRect(0, 0, W, H);
  if (t < A2 + .1) sceneLovers(ctx, t);
  sceneFriend(ctx, t);
  sceneWall(ctx, t);
  sceneTitle(ctx, t);
  sceneSea(ctx, t);
  sceneReasons(ctx, t);
  sceneEnding(ctx, t);
  const black = 1 - seg(t, 0, .6) + seg(t, DUR - 1.2, DUR);
  if (black > 0) { ctx.fillStyle = `rgba(0,0,0,${clamp(black)})`; ctx.fillRect(0, 0, W, H); }
  finish(ctx, t);
}

// ================================================================ sound

const CUES = (() => {
  const c = [];
  const send = list => list.forEach(([at]) => c.push({ t: at, kind: 'send', gain: .9 }));
  send(DAY1); send(LATE); send(FRIEND_MSGS);
  c.push({ t: WL + 1.95, kind: 'boom' }, { t: WL + 2.0, kind: 'shimmer' });
  c.push({ t: TT + .2, kind: 'chord', notes: [146.8, 220, 293.7, 370] });
  c.push({ t: SE - .3, kind: 'swell', dur: 6.0 }, { t: SE + 7.6, kind: 'note', f: 220 }, { t: SE + 11.6, kind: 'note', f: 329.6 });
  for (let n = 0; n < 4; n++) c.push({ t: chapterAt(n) + .2, kind: 'whoosh' });
  for (let i = 0; i < 7; i++) c.push({ t: chapterAt(0) + 3.4 + i * .9 + .55, kind: 'drip', pitch: i / 7 });
  [[3.4], [5.0], [5.8], [6.6], [7.3], [7.9], [8.5], [9.4], [9.9], [10.3], [10.8]].forEach(([x]) => c.push({ t: chapterAt(1) + x, kind: 'send', gain: .8 }));
  send([[E1 + 1.6], [E1 + 3.2]]);
  send(ASK.filter(x => x.at).map(x => [x.at]));
  c.push({ t: E3 + 1.2, kind: 'note', f: 523.3 }, { t: E3 + 3.0, kind: 'shimmer' });
  c.push({ t: E4 + .3, kind: 'chord', notes: [130.8, 196, 261.6, 329.6] });
  return c.sort((a, b) => a.t - b.t);
})();

// Soft piano chords under the whole film: warm at the start and the end, colder in the middle.
const PAD = [
  [0.3, [110, 164.8, 261.6, 329.6]], [4.3, [98, 146.8, 246.9, 293.7]],
  [T2 + .5, [87.3, 130.8, 220, 261.6]], [T2 + 4.5, [82.4, 123.5, 196, 246.9]],
  [T3 + .3, [87.3, 130.8, 220]], [T3 + 5.3, [82.4, 123.5, 196]],
  [A2 + .4, [98, 146.8, 220]], [B1 + .3, [110, 164.8, 261.6, 329.6]], [B1 + 4.3, [123.5, 185, 293.7]], [B1 + 8.3, [110, 164.8, 277.2]],
  [B2 + .4, [98, 146.8, 246.9]],
  [SE + 6.6, [73.4, 110, 174.6]], [SE + 11.0, [82.4, 123.5, 196]],
  ...[0, 1, 2, 3].flatMap(n => [[chapterAt(n) + .3, [98, 146.8, 246.9]], [chapterAt(n) + 6.3, [87.3, 130.8, 220]], [chapterAt(n) + 12.4, [110, 164.8, 261.6]]]),
  [E1 + .3, [87.3, 130.8, 220]], [E1 + 6.3, [98, 146.8, 246.9, 293.7]],
  [E2 + .3, [98, 146.8, 220]], [E2 + 9.6, [110, 164.8, 261.6, 329.6]], [E2 + 13.6, [123.5, 185, 293.7, 370]], [E2 + 17.6, [110, 164.8, 277.2, 329.6]],
  [E3 + .3, [130.8, 196, 261.6, 329.6]], [E3 + 4.3, [110, 164.8, 261.6, 329.6]],
];

const CUT = { dur: DUR, cues: CUES, pad: PAD, drawFrame };
