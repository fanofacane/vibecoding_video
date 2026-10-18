# 像素终端对话

风格标识：`pixel-terminal`。当前示例是样片《橙色暗号》：两只像素 Clawd（克克、劳劳）在同一个终端里对话，约 35 秒，1920 × 1080，30 fps，无配音。

## 风格定义

- **画面**：暗色暖棕终端窗口、双栏聊天、逐字打字和光标、扫描线与暗角。
- **角色**：14 × 8 像素网格的 Clawd，用眼睛像素和跳动表演情绪：眨眼、看向对方、`!!`、`> <`、冒汗、爱心眼。
- **叙事道具**：句数计数、计数徽章（同步、口头禅）、上下文进度条、科普卡（概率条和骰子动画）、记忆文件小窗、像素溶解。
- **声音**：根据剧本自动合成敲键声、提示音和背景铺底，无配音。

适合 AI 拟人对话、知识科普短片和带情感转折的小剧场。分镜与表演说明见 [STORYBOARD.md](STORYBOARD.md)。

## 文件

| 文件 | 用途 |
| --- | --- |
| [src/script.js](src/script.js) | **剧本数据**：台词、反应、计数、科普卡、快进、记忆文件等步骤，编译成带时间的事件 |
| [src/scene.js](src/scene.js) | 根据时间 t 绘制整帧：窗口、双栏、消息、科普卡、溶解、片尾 |
| [src/clawd.js](src/clawd.js) | 像素 Clawd 与表情 |
| [src/util.js](src/util.js) | 数学、缓动、哈希、字体、配色、文字换行 |
| [studio.html](studio.html) | 浏览器预览（播放 / 拖动），也是离线渲染页面 |
| [render.mjs](render.mjs) | 拼图、静帧、整片渲染入口 |
| [audio.mjs](audio.mjs) | 根据剧本的声音提示合成 WAV |

## 改剧本

只改 `src/script.js` 里的 `SCRIPT` 数组即可，时间点由打字速度自动推算，后面的内容会顺延。每一步的写法见文件顶部注释。例如：

```js
{ type: 'say', who: 'kk', text: '你好！请问你是谁？' },
{ type: 'react', who: 'both', eyes: 'wide', emote: '!!', hop: 1, dur: 1.1 },
{ type: 'count', key: 'sync' },
```

约束：每帧只由时间决定，不要使用 `Math.random()`，需要随机时用 `hash(i)`。

## 安装、预览与导出

在本目录执行，需要 Node.js、Chrome 或 Chromium、ffmpeg（在 PATH 中）。

```bash
npm ci

# 关键帧拼图
node render.mjs --sheet=2,9,13,19,25,33 --cols=3 --w=640 --out=out/check.jpg

# 全分辨率静帧
node render.mjs --stills=5.6,13 --out=out/stills

# 整片：逐帧渲染 → 合成声音 → MP4
node render.mjs --video --fps=30 --workers=4 --out=out/sample.mp4
```

也可直接用浏览器打开 `studio.html`，点 ▶ 播放或拖动时间条预览（没有声音）。

浏览器会按常见安装路径自动查找；找不到时传入 `--chrome=<路径>` 或设置环境变量 `CHROME_PATH`。中文字体按顺序使用微软雅黑、苹方、Noto Sans CJK、文泉驿正黑，系统需安装其中之一。
