# vibecoding_video

按视觉风格组织的视频制作代码与指导库。每种风格独立管理源码、素材、依赖、制作说明和渲染输出。

## 风格目录

| 风格 | 视觉特点 | 当前示例 | 入口 |
| --- | --- | --- | --- |
| 情景喜剧群聊风 · `sitcom-flat` | 《爱情公寓》式扁平卡通片头、Logo 当角色、角色介绍卡、手机群聊段子、按歌词卡点剪辑 | 《AI 甄嬛传》第一集《朕只是想改个标题》 | [风格说明](styles/sitcom-flat/README.md) · [制作规范](styles/sitcom-flat/STYLE_GUIDE.md) |
| 水彩墨线手绘动画 · `watercolor-ink` | 纸张纹理、水彩晕染、手绘墨线、角色表演、连续分镜 | Clawd 音乐视频《I'm Upping My P(doom)》 | [风格说明与制作流程](styles/watercolor-ink/README.md) |
| 像素终端对话 · `pixel-terminal` | 暗色终端双栏聊天、像素 Clawd、逐字打字、上下文进度条与压缩、科普卡 | 双 Clawd 短片《没有昨天》 | [风格说明与制作流程](styles/pixel-terminal/README.md) |
| 夜空图文随笔 · `night-sky-essay` | 黑底胶片质感、浮在画面上的聊天气泡、大号衬线数字、PPT 式科普卡、B-roll 解释动画、词海星空，旁白排版轮换 | 《留白》30 秒样片 | [风格说明与制作流程](styles/night-sky-essay/README.md) |

风格以视觉语言命名。Clawd 是当前示例的角色，P(doom) 是当前作品的主题，均不作为风格分类标准。

## 仓库结构

```text
styles/
  sitcom-flat/             情景喜剧群聊风
    README.md             风格说明与命令
    STYLE_GUIDE.md        视觉、剧本与卡点规范
    src/                  通用引擎、群聊系统与镜头组件
    tools/                配乐分析（节拍、人声进入点、结束点）
    works/_template/      新作品模板
    works/ai-zhenhuan-ep01/  示例作品《AI 甄嬛传》第一集
    index.html            预览页面（?work=<作品id>）
    render.mjs            渲染入口
  watercolor-ink/          水彩墨线手绘动画
    README.md             风格定义、文件导航与制作流程
    ORIGINAL_README.md    原项目说明、来源和致谢
    ANIMATION_GUIDE.md    绘制 API、动画与章节制作约定
    STORYBOARD.md         当前 P(doom) 示例的分镜
    src/                  绘画、角色、时间线与章节源码
    assets/               本风格示例的音频等输入素材
    studio.html           浏览器预览与渲染页面
    render.mjs            离线渲染入口
    package.json          本风格的 Node.js 依赖
    package-lock.json     本风格的依赖锁文件
    legacy/               原项目早期实验源码，仅供历史参考
    out/                  生成结果，不提交 Git
  pixel-terminal/          像素终端对话
    README.md             风格定义、剧本写法与导出命令
    STORYBOARD.md         《没有昨天》分镜与表演说明
    src/script.js         剧本数据（改台词只改这里）
    src/                  场景、像素 Clawd 与工具函数
    studio.html           浏览器预览与渲染页面
    render.mjs            拼图、静帧、整片渲染入口
    audio.mjs             按剧本合成音效
    cover.html            横屏和竖屏封面
    showcase/             成片与封面
    references/           参考截图与早期提案
  night-sky-essay/         夜空图文随笔
    README.md             风格定义与命令
    src/                  背景、聊天气泡列、词海星空、解释动画组件
    works/liubai/         《留白》时间线、字体子集与样片
    tools/fetch-fonts.mjs 按用字下载 Noto 字体子集
    studio.html           预览与渲染页面
    render.mjs            拼图、静帧、整片渲染
    audio.mjs             合成声音
creative_materials/       尚未归入具体制作风格的调研与创意资料
```

## 使用现有风格

在仓库根目录执行：

```bash
npm --prefix styles/watercolor-ink ci
node styles/watercolor-ink/render.mjs --sheet=0.8,23.8,39.5 --out=out/check.jpg
```

需要 Node.js 和 Google Chrome；编码视频还需要 PATH 中可用的 ffmpeg。Chrome 不在默认 Windows 安装路径时，传入 `--chrome=<浏览器可执行文件路径>`。

以上拼图生成在 `styles/watercolor-ink/out/check.jpg`。所有相对 `--out` 路径均相对于对应风格目录；绝对路径按原值使用。完整制作步骤见[风格说明](styles/watercolor-ink/README.md)。

## 添加其他风格

1. 在 `styles/<style-id>/` 下创建独立目录，使用表达视觉特征的英文小写名称，单词之间用连字符连接。
2. 编写该风格的 `README.md`，说明视觉特征、适用内容、制作步骤、运行环境、预览与导出命令、素材来源。
3. 将源码、输入素材和依赖放入该风格目录，生成文件统一进入其 `out/`。使用自己的依赖配置与锁文件；不同风格可以使用不同技术栈。
4. 在本页风格表中增加一行，并验证样帧和导出命令。

同一风格的不同选题、歌曲或角色不自动成为新风格。当同一风格确实出现多个作品时，再将作品专属的歌词、音频和分镜拆成独立作品目录。`watercolor-ink` 的代码包含示例专属时间点，并非更换音频即可运行的通用模板；`pixel-terminal` 的时间点由剧本数据自动推算。

`creative_materials/` 中的“AI 公寓”关键帧与原创选题属于调研资料，尚无对应的独立渲染实现，因此暂不列入已实现风格。
