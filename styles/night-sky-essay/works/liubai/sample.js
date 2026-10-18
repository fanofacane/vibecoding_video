// sample.js: a ~33 s sample of 《留白》 — the cold open, the title, the sea of words, and the start of chapter 01.
// Storyboard: creative_materials/2026-10-18_留白_分镜草案/分镜脚本.md.
// Look: near-black, chat bubbles floating without a phone, big serif numbers, tiny letter-spaced labels.
// Shots: four years scrolling (C) → chat left, words right (A) → every day the same (wall of columns)
//        → 老周: big clock left, chat right (B) → title (D) → sea of words (G, C) → chapter 01 (F) → drops (G).

// ---------------------------------------------------------------- chat data

// Four years with 小鹿, oldest first. Messages get shorter as the years go by.
const LOVE = (() => {
  const early = [
    ['them', '今天第一次见你就紧张到把奶茶洒了，你是不是笑我了！！'], ['me', '没有！我是觉得你好可爱哈哈哈'],
    ['them', '你猜我在楼下看到了什么，一只橘猫在追自己的尾巴转了十几圈'], ['me', '想你'],
    ['me', '我们周末去看海吧！我查好了路线'], ['them', '晚安呀，今天超开心，明天还想见你'], ['me', '我刚刚做梦梦到你了，你在梦里请我吃火锅'],
    ['them', '我跟你说一件超好笑的事，我们组长今天把咖啡倒进了打印机里'],
  ];
  const mid = [['them', '晚上吃什么？'], ['me', '随便，都行'], ['me', '我下班了'], ['them', '好累'], ['me', '你先睡'], ['them', '记得带伞'], ['them', '周末去哪']];
  const late = [['them', '到了吗'], ['me', '到了'], ['them', '嗯'], ['me', '好'], ['them', '晚安'], ['me', '嗯嗯']];
  const items = [];
  const months = ['2022年10月', '2022年12月', '2023年3月', '2023年6月', '2023年9月', '2024年1月', '2024年5月', '2024年8月', '2025年1月', '2025年4月', '2025年7月', '2025年11月', '2026年3月', '2026年7月'];
  months.forEach((m, mi) => {
    for (let d = 0; d < 2; d++) {
      items.push({ date: `${m}${3 + Math.floor(hash(mi * 9 + d) * 25)}日  ${20 + d}:${String(Math.floor(hash(mi + d) * 60)).padStart(2, '0')}` });
      const k = mi / months.length, pool = k < .35 ? early : k < .7 ? mid : late, n = 3 + Math.floor(hash(mi * 5 + d) * 3);
      for (let j = 0; j < n; j++) {
        const [who, text] = pool[Math.floor(hash(mi * 31 + d * 7 + j) * pool.length)];
        items.push({ who, text });
      }
    }
  });
  items.push({ date: '今天  22:41' }, { who: 'them', text: '到家了吗' }, { who: 'me', text: '到了' }, { who: 'them', text: '嗯' }, { who: 'me', text: '晚安' });
  return items;
})();

// Every day the same: the same lines, day after day.
const SAME = (() => {
  const items = [];
  for (let d = 0; d < 26; d++) {
    items.push({ date: `${1 + (d % 12)}月${3 + Math.floor(hash(d) * 25)}日  08:47` });
    items.push({ who: 'them', text: '到公司了' }, { who: 'me', text: '嗯' }, { who: 'me', text: '吃了吗' }, { who: 'them', text: '吃了' }, { who: 'them', text: '到家了' }, { who: 'me', text: '早点睡' }, { who: 'them', text: '晚安' });
  }
  return items;
})();

// 老周: four months of silence, then one “在吗” and the night runs away.
const T_D = 10.4;
const FRIEND = [
  { date: '2026年6月12日  20:03' }, { who: 'them', text: '下次回来请你吃饭！' }, { who: 'me', text: '好啊，一言为定' },
  { date: '今天  21:47', at: T_D + 2.2 },
  { who: 'them', text: '在吗', at: T_D + 2.4 },
  { who: 'me', text: '在！！', at: T_D + 2.9 },
  { who: 'them', text: '跟你说个事，我辞职了', at: T_D + 3.4 },
  { who: 'me', text: '？？？什么时候', at: T_D + 3.8 },
  { who: 'them', text: '上个月。现在在大理开了个小民宿', at: T_D + 4.2 },
  { who: 'them', text: '你还记得大二说要去的洱海吗', at: T_D + 4.6 },
  { who: 'them', text: '我真的去了', at: T_D + 4.95 },
  { who: 'me', text: '等等，我要从头听', at: T_D + 5.3 },
  { who: 'them', text: '说来话长', at: T_D + 5.65 },
  { who: 'me', text: '那就慢慢说', at: T_D + 5.95 },
];

// ---------------------------------------------------------------- sea of words

const SEA = makeSea({
  big: [['嗯', 210, 760, 470], ['到了吗', 92, 1240, 300], ['晚安', 104, 470, 250], ['哈哈', 80, 1290, 640], ['吃了吗', 62, 380, 700], ['好', 86, 1600, 230], ['在吗', 56, 980, 790], ['到家了吗', 48, 620, 900]],
  fill: ['下班了', '好累', '今天吃什么', '随便', '都行', '等我', '快到了', '你先睡', '收到', '晚点说', '在开会', '好的', '记得带伞', '外卖到了', '周末去哪', '嗯嗯', '知道了', '路上小心', '早', '想你', '哈哈哈哈', '睡了吗', '在路上', '买了', '没事', '行'],
  hidden: [['其实那天很想被抱一下', -150, -70], ['最近有点害怕变老', 120, -10], ['想重新开始弹琴', -60, 50], ['想过辞职', 170, 95], ['那天在地铁上哭了一次', -170, 130]],
  corner: { x: 1560, y: 860 },
});

// ---------------------------------------------------------------- timeline

const T_B = 3.2, T_C = 7.8, T_TITLE = 16.8, T_SEA = 19.8, T_CH = 27.0, DUR = 33.0;

function drawFrame(ctx, t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
  ctx.fillStyle = COL.bg0; ctx.fillRect(0, 0, W, H);

  if (t < T_D) loveScene(ctx, t);
  if (t >= T_D - .2 && t < T_TITLE + .3) friendScene(ctx, t);
  if (t >= T_TITLE && t < T_SEA + .4) titleScene(ctx, t);
  if (t >= T_SEA && t < T_CH + .5) seaScene(ctx, t);
  if (t >= T_CH) chapterScene(ctx, t);

  const black = 1 - seg(t, 0, .7) + seg(t, DUR - .9, DUR);
  if (black > 0) { ctx.fillStyle = `rgba(0,0,0,${clamp(black)})`; ctx.fillRect(0, 0, W, H); }
  finish(ctx, t);
}

// Scroll position through the four years: fast in the middle, settling at the newest messages.
const loveScroll = t => 1 - easeInOut(seg(t, .2, 3.0));

// 0-1, 0-2 and the wall of identical days.
function loveScene(ctx, t) {
  const out = 1 - seg(t, T_D - .5, T_D);
  ctx.save(); ctx.globalAlpha = out;
  backdrop(ctx, { t });

  // The single column: centred while scrolling, then slides to the left half.
  const slide = easeInOut(seg(t, T_B, T_B + 1.0));
  const cx = lerp(660, 170, slide), wall = easeInOut(seg(t, T_C, T_C + 1.1));
  if (t < T_C + 1.2) {
    // Motion trails while the history flies past.
    const v = Math.abs(loveScroll(t) - loveScroll(t - .05));
    for (let g = 3; g >= 1 && v > .004; g--) chatColumn(ctx, { t, x: cx, w: 600, top: 40, bot: 1040, items: LOVE, scroll: loveScroll(t - g * .03), a: .14 * Math.min(1, v * 60) });
    chatColumn(ctx, { t, x: cx, w: 600, top: 40, bot: 1040, items: LOVE, scroll: loveScroll(t), a: 1 - wall });
  }
  label(ctx, '与 小鹿 的聊天记录', { t, t0: .4, out: T_B, x: 90, y: 92, size: 16 });

  // Right side: the divider and the words that are left.
  const rightOut = T_C - .4;
  if (t > T_B + .5 && t < T_C + .2) {
    const dl = easeInOut(seg(t, T_B + .6, T_B + 1.4)) * (1 - seg(t, rightOut, rightOut + .5));
    ctx.fillStyle = COL.line; ctx.fillRect(900, 540 - 380 * dl, 1, 760 * dl);
  }
  narr(ctx, '我们每天都在聊。', { t, t0: T_B + 1.1, out: rightOut, x: 1010, y: 470, size: 50 });
  narr(ctx, '四年过去，聊天记录里只剩下：', { t, t0: T_B + 2.1, out: rightOut, x: 1012, y: 548, size: 32, weight: 400, color: COL.dim, stagger: .035 });
  narr(ctx, '到了。嗯。晚安。', { t, t0: T_B + 3.0, out: rightOut, x: 1010, y: 668, size: 70, weight: 400, stagger: .16, tail: .75 });
  label(ctx, '第  1460  天', { t, t0: T_B + 3.3, out: rightOut, x: 1014, y: 750, size: 16 });

  // The wall: the column multiplies into identical days, ghosted like a double exposure.
  if (wall > 0) {
    for (let i = 0; i < 5; i++) {
      const x = lerp(cx, 50 + i * 376, wall);
      const scroll = .85 - (t - T_C) * .055 - i * .013;
      for (const [dx, a] of [[0, .9], [7, .22], [-5, .12]]) {
        ctx.save(); ctx.globalAlpha *= wall * a;
        chatColumn(ctx, { t, x: x + dx, w: 330, top: 30, bot: 1050, items: SAME, scroll, fade: 160 });
        ctx.restore();
      }
    }
    // Day counter over the wall.
    const days = Math.round(lerp(15, 1460, easeIn(seg(t, T_C + .6, T_D - .7))));
    const ca = seg(t, T_C + .5, T_C + 1.0);
    if (ca > 0) {
      const g = ctx.createLinearGradient(0, 360, 0, 720);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.5, `rgba(0,0,0,${.88 * ca})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 360, W, 360);
      narr(ctx, `第 ${days} 天`, { t, t0: T_C + .5, x: W / 2, y: 570, size: 120, align: 'center', stagger: 0, halo: true });
      label(ctx, '每 一 天 ， 都 长 得 一 样', { t, t0: T_C + 1.2, x: W / 2, y: 640, size: 18, align: 'center', spacing: 4 });
    }
  }
  ctx.restore();
}

// 0-3, 0-4: 老周. Left: how long since we last talked, then a clock that runs to 2 a.m. Right: the chat.
function friendScene(ctx, t) {
  const d = t - T_D, a = seg(d, 0, .6) * (1 - seg(t, T_TITLE - .5, T_TITLE + .2));
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a;
  backdrop(ctx, { t, cx: W * .3 });
  ctx.fillStyle = COL.line; ctx.fillRect(980, 150, 1, 780);
  chatColumn(ctx, { t, x: 1080, w: 640, top: 90, bot: 1000, items: FRIEND, scroll: 0 });
  label(ctx, '老 周', { t, t0: T_D + .3, x: 1080, y: 112, size: 16, color: COL.faint });

  // Phase 1: silence.
  const p1out = T_D + 2.0;
  label(ctx, '上 一 次 聊 天', { t, t0: T_D + .4, out: p1out, x: 150, y: 360, size: 17 });
  narr(ctx, '127 天前', { t, t0: T_D + .6, out: p1out, x: 140, y: 540, size: 170, stagger: .08 });
  narr(ctx, '我和他，四个月没说过话。', { t, t0: T_D + 1.0, out: p1out, x: 148, y: 650, size: 40, color: COL.dim, stagger: .04 });

  // Phase 2: the clock runs while the messages pour in.
  if (d > 2.4) {
    const m0 = 21 * 60 + 47, m1 = 26 * 60 + 14, m = Math.round(lerp(m0, m1, easeIn(seg(d, 3.2, 6.2)))) % (24 * 60);
    const clock = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
    label(ctx, '此 刻', { t, t0: T_D + 2.5, x: 150, y: 360, size: 17 });
    ctx.save();
    ctx.globalAlpha *= seg(d, 2.5, 3.0);
    ctx.font = `500 190px ${SERIF}`; ctx.fillStyle = COL.ink; ctx.textBaseline = 'alphabetic';
    ctx.shadowColor = 'rgba(243,217,166,.25)'; ctx.shadowBlur = 40;
    ctx.fillText(clock, 140, 545);
    ctx.restore();
    narr(ctx, '四个月没说话，', { t, t0: T_D + 3.3, x: 148, y: 650, size: 40, stagger: .05 });
    narr(ctx, '一开口，就停不下来。', { t, t0: T_D + 4.4, x: 148, y: 716, size: 40, stagger: .06, tail: .6 });
  }
  ctx.restore();
}

// 0-5: the title.
function titleScene(ctx, t) {
  const a = seg(t, T_TITLE, T_TITLE + .5) * (1 - seg(t, T_SEA - .4, T_SEA + .3));
  ctx.save(); ctx.globalAlpha = a; backdrop(ctx, { t, lift: .6 }); ctx.restore();
  label(ctx, '一 部 关 于 聊 天 记 录 的 短 片', { t, t0: T_TITLE + .3, out: T_SEA - .5, x: W / 2, y: 410, size: 16, align: 'center', spacing: 3 });
  narr(ctx, '留白', { t, t0: T_TITLE + .4, out: T_SEA - .5, x: W / 2, y: 590, size: 180, align: 'center', stagger: .35, glow: COL.warm });
  narr(ctx, '为什么最亲的人话越来越少，普通朋友却总有得聊', { t, t0: T_TITLE + 1.3, out: T_SEA - .5, x: W / 2, y: 690, size: 28, weight: 400, align: 'center', color: COL.dim, stagger: .025 });
}

// 2-1 … 2-3: words burst out (G), the sea (C), then the camera drifts to the dim corner (C).
function seaScene(ctx, t) {
  const s = t - T_SEA, a = seg(s, 0, .5) * (1 - seg(t, T_CH - .3, T_CH + .4));
  ctx.save(); ctx.globalAlpha = a;
  backdrop(ctx, { t, stars: 1, lift: .7 });
  const push = easeInOut(seg(s, 4.6, 6.9));
  const cam = { x: lerp(960, 1560, push), y: lerp(540, 860, push), z: lerp(1 + seg(s, 0, 4.6) * .06, 2.7, push) };
  wordSea(ctx, { t, words: SEA, cam, burst: { x: W / 2, y: H / 2, t0: T_SEA + .1 }, focus: push });
  ctx.restore();
  const ride = easeOut(seg(s, .2, 1.8));
  narr(ctx, '四年，我们说过十几万句话。', { t, t0: T_SEA + .4, out: T_SEA + 2.7, x: W / 2, y: lerp(620, 1000, ride), size: 44, align: 'center', halo: true });
  narr(ctx, '说得最多的，是“嗯”。', { t, t0: T_SEA + 3.0, out: T_SEA + 4.5, x: 900, y: 580, size: 48, halo: true });
  narr(ctx, '真正想说的，散落在角落里。', { t, t0: T_SEA + 6.6, out: T_CH - .6, x: W / 2, y: 150, size: 42, align: 'center', halo: true });
}

// 3-1, 3-2: chapter card 01 (F), then the daily cups with the narration falling in with the first drop (G).
function chapterScene(ctx, t) {
  const c = t - T_CH;
  ctx.save(); ctx.globalAlpha = seg(c, 0, .6); backdrop(ctx, { t }); ctx.restore();
  chapterCard(ctx, { t, t0: T_CH + .2, out: T_CH + 2.5, num: '01', title: '新鲜事，是慢慢长出来的', sub: '天天在一起的人，为什么越聊越少？' });
  const dk = seg(c, 1.4, 2.4);
  if (dk > 0 && dk < 1) drop(ctx, 1560, lerp(520, 900, easeIn(dk)), 9, 1 - seg(dk, .85, 1));
  if (c > 2.7) {
    dailyCups(ctx, { t, t0: T_CH + 2.9, n: 7, x: 820, y: 800, gap: 160, dayDur: .42 });
    const fall = easeOut(seg(c, 2.9, 3.8));
    narr(ctx, '天天在一起，', { t, t0: T_CH + 2.9, x: 150, y: lerp(330, 460, fall), size: 50, stagger: .05 });
    narr(ctx, '每天那一点新鲜事，', { t, t0: T_CH + 3.4, x: 150, y: lerp(410, 540, fall), size: 50, stagger: .05 });
    narr(ctx, '当天就说完了。', { t, t0: T_CH + 4.5, x: 150, y: 660, size: 50, color: COL.warm, stagger: .07 });
  }
}

// ---------------------------------------------------------------- sound cues (audio.mjs)

const CUES = (() => {
  const c = [];
  for (let i = 0; i < 46; i++) { const k = i / 46; c.push({ t: .2 + 2.8 * (k < .5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2), kind: 'tick', pitch: k }); }
  c.push({ t: T_B + .05, kind: 'whoosh' }, { t: T_C, kind: 'whoosh' });
  // The wall: soft ticks speeding up with the day counter.
  for (let i = 0; i < 22; i++) c.push({ t: T_C + .6 + (T_D - 1.3 - T_C) * (1 - (1 - i / 22) ** .5), kind: 'tick', pitch: .2 + i / 30 });
  FRIEND.filter(m => m.at && m.who).forEach(m => c.push({ t: m.at, kind: m.who === 'me' ? 'send' : 'ding' }));
  c.push({ t: T_TITLE + .4, kind: 'boom' }, { t: T_TITLE + .45, kind: 'chord', notes: [146.8, 220, 293.7, 370] });
  c.push({ t: T_SEA + .15, kind: 'shimmer' });
  c.push({ t: T_SEA + 6.6, kind: 'note', f: 587.3 });
  c.push({ t: T_CH + .2, kind: 'whoosh' });
  c.push({ t: T_CH + 2.35, kind: 'drip' });
  for (let i = 0; i < 7; i++) c.push({ t: T_CH + 2.9 + i * .42 + .55, kind: 'drip', pitch: i / 7 });
  return c.sort((a, b) => a.t - b.t);
})();

// Soft piano chords: [time, notes]. None during 老周's messages so the notifications carry it.
const PAD = [
  [0.2, [110, 164.8, 261.6]], [4.2, [98, 146.8, 246.9]], [8.2, [87.3, 130.8, 220]],
  [T_SEA, [110, 164.8, 246.9]], [T_SEA + 4, [87.3, 130.8, 220]], [T_CH, [98, 146.8, 246.9]], [T_CH + 3.5, [110, 164.8, 261.6]],
];

const CUT = { dur: DUR, cues: CUES, pad: PAD, drawFrame };
