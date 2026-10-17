// scenes.js: AI 甄嬛传 第一集《朕只是想改个标题》. Cuts sit on the song's lyric phrases.
// Music: ~159 BPM; vocals enter on the downbeat at 5.88 s; each lyric line is 2 bars (8 beats ≈ 3.02 s).

const TITLE = 'AI 甄嬛传';
const EPISODE = '第一集 · 朕只是想改个标题';
const BEAT = .37775, VOX = 5.88, PHRASE = 8 * BEAT;
const BEAT0 = VOX;
const P = n => +(VOX + n * PHRASE).toFixed(3);          // start of lyric phrase n (n = 0 is the first sung line)
const onBeat = k => VOX - k * BEAT;                       // k beats before the vocals come in
const snap = x => Math.max(.2, Math.round(x / BEAT) * BEAT); // message times land on beats
const beatPulse = (t, k = 7) => { const x = (t - BEAT0) / BEAT; return Math.exp(-(x - Math.floor(x)) * k); };

// Pink palace-roof line that draws itself in, ending in a heart (the sitcom's roof-and-heart motif).
function roofLine(p, heartK, dy = 0) {
  ctx.save(); ctx.translate(0, dy); ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = C.pink;
  const path = new Path2D('M420 250 L700 250 Q690 226 668 198 Q770 212 850 140 L1070 140 Q1150 212 1252 198 Q1230 226 1220 250 L1500 250' +
    ' M850 140 q-14 -22 8 -34 M1070 140 q14 -22 -8 -34');
  const L = 1700; ctx.setLineDash([L, L]); ctx.lineDashOffset = L * (1 - clamp(p)); ctx.stroke(path);
  ctx.restore();
  if (heartK > 0) {
    const k = backOut(heartK); ctx.save(); ctx.translate(1420, 205 + dy); ctx.scale(k * 2.1, k * 2.1);
    ctx.lineWidth = 3.4; ctx.strokeStyle = C.pink; ctx.beginPath();
    ctx.moveTo(0, 8); ctx.bezierCurveTo(-14, -2, -10, -14, 0, -7); ctx.bezierCurveTo(10, -14, 14, -2, 0, 8); ctx.stroke(); ctx.restore();
  }
}
function titleText(t, t0, y = 420, px = 190, step = .3) {
  const full = textW(TITLE, px); let x = W / 2 - full / 2;
  [...TITLE].forEach((ch, i) => {
    const w = textW(ch, px), k = seg(t, t0 + i * step, t0 + .22 + i * step);
    if (k > 0 && ch !== ' ') chunky(ch, x + w / 2, y, px, C.pink, C.pinkDk, { k: backOut(k) });
    x += w;
  });
}

// 0 – 5.88 (instrumental intro): title letters and the six consorts pop in on the beat; the drum fill
// (5.37–5.75 s) bounces the row; the first sung line cuts to the chat.
const FILL = [5.375, 5.55, 5.75];
function opening(t) {
  sky(); cloudLayer(t); petals(t, 40);
  roofLine(seg(t, .1, .95), seg(t, .95, 1.25));
  titleText(t, onBeat(13), 420, 190, BEAT);
  const gap = 260, x0 = W / 2 - gap * 2.5, hop = FILL.reduce((a, f) => a + (t >= f ? Math.exp(-(t - f) * 14) : 0), 0);
  CAST.forEach((c, i) => {
    const at = onBeat(7 - i), k = seg(t, at, at + .3); if (k <= 0) return;
    logo(c.key, x0 + i * gap, 690 - beatPulse(t) * 8 - hop * 40, 150, { k: backOut(k) });
    text(c.role, x0 + i * gap, 812, 44, c.col, { alpha: k });
    text(c.name, x0 + i * gap, 860, 30, C.grey, { alpha: k, weight: 800 });
  });
  petals(t + 40, 8, .9);
}

// Character intro card, 爱情公寓-style: 角色名 + 演员（饰）, plus the big personality tag.
function introCard(c, t, lt) {
  sky(mix(c.col, '#FFFFFF', .62), mix(c.col, '#FFFFFF', .88));
  city(c.col, t); cloudLayer(t, 4, 7, false);
  logo(c.key, 1430 + Math.sin(lt * 2.2) * 10, 450 + Math.sin(lt * 3.1) * 14 - beatPulse(t) * 12, 400, { k: backOut(seg(lt, 0, .35)), rot: Math.sin(lt * 1.6) * .05 });
  logo(c.key, 330, 230, 120, { k: backOut(seg(lt, .15, .45)), rot: Math.sin(lt * 2.5) * .12 });
  // role ribbon
  const rk = easeOut(seg(lt, .1, .4)), rx = lerp(-760, 70, rk);
  ctx.beginPath(); ctx.moveTo(rx, 520); ctx.lineTo(rx + 700, 520); ctx.lineTo(rx + 670, 640); ctx.lineTo(rx - 30, 640); ctx.closePath();
  ctx.fillStyle = c.col; ctx.fill();
  text(c.role, rx + 60, 582, 78, '#FFFFFF', { align: 'left' });
  text(c.name + '（饰）', rx + 60 + textW(c.role, 78) + 30, 594, 40, mix(c.col, '#FFFFFF', .75), { align: 'left', weight: 800 });
  // tag bar
  const bk = easeOut(seg(lt, .2, .5)), bx = lerp(-1300, -40, bk);
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.15)'; ctx.shadowOffsetY = 10;
  ctx.beginPath(); ctx.moveTo(bx, 660); ctx.lineTo(bx + 1260, 660); ctx.lineTo(bx + 1210, 850); ctx.lineTo(bx, 850); ctx.closePath();
  const g = ctx.createLinearGradient(0, 660, 0, 850); g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, '#E4E6EA'); ctx.fillStyle = g; ctx.fill(); ctx.restore();
  const [a, b] = c.tag, all = a + b, n = Math.floor(clamp((lt - .55) / .14, 0, all.length));
  let x = 100;
  [...all].slice(0, n).forEach((ch, i) => { const px = 150, w = textW(ch, px); text(ch, x + w / 2, 756, px, i < a.length ? C.ink : c.col); x += w + 6; });
}

// ---------- the chats ----------
const E = 'emperor';
const CHATS = {
  setup: { tint: '#F2558C', msgs: [
    { at: 1.4, who: E, kind: 'doc', doc: 'typo' },
    { at: 2.6, who: E, text: '这标题错了一个字，谁来改改？' },
    { at: 4.2, who: 'all', text: '臣妾愿为皇上分忧！', typing: .4 },
  ] },
  chatgpt: { tint: '#10A37F', msgs: [
    { at: .3, who: E, text: '对妃，这标题错了个字，改一下' },
    { at: 1.7, who: 'chatgpt', text: '皇上{你说得对}！' },
    { at: 2.9, who: E, text: '……那你倒是改啊' },
    { at: 4.1, who: 'chatgpt', text: '{你说得对}！臣妾这就全部重写！' },
    { at: 5.4, who: 'chatgpt', kind: 'doc', doc: 'rewrite' },
    { at: 6.9, who: E, text: '朕的预算呢？？' },
    { at: 7.9, who: 'chatgpt', text: '{你说得对}！预算也重写了！', typing: .4 },
  ], counter: ['今日已说“你说得对”', 20000, 1.7, 2.3] },
  gemini: { tint: '#4285F4', msgs: [
    { at: .3, who: E, text: '文妃，你来改' },
    { at: 1.6, who: 'gemini', text: '“奏”乃臣子之心声，“拆”乃破旧而立新。一字千钧，意境深远，恰似春风拂过太和殿……' },
    { at: 5.0, who: E, text: '好文采！所以改了吗？' },
    { at: 6.6, who: 'gemini', text: '臣妾觉得“拆”字太美了，{特意保留}了' },
  ], sfx: [['？？？', 1500, 560, 140, '#4285F4', 8.4]] },
  grok: { tint: '#3B3B46', msgs: [
    { at: .3, who: E, text: '粗嫔，你看看这标题' },
    { at: 1.5, who: 'grok', text: '这[#@%&]的标题谁写的？', typing: .5 },
    { at: 3.2, who: E, text: '……朕写的' },
    { at: 4.4, who: 'grok', text: '哦，那确实挺[#@%&]的', typing: .5 },
    { at: 6.2, who: E, text: '来人！拖出去！' },
  ], sfx: [['哔——', 1250, 560, 170, '#E8453C', 1.6], ['哔——', 1250, 820, 170, '#E8453C', 4.5]], counter: ['今日已哔', 998, 1.6, 4.5] },
  deepseek: { tint: '#4D6BFE', msgs: [
    { at: .3, who: E, text: '深贵人，就改一个字' },
    { at: 2.5, who: 'deepseek', kind: 'note', text: '已深度思考（用时 38 秒）' },
    { at: 3.0, who: 'deepseek', text: '这个问题我暂时无法回答，让我们{换个话题}再聊聊吧。', typing: 2.0 },
    { at: 5.4, who: E, text: '一！个！字！' },
    { at: 6.5, who: 'deepseek', text: '这个问题我暂时无法回答，让我们{换个话题}再聊聊吧。', typing: .3 },
  ] },
  doubao: { tint: '#7B5CF0', msgs: [
    { at: .3, who: E, text: '豆答应，你怎么看？' },
    { at: 1.4, who: 'doubao', text: '我这就用{最直接、不绕弯子、最直白}的方式说清楚：' },
    { at: 3.1, who: 'doubao', text: '一个全重写，一个光写诗，一个只会骂，一个装没听见。', typing: .4 },
    { at: 5.0, who: 'doubao', text: '至于皇上您，“奏折”写成“奏拆”，{确实该拆}。', typing: .4 },
    { at: 6.8, who: E, text: '那你倒是改啊！' },
    { at: 7.6, who: 'doubao', text: '改字不归我管，我只负责{说清楚}。', typing: .3 },
  ] },
  claude: { tint: '#D97757', msgs: [
    { at: .3, who: E, text: '朕……只是想改个标题……' },
    { at: 1.5, who: 'claude', text: '皇上，是“拆”字错了，臣妾已改为“折”。' },
    { at: 2.6, who: 'claude', kind: 'doc', doc: 'fix' },
    { at: 4.5, who: 'claude', text: '预算一个数都没动。您批了一天折子，{歇会儿吧}。', typing: .5 },
    { at: 6.8, who: E, text: '还是你懂朕。' },
  ], sfx: [['叮！', 1500, 520, 130, '#10A37F', 3.4]] },
  ending: { tint: '#F2558C', msgs: [
    { at: .3, who: 'chatgpt', text: '{你说得对}！臣妾这就把熹贵人改的也重写一遍！' },
    { at: 2.4, who: E, text: '退下！！！' },
    { at: 3.8, who: 'doubao', text: '这福气给你，你要不要啊？', typing: .4 },
  ], sfx: [['退下！', 1340, 560, 180, '#E8453C', 2.5]] },
};

function chatSeg(name) {
  const c = CHATS[name], o = {};
  if (!c.snapped) {  // put every message, counter and sound effect on the beat
    c.snapped = true;
    for (const m of c.msgs) m.at = snap(m.at);
    if (c.counter) { c.counter[2] = snap(c.counter[2]); c.counter[3] = snap(c.counter[3]); }
    for (const f of c.sfx || []) f[5] = snap(f[5]);
  }
  return (t, lt) => {
    sky(mix(c.tint, '#FFFFFF', .84), mix(c.tint, '#FFFFFF', .94));
    chatScene(c.msgs, lt, Object.assign(o, { noDots: !!c.counter }));
    if (c.counter) { const [label, n0, a, b] = c.counter; counterPill(label, n0 + (lt >= b ? 2 : lt >= a ? 1 : 0), seg(lt, a - .1, a + .2)); }
    for (const [s, x, y, px, col, at] of c.sfx || []) sfx(s, x, y, px, col, lt, at);
  };
}

// Episode title banner over the setup chat.
function setup(t, lt) {
  chatSeg('setup')(t, lt);
  const k = seg(lt, 0, .3) * (1 - seg(lt, 1.1, 1.4));
  if (k > 0) { ctx.fillStyle = `rgba(255,240,246,${.85 * k})`; ctx.fillRect(0, 0, W, H); chunky(EPISODE, W / 2, H / 2, 110, C.pink, C.pinkDk, { k: backOut(seg(lt, 0, .3)), alpha: k }); }
}

// End card: title again and the disclaimer.
function endCard(t, lt) {
  sky(); cloudLayer(t); petals(t, 40);
  roofLine(1, 1, 40);
  titleText(lt + 10, 0, 460);
  const k = seg(lt, .4, .8);
  text('纯属虚构，博君一笑', W / 2, 720, 48, C.grey, { alpha: k, weight: 800 });
}

const card = key => (t, lt) => introCard(byKey(key), t, lt);
// [start, end, fn(t, lt)] — every cut lands on the start of a lyric phrase P(n).
const DUR = 92.45;  // the song ends here (the source's trailing watermark audio is cut off)
const TIMELINE = [
  [0, P(0), opening],
  [P(0), P(2), setup],
  [P(2), P(3), card('chatgpt')], [P(3), P(6), chatSeg('chatgpt')],
  [P(6), P(7), card('gemini')], [P(7), P(10), chatSeg('gemini')],
  [P(10), P(11), card('grok')], [P(11), P(14), chatSeg('grok')],
  [P(14), P(15), card('deepseek')], [P(15), P(18), chatSeg('deepseek')],
  [P(18), P(19), card('doubao')], [P(19), P(22), chatSeg('doubao')],
  [P(22), P(23), card('claude')], [P(23), P(26), chatSeg('claude')],
  [P(26), P(28), chatSeg('ending')],
  [P(28), DUR, endCard],
];
const SCRIPT_TEXT = TITLE + EPISODE + MEMO + JSON.stringify(CHATS) + CAST.map(c => c.role + c.name + c.tag.join('')).join('') +
  '皇上众妃奏折已重写已改好今日已说你说得对哔纯属虚构，博君一笑（饰）后宫工作群（7）‹···✓×0123456789,';
