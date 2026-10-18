// audio.mjs: synthesize the sound track from a cut's cues plus soft piano chords (PAD).
// Deterministic: the same cut always gives the same WAV. Stereo 44.1 kHz, 16-bit.

const SR = 44100;
const hash = i => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

export function synth(cues, pad, dur) {
  const n = Math.ceil((dur + .5) * SR), L = new Float32Array(n), R = new Float32Array(n);
  // add(t0, len, fn, pan): fn(x) gives the sample at x seconds after t0; pan -1..1.
  const add = (t0, len, fn, pan = 0) => {
    const a = Math.floor(t0 * SR), b = Math.min(n, a + Math.floor(len * SR)), gl = Math.cos((pan + 1) * Math.PI / 4), gr = Math.sin((pan + 1) * Math.PI / 4);
    for (let i = Math.max(0, a); i < b; i++) { const v = fn((i - a) / SR); L[i] += v * gl; R[i] += v * gr; }
  };
  const sin = (f, x) => Math.sin(2 * Math.PI * f * x);
  // A soft piano-ish note: a few decaying harmonics with a gentle attack.
  const piano = (f, x, decay = 1.6) => (sin(f, x) + .35 * sin(2 * f, x) * Math.exp(-x * 3) + .12 * sin(3 * f, x) * Math.exp(-x * 5))
    * Math.min(1, x * 60) * Math.exp(-x * decay);

  // Pad chords, rolled slightly, each note panned a little.
  for (const [t0, notes] of pad) notes.forEach((f, k) => add(t0 + k * .09, 5.5, x => piano(f, x, .55) * .055, (k - 1) * .3));

  cues.forEach((c, ci) => {
    const r = hash(ci);
    switch (c.kind) {
      case 'tick': add(c.t, .03, x => sin(1800 + (c.pitch ?? .5) * 900, x) * Math.exp(-x * 220) * .05, (r - .5) * .6); break;
      case 'ding': {   // message notification: two bright tones
        const f = 1318.5 * (1 + (c.pitch ?? 0) * .12);
        add(c.t, .8, x => (piano(f, x, 5) + .6 * piano(f * 1.5, Math.max(0, x - .07), 6) * (x > .07)) * .07, (r - .5) * .9);
        break;
      }
      case 'send': add(c.t, .18, x => sin(700 + x * 2200, x) * Math.exp(-x * 22) * .09, .3); break;
      case 'whoosh': {
        let y = 0;
        add(c.t, .7, x => { const env = Math.sin(Math.PI * x / .7) ** 2; y += (hash(ci * 31 + x * SR) - .5 - y) * (.02 + .12 * env); return y * env * 1.1; });
        break;
      }
      case 'boom': add(c.t, 2.5, x => (sin(55 - x * 8, x) * .5 + sin(110, x) * .15) * Math.exp(-x * 1.8) * Math.min(1, x * 30) * .5); break;
      case 'chord': c.notes.forEach((f, k) => add(c.t + k * .12, 6, x => piano(f, x, .45) * .08, (k - 1.5) * .35)); break;
      case 'shimmer': for (let k = 0; k < 14; k++) { const f = [1568, 1760, 2093, 2349, 2637][k % 5]; add(c.t + k * .11, 1.6, x => piano(f, x, 2.5) * .022, (hash(k) - .5) * 1.6); } break;
      case 'note': add(c.t, 4, x => piano(c.f, x, .8) * .09); break;
      case 'drip': { const f = 900 + (c.pitch ?? .4) * 500; add(c.t, .25, x => sin(f + x * 2400, x) * Math.exp(-x * 26) * .12, (r - .5) * .5); break; }
    }
  });

  // Fade the tail, soft clip, write the WAV.
  for (let i = 0; i < n; i++) { const x = i / SR; if (x > dur - 1) { const g = Math.max(0, (dur + .3 - x) / 1.3); L[i] *= g; R[i] *= g; } }
  const out = Buffer.alloc(44 + n * 4);
  out.write('RIFF', 0); out.writeUInt32LE(36 + n * 4, 4); out.write('WAVEfmt ', 8);
  out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(2, 22);
  out.writeUInt32LE(SR, 24); out.writeUInt32LE(SR * 4, 28); out.writeUInt16LE(4, 32); out.writeUInt16LE(16, 34);
  out.write('data', 36); out.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    out.writeInt16LE(Math.round(Math.tanh(L[i] * 1.6) * 30000), 44 + i * 4);
    out.writeInt16LE(Math.round(Math.tanh(R[i] * 1.6) * 30000), 46 + i * 4);
  }
  return out;
}
