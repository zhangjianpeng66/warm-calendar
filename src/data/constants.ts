// ========== 主题配置与鼓励语池 ==========
import type { ThemeConfig } from './types'

export const THEMES: ThemeConfig[] = [
  { id: 'sunflower', name: '向日葵', emoji: '🌻', description: '阳光明亮' },
  { id: 'sakura', name: '樱花', emoji: '🌸', description: '粉樱浪漫' },
  { id: 'fresh', name: '新绿', emoji: '🍃', description: '青草自然' },
  { id: 'sunset', name: '晚霞', emoji: '🌅', description: '海天交融' },
  { id: 'matcha', name: '抹茶', emoji: '🫒', description: '茶点时光' },
  { id: 'starry', name: '星夜', emoji: '🌙', description: '月明星稀' },
]

export const ENCOURAGEMENTS: Record<string, string[]> = {
  day: [
    '回头看，轻舟已过万重山；低眉处，寸心亦抵万里云。',
    '且将新火试新茶，诗酒趁年华——原来最好的抵达，是配得上这一路风尘。',
    '我走过的每一步，都在替星辰探路。如今灯火可亲，不负来路。',
    '山重水复之后，未必是柳暗花明，但一定是另一个我，在终点含笑相迎。',
    '所有暗夜里的辗转，都化作了黎明前的落款。这一程，山高水长，幸未辜负。',
    '终于是岸。不必惊涛骇浪，只需静静说一句：我来过，我见过，我值得。',
    '风起时出发，风止时抵达。天地之间，我是自己的回音。',
    '将这一路霜雪煮成茶，敬自己：千山暮雪，海棠依旧',
  ],
  month: [
    '一个月的光阴，都被你酿成了酒。敬这三十天的自己 🥂',
    '回头看这一个月，每一格绿色都是你给未来的礼物。',
    '满月度，满心欢喜。你的坚持，时间都看得见 ✨',
  ],
  year: [
    '一年风雨，四季轮回。你走过的路，每一步都算数 🏆',
    '三百六十五个日夜，你为自己写了一首最长的诗。',
    '这一年，山河远阔，你是自己故事里最亮的主角 🌟',
  ]
}

export function randomEncouragement(level: string): string {
  const pool = ENCOURAGEMENTS[level] || ENCOURAGEMENTS.day
  return pool[Math.floor(Math.random() * pool.length)]
}

// 获取主题的 data-theme 属性值
export function themeToDataAttr(themeId: string): string {
  const map: Record<string, string> = {
    sunflower: '',
    sakura: 'sakura',
    fresh: 'fresh',
    sunset: 'sunset',
    matcha: 'matcha',
    starry: 'starry',
  }
  return map[themeId] ?? ''
}
