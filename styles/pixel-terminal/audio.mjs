// audio.mjs: synthesize the sound track from the screenplay's cues (typing clicks, pops, dings, alarm, glitch)
// plus a quiet ambient pad. Deterministic: the same script always gives the same WAV.

const SR = 44100;
const hash = i => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

export function synth(cues, dur) {
  const n = Math.ceil((dur + .5) * SR), buf = new Float32Array(n);
  const add = (t0, len, fn) => {
    const a = Math.floor(t0 * SR), b = Math.min(n, a + Math.floor(len * SR));
    for (let i = Math.max(0, a); i < b; i++) buf[i] += fn((i - a) / SR);
  };
  const sin = (f, x) => Math.sin(2 * Math.PI * f * x);

  cues.forEach((c, ci) => {
    const r = hash(ci);
    switch (c.kind) {
      case 'key': {  // keyboard click: noise transient plus a short pitched body, slightly different per speaker
        const f = { kk: 1900, ll: 1550, sys: 1250 }[c.who] * (1 + (r - .5) * .12);
        add(c.t, .035, x => ((hash(ci * 977 + x * SR) - .5) * 1.2 * Math.exp(-x * 400) + sin(f, x) * .5 * Math.exp(-x * 160)) * .13);
        break;
      }
      case 'tick': { const f = 1100 + (c.pitch ?? .5) * 1500; add(c.t, .02, x => sin(f, x) * Math.exp(-x * 260) * .09); break; }
      case 'pop': add(c.t, .12, x => sin(380 + x * 7000, x) * Math.exp(-x * 30) * .22); break;
      case 'ding': add(c.t, .7, x => (sin(1320, x) + .5 * sin(1980, x)) * Math.exp(-x * 7) * .12); break;
      case 'whoosh': {
        let y = 0;
        add(c.t, .4, x => { const env = Math.sin(Math.PI * x / .4) ** 2; y += (hash(ci * 31 + x * SR) - .5 - y) * (.04 + .25 * env); return y * env * .9; });
        break;
      }
      case 'squish': add(c.t, .7, x => sin(520 - x * 600, x) * Math.exp(-x * 3) * .14 + (hash(ci * 7 + x * SR) - .5) * .05 * Math.exp(-x * 6)); break;
      case 'beep': add(c.t, .13, x => Math.sign(sin(880, x)) * .05 * (x < .11 ? 1 : 0) * Math.min(1, x * 200)); break;
      case 'glitch': add(c.t, .85, x => {
        const gate = hash(Math.floor(x * 40) + ci) > .35 ? 1 : 0;
        return ((hash(ci * 13 + x * SR) - .5) * .5 * gate + ((x * (300 - x * 250)) % 1 - .5) * .25) * (1 - x / .85) * .5;
      }); break;
      case 'boot': [523.3, 659.3, 784].forEach((f, k) => add(c.t + k * .07, .9, x => sin(f, x) * Math.exp(-x * 4) * .08)); break;
      case 'sparkle': [1568, 2093, 2637, 3136].forEach((f, k) => add(c.t + k * .06, .5, x => sin(f, x) * Math.exp(-x * 9) * .07)); break;
      case 'chord': [220, 277.2, 329.6, 440].forEach(f => add(c.t, 2.4, x => sin(f, x) * Math.min(1, x * 3) * Math.exp(-x * 1.2) * .06)); break;
    }
  });

  // Ambient pad: silent from the glitch (memory lost) until the next boot.
  const glitch = cues.find(c => c.kind === 'glitch')?.t ?? 1e9;
  const reboot = cues.find(c => c.kind === 'boot' && c.t > glitch)?.t ?? 1e9;
  const notes = [110, 164.8, 220, 261.6, 329.6];
  for (let i = 0; i < n; i++) {
    const x = i / SR;
    let env = Math.min(1, x / 1.5);
    if (x > glitch) env *= Math.max(0, 1 - (x - glitch) / .3);
    if (x > reboot) env = Math.min(1, (x - reboot) / 1);
    if (x > dur - 1) env *= Math.max(0, (dur + .5 - x) / 1.5);
    let v = 0;
    notes.forEach((f, k) => { v += sin(f * (1 + .002 * k), x) * (1 + .3 * Math.sin(x * (.4 + k * .13))) / (k + 1.5); });
    buf[i] += v * .025 * env;
  }

  // Soft clip, then 16-bit mono WAV.
  const out = Buffer.alloc(44 + n * 2);
  out.write('RIFF', 0); out.writeUInt32LE(36 + n * 2, 4); out.write('WAVEfmt ', 8);
  out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(1, 22);
  out.writeUInt32LE(SR, 24); out.writeUInt32LE(SR * 2, 28); out.writeUInt16LE(2, 32); out.writeUInt16LE(16, 34);
  out.write('data', 36); out.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) out.writeInt16LE(Math.round(Math.tanh(buf[i] * 2.2) * 30000), 44 + i * 2);
  return out;
}
