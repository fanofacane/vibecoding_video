// render.mjs: drive studio.html in headless Chrome for one cut of one work.
//   node render.mjs [--work=liubai] [--cut=sample] --sheet=1,5,12 [--cols=4] [--w=480]   contact sheet → out/<work>/<cut>/sheet.jpg
//   node render.mjs --stills=3,12                                                     full-res PNG stills → out/<work>/<cut>/stills/
//   node render.mjs --video [--fps=30] [--workers=4]                                  frames → sound → MP4 → out/<work>/<cut>/<cut>.mp4
//   node render.mjs --audio                                                           sound track only → out/<work>/<cut>/sound.wav
// --out overrides each default path. Browser: --chrome=<path>, or env CHROME_PATH; otherwise common install locations.
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
const WORK = args.work || 'liubai', CUT = args.cut || 'sample';
if (!existsSync(stylePath(`works/${WORK}/${CUT}.js`))) { console.error(`no such cut: works/${WORK}/${CUT}.js`); process.exit(1); }
if (!existsSync(stylePath(`works/${WORK}/fonts/fonts.css`))) console.warn(`warning: no fonts yet, run: node tools/fetch-fonts.mjs --work=${WORK}`);
const outPath = def => stylePath(args.out || `out/${WORK}/${CUT}/${def}`);

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
  await page.goto(pathToFileURL(stylePath('studio.html')).href + `?work=${WORK}&cut=${CUT}`, { waitUntil: 'load' });
  await page.waitForFunction('window.ready === true', { timeout: 60000 });
  return page;
}
const b64 = url => Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
const times = s => String(s).split(',').map(Number);

if (args.sheet) {
  const page = await openPage(), out = outPath('sheet.jpg'); mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, b64(await page.evaluate((ts, c, w) => window.renderSheet(ts, c, w), times(args.sheet), +(args.cols || 4), +(args.w || 480))));
  console.log(out);
} else if (args.stills) {
  const page = await openPage(), out = outPath('stills'); mkdirSync(out, { recursive: true });
  for (const s of times(args.stills)) {
    const f = `${out}/t${s.toFixed(2).replace('.', '_')}.png`;
    writeFileSync(f, b64(await page.evaluate(t => window.renderAt(t, 'image/png'), s))); console.log(f);
  }
} else if (args.audio || args.video) {
  const page = await openPage();
  const { dur, cues, pad } = await page.evaluate(() => ({ dur: window.DURATION, cues: window.CUES, pad: window.PAD }));
  const wav = args.audio ? outPath('sound.wav') : stylePath(`out/${WORK}/${CUT}/sound.wav`); mkdirSync(dirname(wav), { recursive: true });
  writeFileSync(wav, synth(cues, pad, dur));
  console.log(`sound → ${wav}  (${dur.toFixed(2)} s, ${cues.length} cues)`);
  if (args.video) {
    await page.close();
    const dir = stylePath(`out/${WORK}/${CUT}/frames`); rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
    const n = Math.ceil(dur * fps), workers = +(args.workers || 4); let next = 0, done = 0; const start = Date.now();
    await Promise.all(Array.from({ length: workers }, async (_, w) => {
      const p = await openPage('#' + w);
      while (next < n) {
        const i = next++;
        writeFileSync(`${dir}/f${String(i).padStart(5, '0')}.jpg`, b64(await p.evaluate(t => window.renderAt(t, 'image/jpeg', .95), i / fps)));
        if (++done % (fps * 2) === 0 || done === n) console.log(`frame ${done}/${n}  ${((Date.now() - start) / done).toFixed(0)} ms/frame`);
      }
    }));
    const out = outPath(`${CUT}.mp4`);
    await run('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', `${dir}/f%05d.jpg`, '-i', wav,
      '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'slow', '-crf', '22', '-pix_fmt', 'yuv420p',
      '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-shortest', out]);
    rmSync(dir, { recursive: true, force: true });
    console.log('wrote ' + out);
  }
}
await browser.close();
