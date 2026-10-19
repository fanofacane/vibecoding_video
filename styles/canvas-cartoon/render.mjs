// render.mjs: drive studio.html in headless Chrome.
//   node render.mjs --sheet=1,5,12 [--cols=3] [--w=640] --out=out/check.jpg   contact sheet (fast visual check)
//   node render.mjs --stills=3,12 --out=out/stills                          full-res PNG stills
//   node render.mjs --clip=8:18 [--fps=30] --out=out/clip.mp4               a stretch of the film, with sound
//   node render.mjs --video [--fps=30] [--workers=4] --out=out/film.mp4     whole film: frames → sound → MP4
//   node render.mjs --audio --out=out/sound.wav                             only the synthesized sound track
// Browser: --chrome=<path>, or env CHROME_PATH; otherwise common install locations are tried.
import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { synth } from './audio.mjs';

const STYLE_DIR = dirname(fileURLToPath(import.meta.url));
const stylePath = p => resolve(STYLE_DIR, p);
const args = Object.fromEntries(process.argv.slice(2).map(a => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? true]; }));
const fps = +(args.fps || 30);

const CHROME = args.chrome || process.env.CHROME_PATH || [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
].find(existsSync);
if (!CHROME) { console.error('Chrome not found: pass --chrome=<path>'); process.exit(1); }

const run = (cmd, a) => new Promise((ok, bad) => { const p = spawn(cmd, a, { stdio: 'inherit' }); p.on('close', c => c ? bad(new Error(cmd + ' exited ' + c)) : ok()); });

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true, protocolTimeout: 0,
  args: ['--allow-file-access-from-files', '--window-size=1920,1080', '--disable-renderer-backgrounding', '--disable-background-timer-throttling',
    ...(process.getuid?.() === 0 ? ['--no-sandbox'] : [])],  // Chrome refuses to start as root (e.g. in containers) without it
});
async function openPage(tag = '') {
  const page = await browser.newPage();
  page.on('console', m => { if (['error', 'warn'].includes(m.type())) console.log(`[page${tag}]`, m.text()); });
  page.on('pageerror', e => console.log(`[page error${tag}]`, e.message));
  await page.goto(pathToFileURL(stylePath('studio.html')).href, { waitUntil: 'load' });
  await page.waitForFunction('window.ready === true', { timeout: 60000 });
  return page;
}
const frameOf = async (page, t, type, q) => {
  const url = await page.evaluate((t, type, q) => window.renderAt(t, type, q), t, type, q);
  return Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
};
const times = s => String(s).split(',').map(Number);

async function renderFrames(dir, t0, t1) {
  rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
  const n = Math.ceil((t1 - t0) * fps), workers = +(args.workers || 4); let next = 0, done = 0; const start = Date.now();
  await Promise.all(Array.from({ length: workers }, async (_, w) => {
    const p = await openPage('#' + w);
    while (next < n) {
      const i = next++;
      writeFileSync(`${dir}/f${String(i).padStart(5, '0')}.png`, await frameOf(p, t0 + i / fps, 'image/png'));
      if (++done % fps === 0 || done === n) console.log(`frame ${done}/${n}  ${((Date.now() - start) / done).toFixed(0)} ms/frame`);
    }
    await p.close();
  }));
}
async function encode(dir, wav, out, t0) {
  await run('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', `${dir}/f%05d.png`, '-ss', String(t0), '-i', wav,
    '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-tune', 'animation',
    '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-shortest', out]);
  console.log('wrote ' + out);
}

if (args.sheet) {
  const page = await openPage(), out = stylePath(args.out || 'out/sheet.jpg'); mkdirSync(dirname(out), { recursive: true });
  const { url, ms } = await page.evaluate((ts, c, w) => window.renderSheet(ts, c, w), times(args.sheet), +(args.cols || 3), +(args.w || 640));
  writeFileSync(out, Buffer.from(url.slice(url.indexOf(',') + 1), 'base64'));
  console.log(`${out}  ms/frame: ${ms.join(' ')}`);
} else if (args.stills) {
  const page = await openPage(), out = stylePath(args.out || 'out/stills'); mkdirSync(out, { recursive: true });
  for (const s of times(args.stills)) {
    const f = `${out}/t${s.toFixed(2).replace('.', '_')}.png`; writeFileSync(f, await frameOf(page, s, 'image/png')); console.log(f);
  }
} else if (args.audio || args.video || args.clip) {
  const page = await openPage();
  const { dur, cues, music } = await page.evaluate(() => ({ dur: window.DURATION, cues: window.CUES, music: window.MUSIC }));
  await page.close();
  const wav = stylePath(args.audio ? (args.out || 'out/sound.wav') : 'out/sound.wav'); mkdirSync(dirname(wav), { recursive: true });
  writeFileSync(wav, synth(cues, dur, music));
  console.log(`sound → ${wav}  (${dur.toFixed(2)} s, ${cues.length} cues)`);
  if (args.video || args.clip) {
    const [t0, t1] = args.clip ? String(args.clip).split(':').map(Number) : [0, dur];
    const dir = stylePath('out/frames');
    await renderFrames(dir, t0, t1);
    await encode(dir, wav, stylePath(args.out || (args.clip ? 'out/clip.mp4' : 'out/film.mp4')), t0);
  }
}
await browser.close();
