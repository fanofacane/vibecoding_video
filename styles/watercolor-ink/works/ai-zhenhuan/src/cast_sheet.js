// cast_sheet.js: the six-consort character sheet for AI 甄嬛传 (one still frame, 1920×1080).

// Wait for the brush-script Chinese font before the page reports ready.
{
  const coreSetup = setup;
  setup = async function () { await document.fonts.load('80px "Ma Shan Zheng"', '甄嬛传'); return coreSetup(); };
}

const BRUSH_FONT = px => `${px}px "Ma Shan Zheng", "WenQuanYi Zen Hei", serif`;

function castSheet(t) {
  // background: palace-red band behind the title, warm gold floor
  paint([[-40, -40], [W + 40, -40], [W + 40, 150], [W * .5, 175], [-40, 150]], { wash: ZH.crimson, washOp: 235, fill: ZH.red, fillOp: 90, bleed: .1, tex: .7, border: .5, ink: null });
  paint(rectPts(-40, 152, W + 80, 10, 2), { wash: ZH.gold, washOp: 230, ink: null });
  paint([[-40, 800], [W + 40, 780], [W + 40, H + 40], [-40, H + 40]], { fill: PAL.ochre, fillOp: 45, bleed: .25, tex: .6, border: .5, ink: null });

  const n = CONSORTS.length, gap = W / n, size = 214, cy = 548;
  CONSORTS.forEach((c, i) => {
    const cx = gap * (i + .5);
    // soft halo and ground shadow
    paint(ellPts(cx, cy - 50, 150, 200, 26, 6), { fill: mixCol(c.col, PAL.paper, .55), fillOp: 150, bleed: .3, tex: .5, border: .5, ink: null });
    paint(ellPts(cx, cy + size * .56, 104, 16, 20, 2), { fill: PAL.ink, fillOp: 50, bleed: .2, tex: .3, ink: null });
  });
  flushBrush();

  const lc = logoLayer();
  CONSORTS.forEach((c, i) => drawLogo(lc, c.key, gap * (i + .5), cy, size, c.col, i + 1));
  image(logoG, 0, 0);

  CONSORTS.forEach((c, i) => {
    const cx = gap * (i + .5);
    drawConsortHat(c, cx, cy, size);
    // 绿头牌 name tablet
    const tw = 216, th = 132, tx = cx - tw / 2, ty = 748;
    paint(rrPts(tx, ty, tw, th, 10, 1.5), { wash: PAL.cream, washOp: 255, fill: '#E8D3AE', fillOp: 70, tex: .5, ink: PAL.ink, sw: 1 });
    paint(rrPts(tx, ty, tw, 30, 8, 1), { wash: '#3F7F5A', washOp: 250, fill: PAL.sap, fillOp: 80, tex: .5, ink: PAL.ink, sw: .8 });
    letter(c.name, cx, ty + 74, 58, PAL.ink, { ink: false, font: BRUSH_FONT(58) });
    letter(c.brand, cx, ty + 114, 24, mixCol(PAL.ink, PAL.paper, .25), { ink: false, font: '800 24px "Shantell Sans", "WenQuanYi Zen Hei", sans-serif' });
    letter(c.tag, cx, 932, 27, PAL.clayDk, { ink: false, font: BRUSH_FONT(27) });
  });

  letter('AI', 600, 84, 84, '#F7D98B', { align: 'right' });
  letter('甄嬛传 · 后宫众妃', 626, 80, 92, '#F7D98B', { align: 'left', font: BRUSH_FONT(92) });
  letter('纯属虚构，博君一笑', W - 150, H - 40, 26, mixCol(PAL.ink, PAL.paper, .35), { ink: false, font: BRUSH_FONT(26) });
}

window.LOOP = castSheet;
