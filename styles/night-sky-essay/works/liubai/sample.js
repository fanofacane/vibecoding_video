// sample.js: a ~38 s sample of 《留白》, act 1 and the start of the sea of words.
//   0:00  day 1, live: one message after another, they can't stop talking
//   0:08  the same chat log scrolls down, faster and faster through four years, then slows down…
//   0:14  …and lands in the latest conversation, which goes on live: she brings things up, I only answer “嗯” “好”
//   0:24  the chat window copies itself, every copy races through its history, and the messages burst out
//   0:27  the sea of words: a 3-D flight through sentences that keep changing; they end as one-word brush-offs
// One chat window from start to end of act 1. Left: dashboard (date, clock, day, messages today) and narration.

const T2 = 7.8, T3 = 13.8, TD = 24.4, T4 = 27.4, DUR = 38.2;
const COLX = 1060, COLW = 680, TOP = 140, BOT = 1030;

// ---------------------------------------------------------------- the chat

const MIN = (h, m) => h * 60 + m;
const dateText = (day, mins) => {
  const d = new Date(Date.UTC(2022, 9, 20) + (day - 1) * 864e5);
  return `${d.getUTCFullYear()}年${d.getUTCMonth() + 1}月${d.getUTCDate()}日  ${hhmm(mins)}`;
};
const hhmm = m => { m = ((Math.round(m) % 1440) + 1440) % 1440; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };

// Day 1, live. [time it lands, who, text]
const DAY1 = [
  [1.9, 'them', '今天第一次见你，紧张到把奶茶洒了，你是不是笑我了！！'],
  [3.2, 'me', '没有！我是觉得你好可爱'],
  [4.2, 'them', '骗人，你明明笑出声了'],
  [5.2, 'me', '好吧，笑了一下下。但是是那种很开心的笑'],
  [6.1, 'them', '那下次还见吗'],
  [6.7, 'me', '明天就见'],
  [7.25, 'them', '说好了！'],
];

// Four years of history: already there, revealed by scrolling. Messages shrink as the days go by.
const HISTORY = (() => {
  const early = [['them', '周末去看海吧！我查好路线了'], ['me', '好呀，我带相机'], ['them', '你猜我在楼下看到了什么，一只橘猫在追自己的尾巴转了十几圈'], ['me', '想你'],
    ['them', '今天被组长夸了，开心到想转圈'], ['me', '我做了红烧肉，失败了，但是很好笑'], ['them', '下雨了，你带伞没有？没带的话我去接你'], ['me', '明天想吃什么，我早点下班']];
  const mid = [['them', '晚上吃什么？'], ['me', '随便，都行'], ['me', '我下班了'], ['them', '好累'], ['me', '你先睡'], ['them', '记得带伞'], ['them', '周末去哪'], ['me', '再说吧']];
  const late = [['them', '到了吗'], ['me', '到了'], ['them', '吃了吗'], ['me', '吃了'], ['me', '嗯'], ['me', '好'], ['them', '晚安'], ['me', '晚安']];
  const days = [2, 4, 9, 17, 30, 52, 80, 120, 170, 230, 300, 380, 460, 540, 620, 700, 780, 860, 940, 1010, 1080, 1150, 1210, 1270, 1320, 1370, 1410, 1440, 1455];
  const out = [];
  days.forEach((day, di) => {
    out.push({ date: dateText(day, MIN(19 + Math.floor(hash(di) * 4), Math.floor(hash(di + 5) * 60))), day, mins: MIN(20, 0) });
    const pool = day < 300 ? early : day < 900 ? mid : late, n = day < 300 ? 5 : day < 900 ? 4 : 2 + Math.floor(hash(di) * 2);
    for (let j = 0; j < n; j++) { const [who, text] = pool[Math.floor(hash(di * 31 + j * 7) * pool.length)]; out.push({ who, text, day }); }
  });
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
// “对方正在输入…” shown in the header: [from, to]. One of them leads to nothing.
const TYPING = [[.6, 1.9], [2.6, 4.2], [5.6, 6.1], [6.9, 7.25],
  [T3 + .4, T3 + 1.1], [T3 + 1.3, T3 + 2.0], [T3 + 3.9, T3 + 4.4], [T3 + 5.9, T3 + 6.4], [T3 + 7.9, T3 + 8.9], [T3 + 9.1, T3 + 9.6]];
const LATE_MINS = [[T3, MIN(22, 41)], [T3 + 3.6, MIN(22, 52)], [T3 + 5.6, MIN(22, 58)], [T3 + 7.5, MIN(23, 6)], [T3 + 9.6, MIN(23, 15)]];

const CHAT = [
  { date: dateText(1, MIN(22, 13)), day: 1, mins: MIN(22, 13) },
  ...DAY1.map(([at, who, text]) => ({ who, text, at, day: 1 })),
  ...HISTORY.map(it => ({ ...it, at: T2 - .5 })),                       // below the window until the scroll reaches them
  { date: dateText(1460, MIN(22, 41)), day: 1460, mins: MIN(22, 41), at: T2 - .5 },
  ...LATE.map(([at, who, text]) => ({ who, text, at, day: 1460 })),
];

// Where the top of the chat content sits on screen at time t.
const CHAT_DAY1 = CHAT.slice(0, DAY1.length + 1);   // the part on screen before the scroll
function chatY(ctx, t) {
  const live = tt => Math.min(TOP + 20, BOT - 30 - chatHeight(ctx, CHAT, tt));
  const day1 = tt => Math.min(TOP + 20, BOT - 30 - chatHeight(ctx, CHAT_DAY1, tt));
  if (t < T2) return day1(t);
  const yA = day1(T2), yB = BOT - 30 - chatHeight(ctx, CHAT, T3 + .001);
  if (t < T3) return lerp(yA, yB, easeInOut(seg(t, T2, T3)));
  return live(t);
}

// The date stamp nearest above the middle of the window: what the dashboard shows while scrolling.
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

// ---------------------------------------------------------------- dashboard

function dashboard(ctx, t, y0, speed) {
  let day, clock, today;
  if (t < T2) {
    day = 1; clock = hhmm(lerp(MIN(22, 13), MIN(25, 47), easeIn(seg(t, .6, T2))));
    today = Math.round(lerp(31, 212, easeIn(seg(t, .5, T2))));
  } else if (t < T3) {
    const st = stampAt(ctx, y0, t);
    day = st.day; clock = hhmm(st.mins + (day > 1 ? hash(day) * 180 : 214));
    today = Math.round(212 * Math.exp(-day / 230) + 4);
  } else {
    day = 1460;
    let m = MIN(22, 41); for (const [at, mm] of LATE_MINS) if (t >= at) m = mm;
    clock = hhmm(m); today = LATE.filter(([at]) => at <= t).length;
  }
  const blur = clamp(speed / 2500);
  label(ctx, dateText(day, 0).split('  ')[0].replace('年', ' . ').replace('月', ' . ').replace('日', ''), { t: 9, t0: 0, x: 150, y: 290, size: 20, spacing: 3 });
  ctx.save();
  ctx.font = `500 190px ${SERIF}`; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = COL.ink;
  ctx.shadowColor = 'rgba(243,217,166,.22)'; ctx.shadowBlur = 40;
  if (blur > .05) for (let g = 1; g <= 4; g++) { ctx.save(); ctx.globalAlpha *= .16 * blur; ctx.fillText(clock, 140, 470 - g * 18 * blur); ctx.restore(); }
  ctx.globalAlpha *= 1 - .3 * blur;
  ctx.fillText(clock, 140, 470);
  ctx.restore();
  label(ctx, `在 一 起 第  ${day}  天`, { t: 9, t0: 0, x: 150, y: 535, size: 18, color: COL.ink });
  label(ctx, `今 日 消 息  ${today}`, { t: 9, t0: 0, x: 150, y: 572, size: 18 });
}

// Name above the chat; while she types it turns into “对方正在输入…”.
function header(ctx, t) {
  let typing = 0;
  for (const [a, b] of TYPING) typing = Math.max(typing, seg(t, a, a + .2) * (1 - seg(t, b - .15, b)));
  const cx = COLX + COLW / 2;
  ctx.save(); ctx.globalAlpha *= 1 - typing;
  label(ctx, '小 鹿', { t: 9, t0: 0, x: cx, y: 92, size: 20, align: 'center', color: COL.ink });
  ctx.restore();
  if (typing > 0) {
    ctx.save(); ctx.globalAlpha *= typing;
    const dots = '.'.repeat(1 + Math.floor(t * 3) % 3);
    label(ctx, '对 方 正 在 输 入 ' + dots, { t: 9, t0: 0, x: cx, y: 92, size: 20, align: 'center', color: COL.dim });
    ctx.restore();
  }
  ctx.fillStyle = COL.line; ctx.fillRect(COLX, 116, COLW, 1);
}

// ---------------------------------------------------------------- the sea of words

const SHORT = ['嗯', '好的', '我知道了', '1', '晚安', '早安', '吃了', '吃了没', '哦', '嗯嗯', '好', '行', '收到', '哈哈', '到了', '在', '知道了', '早', '随便', '都行'];
const POOL = [...SHORT, ...SHORT, '今天第一次见你，紧张到把奶茶洒了', '周末去看海吧', '想你', '晚安呀，今天超开心', '你猜我在楼下看到了什么',
  '一只橘猫在追自己的尾巴', '今天被组长夸了', '我做了红烧肉，失败了', '下雨了，我去接你', '晚上吃什么', '我下班了', '好累', '你先睡', '记得带伞',
  '到家了吗', '早点睡', '路上小心', '在开会', '晚点说', '新开了一家面包店', '买到了最后一个可颂'];
const BIG = ['嗯', '好的', '晚安', '我知道了', '1', '好'];

// Camera speed: arrives fast out of the burst, cruises, then brakes to a stop.
function camZ(t) {
  let z = -400;
  for (let x = T4; x < t; x += 1 / 60) {
    const v = x < T4 + 5.0 ? lerp(1900, 1200, ease(seg(x, T4, T4 + 5))) : lerp(1200, 0, easeOut(seg(x, T4 + 5.0, T4 + 7.6)));
    z += v / 60;
  }
  return z;
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
  const wall = easeInOut(seg(t, TD, TD + .9)), solo = 1 - wall;
  ctx.save(); ctx.globalAlpha = 1 - seg(t, T4 - .6, T4 + .3);
  backdrop(ctx, { t, cx: W * .3 });

  // The one chat window: live, then the scroll, then live again.
  const y0 = chatY(ctx, t), speed = Math.abs(y0 - chatY(ctx, t - 1 / 30)) * 30;
  if (solo > 0) {
    ctx.save(); ctx.globalAlpha *= solo;
    ctx.fillStyle = COL.line; ctx.fillRect(940, 140, 1, 800);
    dashboard(ctx, t, y0, speed);
    header(ctx, t);
    const trail = clamp(speed / 1800);
    for (let g = 3; g >= 1 && trail > .05; g--) chatColumn(ctx, { t, x: COLX, w: COLW, top: TOP, bot: BOT, items: CHAT, y0: y0 + g * speed / 60, a: .14 * trail });
    chatColumn(ctx, { t, x: COLX, w: COLW, top: TOP, bot: BOT, items: CHAT, y0 });
    narration(ctx, t);
    ctx.restore();
  }

  // The window copies itself; every copy races through its history; messages burst out toward the camera.
  if (wall > 0) {
    const d = t - TD, zoom = 1 + .22 * easeIn(seg(d, .6, 3.0));
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(zoom, zoom); ctx.translate(-W / 2, -H / 2);
    ctx.globalAlpha *= 1 - seg(d, 2.0, 2.9);
    for (let i = 0; i < 5; i++) {
      const x = lerp(COLX, 50 + i * 376, wall), w = lerp(COLW, 330, wall);
      const yy = y0 - (i % 2 ? 300 : 0) - 900 * d * d * (.8 + .12 * i), v = 1800 * d * (.8 + .12 * i);
      for (let g = 3; g >= 0; g--) {
        if (g && v < 300) continue;
        chatColumn(ctx, { t: 99, x, w, top: 40, bot: 1040, items: WALL, y0: yy + g * v / 50, a: (g ? .12 * clamp(v / 2000) : 1) * (i === 2 ? 1 : wall), fade: 160 });
      }
    }
    ctx.restore();
    burst(ctx, t);
  }
  ctx.restore();
}

// The history twice over, for the copies that race through it.
const WALL = [...HISTORY, ...HISTORY, ...HISTORY].map(it => ({ ...it }));

// Brush-off replies fly out of the copies toward the camera.
function burst(ctx, t) {
  for (let j = 0; j < 150; j++) {
    const t0 = TD + 1.4 + hash(j) * 1.4, k = seg(t, t0, t0 + 1.3);
    if (k <= 0 || k >= 1) continue;
    const col = j % 5, sx = 50 + col * 376 + hash(j + 1) * 330, sy = 80 + hash(j + 2) * 920;
    const dx = sx - W / 2, dy = sy - H / 2, e = easeIn(k);
    const x = sx + dx * e * 1.6, y = sy + dy * e * 1.6, s = 1 + e * 3.2;
    looseBubble(ctx, { who: hash(j + 3) < .5 ? 'me' : 'them', text: SHORT[j % SHORT.length] }, x, y, { s, a: seg(k, 0, .1) * (1 - seg(k, .6, 1)) });
  }
}

// Narration under the dashboard.
function narration(ctx, t) {
  const N = (text, t0, out, y, o = {}) => narr(ctx, text, { t, t0, out, x: 148, y, size: 40, stagger: .05, ...o });
  N('刚在一起的时候，', .9, 4.1, 700);
  N('什么都想告诉你。', 1.9, 4.1, 762);
  N('一杯洒了的奶茶，', 4.5, 7.6, 700);
  N('也能聊到凌晨两点。', 5.4, 7.6, 762);
  N('后来，我们每天都在聊。', T2 + .4, T3 - .3, 700);
  N('聊天成了习惯，', T2 + 2.2, T3 - .3, 762, { color: COL.dim });
  N('话却一天比一天短。', T2 + 3.6, T3 - .3, 824, { color: COL.dim, tail: .5 });
  N('第一千四百六十天，', T3 + .4, T3 + 3.4, 700);
  N('我们还是每天都在聊。', T3 + 1.3, T3 + 3.4, 762);
  N('她说了很多，', T3 + 3.8, T3 + 7.2, 700);
  N('我只回了几个字。', T3 + 4.8, T3 + 7.2, 762);
  N('不是不爱了，', T3 + 7.6, TD + .2, 700);
  N('只是不知道还能聊什么。', T3 + 8.6, TD + .2, 762, { tail: .5 });
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

// ---------------------------------------------------------------- sound

// Times at which an easeInOut scroll from a to b has covered fraction f (for ticks that follow the scroll speed).
const invEase = f => { let lo = 0, hi = 1; for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; easeInOut(m) < f ? lo = m : hi = m; } return lo; };

const CUES = (() => {
  const c = [];
  DAY1.forEach(([at, who]) => c.push({ t: at, kind: who === 'me' ? 'send' : 'ding' }));
  for (let n = 1; n < 110; n++) c.push({ t: T2 + (T3 - T2) * invEase(n / 110), kind: 'tick', pitch: .3, quiet: true });
  c.push({ t: T2, kind: 'rain', dur: T3 - T2, shape: 'hump' });
  LATE.forEach(([at, who]) => c.push({ t: at, kind: who === 'me' ? 'send' : 'ding', gain: .8 }));
  c.push({ t: TD, kind: 'whoosh' }, { t: TD + .4, kind: 'rain', dur: 2.6 });
  c.push({ t: TD + 1.45, kind: 'boom' }, { t: TD + 1.5, kind: 'shimmer' });
  c.push({ t: T4 - .3, kind: 'swell', dur: 6.0 });
  c.push({ t: T4 + 7.6, kind: 'note', f: 220 });
  return c.sort((a, b) => a.t - b.t);
})();

const PAD = [
  [0.3, [110, 164.8, 261.6, 329.6]], [4.3, [98, 146.8, 246.9, 293.7]],
  [T3 + .3, [87.3, 130.8, 220]], [T3 + 5.3, [82.4, 123.5, 196]],
  [T4 + 6.6, [73.4, 110, 174.6]],
];

const CUT = { dur: DUR, cues: CUES, pad: PAD, drawFrame };
