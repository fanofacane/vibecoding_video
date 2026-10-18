// sample.js: a ~37 s sample of 《留白》, act 1 and the start of the sea of words (storyboard v4).
//   0:00  day 1, real speed: one line after another, they can't stop talking
//   0:08  time speeds up: days fly by, messages stream and get shorter
//   0:16  hard stop: day 1460, real speed again, and almost nothing to say
//   0:25  the sea of words: a 3-D flight through four years of sentences that keep changing, collapsing into “嗯”
// Layout: dashboard on the left (date, clock, day count, messages today, narration), chat on the right.

const T1 = 0, T2 = 7.8, T3 = 16.0, T4 = 25.4, DUR = 37.4;

// ---------------------------------------------------------------- act 1 chat, day 1 and the years after

// Day 1: [time the message lands, who, text]. Their messages are preceded by “typing…”.
const DAY1 = [
  [1.9, 'them', '今天第一次见你，紧张到把奶茶洒了，你是不是笑我了！！'],
  [3.2, 'me', '没有！我是觉得你好可爱'],
  [4.2, 'them', '骗人，你明明笑出声了'],
  [5.2, 'me', '好吧，笑了一下下。但是是那种很开心的笑'],
  [6.1, 'them', '那下次还见吗'],
  [6.7, 'me', '明天就见'],
  [7.25, 'them', '说好了！'],
];

// The years after: messages land faster and faster, and get shorter as the days go by.
const YEARS = (() => {
  const early = [['them', '周末去看海吧！我查好路线了'], ['me', '好呀，我带相机'], ['them', '你猜我在楼下看到了什么，一只橘猫在追自己的尾巴'], ['me', '想你'], ['them', '今天被组长夸了，开心到想转圈'], ['me', '我做了红烧肉，失败了，但是很好笑']];
  const mid = [['them', '晚上吃什么？'], ['me', '随便，都行'], ['me', '我下班了'], ['them', '好累'], ['me', '你先睡'], ['them', '记得带伞'], ['them', '周末去哪']];
  const late = [['them', '到了吗'], ['me', '到了'], ['them', '嗯'], ['me', '好'], ['them', '晚安'], ['me', '嗯嗯'], ['them', '在吗'], ['me', '在']];
  const N = 96, out = [];
  let lastDay = 1;
  for (let k = 0; k < N; k++) {
    const u = k / N, at = T2 + (T3 - T2 - .25) * u ** .62, day = Math.round(1 + 1459 * u ** 1.5);
    const pool = day < 300 ? early : day < 900 ? mid : late;
    const [who, text] = pool[Math.floor(hash(k * 17 + 3) * pool.length)];
    if (day - lastDay > 40 || k === 0) { out.push({ date: dateOf(day), at: at - .05, day }); lastDay = day; }
    out.push({ who, text, at, day });
  }
  return out;
})();

const LOVE = (() => {
  const items = [{ date: '2022年10月20日  22:13' }];
  DAY1.forEach(([at, who, text]) => {
    const wait = who === 'them' ? .7 : .45;
    items.push({ who, typing: [at - wait, at] }, { who, text, at });
  });
  return items.concat(YEARS);
})();

// Day 1460: real speed again, and nearly empty.
const LATE = [
  { date: '2026年10月18日  22:41', at: T3 + .3 },
  { who: 'them', typing: [T3 + .9, T3 + 1.5] }, { who: 'them', text: '到家了吗', at: T3 + 1.5 },
  { who: 'me', typing: [T3 + 4.0, T3 + 4.4] }, { who: 'me', text: '到了', at: T3 + 4.4 },
  { who: 'them', text: '嗯', at: T3 + 5.3 },
  { who: 'me', typing: [T3 + 6.0, T3 + 7.6] },                    // typed something, then deleted it
  { who: 'me', text: '晚安', at: T3 + 8.2 },
];

// ---------------------------------------------------------------- dashboard values over time

function dateOf(day) {
  const d = new Date(Date.UTC(2022, 9, 20) + (day - 1) * 864e5);
  return `${d.getUTCFullYear()}年${d.getUTCMonth() + 1}月${d.getUTCDate()}日`;
}
const dateDots = day => { const d = new Date(Date.UTC(2022, 9, 20) + (day - 1) * 864e5); return `${d.getUTCFullYear()} . ${String(d.getUTCMonth() + 1).padStart(2, '0')} . ${String(d.getUTCDate()).padStart(2, '0')}`; };
const hhmm = m => { m = ((Math.round(m) % 1440) + 1440) % 1440; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };

function dashState(t) {
  if (t < T2) {
    // Day 1: the clock creeps, then runs to 01:47 as the night goes on; messages pile up.
    const m = lerp(22 * 60 + 13, 25 * 60 + 47, easeIn(seg(t, .6, T2)));
    return { day: 1, clock: hhmm(m), today: Math.round(lerp(31, 212, easeIn(seg(t, .5, T2)))), blur: 0 };
  }
  if (t < T3) {
    const shown = YEARS.filter(y => y.who && y.at <= t), last = shown[shown.length - 1];
    const day = last ? last.day : 1, fast = seg(t, T2, T3);
    return { day, clock: hhmm(hash(Math.floor(t * 20)) * 1440), today: Math.round(212 * Math.exp(-day / 230) + 4), blur: easeIn(fast) };
  }
  // Day 1460: the clock barely moves; 22:41 → 22:58 while nobody says anything.
  const m = 22 * 60 + 41 + Math.floor(17 * ease(seg(t, T3 + 1.8, T3 + 4.0))) + Math.floor(seg(t, T3 + 4.4, T3 + 9) * 3);
  const today = LATE.filter(x => x.text && x.at <= t).length;
  return { day: 1460, clock: hhmm(m), today, blur: 0 };
}

function dashboard(ctx, t, a) {
  const s = dashState(t);
  ctx.save(); ctx.globalAlpha *= a;
  label(ctx, dateDots(s.day), { t: 9, t0: 0, x: 150, y: 290, size: 20, spacing: 3 });
  // The clock: big serif; while time flies it smears into ghost digits.
  ctx.font = `500 190px ${SERIF}`; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = COL.ink;
  ctx.shadowColor = 'rgba(243,217,166,.22)'; ctx.shadowBlur = 40;
  if (s.blur > .05) {
    for (let g = 1; g <= 4; g++) {
      ctx.globalAlpha = a * .18 * s.blur;
      ctx.fillText(hhmm(hash(Math.floor(t * 20) - g) * 1440), 140, 470 - g * 14 * s.blur);
    }
  }
  ctx.globalAlpha = a * (1 - .35 * s.blur);
  ctx.fillText(s.clock, 140, 470);
  ctx.shadowBlur = 0;
  ctx.globalAlpha = a;
  label(ctx, `在 一 起 第  ${s.day}  天`, { t: 9, t0: 0, x: 150, y: 535, size: 18, color: COL.ink });
  label(ctx, `今 日 消 息  ${s.today}`, { t: 9, t0: 0, x: 150, y: 572, size: 18 });
  ctx.restore();
}

// ---------------------------------------------------------------- sea of words

const POOL = [
  '今天第一次见你，紧张到把奶茶洒了', '你是不是笑我了', '明天就见', '周末去看海吧', '我查好路线了', '想你', '晚安呀，今天超开心',
  '你猜我在楼下看到了什么', '一只橘猫在追自己的尾巴', '今天被组长夸了', '我做了红烧肉，失败了', '晚上吃什么', '随便，都行', '我下班了',
  '好累', '你先睡', '记得带伞', '周末去哪', '到了吗', '到了', '在吗', '在', '好', '嗯嗯', '吃了吗', '到家了吗', '早点睡', '路上小心',
  '收到', '在开会', '晚点说', '外卖到了', '哈哈哈哈', '知道了', '没事', '等我', '快到了', '睡了吗',
];
const BIG = ['嗯', '晚安', '到了', '好', '嗯', '在吗', '嗯'];

// Camera: forward speed ramps up, cruises, then brakes to a stop; drifts left and up along the way.
function camZ(t) {
  let z = -1800, v = 0;
  for (let x = T4; x < t; x += 1 / 60) {
    const target = x < T4 + 2.6 ? lerp(300, 1500, easeIn(seg(x, T4, T4 + 2.6))) : x < T4 + 6.6 ? 1500 : lerp(1500, 0, easeOut(seg(x, T4 + 6.6, T4 + 9.2)));
    v = target; z += v / 60;
  }
  return z;
}

// ---------------------------------------------------------------- frame

function drawFrame(ctx, t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
  ctx.fillStyle = COL.bg0; ctx.fillRect(0, 0, W, H);
  if (t < T4 + .8) chatAct(ctx, t);
  if (t > T4 - .3) seaAct(ctx, t);
  const black = 1 - seg(t, 0, .6) + seg(t, DUR - .9, DUR);
  if (black > 0) { ctx.fillStyle = `rgba(0,0,0,${clamp(black)})`; ctx.fillRect(0, 0, W, H); }
  finish(ctx, t);
}

function chatAct(ctx, t) {
  const out = 1 - seg(t, T4 - .3, T4 + .5);
  // The hard stop: a quarter second of black between the years and day 1460.
  const cut = t >= T3 - .02 && t < T3 + .28 ? 0 : 1;
  ctx.save(); ctx.globalAlpha = out * cut;
  backdrop(ctx, { t, cx: W * .3 });
  ctx.fillStyle = COL.line; ctx.fillRect(940, 140, 1, 800);
  dashboard(ctx, t, 1);

  const col = { t, x: 1060, w: 680, top: 110, bot: 1030, fromTop: true };
  if (t < T3) {
    // While time flies, ghost copies trail behind the stream.
    const fast = easeIn(seg(t, T2 + 2, T3));
    for (let g = 3; g >= 1 && fast > .05; g--) chatColumn(ctx, { ...col, t: t - g * .035, items: LOVE, a: .16 * fast });
    chatColumn(ctx, { ...col, items: LOVE });
    label(ctx, '小 鹿', { t, t0: .4, x: 1060, y: 92, size: 16, color: COL.faint });
  } else {
    chatColumn(ctx, { ...col, items: LATE });
    label(ctx, '小 鹿', { t, t0: T3 + .3, x: 1060, y: 92, size: 16, color: COL.faint });
  }

  // Narration, left column under the dashboard.
  const N = (text, t0, out, y, o = {}) => narr(ctx, text, { t, t0, out, x: 148, y, size: 40, stagger: .05, ...o });
  N('刚在一起的时候，', .9, 4.1, 700);
  N('什么都想告诉你。', 1.9, 4.1, 762);
  N('一杯洒了的奶茶，', 4.5, 7.6, 700);
  N('也能聊到凌晨两点。', 5.4, 7.6, 762);
  N('后来，我们每天都在聊。', T2 + .5, T3 - .6, 700);
  N('聊天成了习惯，', T2 + 2.9, T3 - .6, 762, { color: COL.dim });
  N('话却一天比一天短。', T2 + 4.6, T3 - .6, 824, { color: COL.dim, tail: .5 });
  N('第一千四百六十天，', T3 + 1.0, T3 + 5.0, 700);
  N('我们还是每天都在聊。', T3 + 2.0, T3 + 5.0, 762);
  N('可是好像，', T3 + 5.5, T4 - .4, 700);
  N('已经没什么可聊的了。', T3 + 6.6, T4 - .4, 762, { tail: .55 });
  ctx.restore();
}

function seaAct(ctx, t) {
  const s = t - T4, a = seg(s, -.3, 1.2);
  ctx.save(); ctx.globalAlpha = a;
  backdrop(ctx, { t, stars: .6, lift: .4 });
  const cam = { x: -380 * s - 140 * Math.sin(s * .7), y: -260 * s, z: camZ(t) };
  // Keep a calm pocket behind the narration.
  const hole = { x: W / 2, y: 560, r: 420, k: .75 * (seg(s, .8, 1.4) * (1 - seg(s, 6.0, 6.6)) + seg(s, 7.8, 8.4)) };
  sea3d(ctx, { t, cam, pool: POOL, big: BIG, collapse: { t0: T4 + 7.0, to: '嗯' }, a, hole });
  ctx.restore();
  const H_ = { halo: true, align: 'center', x: W / 2 };
  narr(ctx, '四年，十几万句话。', { t, t0: T4 + 1.0, out: T4 + 6.2, y: 500, size: 66, ...H_ });
  narr(ctx, '它们没有消失，', { t, t0: T4 + 2.6, out: T4 + 6.2, y: 600, size: 40, color: COL.dim, ...H_ });
  narr(ctx, '只是一层一层，沉在了这里。', { t, t0: T4 + 3.6, out: T4 + 6.2, y: 662, size: 40, color: COL.dim, ...H_ });
  narr(ctx, '说得最多的，', { t, t0: T4 + 8.0, out: DUR - 1.2, y: 470, size: 46, color: COL.dim, ...H_ });
  narr(ctx, '是“嗯”。', { t, t0: T4 + 9.0, out: DUR - 1.2, y: 600, size: 110, stagger: .25, ...H_ });
}

// ---------------------------------------------------------------- sound

const CUES = (() => {
  const c = [];
  const msg = (at, who, k) => c.push({ t: at, kind: who === 'me' ? 'send' : 'ding', pitch: k });
  DAY1.forEach(([at, who]) => msg(at, who, 0));
  LOVE.filter(x => x.typing).forEach(x => { for (let q = x.typing[0]; q < x.typing[1] - .05; q += .11) c.push({ t: q, kind: 'tick', pitch: .2, quiet: true }); });
  YEARS.filter(y => y.who).forEach((y, i) => msg(y.at, y.who, Math.min(1, i / 96)));
  c.push({ t: T2 + 1.2, kind: 'rain', dur: T3 - T2 - 1.2 });                  // the stream swells into rain, cut at T3
  LATE.filter(x => x.text).forEach(x => msg(x.at, x.who, 0));
  for (let q = T3 + 6.0; q < T3 + 7.5; q += .13) c.push({ t: q, kind: 'tick', pitch: .2, quiet: true });
  c.push({ t: T3 + 7.6, kind: 'tick', pitch: 0 });                            // backspace
  c.push({ t: T4 - .2, kind: 'whoosh' }, { t: T4, kind: 'swell', dur: 7.0 });
  c.push({ t: T4 + 7.0, kind: 'boom' }, { t: T4 + 9.0, kind: 'note', f: 220 });
  return c.sort((a, b) => a.t - b.t);
})();

const PAD = [
  [0.3, [110, 164.8, 261.6, 329.6]], [4.3, [98, 146.8, 246.9, 293.7]],
  [T3 + .6, [87.3, 130.8, 220]], [T3 + 5.5, [82.4, 123.5, 196]],
  [T4 + 8.0, [73.4, 110, 174.6]],
];

const CUT = { dur: DUR, cues: CUES, pad: PAD, drawFrame };
