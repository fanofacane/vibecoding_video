// runtime.js: loads works/<id>/work.js (from ?work=<id>), waits for fonts, and exposes renderAt / renderSheet
// to render.mjs plus a time slider for manual preview.
ctx = document.getElementById('out').getContext('2d');
let TIMELINE = [], DUR = 0;

function drawAt(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.filter = 'none';
  const sc = TIMELINE.find(s => t >= s[0] && t < s[1]) || TIMELINE[TIMELINE.length - 1];
  sc[2](t, t - sc[0]);
}
window.renderAt = async (t, type = 'image/png', q = .92) => { drawAt(t); return ctx.canvas.toDataURL(type, q); };
window.renderSheet = async (times, cols = 3, w = 640) => {
  const h = Math.round(w * 9 / 16), sc = document.createElement('canvas'); sc.width = cols * w; sc.height = Math.ceil(times.length / cols) * h;
  const c = sc.getContext('2d');
  times.forEach((t, i) => {
    drawAt(t); const x = (i % cols) * w, y = Math.floor(i / cols) * h; c.drawImage(ctx.canvas, x, y, w, h);
    c.fillStyle = 'rgba(0,0,0,.65)'; c.fillRect(x, y, 90, 26); c.fillStyle = '#fff'; c.font = '16px sans-serif'; c.fillText(t.toFixed(2) + 's', x + 6, y + 18);
  });
  return sc.toDataURL('image/jpeg', .9);
};

const params = new URLSearchParams(location.search), workId = params.get('work') || 'ai-zhenhuan-ep01';
const s = document.createElement('script'); s.src = `works/${workId}/work.js`;
s.onerror = () => { document.getElementById('tt').textContent = `cannot load works/${workId}/work.js`; };
s.onload = async () => {
  WORK.id = workId;
  TIMELINE = WORK.timeline(); DUR = WORK.duration ?? TIMELINE[TIMELINE.length - 1][1];
  window.WORK_INFO = { id: workId, duration: DUR, fps: WORK.fps || 30, music: WORK.music && WORK.music.file ? `works/${workId}/${WORK.music.file}` : null };
  // Noto Sans SC is split into unicode-range subsets: load every glyph the work uses before reporting ready.
  const glyphs = JSON.stringify(WORK) + WORK.cast.map(c => c.name + '（饰）').join('') + '‹···✓×0123456789,';
  await Promise.all([900, 800, 500].map(w => document.fonts.load(`${w} 60px "Noto Sans SC"`, glyphs)));
  window.ready = true;
  if (params.has('render')) return;
  const sl = document.getElementById('scrub'), lab = document.getElementById('tt');
  sl.max = DUR; const go = () => { drawAt(+sl.value); lab.textContent = `${workId}  ${(+sl.value).toFixed(2)}s / ${DUR}s`; };
  sl.addEventListener('input', go); go();
};
document.body.appendChild(s);
