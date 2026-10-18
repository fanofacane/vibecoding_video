# 情景喜剧群聊风

风格标识：`sitcom-flat`。仿照《爱情公寓》式情景喜剧片头的扁平卡通画面，用品牌 Logo 当角色，在手机群聊里演段子，全片卡着一首歌的节奏剪辑。

![《AI 甄嬛传》第一集关键帧](works/ai-zhenhuan-ep01/preview/keyframes.jpg)

## 风格要点

- **片头**：在前奏内完成。蓝天白云和樱花，粉色屋顶线条自绘并以爱心收尾，粗体标题逐字踩拍弹出，全体角色 Logo 逐拍弹出并标注身份。人声一进就切正片。
- **角色介绍卡**：品牌色调的卡通城市，大 Logo 随节拍浮动；名条写“角色名　品牌（饰）”，白色斜条上逐字打出性格标签，关键词用品牌色。
- **群聊段子**：用户是右侧蓝色气泡，角色是左侧品牌色描边气泡，头像为 Logo。包括：
  - “正在输入”和自动滚动；
  - 文件卡片（圈错字、改字、盖章）；
  - 脏话打码，配“哔——”；
  - 计数胶囊和拟声大字。
- **角色**：只用 Logo，不加五官和服饰。
- **节奏**：每个转场落在歌词句首，消息出现时间吸附到节拍，片尾截在歌曲结束处。

完整规范（配色、字号、动效、剧本写法、卡点方法）见 [STYLE_GUIDE.md](STYLE_GUIDE.md)。

## 目录

| 路径 | 内容 |
| --- | --- |
| [STYLE_GUIDE.md](STYLE_GUIDE.md) | 风格规范与制作流程 |
| `src/` | 风格通用代码：引擎、Logo、群聊系统、片头/介绍卡/片尾组件、页面运行时 |
| `tools/analyze_music.py` | 配乐分析：节拍、人声进入点、过门鼓点、歌曲结束点，并导出截好的配乐 |
| `works/_template/` | 新作品模板 |
| [works/ai-zhenhuan-ep01/](works/ai-zhenhuan-ep01/) | 示例作品：《AI 甄嬛传》第一集《朕只是想改个标题》 |
| `index.html` | 预览页面：`index.html?work=<作品id>`，拖动时间条查看任意时刻 |
| `render.mjs` | 渲染：关键帧拼图、静帧、片段、成片 |

## 使用

在本目录执行，需要 Node.js、Chrome、ffmpeg；配乐分析还需要 Python 3 和 numpy。

```bash
npm ci

# 新作品
cp -r works/_template works/my-show
python3 tools/analyze_music.py song.mp4 --extract works/my-show/assets/music.m4a   # 把输出的数值填进 work.js

# 预览与出片
node render.mjs --work=my-show --sheet=3,8,15,20     # 关键帧拼图 → out/my-show/sheet.jpg
node render.mjs --work=my-show --stills=8            # 全分辨率静帧 → out/my-show/stills/
node render.mjs --work=my-show --clip=0:12           # 片段 → out/my-show/clip.mp4
node render.mjs --work=my-show                       # 成片（自动配乐） → out/my-show/my-show.mp4
```

`--work` 默认为 `ai-zhenhuan-ep01`。默认浏览器为 `C:/Program Files/Google/Chrome/Application/chrome.exe`，其他位置用 `--chrome=<路径>`。Linux 容器中以 root 运行时加 `--no-sandbox`。字体 Noto Sans SC 从 Google Fonts 加载，需要网络；设置了 `HTTPS_PROXY` 时 Chrome 会走该代理。

配乐 `works/*/assets/music.*` 一般来自他人作品，不提交 Git。
