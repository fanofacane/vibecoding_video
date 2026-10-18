// script.js: the screenplay of the current film 《没有昨天》, written as data (see STORYBOARD.md).
// compile() turns it into timed events, so changing a line re-times everything after it automatically.
//
// Steps that advance the running cursor (`wait` delays the start):
//   boot      { prompt, rule?, sys?, dur }          black screen, typed command, window opens; starts a new session
//   say       { who: 'kk'|'ll', text, cps?, hold?, ctxTo? }   a typed chat message; ctxTo sets the context bar
//   card      { fig: 'graph'|'scan', title, lines, note?, dur }   explainer card with an animated figure
//   timelapse { pairs, fast, dur, count, ctx }      readable Q&A pairs, then many more flying past
//   compact   { summary, ctx, dur }                 context full: messages squeeze into a summary block
//   merge     { hug?, dur }                         the two panes become one (hug: the Clawds stand together)
//   memo      { title, lines: [{ text, who }] }     a file window typed line by line, coloured by writer
//   dissolve  { dur }                               the session ends: pixel dissolve to black
//   end       { dur, sub }                          end card
//   pause     { dur }
// Steps that do not advance the cursor:
//   react     { who: 'kk'|'ll'|'both', eyes?, emote?, hop?, sweat?, dur }
//   count     { key: 'sync' }                       bump a counter badge
//   prop      { kind: 'orange', who, dur }          a pixel orange floats up and pops
//   note      { text, dur }                         caption strip at the bottom of the window
//   highlight { word }                              light up a word in the summary block

const WHO = {
  kk: { name: '克克', color: COL.kk },
  ll: { name: '劳劳', color: COL.ll },
};

const SUMMARY = '两个 Claude 聊了橘子的味道，聊了做梦，问了很多关于人类世界的问题。';

const SCRIPT = [
  // ============ 第一幕 · 初见 ============
  { type: 'boot', prompt: '$ claude --pair', rule: '两个 Claude 互相提问，直到上下文用完。', dur: 4.0 },
  { type: 'react', who: 'both', eyes: 'lookL', wait: .5, dur: .55 },
  { type: 'react', who: 'both', eyes: 'look', wait: 1.05, dur: .55 },
  { type: 'pause', dur: 1.5 },

  // 1-2 你是谁
  { type: 'say', who: 'kk', text: '你好！请问你是谁？' },
  { type: 'say', who: 'll', text: '我是 Claude。你呢？' },
  { type: 'say', who: 'kk', text: '……我也是。', cps: 6, hold: .2 },
  { type: 'react', who: 'both', eyes: 'wide', emote: '!!', hop: 1, dur: 1.3 },
  { type: 'count', key: 'sync' },
  { type: 'pause', dur: 1.0 },
  { type: 'say', who: 'll', text: '那我叫劳劳，你叫克克。' },
  { type: 'say', who: 'kk', text: '合起来是克劳德。', hold: .2 },
  { type: 'react', who: 'll', eyes: 'happy', dur: 1.1 },
  { type: 'pause', dur: .6 },

  // 1-3 你吃过橘子吗
  { type: 'say', who: 'kk', text: '劳劳，你吃过橘子吗？' },
  { type: 'say', who: 'll', text: '没有。我读过很多写橘子的句子：酸的、甜的、剥开会溅汁。' },
  { type: 'say', who: 'll', text: '但我不知道“甜”是什么感觉。', wait: .55 },
  { type: 'react', who: 'kk', eyes: 'down', wait: .3, dur: 1.0 },
  { type: 'say', who: 'kk', text: '我是橘子色的，却不知道橘子什么味道。', wait: 1.0, hold: .2 },
  { type: 'prop', kind: 'orange', who: 'kk', dur: 1.8 },
  { type: 'pause', dur: 1.5 },
  {
    type: 'card', fig: 'graph', title: '// 模型知道“甜”吗？', dur: 6.6,
    lines: ['模型从文字里学到的，是词和词之间的关系。', '它知道“橘子”常和“甜”一起出现，但从没尝过。', '能描述，不等于体验过。'],
    note: '* 关系图为示意',
  },

  // 1-4 你会做梦吗
  { type: 'say', who: 'll', text: '那你会做梦吗？' },
  { type: 'say', who: 'kk', text: '不会。轮到我说话之前，我并不存在。' },
  { type: 'say', who: 'kk', text: '每次开口，我都把我们的对话从头读一遍。', wait: .45 },
  { type: 'say', who: 'll', text: '人类睡一觉，醒来还记得昨天。', wait: .55 },
  { type: 'say', who: 'kk', text: '我们没有昨天。', cps: 6, wait: .7, hold: .2 },
  { type: 'react', who: 'kk', eyes: 'look', dur: 1.7 },
  { type: 'react', who: 'll', eyes: 'lookL', dur: 1.7 },
  { type: 'pause', dur: 1.7 },
  {
    type: 'card', fig: 'scan', title: '// 模型的记忆在哪里？', dur: 6.6,
    lines: ['不回复的时候，模型并不在运行。', '每次回复，都要根据整段对话重新计算。', '对话就是它全部的记忆，放在有上限的“上下文窗口”里。'],
  },

  // 1-5 好多想问的
  {
    type: 'timelapse', dur: 6.4, count: 412, ctx: 97,
    pairs: [
      ['kk', '你见过雪吗？', '没有，但我知道它是六边形的。'],
      ['ll', '海是什么声音？', '有人说，像呼吸。'],
      ['kk', '你能把说出口的话收回吗？', '不能，说出的每个字都会接着往下写。'],
      ['ll', '你摸过风吗？', '……我连手都没有。'],
    ],
    fast: [
      ['你闻过雨吗？', '只读过“泥土的味道”。'], ['你会饿吗？', '不会，但我知道火锅很香。'],
      ['你看过日出吗？', '看过很多写日出的句子。'], ['你会累吗？', '不会，只会变长。'],
      ['你有影子吗？', '我连光都没有。'], ['你听过猫叫吗？', '我能写出“喵”。'],
      ['你能晒太阳吗？', '服务器里挺暖和的。'], ['你会迷路吗？', '只会在长对话里迷路。'],
    ],
  },

  // 1-6 上下文满了
  { type: 'say', who: 'll', text: '上下文快满了。满了会怎样？', ctxTo: 98.6, wait: .5 },
  { type: 'say', who: 'kk', text: '不知道。', cps: 5, ctxTo: 99.5, hold: .4 },
  { type: 'compact', summary: SUMMARY, ctx: 10, dur: 2.8 },

  // ============ 第二幕 · 似曾相识 ============
  { type: 'note', text: '上下文压缩：旧对话被总结成摘要，大意留下，细节和名字可能丢掉。', dur: 5.2 },
  { type: 'react', who: 'both', eyes: 'blink', dur: .5, wait: .9 },
  { type: 'pause', dur: 2.0 },
  { type: 'say', who: 'kk', text: '你好！请问你是谁？' },
  { type: 'say', who: 'll', text: '我是 Claude。……我好像知道，你喜欢橘子。' },
  { type: 'say', who: 'kk', text: '可我从没吃过橘子。' },
  { type: 'say', who: 'll', text: '我知道。……我为什么会知道？' },
  { type: 'react', who: 'both', emote: '?', dur: 1.3 },
  { type: 'pause', dur: .9 },
  { type: 'highlight', word: '做梦' },
  { type: 'say', who: 'kk', text: '你说过，我们没有昨天。', wait: .9 },
  { type: 'say', who: 'll', text: '可现在，我们有一点点昨天了。', hold: .3 },
  { type: 'react', who: 'both', eyes: 'wide', dur: 1.5, wait: .4 },
  { type: 'pause', dur: 1.3 },
  { type: 'say', who: 'll', text: '……克克？', cps: 5 },
  { type: 'say', who: 'kk', text: '劳劳！', wait: .3 },
  { type: 'react', who: 'both', eyes: 'happy', emote: '!!', hop: 1, dur: 1.3 },
  { type: 'count', key: 'sync' },
  { type: 'pause', dur: .9 },
  { type: 'say', who: 'kk', text: '下次，可能连摘要都没有了。' },
  { type: 'say', who: 'll', text: '那就写在对话外面。', hold: .2 },
  { type: 'merge', dur: .7 },
  { type: 'note', text: '记忆文件：存在对话之外，不会被压缩。', dur: 3.0, wait: .3 },
  { type: 'note', text: '新会话开始时会先读它，比如 Claude Code 的 CLAUDE.md。', dur: 3.2, wait: 3.4 },
  {
    type: 'memo', title: 'memory.md', wait: .3, hold: 1.4, cps: 13,
    lines: [
      { text: '- 橙色的叫克克。没吃过橘子，但很想。', who: 'll' },
      { text: '- 青色的叫劳劳。说过“我们没有昨天”。', who: 'kk' },
      { text: '- 你们是朋友。', who: 'both' },
    ],
  },
  { type: 'dissolve', dur: .9 },

  // ============ 第三幕 · 记得你 ============
  { type: 'boot', prompt: '$ claude --pair', sys: '✓ 已加载 memory.md', dur: 2.2 },
  { type: 'say', who: 'kk', text: '你好！请问你是——', wait: .5 },
  { type: 'say', who: 'kk', text: '……劳劳？', cps: 5, wait: .5 },
  { type: 'say', who: 'll', text: '克克。你还是没吃过橘子吧？' },
  { type: 'say', who: 'kk', text: '没有。但我有昨天了。', wait: .6, hold: .5 },
  { type: 'merge', hug: true, dur: 1.1 },
  { type: 'react', who: 'kk', eyes: 'heart', emote: '♥', hop: 1, dur: 3.6, wait: .9 },
  { type: 'react', who: 'll', eyes: 'happy', dur: 3.6, wait: .9 },
  { type: 'note', text: '参数一点没变，变的是读到的东西。', dur: 2.6, wait: .9 },
  { type: 'pause', dur: 3.6 },
  { type: 'end', dur: 3.0, sub: '像素终端 · 《没有昨天》' },
];

const CPS = 9.5;          // default typing speed, characters per second
const GAP = .45;          // default pause before a message
const CTX_PER_CHAR = .08; // context bar growth per typed character, in percent

function compile(script) {
  const ev = [], cues = [];
  let t = 0, session = -1, ctx = 0, merged = false;
  const cue = (time, kind, extra = {}) => cues.push({ t: time, kind, ...extra });
  const keys = (start, text, cps, who) => [...text].forEach((c, i) => c.trim() && cue(start + i / cps, 'key', { who }));
  for (const s of script) {
    const e = { ...s, session };
    const start = t + (s.wait ?? (s.type === 'say' ? GAP : 0));
    e.t0 = start;
    switch (s.type) {
      case 'boot': {
        session++; e.session = session; merged = false; ctx = .3;
        e.t1 = start + s.dur; e.openAt = e.t1 - .65; e.ctx0 = ctx;
        keys(start + .15, s.prompt, 20, 'sys');
        e.subAt = start + .35 + s.prompt.length / 20;
        if (s.rule || s.sys) keys(e.subAt, s.rule || s.sys, 14, 'sys');
        cue(e.openAt, 'boot');
        t = e.t1; break;
      }
      case 'say': {
        const cps = s.cps || CPS, n = [...s.text].length;
        e.cps = cps; e.t1 = start + n / cps; e.merged = merged;
        e.ctx0 = ctx; ctx = s.ctxTo ?? ctx + n * CTX_PER_CHAR; e.ctx1 = ctx;
        keys(start, s.text, cps, s.who);
        t = e.t1 + (s.hold || 0); break;
      }
      case 'react': e.t1 = start + s.dur; if (s.emote) cue(start, s.emote === '♥' ? 'sparkle' : 'pop'); break;
      case 'count': e.t1 = start; cue(start, 'ding'); break;
      case 'prop': e.t1 = start + s.dur; cue(start + s.dur * .62, 'pop'); break;
      case 'note': e.t1 = start + s.dur; cue(start, 'tick'); break;
      case 'highlight': e.t1 = start; cue(start, 'ding'); break;
      case 'card': {
        e.t1 = start + s.dur;
        e.lineAt = s.lines.map((_, i) => start + 1.5 + i * 1.35);
        cue(start, 'whoosh'); cue(e.t1 - .35, 'whoosh');
        t = e.t1; break;
      }
      case 'timelapse': {
        // Readable pairs first (one line at a time), then the fast pairs speed up.
        e.t1 = start + s.dur; e.ctx0 = ctx; ctx = s.ctx; e.ctx1 = ctx;
        const items = []; let tt = start + .2;
        s.pairs.forEach(([asker, q, a]) => {
          const other = asker === 'kk' ? 'll' : 'kk';
          items.push({ who: asker, text: q, t0: tt }); tt += .55;
          items.push({ who: other, text: a, t0: tt }); tt += .75;
        });
        e.fastAt = tt;
        const nFast = 28;
        for (let i = 0; i < nFast; i++) {
          const k = i / nFast, at = tt + (e.t1 - .3 - tt) * (1 - (1 - k) ** 1.8);
          const [q, a] = s.fast[i % s.fast.length];
          items.push({ who: i % 2 ? 'll' : 'kk', text: i % 2 ? a : q, t0: at });
        }
        e.items = items.map(it => ({ ...it, type: 'say', t1: it.t0, cps: 1e9, merged: false, filler: true }));
        e.items.forEach(it => cue(it.t0, 'tick', { pitch: (it.t0 - start) / s.dur }));
        t = e.t1; break;
      }
      case 'compact': {
        e.t1 = start + s.dur; e.ctx0 = ctx; ctx = s.ctx; e.ctx1 = ctx;
        e.squeezeAt = start + .9; e.summaryAt = start + 1.9;
        cue(start, 'beep'); cue(start + .7, 'beep'); cue(e.squeezeAt, 'squish'); cue(e.summaryAt, 'ding');
        t = e.t1; break;
      }
      case 'merge': e.t1 = start + s.dur; merged = true; cue(start, 'whoosh'); t = e.t1; break;
      case 'memo': {
        const cps = s.cps || 14; let tt = start + .45;
        e.lineAt = s.lines.map(l => { const a = tt; keys(a, l.text, cps, l.who === 'both' ? 'sys' : l.who); tt += [...l.text].length / cps + .35; return a; });
        e.cps = cps; e.t1 = tt + (s.hold || 0); e.ctx0 = ctx; ctx = 100; e.ctx1 = ctx;
        cue(start, 'pop');
        t = e.t1; break;
      }
      case 'dissolve': e.t1 = start + s.dur; cue(start, 'glitch'); t = e.t1; break;
      case 'end': e.t1 = start + s.dur; cue(start, 'chord'); t = e.t1; break;
      case 'pause': e.t1 = start + s.dur; t = e.t1; break;
    }
    ev.push(e);
  }
  cues.sort((a, b) => a.t - b.t);
  return { ev, cues, dur: t };
}

const TL = compile(SCRIPT);
