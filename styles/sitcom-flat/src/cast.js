// cast.js: the six AI characters of the current example (AI 甄嬛传). Logo only, no costume.
// tag = [plain part, highlighted part] for the intro card.
const CAST = [
  { key: 'claude',   name: 'Claude',   col: '#D97757', tag: ['最', '懂你'] },
  { key: 'chatgpt',  name: 'ChatGPT',  col: '#10A37F', tag: ['对对对', '全重做'] },
  { key: 'gemini',   name: 'Gemini',   col: '#4285F4', tag: ['文笔', '满分'] },
  { key: 'grok',     name: 'Grok',     col: '#3B3B46', tag: ['啥都会', '一点'] },
  { key: 'deepseek', name: 'DeepSeek', col: '#4D6BFE', tag: ['让我', '想想'] },
  { key: 'doubao',   name: '豆包',      col: '#7B5CF0', tag: ['专业', '吐槽'] },
];
const byKey = k => CAST.find(c => c.key === k);
