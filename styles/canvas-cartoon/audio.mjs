// audio.mjs: synthesize the whole sound track — music and effects — from the film's cues and music plan.
// Deterministic: same timeline, same WAV. Mono 44.1 kHz, 16-bit.
//   0–8 s      soft night celesta
//   8–51.5 s   bouncy ukulele (Karplus–Strong strums), bass, kick, shaker, whistled melody, 120 BPM
//   52–60.6 s  a few lonely ukulele notes, then silence
//   62–90 s    quiet piano

const SR = 44100;
const hash = i => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const mtof = m => 440 * 2 ** ((m - 69) / 12);
const TAU = Math.PI * 2;

export function synth(cues, dur, M) {
  const n = Math.ceil((dur + .5) * SR), buf = new Float32Array(n);
  const add = (t0, len, fn, amp = 1) => {
    const a = Math.floor(t0 * SR), b = Math.min(n, a + Math.floor(len * SR));
    for (let i = Math.max(0, a); i < b; i++) buf[i] += fn((i - a) / SR, i - a) * amp;
  };
  const sin = (f, x) => Math.sin(TAU * f * x);
  let seed = 1;
  const noise = () => hash(seed++ * .618) * 2 - 1;

  // ---- instruments
  const pluck = (t0, f, amp = .1, len = .9, bright = .5) => {          // Karplus–Strong string
    const N = Math.max(2, Math.round(SR / f)), ring = new Float32Array(N);
    for (let i = 0; i < N; i++) ring[i] = noise();
    let idx = 0, prev = 0;
    add(t0, len, (x) => {
      const v = ring[idx], nx = ring[(idx + 1) % N];
      const out = (v + nx) * .5 * (.994 + bright * .005);
      ring[idx] = out * (1 - (1 - bright) * .02) + prev * 0; prev = out;
      idx = (idx + 1) % N;
      return v * Math.min(1, (len - x) * 8);
    }, amp);
  };
  const piano = (t0, m, amp = .08, len = 3.5) => {
    const f = mtof(m);
    add(t0, len, x => {
      let v = 0;
      for (let k = 1; k <= 6; k++) v += sin(f * k * (1 + .0004 * k * k), x) * Math.exp(-x * (.9 + k * .7)) / k ** 1.4;
      return v * Math.min(1, x * 300) * Math.min(1, (len - x) * 3);
    }, amp);
  };
  const celesta = (t0, m, amp = .05) => { const f = mtof(m); add(t0, 1.6, x => (sin(f, x) + .4 * sin(f * 4, x) * Math.exp(-x * 8)) * Math.exp(-x * 3) * Math.min(1, x * 400), amp); };
  const whistle = (t0, m, len, amp = .045) => { const f = mtof(m); let ph = 0; add(t0, len, x => { ph += TAU * f * (1 + .006 * Math.sin(x * 34)) / SR; const env = Math.min(1, x * 25) * Math.min(1, (len - x) * 12); return (Math.sin(ph) + noise() * .04) * env; }, amp); };
  const kick = (t0, amp = .3) => { let ph = 0; add(t0, .22, x => { ph += TAU * (45 + 90 * Math.exp(-x * 30)) / SR; return Math.sin(ph) * Math.exp(-x * 14); }, amp); };
  const hat = (t0, amp = .03) => { let y = 0; add(t0, .05, x => { const w = noise(); const o = w - y; y = w; return o * Math.exp(-x * 90); }, amp); };
  const clap = (t0, amp = .06) => { let y = 0; add(t0, .15, x => { y += (noise() - y) * .5; return y * (Math.exp(-x * 35) + .5 * Math.exp(-Math.abs(x - .012) * 400)); }, amp); };
  const bass = (t0, m, len, amp = .12) => { const f = mtof(m); add(t0, len, x => (sin(f, x) + .25 * sin(f * 2, x)) * Math.min(1, x * 80) * Math.exp(-x * 2.2) * Math.min(1, (len - x) * 20), amp); };
  const nburst = (t0, len, amp, lp = .2, env = 10) => { let y = 0; add(t0, len, x => { y += (noise() - y) * lp; return y * Math.exp(-x * env); }, amp); };
  const tone = (t0, f, len, amp, decay = 6) => add(t0, len, x => sin(f, x) * Math.exp(-x * decay) * Math.min(1, x * 400), amp);
  const sweep = (t0, f0, f1, len, amp, wave = 'sin') => { let ph = 0; add(t0, len, x => { ph += TAU * (f0 + (f1 - f0) * x / len) / SR; const v = wave === 'sq' ? Math.sign(Math.sin(ph)) * .5 : Math.sin(ph); return v * Math.min(1, x * 200) * Math.min(1, (len - x) * 20); }, amp); };

  // ---- music
  const B = 60 / M.bpm;
  // night intro: slow celesta arpeggio
  const introNotes = [69, 72, 76, 72, 65, 69, 72, 69, 67, 72, 76, 79, 67, 71, 74, 71];
  for (let i = 0; i * .45 + M.introStart < M.upStart - .3; i++) celesta(M.introStart + i * .45, introNotes[i % 16] + 12, .035 * Math.min(1, i / 4));

  // bouncy part
  const CH = [[67, 60, 64, 72], [67, 62, 67, 71], [69, 60, 64, 69], [69, 60, 65, 69]];    // C G Am F (uke voicings)
  const ROOT = [48, 43, 45, 41];
  const STRUM = [[0, 1], [1, 1], [1.5, -1], [2.5, -1], [3, 1], [3.5, -1]];                 // beat, dir (D DU UDU)
  const MEL = [[0, 76, 1], [1, 79, 1], [2, 81, 1], [3, 79, 1], [4, 74, 1.5], [5.5, 71, .5], [6, 74, 2], [8, 72, 1], [9, 76, 1], [10, 81, 1], [11, 79, 1], [12, 77, 1], [13, 76, 1], [14, 72, 2],
    [16, 76, 1], [17, 79, 1], [18, 84, 2], [20, 83, 1], [21, 81, 1], [22, 79, 2], [24, 81, 1], [25, 79, 1], [26, 76, 1], [27, 72, 1], [28, 74, 2], [30, 72, 2]];
  const bars = Math.ceil((M.upEnd - M.upStart) / (4 * B));
  for (let bar = 0; bar < bars; bar++) {
    const t0 = M.upStart + bar * 4 * B, ci = bar % 4, ch = CH[ci];
    const party = t0 >= 41.4 && t0 < 51.5;
    for (const [bt, dir] of STRUM) {
      const ts = t0 + bt * B; if (ts >= M.upEnd) break;
      (dir > 0 ? ch : [...ch].reverse()).forEach((m, k) => pluck(ts + k * .012, mtof(m), dir > 0 ? .07 : .05, .7, .6));
    }
    for (let b = 0; b < 4; b++) {
      const tb = t0 + b * B; if (tb >= M.upEnd) break;
      if (b % 2 === 0) { kick(tb, party ? .34 : .22); bass(tb, ROOT[ci] + (b === 2 ? 7 : 0), B * 1.8, party ? .16 : .11); }
      else clap(tb, party ? .07 : .045);
      hat(tb + B / 2); if (party) hat(tb, .025);
    }
    // whistled melody, an 8-bar loop
    if (bar >= 1) for (const [bt, m, l] of MEL) if (Math.floor(bt / 4) === bar % 8) {
      const tm = t0 + (bt % 4) * B; if (tm < M.upEnd - .1) whistle(tm, m, l * B * .95, party ? .04 : .032);
    }
  }
  // lonely chapter 5
  [[52.4, 69], [53.6, 64], [55.6, 60], [57.2, 62], [58.6, 64], [59.6, 57]].forEach(([t, m]) => pluck(t, mtof(m), .07, 1.6, .3));

  // piano
  const PB = 60 / 66;
  const PCH = [[41, 53, 57, 60, 65], [40, 52, 55, 60, 64], [38, 50, 53, 57, 62], [34, 46, 50, 53, 58], [41, 53, 57, 60, 65], [36, 48, 52, 55, 60], [34, 46, 50, 53, 58], [41, 53, 57, 60, 65]];
  const PMEL = [[1, 0, 72, 2], [1, 2, 74, 1], [1, 3, 72, 1], [2, 0, 69, 3], [3, 0, 70, 2], [3, 2, 69, 1], [3, 3, 67, 1], [4, 0, 65, 3], [5, 0, 67, 2], [5, 2, 72, 2], [6, 0, 74, 2], [6, 2, 72, 1], [6, 3, 70, 1], [7, 0, 69, 4]];
  for (let bar = 0; bar < PCH.length; bar++) {
    const t0 = M.pianoStart + .3 + bar * 4 * PB; if (t0 > 87.6) break;
    const c = PCH[bar];
    if (t0 > 86.5) { c.forEach((m, k) => piano(t0 + k * .06, m, .07, 4.5)); break; }
    piano(t0, c[0], .09); piano(t0, c[0] + 12, .04);
    [1, 2, 3, 4, 3, 2, 3, 4].forEach((k, i) => piano(t0 + i * PB / 2, c[k], .045, 2.2));
  }
  for (const [bar, beat, m, l] of PMEL) { const tm = M.pianoStart + .3 + (bar * 4 + beat) * PB; if (tm < 88) piano(tm, m + 12, .06, l * PB + 1.5); }
  piano(87.6, 77, .05, 3); piano(87.6, 81, .04, 3);

  // ---- effects
  cues.forEach((c, ci) => {
    const t = c.t, r = hash(ci + 7);
    switch (c.kind) {
      case 'key': nburst(t, .04, .12, .6, 120); tone(t, 1800 + r * 400, .03, .05, 120); break;
      case 'enter': nburst(t, .06, .18, .5, 70); tone(t, 900, .1, .08, 40); break;
      case 'peek': sweep(t, 300, 700, .25, .06); break;
      case 'pop': sweep(t, 380, 1400, .1, .14); break;
      case 'sparkle': [1568, 2093, 2637, 3136].forEach((f, k) => tone(t + k * .07, f, .6, .05, 7)); break;
      case 'glint': tone(t, 3520, .4, .04, 9); tone(t + .05, 4186, .4, .03, 9); break;
      case 'pageflip': nburst(t, .25, .1, .35, 14); break;
      case 'nod': tone(t, 660, .1, .05, 30); tone(t + .15, 660, .1, .05, 30); break;
      case 'alarm': for (let i = 0; i < 4; i++) sweep(t + i * .15, 1600, 1600, .08, .04, 'sq'); break;
      case 'hop': sweep(t, 600, 2200, .22, .07); tone(t + .38, 1320, .2, .06, 18); break;
      case 'hopSoft': sweep(t, 600, 1600, .2, .025); tone(t + .38, 1320, .3, .025, 12); break;
      case 'symphony': [48, 55, 60, 64, 67, 72, 76].forEach(m => add(t, 1.1, x => { const f = mtof(m); let v = 0; for (let k = 1; k < 8; k++) v += Math.sin(TAU * f * k * x) / k; return v * Math.min(1, x * 60) * Math.exp(-x * 1.6); }, .05)); kick(t, .5); nburst(t, .8, .15, .3, 4); break;
      case 'curtain': case 'curtainSoft': { const a = c.kind === 'curtain' ? .2 : .05; let y = 0; add(t, .45, x => { y += (noise() - y) * (.05 + .3 * Math.sin(Math.PI * x / .45)); return y * Math.sin(Math.PI * x / .45); }, a); break; }
      case 'lampup': sweep(t, 200, 2400, .9, .04); break;
      case 'tumble': sweep(t, 700, 200, .4, .05); break;
      case 'thud': kick(t, .5); nburst(t, .2, .2, .15, 20); break;
      case 'dizzy': for (let i = 0; i < 6; i++) tone(t + i * .12, 2000 + (i % 2) * 400, .1, .025, 30); break;
      case 'tick': tone(t, 2200, .05, .06, 80); break;
      case 'fridge': nburst(t, .3, .08, .1, 10); break;
      case 'toasterOn': tone(t, 300, .08, .1, 40); nburst(t, .05, .1, .5, 80); break;
      case 'beepOn': tone(t, 1760, .12, .05, 10); break;
      case 'microOn': tone(t, 1200, .15, .05, 10); add(t, 1.8, x => sin(120, x) * .3, .03); break;
      case 'pour': { let y = 0; add(t, 4, x => { y += (noise() - y) * .08; return y * Math.min(1, x * 5) * (1 - x / 4); }, .06); break; }
      case 'toastPop': nburst(t, .05, .2, .6, 60); sweep(t, 300, 900 + (c.pitch || 0) * 60, .12, .1); break;
      case 'bonk': tone(t, 220, .15, c.soft ? .08 : .2, 25); nburst(t, .05, .08, .4, 60); break;
      case 'ding': tone(t, 2637, .5, .06, 6); tone(t, 3951, .4, .03, 8); break;
      case 'plate': tone(t, 1900, .4, .05, 9); tone(t, 2850, .3, .03, 12); break;
      case 'crunch': nburst(t, .14, .22, .7, 30); break;
      case 'button': kick(t, .2); tone(t, 1100, .1, .08, 30); break;
      case 'printStart': for (let i = 0; i < 36; i++) { nburst(t + i * .1, .08, .05 + i * .002, .4, 30); tone(t + i * .1, 180 + (i % 2) * 40, .07, .04, 20); } break;
      case 'paper': case 'rustle': nburst(t, .12, .06, .5, 20); break;
      case 'grab': nburst(t, .1, .1, .6, 30); break;
      case 'aww': [72, 76, 79, 84].forEach((m, k) => tone(t + k * .1, mtof(m), 1.2, .04, 2.5)); break;
      case 'crack': nburst(t, .03, .3, .9, 200); nburst(t + .05, .03, .25, .9, 200); break;
      case 'phoneRing': for (let i = 0; i < 6; i++) add(t + i * .07, .06, x => (sin(1400, x) + sin(1800, x)) * .5, .06); break;
      case 'tap': tone(t, 1500, .06, .07, 60); break;
      case 'sing': { const mel = [72, 76, 79, 77, 76, 74, 76]; mel.forEach((m, k) => { let ph = 0; const f = mtof(m); add(t + k * .22, .22, x => { ph += TAU * f * (1 + .02 * Math.sin(x * 40)) / SR; return (Math.sin(ph) + .3 * Math.sin(2 * ph)) * Math.min(1, x * 30) * Math.min(1, (.22 - x) * 30); }, .05); }); break; }
      case 'hangup': add(t, 1.1, x => sin(425, x) * Math.min(1, x * 100) * Math.min(1, (1.1 - x) * 30), .06); break;
      case 'powerOff': sweep(t, 400, 40, .6, .12); nburst(t, .15, .1, .3, 20); break;
      case 'resolve': tone(t, 392, .3, .04, 8); break;
      case 'leap': sweep(t, 300, 900, .3, .05); break;
      case 'splat': { const L = c.loud ?? 1; kick(t, .5 * L); tone(t, 140, .3, .25 * L, 12); nburst(t, .1, .2 * L, .4, 40); break; }
      case 'squeak': sweep(t, 1800, 900, .7, .025); break;
      case 'bookClose': nburst(t, .12, .12, .2, 30); tone(t, 160, .15, .08, 30); break;
      case 'pianoIn': break;
      case 'door': sweep(t, 300, 180, .5, .025); nburst(t, .08, .06, .3, 40); break;
      case 'doorClose': kick(t, .12); break;
      case 'steps': for (let i = 0; i < 5; i++) nburst(t + i * .23, .06, .06, .2, 50); break;
      case 'flop': kick(t, .2); nburst(t, .3, .1, .08, 10); break;
      case 'dim': sweep(t, 600, 300, 1.2, .012); break;
      case 'musicBox': break;
      case 'beepSoft': tone(t, 1568, .12, .03, 20); break;
      case 'scroll': for (let i = 0; i < 10; i++) tone(t + i * .08, 2400, .02, .025, 120); break;
      case 'eyesOpen': tone(t, 1046, .5, .02, 6); break;
      case 'thanks': break;
      case 'touch': tone(t, 1318, 1, .04, 3); break;
      case 'hug': [76, 79, 84].forEach((m, k) => tone(t + k * .12, mtof(m), 1.5, .035, 2)); break;
      case 'breath': break;
      case 'write': for (let i = 0; i < 12; i++) nburst(t + i * .09, .07, .02, .5, 30); break;
    }
  });

  // party room hum stops dead at the blackout; tidy the very end
  for (let i = 0; i < n; i++) { const x = i / SR; if (x > dur - .8) buf[i] *= Math.max(0, (dur - x) / .8); }

  const out = Buffer.alloc(44 + n * 2);
  out.write('RIFF', 0); out.writeUInt32LE(36 + n * 2, 4); out.write('WAVEfmt ', 8);
  out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(1, 22);
  out.writeUInt32LE(SR, 24); out.writeUInt32LE(SR * 2, 28); out.writeUInt16LE(2, 32); out.writeUInt16LE(16, 34);
  out.write('data', 36); out.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) out.writeInt16LE(Math.round(Math.tanh(buf[i] * 1.6) * 30000), 44 + i * 2);
  return out;
}
