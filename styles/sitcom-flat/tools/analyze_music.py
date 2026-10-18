#!/usr/bin/env python3
"""analyze_music.py: find the timing numbers a sitcom-flat work needs from a song (audio or video file).

    python3 tools/analyze_music.py <song.mp3|video.mp4> [--extract works/<id>/assets/music.m4a] [--spec out.png]

Prints, ready to paste into work.js `music`:
  beat     seconds per beat (tempo searched in 90–180 BPM)
  vocals   where the first sung line starts: the first beat after the intro's drum fill, else the beat with the
           biggest lasting loudness jump (other candidates are listed too)
  fill     the drum-fill hits just before `vocals` (the opening's logo row hops on them)
  end      where the song itself ends: the start of the last silence; anything after it (platform voice tags,
           watermarks) is cut off
Always check by ear or with --spec (a spectrogram of the first 15 s): automatic guesses can be a beat off.
--extract writes the music trimmed at `end` with a 0.5 s fade-out. Needs ffmpeg and numpy.
"""
import subprocess, sys
import numpy as np

SR = 16000


def decode(path, mono=True):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-vn', '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'],
                         check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.int16).astype(np.float64) / 32768


def rms_track(x, hop):
    n = len(x) // hop
    return np.sqrt(np.mean(x[:n * hop].reshape(n, hop) ** 2, axis=1))


def song_end(x):
    """Start of the last run of digital silence (≥0.3 s) in the final 10 s, else the file end."""
    hop = int(SR * .02); r = rms_track(x, hop); quiet = r < 1e-3
    end = len(r); i = len(r) - 1; tail = max(0, len(r) - int(10 / .02))
    while i > tail:
        if quiet[i]:
            j = i
            while j > tail and quiet[j - 1]: j -= 1
            if (i - j + 1) * .02 >= .3: end = j
            i = j - 1
        else:
            i -= 1
    return end * .02


def onset_env(x):
    hop = 256; r = rms_track(x, hop)
    le = np.log1p(r ** 2 * 1e4); on = np.maximum(0, np.diff(le, prepend=le[0]))
    on = np.maximum(0, on - np.convolve(on, np.ones(16) / 16, 'same'))
    return on, SR / hop


def tempo(on, fps):
    ac = np.correlate(on, on, 'full')[len(on) - 1:]
    best = None
    for bpm in np.arange(90, 180.01, .05):
        lag = 60 / bpm * fps
        score = sum(np.interp(lag * m, np.arange(len(ac)), ac) / m for m in (1, 2, 4))
        if best is None or score > best[0]: best = (score, bpm)
    return 60 / best[1]


def refine(on, fps, beat, t_max):
    """Fine-tune beat length and phase together so the beat grid lines up with onsets over the whole song."""
    sm = np.convolve(on, np.ones(3) / 3, 'same'); best = (-1, beat, 0)
    for bpm in np.arange(60 / beat - 1.5, 60 / beat + 1.5, .01):
        b = 60 / bpm; ks = np.arange(0, int(t_max / b))
        for ph in np.arange(0, b, .005):
            sc = sm[np.minimum(((ph + ks * b) * fps).astype(int), len(sm) - 1)].sum()
            if sc > best[0]: best = (sc, b, ph)
    return best[1], best[2]


def fills(x, limit=20):
    """Drum fills: runs of ≥3 sharp hits spaced 0.12–0.3 s apart (eighth notes) within the first `limit` s."""
    hop = int(SR * .0125); r = rms_track(x[:int(limit * SR)], hop); med = np.convolve(r, np.ones(240) / 240, 'same')
    peaks = [k * .0125 for k in range(1, len(r) - 1) if r[k] > r[k - 1] and r[k] >= r[k + 1] and r[k] > med[k] * 1.6]
    runs, cur = [], []
    for t in peaks:
        if cur and t - cur[-1] < .1: continue
        if cur and .12 <= t - cur[-1] <= .3: cur.append(t)
        else:
            if len(cur) >= 3: runs.append(cur)
            cur = [t]
    if len(cur) >= 3: runs.append(cur)
    return [[round(t, 3) for t in run] for run in runs]


def loud_jumps(x, beat, ph, limit=20, top=3):
    """Beats ranked by how much louder the next 2 s are than the previous 1.5 s (fallback when there is no fill)."""
    hop = int(SR * .05); r = rms_track(x, hop); out = []
    for t in np.arange(ph, limit, beat):
        i = int(t / .05)
        if 30 <= i and i + 40 < len(r): out.append((np.median(r[i:i + 40]) / np.median(r[i - 30:i]), round(t, 2)))
    return [t for _, t in sorted(out, reverse=True)[:top]]


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    opts = dict(a[2:].split('=', 1) if '=' in a else (a[2:], '') for a in sys.argv[1:] if a.startswith('--'))
    for k in ('extract', 'spec'):  # allow "--extract path" as well as "--extract=path"
        if k in opts and not opts[k] and k in sys.argv:
            i = sys.argv.index('--' + k); opts[k] = sys.argv[i + 1]; args.remove(sys.argv[i + 1])
    if not args: sys.exit(__doc__)
    src = args[0]; x = decode(src)
    dur = len(x) / SR; end = song_end(x)
    on, fps = onset_env(x[:int(end * SR)])
    beat, ph = refine(on, fps, tempo(on, fps), end)
    # a fill usually ends by landing on the downbeat where the song proper starts: if its last hit is on the
    # beat grid, that hit is the entry; otherwise the entry is the next beat.
    fl = fills(x); near = lambda t: ph + round((t - ph) / beat) * beat
    def entry(run):
        last = run[-1]
        return (round(near(last), 2), run[:-1]) if abs(near(last) - last) < .06 else (round(near(last + beat / 2), 2), run)
    entries = [entry(run) for run in fl]; after_fill = [e for e, _ in entries]
    jumps = loud_jumps(x, beat, ph)
    vox = after_fill[0] if after_fill else jumps[0]
    fill = entries[0][1] if entries else []
    print(f'file      {src}  ({dur:.2f} s)')
    print(f'tempo     {60 / beat:.1f} BPM')
    if end < dur - .05: print(f'tail      {dur - end:.2f} s after the song ends will be cut (voice tags / silence)')
    print('\nmusic: {')
    print(f"  file: 'assets/music.m4a', beat: {beat:.5f}, vocals: {vox:.2f}, phraseBeats: 8," if vox else f"  file: 'assets/music.m4a', beat: {beat:.5f}, vocals: ?, phraseBeats: 8,")
    print(f'  fill: {fill},')
    print(f'  end: {end:.2f},\n}}')
    print(f"\nvocals: {'first beat after the drum fill ' + str(fill) if after_fill else 'biggest loudness jump'}; "
          f"other candidates: {sorted(float(c) for c in set(after_fill[1:] + jumps) - {vox})}. Check by ear or with --spec.")
    if vox:
        print('\nphrase starts P(n): ' + '  '.join(f'{n}:{vox + n * 8 * beat:.2f}' for n in range(0, 40) if vox + n * 8 * beat < end))
    if 'spec' in opts:
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-t', '15', '-i', src, '-vn', '-ac', '1', '-lavfi',
                        'showspectrumpic=s=1440x400:fscale=lin:stop=4000:legend=1:color=intensity', opts['spec']], check=True)
        print(f'\nspectrogram of the first 15 s → {opts["spec"]}')
    if 'extract' in opts:
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-vn', '-t', f'{end:.3f}', '-af', f'afade=t=out:st={max(0, end - .5):.3f}:d=0.5',
                        '-c:a', 'aac', '-b:a', '192k', opts['extract']], check=True)
        print(f'\nmusic trimmed at {end:.2f} s → {opts["extract"]}')


if __name__ == '__main__':
    main()
