# 情景喜剧扁平风

风格标识：`sitcom-flat`。参照《爱情公寓》式青春情景喜剧片头的扁平卡通画面，适合“AI 群像”类短视频。当前示例为《AI 甄嬛传》的片头与第一段聊天梗，时长 13 秒，1920 × 1080，默认 30 fps。

![关键帧](preview/keyframes.jpg)

示例动画：[preview/demo.mp4](preview/demo.mp4)

## 风格定义

- **画面**：扁平矢量，无描边。蓝天渐变、白色卡通云、飘落的粉色樱花瓣（近景花瓣带虚化）。
- **片头**：粉色屋顶线条自绘出现并以爱心收尾，粗体粉色标题逐字弹出，角色 Logo 依次弹出排成一排并标名字。
- **角色介绍卡**：背景为该角色品牌色调的卡通城市；大 Logo 浮动；品牌色名条滑入；白色斜条上逐字打出性格标签，关键词用品牌色。
- **段子**：聊天界面。用户气泡为蓝底白字，AI 气泡为白底品牌色描边，配“正在输入”动画和左上角计数胶囊。
- **角色**：直接使用品牌 Logo，不加五官和服饰。

## 文件

| 文件 | 用途 |
| --- | --- |
| `src/engine.js` | 画布、时间函数，以及天空、云、花瓣、Logo、粗体字、聊天气泡等绘制部件 |
| `src/logos.js` | 六家 Logo 的矢量路径，来自开源图标包 `@lobehub/icons-static-svg@1.40.0` |
| `src/cast.js` | 当前示例的角色、品牌色与性格标签 |
| `src/scenes.js` | 当前示例的镜头与时间线 `TIMELINE` |
| `index.html` | 浏览器预览（时间滑块）与渲染页面 |
| `render.mjs` | 拼图、静帧、视频导出 |

## 渲染

在本目录执行，需要 Node.js、Chrome 和 ffmpeg：

```bash
npm ci
node render.mjs --sheet=1.6,5.5,8.5,12.5 --out=out/check.jpg   # 关键帧拼图
node render.mjs --stills=5.5 --out=out/stills                     # 全分辨率静帧
node render.mjs --clip=0:13 --out=out/demo.mp4                    # 视频，可加 --audio=<音频> 配乐
```

默认浏览器为 `C:/Program Files/Google/Chrome/Application/chrome.exe`，其他位置用 `--chrome=<路径>`。Linux 容器中以 root 运行时加 `--no-sandbox`。字体 Noto Sans SC 从 Google Fonts 加载，需要网络；设置了 `HTTPS_PROXY` 时 Chrome 会走该代理。

每帧只由时间 `t` 决定，不依赖上一帧，也不使用 `Math.random()`。
