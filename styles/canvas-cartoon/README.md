# Canvas 手绘卡通

风格标识：`canvas-cartoon`。全部画面只用浏览器原生 **Canvas 2D** 绘制，不依赖 p5、WebGL 或任何图片素材。当前作品是《学会爱的一百种笨办法》：Clawd 照着《爱的说明书》用家里的智能家电"表达爱"，一章比一章搞砸，最后把一切调到"刚刚好"。90 秒，1920 × 1080，30 fps，配乐和音效全部由代码合成。

## 风格定义

- **画面**：扁平色块 + 深棕墨线；线条每秒抖动 8 次（"boil"），像逐帧手绘。
- **世界**：一间"剖面娃娃屋"公寓（卧室 | 厨房 | 客厅），镜头在同一个世界坐标里推拉摇移；结尾拉远看到整栋剖面。
- **光**：先画场景，再整体乘一层时段色（深夜蓝、清晨、厨房暖橙、派对粉紫、冷灰蓝、傍晚琥珀），屏幕、灯光、橙色光晕在调色之后再画，所以永远是"亮"的。
- **特写**：手机、电脑、冰箱屏、电视、平板的特写是屏幕空间里单独画的大尺寸版本（`insert()`），细节和文字更清楚。
- **Clawd 跳屏**：缩成光点 → 沿发光的虚线 Wi‑Fi 弧线飞 → 在下一块屏幕里"啵"地弹开（`route()` + `drawHop()`），全片统一。

## 成片

| 文件 | 说明 |
| --- | --- |
| [showcase/学会爱的一百种笨办法.mp4](showcase/学会爱的一百种笨办法.mp4) | 90 秒，1920 × 1080，30 fps，H.264 + AAC |
| [showcase/一秒一帧.jpg](showcase/一秒一帧.jpg) | 每秒一帧的缩略图总览 |

分镜见 [STORYBOARD.md](STORYBOARD.md)。分镜"待定"一节的默认处理：16:9 横屏；配乐用代码合成（前半段尤克里里 Karplus–Strong 拨弦 + 口哨旋律，转折后钢琴）；"谢谢你，Clawd"用字幕。

## 文件

| 文件 | 用途 |
| --- | --- |
| [src/util.js](src/util.js) | 数学、缓动、哈希噪声、手绘抖动形状 `shape()` / `line()`、光晕、文字 |
| [src/clawd.js](src/clawd.js) | Clawd：表情、像素眼镜、冒汗、爱心、贴玻璃的"扁片"造型 |
| [src/human.js](src/human.js) | 人类：一个参数化骨架（站、坐、蹲、坐地、躺、走路），表情和发型 |
| [src/world.js](src/world.js) | 公寓布局、全部家电、镜头、调色、Clawd 跳屏路线与弧线 |
| [src/screens.js](src/screens.js) | 设备特写外框和屏幕 UI：电子书、搜索框、情书编辑器、音量、来电、闹钟、吐司、纸 |
| [src/film.js](src/film.js) | 时间线框架：`shot()` 注册镜头，`cue()` 注册音效，章节书页 |
| [src/shots_a.js](src/shots_a.js) | 开场、第一章、第二章（0–28 秒） |
| [src/shots_b.js](src/shots_b.js) | 第三章、第四章、第五章（28–62 秒） |
| [src/shots_c.js](src/shots_c.js) | 转折与结尾（62–90 秒） |
| [audio.mjs](audio.mjs) | 根据 `CUES` 和 `MUSIC` 合成整条声轨 |
| [studio.html](studio.html) | 浏览器预览（播放 / 拖动），也是离线渲染页面 |
| [render.mjs](render.mjs) | 拼图、静帧、片段、整片渲染入口 |
| [assets/fonts/](assets/fonts/) | 站酷快乐体（SIL OFL 1.1，许可见 OFL.txt），保证离线渲染字体一致 |

## 怎么改

- 每个镜头是 `shot(开始秒, 结束秒, (ctx, t, lt) => { ... })`，`t` 是全片时间，`lt` 是镜头内时间。
- 公寓里的镜头：构造一个状态对象交给 `drawWorld(ctx, S)`（镜头、调色、灯、窗帘、各设备状态、人物绘制钩子），见 `world.js` 顶部注释。
- Clawd 在设备间跳：`route(t, 起点设备, [[出发时间, 目标设备], ...])`，再 `useRoute(S, R)`。
- 音效：`cue(时间, '种类')`，种类在 `audio.mjs` 的 `switch` 里。配乐段落时间在 `film.js` 的 `MUSIC`。

约束：每帧只由时间决定，不用 `Math.random()`（用 `hash(i)`），不在帧之间保存状态，所以可以多进程并行、任意跳帧渲染。

## 安装、预览与导出

在本目录执行，需要 Node.js、Chrome 或 Chromium、ffmpeg（在 PATH 中）。

```bash
npm ci

# 关键帧拼图
node render.mjs --sheet=2.9,11.2,23.5,35,44.6,54.8,78.8,82.8 --cols=4 --w=480 --out=out/check.jpg

# 全分辨率静帧
node render.mjs --stills=26.4,82.8 --out=out/stills

# 一段带声音的片段
node render.mjs --clip=8:18 --out=out/clip.mp4

# 整片：合成声音 → 逐帧渲染 → MP4（约 4 分钟，6 进程）
node render.mjs --video --fps=30 --workers=6 --out=out/film.mp4
```

也可以直接用浏览器打开 `studio.html` 播放或拖动预览（没有声音）。找不到浏览器时传入 `--chrome=<路径>` 或设置 `CHROME_PATH`。
