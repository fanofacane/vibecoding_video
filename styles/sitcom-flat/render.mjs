// render.mjs: drive index.html in headless Chrome.
//   node render.mjs --sheet=1,3,5.5 [--cols=3] [--w=640] --out=out/check.jpg   contact sheet
//   node render.mjs --stills=5.5,7.5 --out=out/stills                         full-res PNG stills
//   node render.mjs --clip=0:13 [--fps=30] [--audio=path] --out=out/clip.mp4   video (silent unless --audio)
// Options: --chrome=<path>, --no-sandbox (root in Linux containers). HTTPS_PROXY, if set, is passed to Chrome for web fonts.
import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const STYLE_DIR = dirname(fileURLToPath(import.meta.url));
const stylePath = p => resolve(STYLE_DIR, p);
const args = Object.fromEntries(process.argv.slice(2).map(a => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? true]; }));
const CHROME = args.chrome || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const fps = +(args.fps || 30);

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true, protocolTimeout: 0,
  args: ['--allow-file-access-from-files', '--window-size=1920,1080', '--disable-renderer-backgrounding', '--disable-background-timer-throttling',
    ...(args['no-sandbox'] ? ['--no-sandbox'] : []), ...(process.env.HTTPS_PROXY ? [`--proxy-server=${process.env.HTTPS_PROXY}`] : [])]
});
const page = await browser.newPage();
page.on('console', m => { if (['error', 'warn'].includes(m.type())) console.log('[page]', m.text()); });
page.on('pageerror', e => console.log('[page error]', e.message));
await page.goto(pathToFileURL(stylePath('index.html')).href + '?render', { waitUntil: 'networkidle0', timeout: 60000 });
await page.waitForFunction('window.ready === true', { timeout: 60000 });
const frame = async (t, type, q) => { const url = await page.evaluate((t, type, q) => window.renderAt(t, type, q), t, type, q); return Buffer.from(url.slice(url.indexOf(',') + 1), 'base64'); };
const times = s => String(s).split(',').map(Number);

if (args.sheet) {
  const out = stylePath(args.out || 'out/sheet.jpg'); mkdirSync(dirname(out), { recursive: true });
  const url = await page.evaluate((ts, c, w) => window.renderSheet(ts, c, w), times(args.sheet), +(args.cols || 3), +(args.w || 640));
  writeFileSync(out, Buffer.from(url.slice(url.indexOf(',') + 1), 'base64')); console.log(out);
} else if (args.stills) {
  const out = stylePath(args.out || 'out/stills'); mkdirSync(out, { recursive: true });
  for (const s of times(args.stills)) { const f = `${out}/t${s.toFixed(2).replace('.', '_')}.png`; writeFileSync(f, await frame(s, 'image/png')); console.log(f); }
} else {
  const DUR = await page.evaluate(() => DUR), [a, b] = args.clip ? String(args.clip).split(':').map(Number) : [0, DUR];
  const out = stylePath(args.out || 'out/clip.mp4'); mkdirSync(dirname(out), { recursive: true });
  const audio = args.audio ? ['-ss', String(a), '-t', String(b - a), '-i', resolve(args.audio), '-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '192k', '-shortest'] : [];
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', ...audio,
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const n = Math.round((b - a) * fps);
  for (let i = 0; i < n; i++) { const buf = await frame(a + i / fps, 'image/jpeg', .93); if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r)); }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); console.log(`wrote ${out} (${n} frames)`);
}
await browser.close();
