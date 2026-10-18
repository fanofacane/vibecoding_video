// sample.js: a ~30 s sample of 《留白》 — the cold open, the title, the sea of words, and the start of chapter 01.
// Storyboard: creative_materials/2026-10-18_留白_分镜草案/分镜脚本.md (shots 0-1 … 0-5, 2-1 … 2-3, 3-1, 3-2).
// Layouts used: C full screen → A text left → B text right → C overflow → D title → G follow → C sea → F chapter → G drop.

// ---------------------------------------------------------------- chat data

// Four years with 小鹿, oldest first. Messages get shorter as the years go by.
const LOVE = (() => {
  const early = [
    ['them', '今天第一次见你就紧张到把奶茶洒了，你是不是笑我了！！'], ['me', '没有！我是觉得你好可爱哈哈哈'],
    ['them', '你猜我在楼下看到了什么'], ['them', { image: true }], ['me', '想你想你想你'], ['them', { voice: 14 }],
    ['me', '我们周末去看海吧！我查好了路线'], ['them', '晚安呀，今天超开心，明天还想见你'], ['me', '我刚刚做梦梦到你了，你在梦里请我吃火锅'],
    ['them', '我跟你说一件超好笑的事，我们组长今天把咖啡倒进了打印机里'],
  ];
  const mid = [['them', '晚上吃什么？'], ['me', '随便，都行'], ['me', '我下班了'], ['them', '好累'], ['me', '你先睡'], ['them', '记得带伞'], ['me', { voice: 4 }], ['them', '周末去哪']];
  const late = [['them', '到了吗'], ['me', '到了'], ['them', '嗯'], ['me', '好'], ['them', '收到'], ['me', '嗯嗯']];
  const items = [];
  const months = ['2022年10月', '2022年12月', '2023年3月', '2023年6月', '2023年9月', '2024年1月', '2024年5月', '2024年8月', '2025年1月', '2025年4月', '2025年7月', '2025年11月', '2026年3月', '2026年7月'];
  months.forEach((m, mi) => {
    for (let d = 0; d < 3; d++) {
      items.push({ date: `${m}${3 + Math.floor(hash(mi * 9 + d) * 25)}日` });
      const k = mi / months.length, pool = k < .35 ? early : k < .7 ? mid : late, n = 3 + Math.floor(hash(mi * 5 + d) * 3);
      for (let j = 0; j < n; j++) {
        const [who, x] = pool[Math.floor(hash(mi * 31 + d * 7 + j) * pool.length)];
        items.push(typeof x === 'string' ? { who, text: x } : { who, ...x });
      }
    }
  });
  items.push({ date: '今天 22:41' }, { who: 'them', text: '到家了吗' }, { who: 'me', text: '到了' }, { who: 'them', text: '嗯' }, { who: 'me', text: '晚安' });
  return items;
})();

const FRIEND = [
  { date: '6月12日' }, { who: 'them', text: '下次回来请你吃饭！' }, { who: 'me', text: '好啊，一言为定' }, { who: 'them', image: true },
  { date: '今天 21:47', at: 10.2 },
  { who: 'them', text: '在吗？跟你说个事', at: 10.4 },
  { who: 'them', text: '我辞职了！！', at: 11.0 },
  { who: 'them', text: '现在在大理开了个小民宿', at: 11.4 },
  { who: 'them', text: '你还记得大二说要去的洱海吗', at: 11.8 },
  { who: 'them', text: '我真的去了', at: 12.15 },
];

// Messages that overflow the phone and spill across the screen.
const SPILL = [
  ['还养了只狗，叫“学分”', 300, 200], ['哈哈哈因为当年挂科', 1460, 170], ['对了老王结婚了你知道吗', 180, 470],
  ['我上个月还去爬了雪山', 1520, 420], ['山顶冷到怀疑人生', 330, 760], ['你最近怎么样？？', 1430, 690],
  ['有好多事想跟你说', 760, 150], ['下个月我回来！', 860, 930], ['还记得那家烧烤吗', 1600, 930], ['老板还认得我', 120, 960],
];

// ---------------------------------------------------------------- sea of words

const SEA = makeSea({
  big: [['嗯', 210, 760, 470], ['到了吗', 96, 1240, 300], ['晚安', 110, 470, 250], ['哈哈', 84, 1290, 640], ['吃了吗', 64, 380, 700], ['好', 90, 1600, 230], ['在吗', 58, 980, 790], ['到家了吗', 50, 620, 900]],
  fill: ['下班了', '好累', '今天吃什么', '随便', '都行', '等我', '快到了', '你先睡', '收到', '晚点说', '在开会', '好的', '记得带伞', '外卖到了', '周末去哪', '嗯嗯', '知道了', '路上小心', '早', '想你', '哈哈哈哈', '睡了吗', '在路上', '买了', '没事', '行'],
  hidden: [['其实那天很想被抱一下', -150, -70], ['最近有点害怕变老', 120, -10], ['想重新开始弹琴', -60, 50], ['想过辞职', 170, 95], ['那天在地铁上哭了一次', -170, 130]],
  corner: { x: 1560, y: 860 },
});

// ---------------------------------------------------------------- timeline

const DUR = 33.6;

function drawFrame(ctx, t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
  ctx.fillStyle = COL.sky0; ctx.fillRect(0, 0, W, H);

  if (t < 15.1) openScene(ctx, t);
  if (t >= 14.9 && t < 18.6) titleScene(ctx, t);
  if (t >= 18.0 && t < 27.4) seaScene(ctx, t);
  if (t >= 26.9) chapterScene(ctx, t);

  // Fade in from black at the start, out at the end.
  const black = 1 - seg(t, 0, .6) + seg(t, DUR - .8, DUR);
  if (black > 0) { ctx.fillStyle = `rgba(0,0,0,${clamp(black)})`; ctx.fillRect(0, 0, W, H); }
  finish(ctx, t);
}

// 0-1 … 0-4: 小鹿's phone scrolls through four years (C), slides right (A), pan to 老周 (B), overflow (C).
function openScene(ctx, t) {
  const camX = easeInOut(seg(t, 6.6, 7.6)) * W;
  const fadeOut = 1 - seg(t, 14.4, 15.1);
  ctx.save(); ctx.globalAlpha = fadeOut;
  sky(ctx, { t, bright: .55 });

  // 小鹿: centred and big while the history flies past, then slides to the right.
  const slide = easeInOut(seg(t, 2.7, 3.7));
  const lx = lerp(W / 2, 1300, slide) - camX;
  if (lx > -400) {
    phone(ctx, {
      t, cx: lx, cy: 540, s: lerp(1.12, 1.0, slide), name: '小鹿 ❤', accent: COL.partner, avatar: '鹿',
      items: LOVE, scroll: 1 - easeInOut(seg(t, .25, 3.0)),
    });
    narr(ctx, '我们每天都在聊。', { t, t0: 3.8, x: 210 - camX, y: 545, size: 66 });
    narr(ctx, '四年，十几万条消息。', { t, t0: 5.0, x: 214 - camX, y: 625, size: 30, weight: 400, color: COL.dim, stagger: .04 });
  }

  // 老周: on the left after the pan; then the messages start and spill out of the phone.
  const spill = seg(t, 12.3, 13.3);
  const fx = lerp(620, W / 2, easeInOut(spill)) + W - camX;
  if (fx < W + 400) {
    const typing = t > 10.6;
    phone(ctx, {
      t, cx: fx, cy: 540, s: lerp(1.0, 1.06, easeInOut(spill)), name: '老周', accent: COL.friend, avatar: '周',
      items: FRIEND, scroll: 0, typing, sub: typing ? '对方正在输入…' : null, glow: 1 + spill,
    });
    narr(ctx, '我和他，四个月没说过话。', { t, t0: 7.9, out: 11.3, x: 1030 + W - camX, y: 545, size: 60 });
    narr(ctx, '上一次聊天：6 月 12 日', { t, t0: 9.0, out: 11.3, x: 1034 + W - camX, y: 625, size: 30, weight: 400, color: COL.dim, stagger: .04 });
    // Spilled bubbles pop up all over the screen and drift upward.
    SPILL.forEach(([text, x, y], i) => {
      const t0 = 12.35 + i * .2, k = seg(t, t0, t0 + .35);
      if (k <= 0) return;
      looseBubble(ctx, text, x, y - (t - t0) * 14, { s: backOut(k) * 1.4, a: k, accent: COL.friend, avatar: '周' });
    });
  }
  ctx.restore();
}

// 0-5: the title on black, with a few stars.
function titleScene(ctx, t) {
  const a = seg(t, 14.9, 15.4) * (1 - seg(t, 17.9, 18.6));
  ctx.save(); ctx.globalAlpha = a;
  sky(ctx, { t, bright: .35, cy: H * .5 });
  ctx.restore();
  narr(ctx, '留白', { t, t0: 15.2, out: 17.9, x: W / 2, y: 560, size: 190, align: 'center', stagger: .35, glow: COL.warm });
  narr(ctx, '为什么最亲的人话越来越少，普通朋友却总有得聊', { t, t0: 16.1, out: 17.9, x: W / 2, y: 660, size: 32, weight: 400, align: 'center', color: COL.dim, stagger: .025 });
}

// 2-1 … 2-3: the chat breaks into words (G), the sea of stars (C), the camera drifts to the dim corner (C).
function seaScene(ctx, t) {
  const a = seg(t, 18.0, 18.5) * (1 - seg(t, 26.8, 27.4));
  ctx.save(); ctx.globalAlpha = a;
  sky(ctx, { t, drift: 3 });
  const push = easeInOut(seg(t, 22.9, 25.2));
  const cam = { x: lerp(960, 1560, push), y: lerp(540, 860, push), z: lerp(1 + seg(t, 18, 23) * .06, 2.7, push) };
  wordSea(ctx, { t, words: SEA, cam, burst: { x: W / 2, y: H / 2, t0: 18.2 }, focus: push });
  ctx.restore();
  // Narration rides out with the fragments, then sits beside “嗯”, then a caption at the bottom.
  const ride = easeOut(seg(t, 18.4, 20.0));
  narr(ctx, '四年，我们说过十几万句话。', { t, t0: 18.6, out: 20.9, x: W / 2, y: lerp(620, 1000, ride), size: 46, align: 'center', halo: true });
  narr(ctx, '说得最多的，是“嗯”。', { t, t0: 21.2, out: 22.8, x: 900, y: 580, size: 50, halo: true });
  narr(ctx, '真正想说的，散落在角落里。', { t, t0: 25.0, out: 26.6, x: W / 2, y: 150, size: 44, align: 'center', color: COL.ink, halo: true });
}

// 3-1, 3-2: chapter card 01 (F), then the daily cups with the narration falling in with the first drop (G).
function chapterScene(ctx, t) {
  const a = seg(t, 26.9, 27.5);
  ctx.save(); ctx.globalAlpha = a;
  sky(ctx, { t, bright: .5 });
  ctx.restore();
  chapterCard(ctx, { t, t0: 27.2, out: 29.6, num: '01', title: '新鲜事，是慢慢长出来的', sub: '天天在一起的人，为什么越聊越少？' });
  // A drop teases the next shot in the lower right of the card.
  const dk = seg(t, 28.4, 29.4);
  if (dk > 0 && dk < 1) drop(ctx, 1560, lerp(520, 900, easeIn(dk)), 10, 1 - seg(dk, .85, 1));
  if (t > 29.8) {
    dailyCups(ctx, { t, t0: 30.0, n: 7, x: 820, y: 800, gap: 160, dayDur: .42 });
    const fall = easeOut(seg(t, 30.0, 30.9));
    narr(ctx, '天天在一起，', { t, t0: 30.0, x: 150, y: lerp(330, 460, fall), size: 52, stagger: .05 });
    narr(ctx, '每天那一点新鲜事，', { t, t0: 30.5, x: 150, y: lerp(410, 540, fall), size: 52, stagger: .05 });
    narr(ctx, '当天就说完了。', { t, t0: 31.6, x: 150, y: 660, size: 52, color: COL.warm, stagger: .07 });
  }
}

// ---------------------------------------------------------------- sound cues (audio.mjs)

const CUES = (() => {
  const c = [];
  // Scroll ticks: dense in the middle of the fast scroll.
  for (let i = 0; i < 46; i++) { const k = i / 46; c.push({ t: .3 + 2.7 * (k < .5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2), kind: 'tick', pitch: k }); }
  c.push({ t: 2.75, kind: 'whoosh' }, { t: 6.65, kind: 'whoosh' });
  FRIEND.filter(m => m.at && m.who).forEach(m => c.push({ t: m.at, kind: 'ding' }));
  SPILL.forEach((_, i) => c.push({ t: 12.35 + i * .2, kind: 'ding', pitch: i / SPILL.length }));
  c.push({ t: 15.15, kind: 'boom' }, { t: 15.2, kind: 'chord', notes: [174.6, 261.6, 329.6, 440] });
  c.push({ t: 18.25, kind: 'shimmer' });
  c.push({ t: 25.0, kind: 'note', f: 523.3 });
  c.push({ t: 27.2, kind: 'whoosh' });
  c.push({ t: 29.25, kind: 'drip' });
  for (let i = 0; i < 7; i++) c.push({ t: 30.0 + i * .42 + .55, kind: 'drip', pitch: i / 7 });
  return c.sort((a, b) => a.t - b.t);
})();

// Soft piano chords under everything: [time, notes]. Silent during the overflow so the dings carry it.
const PAD = [
  [0.2, [130.8, 196, 329.6]], [4.2, [110, 164.8, 261.6]], [8.2, [116.5, 174.6, 293.7]],
  [18.2, [130.8, 196, 311.1]], [22.2, [103.8, 155.6, 261.6]], [26.4, [116.5, 174.6, 293.7]], [30.4, [130.8, 196, 329.6]],
];

const CUT = { dur: DUR, cues: CUES, pad: PAD, drawFrame };
