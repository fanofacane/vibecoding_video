# 夜空图文随笔

风格标识：`night-sky-essay`。近乎纯黑的底色、胶片颗粒和暗角，把聊天记录、PPT 式科普卡、B-roll 解释动画和“词海星空”交替剪在一起，讲一个生活里的小道理。旁白只以衬线大字出现，不配音。1920 × 1080，30 fps。

## 风格要点

- **克制的配色**：黑底、暖白文字，几乎不用彩色。对方的气泡是深灰，我的气泡是带微光的暖白。
- **聊天记录不用手机**：气泡直接浮在画面上排成一列，上下边缘淡出，只配极小的日期戳和名字标签。
- **大号衬线数字**：天数、时钟等用很大的思源宋体，配一行小字号、拉开字距的标签（如“此 刻”“第 1460 天”）。
- **四种画面**：聊天记录（生活感）、章节科普卡（讲为什么）、几何解释动画（把道理画出来）、词海星空（聊天里的词像星星漂浮，常说的大而亮，没说出口的小而暗）。
- **旁白排版不固定**：以“左文右图”为基础，按段落轮换七种排版——A 左文右图、B 右文左图、C 全屏画面、D 大字独占、E 分屏对照、F 章节卡、G 文字跟随画面元素。同一种排版不连续超过两个镜头。
- **字体**：旁白用思源宋体（Noto Serif SC），界面用思源黑体（Noto Sans SC），只下载作品用到的字。
- **声音**：根据时间线合成钢琴和弦铺底、消息提示音、滚动声、水滴声等，无配音。

## 作品

| 作品 | 内容 | 目录 |
| --- | --- | --- |
| 《留白》 | 为什么最亲的人话越来越少，普通朋友却总有得聊？恋人和普通朋友的聊天记录对比。目前完成 30 秒样片 | [works/liubai/](works/liubai/) |

分镜脚本见 [creative_materials/2026-10-18_留白_分镜草案/分镜脚本.md](../../creative_materials/2026-10-18_留白_分镜草案/分镜脚本.md)。

## 目录

```text
night-sky-essay/
  src/
    util.js          数学、缓动、哈希、配色、字体、文字换行
    fx.js            黑色背景（可加稀疏星点）、颗粒与暗角、旁白文字（逐字浮现）、小标签
    chat.js          浮在画面上的聊天气泡列
    wordsea.js       词海星空
    broll.js         章节卡、水滴、每日小杯子等解释动画
  works/<作品id>/
    <片段>.js         时间线：drawFrame(ctx, t)、音效提示 CUES、钢琴和弦 PAD
    fonts/           tools/fetch-fonts.mjs 生成的字体子集
    showcase/        已发布的成片
  tools/fetch-fonts.mjs  按作品用到的字下载 Noto 字体子集
  studio.html        预览与渲染页面：studio.html?work=liubai&cut=sample
  render.mjs         拼图、静帧、整片渲染
  audio.mjs          合成声音
  out/               渲染结果，不提交 Git
```

## 使用

在本目录执行，需要 Node.js、Chrome 或 Chromium、ffmpeg；下载字体需要 curl 和网络。

```bash
npm ci
node tools/fetch-fonts.mjs --work=liubai              # 改过文字后重新运行
node render.mjs --work=liubai --cut=sample --sheet=4.5,13.4,21.8,28.4   # 拼图 → out/liubai/sample/sheet.jpg
node render.mjs --work=liubai --cut=sample --stills=21.8                # 静帧
node render.mjs --work=liubai --cut=sample --video                      # 成片 → out/liubai/sample/sample.mp4
```

也可以用浏览器打开 `studio.html?work=liubai&cut=sample` 拖动预览（没有声音）。每帧只由时间决定，不要使用 `Math.random()`，需要随机时用 `hash(i)`。
