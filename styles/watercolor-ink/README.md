# 水彩墨线手绘动画

风格标识：`watercolor-ink`。当前完整示例是以 Clawd 为主角的《I'm Upping My P(doom)》，时长 156.6 秒，画面尺寸 1920 × 1080，默认导出 24 fps。

## 风格定义

- **画面质感**：暖色纸底、纸张颗粒、水彩渗色与晕染、带抖动的墨线和少量排线。
- **角色表现**：卡通造型、夸张表情、挤压拉伸、动作预备与回弹，用行为呈现歌词和笑点。
- **叙事方式**：场景内有持续动作，以角色行为、镜头运动和笔刷转场连接分镜。
- **节奏与文字**：动作和音乐节拍配合，当前示例叠加卡拉 OK 歌词；画面内文字主要用于少量拟声和重点表达。

适合角色驱动的音乐视频、幽默叙事和概念演绎。Clawd、AI 末日主题、88 BPM 节奏和具体舞台剧情属于当前作品设定，其他作品需要重新设计这些内容。

## 文件与调用关系

`render.mjs` 通过 Puppeteer 启动 Chrome，打开 `studio.html`。页面先加载 p5.js / p5.brush，再加载 `src/` 中的绘画工具、角色、歌词与时间线，以及 `src/ch/` 的九个章节。章节向时间线注册镜头，渲染器调用页面的 `renderAt` / `renderSheet` 生成图像，视频由 ffmpeg 编码并合入 `assets/pdoom.mp3`。

| 文件 | 用途 |
| --- | --- |
| [ANIMATION_GUIDE.md](ANIMATION_GUIDE.md) | 绘制 API、确定性动画、构图与质量标准；文中路径均相对于本风格目录 |
| [STORYBOARD.md](STORYBOARD.md) | 当前示例的剧情、角色、章节时间点与转场设计 |
| [src/core.js](src/core.js) | 绘画工具、调色板、纸纹、镜头及文字绘制 |
| [src/clawd.js](src/clawd.js)、[src/cast.js](src/cast.js)、[src/props.js](src/props.js) | 角色和道具 |
| [src/timeline.js](src/timeline.js)、[src/lyrics.js](src/lyrics.js) | 时间线、歌词、转场与示例专属叠加元素 |
| [src/ch/](src/ch/) | 当前作品九个章节的分镜实现 |
| [studio.html](studio.html) | 手动预览入口及离线渲染页面 |
| [render.mjs](render.mjs) | 拼图、静帧、短片、批量帧与编码入口 |
| [legacy/](legacy/) | 原始早期实验存档，当前制作链不加载，不作为新作品入口 |
| [ORIGINAL_README.md](ORIGINAL_README.md) | 保留的原项目说明、作品链接、来源与致谢 |

## 制作流程

1. 阅读本页明确风格，再阅读 `ANIMATION_GUIDE.md` 理解绘画与动画约束。
2. 根据歌曲、歌词和目标时长编排分镜。当前 `STORYBOARD.md` 是 P(doom) 的具体案例。
3. 在 `src/ch/` 编写各章节动作；根据新作品同步调整歌词、章节时间点、节拍、音频、渲染时长及页面时间轴范围。当前实现没有统一的作品配置层。
4. 先检查关键帧拼图，再检查含转场的短片，最后渲染全片。
5. 每帧只由时间决定，避免依赖上一帧状态，以支持并行渲染和断点续渲染。

## 安装、预览与导出

以下命令在本目录 `styles/watercolor-ink/` 中执行。需要 Node.js、Chrome 和 ffmpeg；ffmpeg 必须在 PATH 中。

```bash
npm ci

# 关键帧拼图
node render.mjs --sheet=0.8,23.8,39.5 --cols=3 --w=640 --out=out/check.jpg

# 全分辨率静帧
node render.mjs --stills=0.8,23.8 --out=out/stills

# 含声音的短片
node render.mjs --clip=0:6 --fps=24 --out=out/preview.mp4

# 全片逐帧渲染，然后编码
node render.mjs --frames=0:156.6 --workers=4
node render.mjs --encode --out=out/pdoom.mp4
```

安装依赖后，也可以用 Chrome 打开本目录中的 `studio.html`，通过时间滑块预览。页面从 Google Fonts 加载字体，字体完整显示需要网络连接。

从仓库根目录运行时使用 `node styles/watercolor-ink/render.mjs ...`。输入资源和相对输出路径始终以本风格目录为基准，不受终端当前目录影响；绝对 `--out` 路径也可使用。不同风格的 `out/` 相互隔离，且不提交 Git。

默认浏览器为 `C:/Program Files/Google/Chrome/Application/chrome.exe`。其他安装位置请加上 `--chrome=<路径>`；路径含空格时将整个参数用引号括起来。

其他渲染参数：`--page=<页面>` 渲染本目录下的其他页面；`--no-sandbox` 用于以 root 运行的 Linux 容器；`--angle=<后端>` 覆盖 WebGL 后端（Windows 默认 `d3d11`，其他系统由 Chrome 自选，无显卡时使用软件渲染）。设置了 `HTTPS_PROXY` 时，Chrome 会通过该代理加载字体。
