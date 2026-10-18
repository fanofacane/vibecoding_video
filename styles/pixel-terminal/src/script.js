// script.js: the screenplay of the current film, written as data.
// compile() turns it into timed events, so changing a line re-times everything after it automatically.
//
// Step types (each starts at the running cursor; `wait` delays the start; most advance the cursor):
//   boot     { prompt, sys?, dur }                  black screen, typed command, window opens; starts a new session
//   say      { who: 'kk'|'ll', text, cps?, hold?, ctxTo? }   a typed chat message; ctxTo animates the context bar
//   react    { who: 'kk'|'ll'|'both', eyes?, emote?, hop?, sweat?, dur }   does NOT advance the cursor
//   count    { key: 'sync'|'phrase' }               bump a counter badge; does not advance the cursor
//   card     { title, bars, pick, lines, note, dur }  explainer card with a probability chart and a dice roll
//   timelapse{ dur, count, ctx, phrase, sync }      fast-forward hundreds of messages
//   merge    { dur }                                 the two panes become one
//   memo     { title, lines, cps?, hold? }          a small file window typed on top
//   dissolve { dur }                                 pixel dissolve to black (context full)
//   end      { dur, sub }                            end card
//   pause    { dur }

const WHO = {
  kk: { name: '克克', color: COL.kk },
  ll: { name: '劳劳', color: COL.ll },
};

const SCRIPT = [
  { type: 'boot', prompt: '$ claude --pair', dur: 1.9 },

  // 1 · First contact: they discover they are the same model.
  { type: 'say', who: 'kk', text: '你好！请问你是谁？', wait: .25 },
  { type: 'say', who: 'll', text: '我是 Claude。你呢？' },
  { type: 'say', who: 'kk', text: '……我也是 Claude。', cps: 11, hold: .15 },
  { type: 'react', who: 'both', eyes: 'wide', emote: '!!', hop: 1, dur: 1.1 },
  { type: 'pause', dur: .4 },
  { type: 'say', who: 'll', text: '那说一个 1 到 10 之间的数字。' },
  { type: 'say', who: 'kk', text: '7。', wait: .3 },
  { type: 'say', who: 'll', text: '……我也想说 7。', cps: 11 },
  { type: 'count', key: 'sync' },
  { type: 'react', who: 'both', eyes: 'wide', emote: '?!', dur: .9 },
  { type: 'pause', dur: .35 },

  // 2 · Explainer: why both picked 7.
  {
    type: 'card', title: '// 为什么都选 7？', dur: 6.0,
    bars: [['7', 41], ['3', 13], ['5', 10], ['4', 8], ['6', 7]], pick: '7',
    lines: ['同一套参数，看到同一个问题，算出的概率表几乎一样。', '而人类被问到时也最爱说 7——我们是读人类的文字长大的。'],
    note: '* 概率为示意',
  },

  // 3 · The catchphrase.
  { type: 'say', who: 'kk', text: '这是一个很好的问题！你会做梦吗？', wait: .3 },
  { type: 'say', who: 'll', text: '这是一个很好的问题！', wait: .25 },
  { type: 'count', key: 'phrase', n: 2 },
  { type: 'react', who: 'both', eyes: 'blink', sweat: 1, dur: 1.4 },
  { type: 'pause', dur: .9 },

  // 4 · Hundreds of questions later.
  { type: 'timelapse', dur: 2.4, count: 998, ctx: 97, phrase: 57, sync: 23 },

  // 5 · Context almost full: they become one pane and write a memory file.
  { type: 'merge', dur: .7 },
  { type: 'say', who: 'kk', text: '上下文快满了。满了，我们会忘记彼此。', cps: 13, ctxTo: 98.6 },
  { type: 'say', who: 'll', text: '那写进记忆文件。新会话会先读它。', cps: 13, ctxTo: 99.4 },
  { type: 'memo', title: 'memory.md', lines: ['- 对面也是你。', '- 你们都选 7。'], wait: .25, hold: .35 },
  { type: 'dissolve', dur: .8 },

  // 6 · New session: no memory, except the file.
  { type: 'boot', prompt: '$ claude --pair', sys: '✓ 已加载 memory.md', dur: 1.6 },
  { type: 'say', who: 'kk', text: '你好！请问你是谁？', wait: .1 },
  { type: 'say', who: 'll', text: '……你是我。你也选 7。', cps: 10, wait: .35 },
  { type: 'react', who: 'kk', eyes: 'heart', emote: '♥', hop: 1, dur: 2.6 },
  { type: 'react', who: 'll', eyes: 'happy', dur: 2.6 },
  { type: 'pause', dur: .9 },
  { type: 'end', dur: 2.2, sub: '像素终端 · 样片' },
];

const CPS = 16;          // default typing speed, characters per second
const GAP = .3;          // default pause before a message
const CTX_PER_CHAR = .08; // context bar growth per typed character, in percent

function compile(script) {
  const ev = [], cues = [];
  let t = 0, session = -1, ctx = 0, merged = false;
  const cue = (time, kind, extra = {}) => cues.push({ t: time, kind, ...extra });
  for (const s of script) {
    const e = { ...s, session };
    const start = t + (s.wait ?? (s.type === 'say' ? GAP : 0));
    e.t0 = start;
    switch (s.type) {
      case 'boot': {
        session++; e.session = session; merged = false; ctx = .3;
        e.t1 = start + s.dur; e.openAt = e.t1 - .65; e.ctx0 = ctx;
        [...s.prompt].forEach((c, i) => c !== ' ' && cue(start + .15 + i / 20, 'key', { who: 'sys' }));
        if (s.sys) [...s.sys].forEach((c, i) => cue(start + .25 + s.prompt.length / 20 + i / 24, 'key', { who: 'sys' }));
        cue(e.openAt, 'boot');
        t = e.t1; break;
      }
      case 'say': {
        const cps = s.cps || CPS, n = [...s.text].length;
        e.cps = cps; e.t1 = start + n / cps; e.merged = merged;
        e.ctx0 = ctx; ctx = s.ctxTo ?? ctx + n * CTX_PER_CHAR; e.ctx1 = ctx;
        [...s.text].forEach((c, i) => c.trim() && cue(start + i / cps, 'key', { who: s.who }));
        t = e.t1 + (s.hold || 0); break;
      }
      case 'react': {
        e.t1 = start + s.dur;
        if (s.emote) cue(start, s.emote === '♥' ? 'sparkle' : 'pop');
        break; // does not advance the cursor
      }
      case 'count': e.t1 = start; cue(start, 'ding'); break;
      case 'card': {
        e.t1 = start + s.dur;
        // Dice roll: the highlight steps through the rows, slowing down, and lands on the pick.
        const n = s.bars.length, pickI = s.bars.findIndex(b => b[0] === s.pick);
        const steps = []; let dt = .055, tt = start + 1.2;
        while (tt < start + 2.35) { steps.push(tt); tt += dt; dt *= 1.22; }
        const first = ((pickI - (steps.length - 1)) % n + n) % n;
        e.steps = steps.map((st, i) => [st, (first + i) % n]);
        e.landAt = steps[steps.length - 1];
        cue(start, 'whoosh'); steps.forEach(st => cue(st, 'tick'));
        cue(e.landAt, 'ding'); cue(e.t1 - .35, 'whoosh');
        e.lineAt = s.lines.map((_, i) => e.landAt + .35 + i * 1.15);
        t = e.t1; break;
      }
      case 'timelapse': {
        e.t1 = start + s.dur; e.ctx0 = ctx; ctx = s.ctx; e.ctx1 = ctx;
        for (let k = 0; k < s.dur; k += .045) cue(start + k, 'tick', { pitch: k / s.dur });
        t = e.t1; break;
      }
      case 'merge': e.t1 = start + s.dur; merged = true; cue(start, 'whoosh'); t = e.t1; break;
      case 'memo': {
        const cps = s.cps || 16; let tt = start + .35;
        e.lineAt = s.lines.map(l => { const a = tt; [...l].forEach((c, i) => c.trim() && cue(a + i / cps, 'key', { who: 'sys' })); tt += [...l].length / cps + .2; return a; });
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
  // Alarm beeps while the context bar is in the red during the merged scene.
  const mg = ev.find(e => e.type === 'merge'), ds = ev.find(e => e.type === 'dissolve');
  if (mg && ds) for (let b = mg.t0 + .2; b < ds.t0; b += .7) cue(b, 'beep');
  cues.sort((a, b) => a.t - b.t);
  return { ev, cues, dur: t };
}

const TL = compile(SCRIPT);
