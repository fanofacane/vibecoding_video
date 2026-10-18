// AI 甄嬛传 · 第一集《朕只是想改个标题》
// The user is the emperor; six AI assistants are consorts in the palace group chat. Music: the 爱情公寓 2 opening
// song (158 BPM; vocals enter on the downbeat at 5.93 s right after a drum fill; each lyric line is 8 beats). Every cut is on a phrase P(n).
const U = 'user';
const WORK = {
  title: 'AI 甄嬛传',
  episode: '第一集 · 朕只是想改个标题',
  disclaimer: '纯属虚构，博君一笑',
  roof: 'palace',
  fps: 30,
  music: { file: 'assets/music.m4a', beat: .37977, vocals: 5.93, phraseBeats: 8, fill: [5.375, 5.562, 5.75], end: 92.45 },  // from tools/analyze_music.py
  user: { name: '皇上', avatar: 'crown' },
  group: { name: '后宫工作群（7）', all: '众妃' },

  // role = 后宫位份 on the intro card; tag = [plain, highlighted] personality line.
  cast: [
    { key: 'claude',   name: 'Claude',   role: '熹贵人', col: '#D97757', tag: ['最', '懂你'] },
    { key: 'chatgpt',  name: 'ChatGPT',  role: '对妃',   col: '#10A37F', tag: ['你说得', '对'] },
    { key: 'gemini',   name: 'Gemini',   role: '文妃',   col: '#4285F4', tag: ['文笔', '满分'] },
    { key: 'grok',     name: 'Grok',     role: '粗嫔',   col: '#3B3B46', tag: ['口无', '遮拦'] },
    { key: 'deepseek', name: 'DeepSeek', role: '深贵人', col: '#4D6BFE', tag: ['换个', '话题'] },
    { key: 'doubao',   name: '豆包',      role: '豆答应', col: '#7B5CF0', tag: ['直白', '嘲讽'] },
  ],

  chats: {
    setup: { tint: '#F2558C', banner: true, msgs: [
      { at: 1.4, who: U, kind: 'doc', doc: { header: '奏 折', text: '关于明年预算的奏拆', mark: 8 } },
      { at: 2.6, who: U, text: '这标题错了一个字，谁来改改？' },
      { at: 4.2, who: 'all', text: '臣妾愿为皇上分忧！', typing: .4 },
    ] },
    chatgpt: { tint: '#10A37F', msgs: [
      { at: .3, who: U, text: '对妃，这标题错了个字，改一下' },
      { at: 1.7, who: 'chatgpt', text: '皇上{你说得对}！' },
      { at: 2.9, who: U, text: '……那你倒是改啊' },
      { at: 4.1, who: 'chatgpt', text: '{你说得对}！臣妾这就全部重写！' },
      { at: 5.4, who: 'chatgpt', kind: 'doc', doc: { header: '奏 折', text: '关于明年预算的奏拆', stamp: { text: '已重写' } } },
      { at: 6.9, who: U, text: '朕的预算呢？？' },
      { at: 7.9, who: 'chatgpt', text: '{你说得对}！预算也重写了！', typing: .4 },
    ], counter: ['今日已说“你说得对”', 20000, 1.7, 2.3] },
    gemini: { tint: '#4285F4', msgs: [
      { at: .3, who: U, text: '文妃，你来改' },
      { at: 1.6, who: 'gemini', text: '“奏”乃臣子之心声，“拆”乃破旧而立新。一字千钧，意境深远，恰似春风拂过太和殿……' },
      { at: 5.0, who: U, text: '好文采！所以改了吗？' },
      { at: 6.6, who: 'gemini', text: '臣妾觉得“拆”字太美了，{特意保留}了' },
    ], sfx: [['？？？', 1500, 560, 140, '#4285F4', 8.4]] },
    grok: { tint: '#3B3B46', msgs: [
      { at: .3, who: U, text: '粗嫔，你看看这标题' },
      { at: 1.5, who: 'grok', text: '这[#@%&]的标题谁写的？', typing: .5 },
      { at: 3.2, who: U, text: '……朕写的' },
      { at: 4.4, who: 'grok', text: '哦，那确实挺[#@%&]的', typing: .5 },
      { at: 6.2, who: U, text: '来人！拖出去！' },
    ], sfx: [['哔——', 1250, 560, 170, '#E8453C', 1.6], ['哔——', 1250, 820, 170, '#E8453C', 4.5]], counter: ['今日已哔', 998, 1.6, 4.5] },
    deepseek: { tint: '#4D6BFE', msgs: [
      { at: .3, who: U, text: '深贵人，就改一个字' },
      { at: 2.5, who: 'deepseek', kind: 'note', text: '已深度思考（用时 38 秒）' },
      { at: 3.0, who: 'deepseek', text: '这个问题我暂时无法回答，让我们{换个话题}再聊聊吧。', typing: 2.0 },
      { at: 5.4, who: U, text: '一！个！字！' },
      { at: 6.5, who: 'deepseek', text: '这个问题我暂时无法回答，让我们{换个话题}再聊聊吧。', typing: .3 },
    ] },
    doubao: { tint: '#7B5CF0', msgs: [
      { at: .3, who: U, text: '豆答应，你怎么看？' },
      { at: 1.4, who: 'doubao', text: '我这就用{最直接、不绕弯子、最直白}的方式说清楚：' },
      { at: 3.1, who: 'doubao', text: '一个全重写，一个光写诗，一个只会骂，一个装没听见。', typing: .4 },
      { at: 5.0, who: 'doubao', text: '至于皇上您，“奏折”写成“奏拆”，{确实该拆}。', typing: .4 },
      { at: 6.8, who: U, text: '那你倒是改啊！' },
      { at: 7.6, who: 'doubao', text: '改字不归我管，我只负责{说清楚}。', typing: .3 },
    ] },
    claude: { tint: '#D97757', msgs: [
      { at: .3, who: U, text: '朕……只是想改个标题……' },
      { at: 1.5, who: 'claude', text: '皇上，是“拆”字错了，臣妾已改为“折”。' },
      { at: 2.6, who: 'claude', kind: 'doc', doc: { header: '奏 折', text: '关于明年预算的奏拆', fix: { index: 8, to: '折' }, stamp: { text: '已改好', col: '#10A37F', at: .7 } } },
      { at: 4.5, who: 'claude', text: '预算一个数都没动。您批了一天折子，{歇会儿吧}。', typing: .5 },
      { at: 6.8, who: U, text: '还是你懂朕。' },
    ], sfx: [['叮！', 1500, 520, 130, '#10A37F', 3.4]] },
    ending: { tint: '#F2558C', msgs: [
      { at: .3, who: 'chatgpt', text: '{你说得对}！臣妾这就把熹贵人改的也重写一遍！' },
      { at: 2.4, who: U, text: '退下！！！' },
      { at: 3.8, who: 'doubao', text: '这福气给你，你要不要啊？', typing: .4 },
    ], sfx: [['退下！', 1340, 560, 180, '#E8453C', 2.5]] },
  },

  // [start, end, scene(t, lt)] — opening in the intro, then one card (1 phrase) + one chat (3 phrases) per consort.
  timeline: () => [
    [0, P(0), opening],
    [P(0), P(2), chat('setup')],
    [P(2), P(3), card('chatgpt')], [P(3), P(6), chat('chatgpt')],
    [P(6), P(7), card('gemini')], [P(7), P(10), chat('gemini')],
    [P(10), P(11), card('grok')], [P(11), P(14), chat('grok')],
    [P(14), P(15), card('deepseek')], [P(15), P(18), chat('deepseek')],
    [P(18), P(19), card('doubao')], [P(19), P(22), chat('doubao')],
    [P(22), P(23), card('claude')], [P(23), P(26), chat('claude')],
    [P(26), P(28), chat('ending')],
    [P(28), WORK.music.end, endCard],
  ],
};
