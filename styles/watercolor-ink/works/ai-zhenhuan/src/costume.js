// costume.js: AI 甄嬛传 characters = brand logo + painted Qing-court headwear.
// Logos are drawn on a 2D layer with a light watercolor treatment; headwear is painted with p5.brush on top.

const ZH = {
  satin: '#2A2742', satinLt: '#4A4670', gold: '#D9A441', goldDk: '#9C6B1E', pearl: '#FBF3E4',
  silver: '#B9BDCB', red: '#C8413A', crimson: '#A8323A', jade: '#8FC7B0', wood: '#8B5A2B'
};

let logoG = null;

// Force p5.brush to composite everything queued so far (same trick as flushLetters), so a 2D layer can go on top.
function flushBrush() {
  push(); resetMatrix(); translate(-W / 2, -H / 2);
  brush.noStroke(); brush.noHatch(); brush.noWash(); brush.fill('#000000', 1); brush.fillBleed(0); brush.fillTexture(0, 0);
  brush.polygon([[-50, -50], [-40, -50], [-40, -40]]); brush.noFill();
  pop();
}

// ---------- logos ----------
function logoLayer() {
  if (!logoG) { logoG = createGraphics(W, H); logoG.pixelDensity(1); }
  logoG.clear(); return logoG.drawingContext;
}
function hexA(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }

// Draw logo `key` centred at (cx, cy), `size` px wide, with watercolor-like mottling and pooled edges.
function drawLogo(c, key, cx, cy, size, inkCol, seed = 1) {
  const L = LOGOS[key], s = size / 24, rnd = lcg(seed * 97 + 13);
  c.save(); c.translate(cx - size / 2, cy - size / 2); c.scale(s, s);
  for (const [d, col] of L.paths) {
    const p = new Path2D(d), base = col || inkCol;
    let fill = base;
    if (key === 'gemini') {
      const g = c.createLinearGradient(0, 24, 16.5, 7.3);
      g.addColorStop(0, '#1C7DFF'); g.addColorStop(.52, '#1C69FF'); g.addColorStop(1, '#F0DCD6'); fill = g;
    }
    c.globalAlpha = .94; c.fillStyle = fill; c.fill(p, L.rule);
    // mottled pigment inside the shape
    c.save(); c.clip(p, L.rule); c.globalAlpha = 1;
    for (let i = 0; i < 16; i++) {
      const x = rnd() * 24, y = rnd() * 24, r = 2 + rnd() * 6, light = rnd() < .5;
      const g = c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, light ? 'rgba(255,248,235,.16)' : 'rgba(40,20,40,.12)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
    c.restore();
    // pigment pooling at the edges
    c.globalAlpha = .45; c.strokeStyle = typeof base === 'string' ? mixCol(base, '#1a1020', .4) : '#1a1020';
    if (key === 'gemini') c.strokeStyle = hexA('#1C4FCC', .8);
    c.lineWidth = .22; c.lineJoin = 'round'; c.stroke(p);
  }
  c.restore(); c.globalAlpha = 1;
}

// ---------- headwear pieces (local space: base of the headpiece at y = 0, centred on x = 0) ----------
function flower(x, y, r, col, mid = ZH.gold, n = 5, rot = 0) {
  for (let i = 0; i < n; i++) {
    const a = rot + i / n * TAU;
    paint(ellPts(x + Math.cos(a) * r * .55, y + Math.sin(a) * r * .55, r * .52, r * .36, 14, r * .03, a),
      { wash: col, washOp: 245, fill: mixCol(col, '#ffffff', .35), fillOp: 90, tex: .5, ink: PAL.ink, sw: .55, br: 'inkfine' });
  }
  paint(ellPts(x, y, r * .3, r * .3, 12, .5), { wash: mid, washOp: 255, ink: PAL.ink, sw: .5, br: 'inkfine' });
}
function pompom(x, y, r, col) {
  for (let i = 0; i < 9; i++) {
    const a = i / 9 * TAU + .3, d = i === 8 ? 0 : r * .55;
    paint(ellPts(x + Math.cos(a) * d, y + Math.sin(a) * d, r * .42, r * .42, 12, r * .05), { wash: mixCol(col, '#ffffff', hash(i) * .35), washOp: 240, ink: null });
  }
  paint(ellPts(x, y, r * 1.05, r * 1.05, 20, r * .05), { ink: mixCol(col, PAL.ink, .5), sw: .5, br: 'inkfine' });
}
// String of beads hanging from (x, y) down `len` px, ending in a small silk tassel.
function tassel(x, y, len, bead = ZH.pearl, silk = ZH.red, n = 6) {
  inkLine([[x, y], [x + 1, y + len * .5], [x, y + len]], .45, ZH.goldDk, 'inkfine', .5);
  for (let i = 1; i <= n; i++) {
    const by = y + len * i / (n + 1);
    paint(ellPts(x, by, 5.5, 5.5, 10, .3), { wash: bead, washOp: 255, ink: PAL.ink, sw: .4, br: 'inkfine' });
  }
  paint([[x - 3, y + len], [x + 3, y + len], [x + 9, y + len + 26], [x - 9, y + len + 26]], { wash: silk, washOp: 240, ink: PAL.ink, sw: .4, br: 'inkfine' });
}
function hairpin(x1, y1, x2, y2, col = ZH.silver, head = ZH.pearl) {
  inkLine([[x1, y1], [x2, y2]], 1.4, col, 'ink', 0);
  paint(ellPts(x1, y1, 9, 9, 12, .4), { wash: head, washOp: 255, ink: PAL.ink, sw: .5, br: 'inkfine' });
}
// Calligraphy brush stuck into the headpiece at angle `a`.
function brushPen(x, y, a, len = 120) {
  push(); translate(x, y); rotate(a);
  paint(rrPts(-len * .5, -6, len * .78, 12, 5, .5), { wash: ZH.wood, washOp: 255, fill: '#5E3A1A', fillOp: 60, tex: .5, ink: PAL.ink, sw: .6 });
  paint([[len * .28, -8], [len * .5, 0], [len * .28, 8]], { wash: PAL.ink, washOp: 255, ink: PAL.ink, sw: .5, curv: .4 });
  paint(rrPts(len * .22, -8, 12, 16, 3), { wash: ZH.gold, washOp: 255, ink: PAL.ink, sw: .4, br: 'inkfine' });
  pop();
}
function foldFan(x, y, r, a, col = '#F4E3C3') {
  push(); translate(x, y); rotate(a);
  const pts = [[0, 0]]; for (let i = 0; i <= 8; i++) { const t = -1.1 + i / 8 * 2.2 - Math.PI / 2; pts.push([Math.cos(t) * r, Math.sin(t) * r]); }
  paint(pts, { wash: col, washOp: 255, fill: PAL.rose, fillOp: 40, tex: .5, ink: PAL.ink, sw: .6 });
  for (let i = 1; i < 6; i++) { const t = -1.1 + i / 6 * 2.2 - Math.PI / 2; inkLine([[0, 0], [Math.cos(t) * r, Math.sin(t) * r]], .35, PAL.ink, 'inkfine', 0); }
  pop();
}
function pipa(x, y, s, a) {
  push(); translate(x, y); rotate(a);
  paint(rrPts(-3, -s * 1.9, 6, s * 1.2, 2), { wash: ZH.wood, washOp: 255, ink: PAL.ink, sw: .5 });
  paint(ellPts(0, -s * .3, s * .45, s * .65, 18, .4), { wash: PAL.ochre, washOp: 255, fill: ZH.wood, fillOp: 70, tex: .6, ink: PAL.ink, sw: .6 });
  paint(ellPts(0, -s * .25, s * .1, s * .1, 10), { wash: PAL.ink, washOp: 255, ink: null });
  pop();
}
function paintBrush(x, y, a, len = 80, tip = PAL.teal) {
  push(); translate(x, y); rotate(a);
  paint(rrPts(-len / 2, -3.5, len * .8, 7, 3), { wash: '#C9A06A', washOp: 255, ink: PAL.ink, sw: .5 });
  paint([[len * .3, -6], [len * .5, 0], [len * .3, 6]], { wash: tip, washOp: 255, ink: PAL.ink, sw: .4, curv: .5 });
  pop();
}

// 头座: the small dome that sits on the head and carries the headpiece.
function headBase(w = 110, h = 38) {
  const pts = []; for (let i = 0; i <= 12; i++) { const a = Math.PI + i / 12 * Math.PI; pts.push([Math.cos(a) * w / 2, 4 + Math.sin(a) * h]); }
  paint(pts, { wash: ZH.satin, washOp: 255, fill: ZH.satinLt, fillOp: 70, tex: .5, ink: PAL.ink, sw: .9, curv: .3 });
}
// 大拉翅: tall fan-shaped satin board (high rank).
function dalachi(w = 220, h = 130) {
  headBase(w * .5, 36);
  const by = -26, pts = [[-w * .3, by]];
  for (let k = 0; k <= 10; k++) pts.push([lerp(-w / 2, w / 2, k / 10), by - h - Math.sin(k / 10 * Math.PI) * h * .1]);
  pts.push([w * .3, by]);
  paint(pts, { wash: ZH.satin, washOp: 255, fill: ZH.satinLt, fillOp: 90, bleed: .08, tex: .7, border: .45, ink: PAL.ink, sw: 1.1 });
  // satin sheen and the stitched rim
  inkLine([[-w * .36, by - h * .45], [0, by - h * .52], [w * .36, by - h * .45]], .5, '#6F6A9C', 'dry', .5);
  inkLine([[-w * .46, by - h * .93], [0, by - h * 1.05], [w * .46, by - h * .93]], .45, ZH.gold, 'inkfine', .5);
}
// 两把头: low horizontal board (lower rank). `w` sets width.
function liangbatou(w = 200) {
  headBase(w * .45, 34);
  const y0 = -30, hh = 34, pts = [];
  for (let k = 0; k <= 8; k++) pts.push([lerp(-w / 2, w / 2, k / 8), y0 - hh - Math.sin(k / 8 * Math.PI) * 6]);
  for (let k = 8; k >= 0; k--) pts.push([lerp(-w / 2, w / 2, k / 8), y0 + Math.sin(k / 8 * Math.PI) * 4]);
  paint(pts, { wash: ZH.satin, washOp: 255, fill: ZH.satinLt, fillOp: 90, tex: .7, border: .45, ink: PAL.ink, sw: 1, curv: .25 });
  inkLine([[-w * .42, y0 - hh * .55], [w * .42, y0 - hh * .55]], .45, '#6F6A9C', 'dry', .3);
}
// 小发髻: just a bun (lowest rank).
function bun(w = 90) {
  headBase(w, 30);
  paint(ellPts(0, -40, w * .32, w * .26, 18, 1), { wash: ZH.satin, washOp: 255, fill: ZH.satinLt, fillOp: 80, tex: .6, ink: PAL.ink, sw: .9 });
}

// ---------- the six consorts ----------
// Each: headwear(painted in local space). ax/ay: anchor on the logo (24-unit logo space), tilt: headpiece tilt, k: scale.
const CONSORTS = [
  { key: 'chatgpt', name: '对妃', brand: 'ChatGPT', tag: '对对对，皇上圣明！', col: '#10A37F', ax: 12, ay: 1.6, tilt: 0, k: 1,
    hat() {
      dalachi(236, 156);
      tassel(-108, -40, 110, ZH.gold, ZH.red); tassel(108, -40, 110, ZH.gold, ZH.red);
      flower(-62, -120, 22, PAL.ochre); flower(62, -120, 22, PAL.ochre);
      flower(0, -112, 44, ZH.red, ZH.gold, 6);           // the loud red flower
    } },
  { key: 'gemini', name: '文妃', brand: 'Gemini', tag: '此情此景，当赋诗一首', col: '#1C69FF', ax: 12, ay: 4.4, tilt: -.05, k: .92,
    hat() {
      dalachi(214, 122);
      brushPen(44, -96, -.75, 150);                       // a brush as a hairpin
      flower(-40, -96, 20, '#9AA8F0', PAL.cream); flower(-74, -70, 13, '#C9B4F2', PAL.cream);
      tassel(-98, -38, 150, '#B7C3FF', PAL.violet, 8); tassel(-78, -36, 120, '#D9CCFF', PAL.violet, 6);
    } },
  { key: 'grok', name: '平嫔', brand: 'Grok', tag: '这个臣妾也会一点！', col: '#26232E', ax: 12.6, ay: 4.6, tilt: .04, k: .95,
    hat() {
      liangbatou(212);
      brushPen(-50, -70, -1.05, 110);
      foldFan(-12, -62, 56, -.25);
      pipa(42, -52, 40, .35);
      paintBrush(80, -66, .9, 86, PAL.rose);
      flower(-88, -50, 13, PAL.sky, PAL.cream);
    } },
  { key: 'claude', name: '熹贵人', brand: 'Claude', tag: '皇上要的，其实是这个。', col: '#D97757', ax: 12, ay: 3.4, tilt: -.03, k: .92,
    hat() {
      liangbatou(184);
      hairpin(-30, -78, 40, -46, ZH.silver, ZH.pearl);
      flower(30, -66, 15, '#F6EEDF', ZH.jade);
      tassel(84, -40, 92, ZH.pearl, '#E6C9A8', 5);
    } },
  { key: 'deepseek', name: '深贵人', brand: 'DeepSeek', tag: '让臣妾再想想……', col: '#4D6BFE', ax: 15.5, ay: 5.2, tilt: .12, k: .82,
    hat() {
      liangbatou(176);
      flower(-30, -64, 17, '#3E5BD8', PAL.cream); flower(18, -66, 12, '#7F95F2', PAL.cream);
      tassel(-76, -40, 80, '#AFC0FF', '#3E5BD8', 4);
    } },
  { key: 'doubao', name: '豆答应', brand: '豆包', tag: '哟，这也叫办差？', col: '#1E37FC', ax: 12, ay: 2.6, tilt: -.1, k: .9,
    hat() {
      bun(96);
      pompom(30, -52, 18, PAL.rose);
    } },
];

// Paint consort `c` with its logo centre at (cx, cy), logo `size` px. Pass the 2D logo context.
function drawConsortHat(c, cx, cy, size) {
  const s = size / 24, ax = cx - size / 2 + c.ax * s, ay = cy - size / 2 + c.ay * s;
  push(); translate(ax, ay); rotate(c.tilt); scale(c.k * size / 200); c.hat(); pop();
}
