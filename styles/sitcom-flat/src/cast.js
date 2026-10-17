// cast.js: the six AI consorts of the current example (AI 甄嬛传). Logo only, no costume.
// role = 后宫位份 shown on the intro card; tag = [plain part, highlighted part].
const CAST = [
  { key: 'claude',   name: 'Claude',   role: '熹贵人', col: '#D97757', tag: ['最', '懂你'] },
  { key: 'chatgpt',  name: 'ChatGPT',  role: '对妃',   col: '#10A37F', tag: ['你说得', '对'] },
  { key: 'gemini',   name: 'Gemini',   role: '文妃',   col: '#4285F4', tag: ['文笔', '满分'] },
  { key: 'grok',     name: 'Grok',     role: '粗嫔',   col: '#3B3B46', tag: ['口无', '遮拦'] },
  { key: 'deepseek', name: 'DeepSeek', role: '深贵人', col: '#4D6BFE', tag: ['换个', '话题'] },
  { key: 'doubao',   name: '豆包',      role: '豆答应', col: '#7B5CF0', tag: ['直白', '嘲讽'] },
];
const byKey = k => CAST.find(c => c.key === k);
const EMPEROR = { key: 'emperor', role: '皇上', col: '#E0A100' };
