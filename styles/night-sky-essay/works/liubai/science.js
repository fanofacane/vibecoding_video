// science.js: sample of the explainer half of 《留白》 (storyboard v7, sections 2–5), about 50 s.
//   0:00  dark: messages as blocks, coloured by what they carry; “a common explanation”
//   0:09  the blocks flip, the frame turns white
//   0:10  Gottman: bids that were turned toward, 86 % vs 33 %
//   0:25  the formula: topics ≈ new information × curiosity × ease
//   0:30  new information needs time: daily contact (saw-tooth) vs once in three months (one long ramp)
//   0:41  Granovetter 1973: who passed on the job lead — 16.7 / 55.6 / 27.8 %
// Charts and moving type only. Real study numbers carry their source; story numbers say 片中示例; shapes say 示意.

const S1 = 9.0, S2 = 10.4, S3 = 25.0, S4 = 30.0, S5 = 41.0, DUR = 52.0;

// White-side palette.
const P = { bg: '#eceef1', bg2: '#f6f7f9', ink: '#1c1e23', dim: '#878b94', faint: '#c9ccd2', blue: '#3d6cf0', pill: '#25272c' };

// ================================================================ helpers

const tag = (ctx, t, text, t0, x, y, o = {}) => label(ctx, text, { t, t0, x, y, size: 15, spacing: 2, color: P.dim, ...o });
const count = (t, t0, t1, to, dec = 0) => (to * easeOut(seg(t, t0, t1))).toFixed(dec);

function whiteBackdrop(ctx) {
  const g = ctx.createRadialGradient(W * .5, H * .45, 100, W * .5, H * .5, W * .75);
  g.addColorStop(0, P.bg2); g.addColorStop(1, P.bg);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

// Serif number that counts up, e.g. 86%.
function bigNumber(ctx, text, x, y, size, color, a = 1) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  ctx.font = `400 ${size}px ${SERIF}`; ctx.fillStyle = color; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  ctx.fillText(text, x, y);
  ctx.restore();
}

// ================================================================ section 2: blocks (dark)

// One block = 10 messages. Lovers: 4200 blocks over 1460 days; the share that only “keeps in touch” grows.
const LB = { x: 880, y: 560, cols: 140, rows: 30, cell: 6.4 };
const FB = { x: 880, y: 380, n: 19 };
const maintainShare = day => clamp(.15 + .8 * (day / 1460) ** .7, 0, .96);

function sceneBlocks(ctx, t) {
  backdrop(ctx, { t, lift: .5 });
  const a = 1;
  // Labels.
  label(ctx, '老 朋 友', { t, t0: .4, x: FB.x, y: FB.y - 22, size: 16, color: COL.ink, spacing: 3 });
  label(ctx, `1 个 晚 上  ·  ${count(t, .6, 2.2, 186)} 条`, { t, t0: .6, x: FB.x + 110, y: FB.y - 22, size: 15, color: COL.dim, spacing: 1.5 });
  label(ctx, '恋 人', { t, t0: .8, x: LB.x, y: LB.y - 22, size: 16, color: COL.ink, spacing: 3 });
  label(ctx, `1460 天  ·  约 ${Number(count(t, 1.0, 3.2, 42000)).toLocaleString('en-US')} 条`, { t, t0: 1.0, x: LB.x + 90, y: LB.y - 22, size: 15, color: COL.dim, spacing: 1.5 });
  label(ctx, '每 格 = 10 条 消 息  ·  片 中 示 例', { t, t0: 1.4, x: LB.x + LB.cols * LB.cell, y: LB.y + LB.rows * LB.cell + 70, size: 13, color: COL.faint, align: 'right' });
  // Friend: a short band, every message new.
  for (let i = 0; i < FB.n; i++) {
    const k = seg(t, .6 + i * .05, .9 + i * .05); if (k <= 0) continue;
    ctx.globalAlpha = a * k; ctx.fillStyle = COL.ink;
    ctx.fillRect(FB.x + (i % 19) * LB.cell, FB.y + Math.floor(i / 19) * LB.cell, LB.cell - 1.4, LB.cell - 1.4);
  }
  // Lovers: blocks fill in column by column (days), then a sweep colours what each one carried.
  const sweep = seg(t, 3.6, 7.0);
  for (let c = 0; c < LB.cols; c++) {
    const day = (c + .5) / LB.cols * 1460, show = seg(t, 1.0 + c * .016, 1.3 + c * .016);
    if (show <= 0) continue;
    const coloured = sweep * LB.cols > c;
    for (let r = 0; r < LB.rows; r++) {
      const isMaint = hash(c * 31 + r * 7) < maintainShare(day);
      ctx.globalAlpha = a * show * (coloured ? 1 : .55);
      ctx.fillStyle = coloured && isMaint ? P.blue : COL.ink;
      ctx.fillRect(LB.x + c * LB.cell, LB.y + r * LB.cell, LB.cell - 1.4, LB.cell - 1.4);
    }
  }
  ctx.globalAlpha = 1;
  // Line above the band: share of messages with something new in them.
  const lk = seg(t, 3.8, 7.0);
  if (lk > 0) {
    ctx.save(); ctx.strokeStyle = COL.ink; ctx.lineWidth = 2; ctx.beginPath();
    const y0 = LB.y - 60, hgt = 90;
    for (let c = 0; c <= LB.cols * lk; c++) {
      const day = c / LB.cols * 1460, v = 1 - maintainShare(day), x = LB.x + c * LB.cell, y = y0 - hgt * v + 40;
      c ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke(); ctx.restore();
    label(ctx, '带 新 内 容 的 消 息 占 比', { t, t0: 4.0, x: LB.x, y: LB.y - 118, size: 13, color: COL.dim });
  }
  // Bracket under the blue part.
  const bk = easeOut(seg(t, 6.4, 7.2));
  if (bk > 0) {
    const x0 = LB.x + LB.cols * LB.cell * .3, x1 = LB.x + LB.cols * LB.cell, yb = LB.y + LB.rows * LB.cell + 14;
    ctx.strokeStyle = P.blue; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x0, yb - 6); ctx.lineTo(x0, yb); ctx.lineTo(lerp(x0, x1, bk), yb); if (bk > .98) ctx.lineTo(x1, yb - 6); ctx.stroke();
    label(ctx, '维 持 联 系', { t, t0: 6.8, x: (x0 + x1) / 2, y: yb + 30, size: 16, align: 'center', color: P.blue, spacing: 3 });
  }
  // Left: the common explanation.
  label(ctx, '一 个 常 见 的 解 释 ：', { t, t0: 1.6, x: 140, y: 440, size: 18, color: COL.dim });
  narr(ctx, '“到了”“嗯”“晚安”', { t, t0: 2.2, x: 136, y: 520, size: 50, stagger: .06 });
  narr(ctx, [['只是在', COL.ink], ['维持联系', P.blue], ['，', COL.ink]], { t, t0: 3.4, x: 136, y: 592, size: 50, stagger: .06 });
  narr(ctx, '不算真正的交流。', { t, t0: 4.6, x: 136, y: 664, size: 50, stagger: .06 });
  label(ctx, '语 言 学 里 叫 “ 寒 暄 交 流 ”', { t, t0: 6.2, x: 140, y: 740, size: 15, color: COL.dim });
  label(ctx, 'phatic communion  ·  Malinowski, 1923', { t, t0: 6.5, x: 140, y: 768, size: 14, color: COL.faint, spacing: 1 });
}

// ================================================================ the flip to white

// A wave of square tiles flips from left to right; each tile turns from dark to light as it turns over.
function flip(ctx, t) {
  const k = seg(t, S1, S2), cs = 120;
  for (let gx = 0; gx < W / cs; gx++) for (let gy = 0; gy < Math.ceil(H / cs); gy++) {
    const d = (gx / (W / cs)) * .7 + hash(gx * 13 + gy) * .15, p = seg(k, d, d + .25);
    if (p <= 0) continue;
    const sy = Math.abs(Math.cos(Math.PI * p));
    ctx.fillStyle = p < .5 ? '#15161a' : P.bg;
    ctx.fillRect(gx * cs, gy * cs + cs / 2 * (1 - sy), cs + 1, cs * sy + 1);
  }
}

// ================================================================ section 3: Gottman

// 100 bids per group, laid out 10 × 10. Caught bids get a blue dot.
function bidGrid(ctx, t, x0, y0, rate, t0, seed) {
  const order = Array.from({ length: 100 }, (_, i) => i).sort((a, b) => hash(a + seed) - hash(b + seed));
  const caught = new Set(order.slice(0, rate));
  for (let i = 0; i < 100; i++) {
    const c = i % 10, r = Math.floor(i / 10), x = x0 + c * 50, y = y0 + r * 30;
    const k = easeOut(seg(t, t0 + (r * 10 + c) * .012, t0 + (r * 10 + c) * .012 + .3));
    if (k <= 0) continue;
    ctx.save(); ctx.globalAlpha = k;
    roundRect(ctx, x, y, 34 * k, 12, 6); ctx.fillStyle = P.pill; ctx.fill();
    ctx.restore();
    // Dots light up in random order, at a steady pace, until the share is reached.
    const rank = order.indexOf(i), dt = t0 + 1.6 + rank * .028;
    if (caught.has(i) && t > dt) {
      const p = backOut(seg(t, dt, dt + .25));
      ctx.fillStyle = P.blue; ctx.beginPath(); ctx.arc(x + 42, y + 6, 4.2 * p, 0, 7); ctx.fill();
    }
  }
}
const caughtAt = (t, t0, rate) => Math.min(rate, Math.max(0, Math.floor((t - t0 - 1.6) / .028) + 1));

function sceneGottman(ctx, t) {
  const out = 1 - seg(t, S3 - .6, S3);
  ctx.save(); ctx.globalAlpha *= out;
  narr(ctx, '这只说对了一半。', { t, t0: S2 + .3, x: 140, y: 150, size: 40, color: P.ink, stagger: .07 });
  tag(ctx, t, 'G O T T M A N   ·   新 婚 夫 妻 追 踪 研 究', S2 + 1.2, 142, 212);
  narr(ctx, '一方随口“搭话”时，另一方有没有接住——', { t, t0: S2 + 1.5, x: 140, y: 268, size: 34, color: P.ink, stagger: .035 });
  narr(ctx, '6 年后回访：', { t, t0: S2 + 2.9, x: 140, y: 318, size: 34, color: P.ink, stagger: .05 });
  // Legend.
  ctx.save(); ctx.globalAlpha *= seg(t, S2 + 2.6, S2 + 3.0);
  roundRect(ctx, 1520, 200, 30, 11, 5.5); ctx.fillStyle = P.pill; ctx.fill();
  ctx.fillStyle = P.blue; ctx.beginPath(); ctx.arc(1535, 232, 4, 0, 7); ctx.fill();
  ctx.restore();
  tag(ctx, t, '一 次 搭 话', S2 + 2.7, 1566, 211, { color: P.ink });
  tag(ctx, t, '被 接 住', S2 + 2.8, 1566, 238, { color: P.ink });
  // Two groups.
  const g0 = S2 + 3.4;
  tag(ctx, t, '仍 在 一 起 的 夫 妻', g0, 142, 395, { color: P.ink, size: 16 });
  tag(ctx, t, '已 经 离 婚 的 夫 妻', g0 + .4, 1002, 395, { color: P.ink, size: 16 });
  bidGrid(ctx, t, 140, 420, 86, g0, 11);
  bidGrid(ctx, t, 1000, 420, 33, g0 + .4, 47);
  const nA = caughtAt(t, g0, 86), nB = caughtAt(t, g0 + .4, 33);
  bigNumber(ctx, `${nA}%`, 670, 700, 120, P.blue, seg(t, g0 + 1.4, g0 + 1.8));
  bigNumber(ctx, `${nB}%`, 1530, 700, 120, P.ink, seg(t, g0 + 1.8, g0 + 2.2));
  tag(ctx, t, '的 搭 话 被 接 住', g0 + 1.6, 674, 732, { size: 13 });
  tag(ctx, t, '的 搭 话 被 接 住', g0 + 2.0, 1534, 732, { size: 13 });
  tag(ctx, t, '数 据 ： Gottman 实 验 室 ， 130 对 新 婚 夫 妻 ， 6 年 后 回 访', g0 + 2.6, 142, 1030, { size: 12, color: P.faint, spacing: 1 });
  narr(ctx, [['“废话”没有错，它们是关系的', P.ink], ['脉搏', P.blue], ['。', P.ink]], { t, t0: S2 + 8.4, x: 140, y: 860, size: 40, stagger: .05 });
  ctx.restore();
  // The turn: the problem is not too much small talk.
  const k = seg(t, S2 + 11.2, S2 + 11.6);
  if (k > 0) {
    ctx.save(); ctx.globalAlpha *= k * out; whiteBackdrop(ctx); ctx.restore();
    narr(ctx, '所以问题不在“废话”太多，', { t, t0: S2 + 11.6, out: S3 - .5, x: W / 2, y: 500, size: 52, align: 'center', color: P.ink, stagger: .05 });
    narr(ctx, [['而在——', P.ink], ['新东西太少', P.blue], ['。', P.ink]], { t, t0: S2 + 12.6, out: S3 - .5, x: W / 2, y: 600, size: 52, align: 'center', stagger: .08 });
  }
}

// ================================================================ section 4: the formula

function sceneFormula(ctx, t) {
  const a = seg(t, S3, S3 + .3) * (1 - seg(t, S4 - .5, S4));
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  const parts = [['话题', P.ink, 0], ['≈', P.dim, .4], ['新信息', P.blue, .8], ['×', P.dim, 1.3], ['好奇心', P.blue, 1.6], ['×', P.dim, 2.1], ['轻松', P.blue, 2.4]];
  ctx.font = `500 76px ${SERIF}`; ctx.textBaseline = 'alphabetic';
  const gap = 36, widths = parts.map(([s]) => ctx.measureText(s).width), total = widths.reduce((s, w) => s + w, 0) + gap * (parts.length - 1);
  let x = W / 2 - total / 2;
  parts.forEach(([s, c, d], i) => {
    const k = easeOut(seg(t, S3 + .3 + d, S3 + .8 + d));
    ctx.save(); ctx.globalAlpha *= k; ctx.fillStyle = c; ctx.fillText(s, x, 470 - (1 - k) * 40); ctx.restore();
    x += widths[i] + gap;
  });
  // Three empty bars for the three factors.
  [['新 信 息', 0], ['好 奇 心', 1], ['轻 松', 2]].forEach(([s, i]) => {
    const bx = 560 + i * 300, k = seg(t, S3 + 2.8 + i * .2, S3 + 3.2 + i * .2);
    ctx.save(); ctx.globalAlpha *= k;
    ctx.strokeStyle = P.faint; ctx.lineWidth = 1.5; roundRect(ctx, bx, 600, 220, 14, 7); ctx.stroke();
    ctx.restore();
    tag(ctx, t, s, S3 + 2.8 + i * .2, bx + 110, 650, { align: 'center', color: P.ink, size: 16 });
  });
  ctx.restore();
}

// ================================================================ section 5: time, and who brings the news

// Daily contact: news grows a little each day and is emptied by the evening chat. Every 90 days: one long ramp.
const AX = { x0: 220, x1: 1700, y0: 860, y1: 400, days: 90, max: 36 };
const ramp = d => 60 * (1 - Math.exp(-d / 120));
const daily = d => (d % 1) * 2.6;   // a day's worth of news, exaggerated so the teeth are visible

function sceneArea(ctx, t) {
  const a = seg(t, S4, S4 + .4) * (1 - seg(t, S5 - .6, S5));
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  const X = d => AX.x0 + (AX.x1 - AX.x0) * d / AX.days, Y = v => AX.y0 - (AX.y0 - AX.y1) * v / AX.max;
  // Axes.
  const ax = easeOut(seg(t, S4 + .2, S4 + .9));
  ctx.strokeStyle = P.ink; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(AX.x0, AX.y0); ctx.lineTo(lerp(AX.x0, AX.x1, ax), AX.y0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(AX.x0, AX.y0); ctx.lineTo(AX.x0, lerp(AX.y0, AX.y1 - 30, ax)); ctx.stroke();
  [0, 30, 60, 90].forEach((d, i) => tag(ctx, t, String(d), S4 + .5 + i * .1, X(d), AX.y0 + 34, { align: 'center', color: P.ink, size: 15 }));
  tag(ctx, t, '距 离 上 次 聊 天 的 天 数', S4 + .8, AX.x1, AX.y0 + 72, { align: 'right' });
  tag(ctx, t, '可 以 分 享 的 新 鲜 事', S4 + .8, AX.x0 - 6, AX.y1 - 48);
  tag(ctx, t, '示 意', S4 + .8, AX.x1, AX.y1 - 48, { align: 'right', color: P.faint });
  // Lines draw from left to right.
  const reveal = easeInOut(seg(t, S4 + 1.2, S4 + 5.2)) * AX.days;
  if (reveal > 0) {
    // The long ramp, with a light blue fill.
    ctx.beginPath(); ctx.moveTo(X(0), Y(0));
    for (let d = 0; d <= reveal; d += .5) ctx.lineTo(X(d), Y(ramp(d)));
    ctx.lineTo(X(reveal), Y(0)); ctx.closePath();
    ctx.fillStyle = 'rgba(61,108,240,.12)'; ctx.fill();
    ctx.beginPath(); for (let d = 0; d <= reveal; d += .5) d ? ctx.lineTo(X(d), Y(ramp(d))) : ctx.moveTo(X(d), Y(ramp(d)));
    ctx.strokeStyle = P.blue; ctx.lineWidth = 3; ctx.stroke();
    // The saw-tooth along the floor.
    ctx.beginPath(); ctx.moveTo(X(0), Y(0));
    for (let d = 0; d <= reveal; d += .05) ctx.lineTo(X(d), Y(daily(d)));
    ctx.strokeStyle = P.ink; ctx.lineWidth = 1.6; ctx.stroke();
  }
  // Annotations.
  const an1 = seg(t, S4 + 4.6, S4 + 5.0);
  if (an1 > 0) {
    ctx.save(); ctx.globalAlpha *= an1;
    ctx.fillStyle = P.ink; ctx.beginPath(); ctx.arc(X(40), Y(daily(40.95)), 4, 0, 7); ctx.fill();
    ctx.strokeStyle = P.ink; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X(40), Y(0) - 8); ctx.lineTo(X(40) + 40, Y(0) - 70); ctx.stroke();
    ctx.restore();
    tag(ctx, t, '天 天 联 系 ： 每 次 聊 天 都 清 零', S4 + 4.6, X(40) + 48, Y(0) - 76, { color: P.ink, size: 16 });
  }
  const an2 = seg(t, S4 + 5.2, S4 + 5.6);
  if (an2 > 0) {
    ctx.save(); ctx.globalAlpha *= an2;
    ctx.fillStyle = P.blue; ctx.beginPath(); ctx.arc(X(90), Y(ramp(90)), 6, 0, 7); ctx.fill();
    ctx.restore();
    tag(ctx, t, '三 个 月 联 系 一 次', S4 + 5.2, X(90) - 12, Y(ramp(90)) - 26, { color: P.blue, size: 16, align: 'right' });
  }
  narr(ctx, '天天聊，新鲜事刚冒出来，就说完了；', { t, t0: S4 + 1.6, x: 140, y: 150, size: 40, color: P.ink, stagger: .045 });
  narr(ctx, [['隔一段时间，零碎的小事，才', P.ink], ['攒成一个故事', P.blue], ['。', P.ink]], { t, t0: S4 + 5.4, x: 140, y: 215, size: 40, stagger: .045 });
  ctx.restore();
}

// Granovetter: of the 54 people who found their job through someone they knew, how often had they seen that person?
function sceneBars(ctx, t) {
  const a = seg(t, S5, S5 + .4) * (1 - seg(t, DUR - 1.0, DUR - .3));
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  tag(ctx, t, 'G R A N O V E T T E R   ·   1 9 7 3   ·   找 到 新 工 作 的 人', S5 + .2, 142, 130);
  narr(ctx, '那条关键的消息，是谁告诉你的？', { t, t0: S5 + .5, x: 140, y: 200, size: 44, color: P.ink, stagger: .05 });
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
  // Bracket over the two blue bars.
  const bk = easeOut(seg(t, S5 + 4.0, S5 + 4.8));
  if (bk > 0) {
    const x0 = 880, x1 = 1300 + bw, yb = base - hmax * 55.6 / 60 - 120;
    ctx.strokeStyle = P.blue; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x0, yb + 12); ctx.lineTo(x0, yb); ctx.lineTo(lerp(x0, x1, bk), yb); if (bk > .98) ctx.lineTo(x1, yb + 12); ctx.stroke();
    bigNumber(ctx, '84%', (x0 + x1) / 2 - 90, yb - 24, 80, P.blue, seg(t, S5 + 4.6, S5 + 5.0));
    tag(ctx, t, '来 自 不 常 见 面 的 人', S5 + 4.9, (x0 + x1) / 2 + 110, yb - 40, { color: P.blue, size: 16 });
  }
  tag(ctx, t, '基 数 ： 通 过 熟 人 找 到 工 作 的 54 人', S5 + 3.0, 1780, 1036, { size: 12, color: P.faint, spacing: 1, align: 'right' });
  narr(ctx, '另一项研究发现：重新联系多年没联系的旧识，得到的信息比现有联系人更新颖。', { t, t0: S5 + 6.2, x: 140, y: 1000, size: 26, color: P.dim, stagger: .02 });
  tag(ctx, t, 'Levin, Walter & Murnighan, 2011', S5 + 7.4, 142, 1036, { size: 13, spacing: 1, color: P.faint });
  ctx.restore();
}

// ================================================================ frame

function drawFrame(ctx, t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
  const light = t >= S2;
  if (light) whiteBackdrop(ctx); else { ctx.fillStyle = COL.bg0; ctx.fillRect(0, 0, W, H); }
  if (t < S2) { ctx.save(); ctx.globalAlpha = 1 - seg(t, S1 - .2, S1 + .2) * 0; sceneBlocks(ctx, t); ctx.restore(); }
  if (t >= S1 && t < S2) flip(ctx, t);
  if (t >= S2) {
    if (t < S3 + .2) sceneGottman(ctx, t);
    sceneFormula(ctx, t);
    sceneArea(ctx, t);
    sceneBars(ctx, t);
  }
  const black = 1 - seg(t, 0, .6) + seg(t, DUR - .6, DUR);
  if (black > 0) { ctx.fillStyle = `rgba(0,0,0,${clamp(black)})`; ctx.fillRect(0, 0, W, H); }
  finish(ctx, t, light ? { vignette: .1 } : {});
}

// ================================================================ sound

const CUES = [
  { t: S1, kind: 'whoosh' },
  { t: S2 + .3, kind: 'note', f: 523.3 },
  { t: S3 + .3, kind: 'whoosh' }, { t: S4, kind: 'whoosh' }, { t: S5, kind: 'whoosh' },
  { t: S5 + 4.6, kind: 'note', f: 659.3 },
];
const PAD = [
  [.3, [87.3, 130.8, 220]], [4.3, [82.4, 123.5, 196]],
  [S2 + .2, [130.8, 196, 261.6, 329.6]], [S2 + 4.2, [110, 164.8, 261.6, 329.6]], [S2 + 8.2, [116.5, 174.6, 293.7]], [S2 + 12.2, [130.8, 196, 329.6]],
  [S4, [110, 164.8, 261.6]], [S4 + 4, [98, 146.8, 246.9, 293.7]], [S5, [130.8, 196, 261.6, 329.6]], [S5 + 4, [110, 164.8, 277.2, 329.6]], [S5 + 8, [130.8, 196, 261.6]],
];

const CUT = { dur: DUR, cues: CUES, pad: PAD, drawFrame };
