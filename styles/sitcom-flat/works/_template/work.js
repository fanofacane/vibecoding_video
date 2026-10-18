// 新作品模板：复制整个 _template 目录为 works/<作品id>/，按注释填写，然后
//   node render.mjs --work=<作品id> --sheet=3,8,15,20     先看关键帧
//   node render.mjs --work=<作品id>                        再出成片（自动配上 assets/music.m4a）
// 规范见 ../../STYLE_GUIDE.md。所有时间单位为秒。
const U = 'user';
const WORK = {
  title: 'AI 公寓',                       // 片头大标题，逐字弹出；建议 2–6 个字
  episode: '第一集 · 示例',               // 第一段群聊开头的集名横幅（可删）
  disclaimer: '纯属虚构，博君一笑',
  roof: 'house',                          // 标题上方线条：'house' 公寓屋顶 / 'palace' 宫殿屋檐
  fps: 30,

  // 配乐：运行 python3 tools/analyze_music.py <歌曲或视频> --extract works/<id>/assets/music.m4a，把输出的数值粘到这里。
  // 没有配乐时删掉 file，保留 beat/vocals 作为节奏网格（例如 beat: .5, vocals: 6）。
  music: { file: 'assets/music.m4a', beat: .5, vocals: 6, phraseBeats: 8, fill: [], end: 60 },

  user: { name: '我', avatar: 'person' }, // 用户（右侧蓝色气泡）。avatar: 'person' | 'crown'
  group: { name: '合租群（4）', all: '全员' },

  // 角色：key 对应 src/logos.js 中的 Logo；role 是剧中身份；tag = [普通部分, 高亮部分]，介绍卡上的大字。
  cast: [
    { key: 'claude',  name: 'Claude',  role: '室友A', col: '#D97757', tag: ['最', '靠谱'] },
    { key: 'chatgpt', name: 'ChatGPT', role: '室友B', col: '#10A37F', tag: ['你说得', '对'] },
    { key: 'gemini',  name: 'Gemini',  role: '室友C', col: '#4285F4', tag: ['文笔', '满分'] },
  ],

  // 群聊：at 为该段内的出现时间（自动吸附到节拍）。文本里 {高亮} 用说话人品牌色，[脏话] 打码。
  // kind: 'note' 灰色系统提示；'doc' 文件卡片 doc: { header, text, mark: 圈出第几个字, fix: { index, to }, stamp: { text, col, at } }
  chats: {
    setup: { tint: '#F2558C', banner: true, msgs: [
      { at: .5, who: U, text: '房东催房租了，谁去交一下？' },
      { at: 2.0, who: 'all', text: '交给我！', typing: .4 },
    ] },
    chatgpt: { tint: '#10A37F', msgs: [
      { at: .3, who: U, text: '你去交房租' },
      { at: 1.5, who: 'chatgpt', text: '{你说得对}！我先重写一份租房合同。' },
    ], counter: ['今日已说“你说得对”', 100, 1.5, 3] },
    claude: { tint: '#D97757', msgs: [
      { at: .3, who: U, text: '……还是你来吧' },
      { at: 1.5, who: 'claude', text: '已经交了，回执发你了。' },
    ], sfx: [['叮！', 1500, 520, 130, '#10A37F', 2.0]] },
  },

  // 时间线：[开始, 结束, 镜头]。P(n) = 第 n 句歌词开始的时间（P(0) 为人声进入）。
  // 片头放在前奏里 [0, P(0)]；每个角色一张介绍卡（1 句）+ 一段群聊（2–3 句）；片尾放在最后。
  timeline: () => [
    [0, P(0), opening],
    [P(0), P(2), chat('setup')],
    [P(2), P(3), card('chatgpt')], [P(3), P(5), chat('chatgpt')],
    [P(5), P(6), card('claude')], [P(6), P(8), chat('claude')],
    [P(8), P(9), endCard],
  ],
};
