export type CommunityCategory = {
  key: string;
  label: string;
  description: string;
  sampleTopics: string[];
};

export const COMMUNITY_CATEGORIES: Record<string, CommunityCategory> = {
  bazi: {
    key: 'bazi',
    label: '八字命盘',
    description: '日主、用神、大运流年与财官结构的讨论区。',
    sampleTopics: ['用神取舍', '大运交接', '流年事业窗口', '时辰边界'],
  },
  ziwei: {
    key: 'ziwei',
    label: '紫微斗数',
    description: '命宫、四化与宫位角色匹配相关问题。',
    sampleTopics: ['命宫主星', '夫妻宫', '事业宫四化', '大限交接'],
  },
  liuyao: {
    key: 'liuyao',
    label: '六爻预测',
    description: '世应、动变与用神取舍类问题。',
    sampleTopics: ['动爻判断', '用神定位', '应期推断', '卦象结构'],
  },
  qimen: {
    key: 'qimen',
    label: '奇门遁甲',
    description: '值符值使、八门九星与局势判断。',
    sampleTopics: ['开门求财', '休门休整', '值符值使', '局势取舍'],
  },
  zeri: {
    key: 'zeri',
    label: '择日选时',
    description: '结婚、搬家、签约等事件的节奏匹配。',
    sampleTopics: ['结婚择日', '搬家入宅', '签约开业', '动土修造'],
  },
  fengshui: {
    key: 'fengshui',
    label: '风水堪舆',
    description: '家宅布局、朝向与环境层观察。',
    sampleTopics: ['卧室朝向', '财位布局', '厨房卫生间', '阳台气场'],
  },
  xingming: {
    key: 'xingming',
    label: '姓名学',
    description: '取名、改名与五行笔画结构。',
    sampleTopics: ['五格剖象', '五行补缺', '改名时机', '品牌命名'],
  },
  xiangmian: {
    key: 'xiangmian',
    label: '面相手相',
    description: '面相手相作为辅助结构观察（非医学诊断）。',
    sampleTopics: ['事业线', '婚姻线', '印堂气色', '手相结构'],
  },
  meihua: {
    key: 'meihua',
    label: '梅花易数',
    description: '体用、互卦与动变结构。',
    sampleTopics: ['起卦方法', '体用生克', '应期判断', '物象取象'],
  },
  xingzuo: {
    key: 'xingzuo',
    label: '西洋占星',
    description: '星座、宫位与行运结构。',
    sampleTopics: ['上升星座', '行运土星', '合盘关系', '宫位主题'],
  },
  taluo: {
    key: 'taluo',
    label: '塔罗牌',
    description: '牌阵结构与问题拆解。',
    sampleTopics: ['圣杯牌阵', '正逆位', '关系牌阵', '决策牌阵'],
  },
  fenghua: {
    key: 'fenghua',
    label: '综合改运',
    description: '颜色、穿搭、环境调整等辅助层。',
    sampleTopics: ['本命年', '犯太岁', '吉方凶方', '能量调整'],
  },
  world_yi: {
    key: 'world_yi',
    label: '世界易学说',
    description: '结构、时位、环境与动作的现代判断框架。',
    sampleTopics: ['六步判断法', '阶段重排', '环境匹配', '行动顺序'],
  },
  geo: {
    key: 'geo',
    label: '海外华人命理',
    description: '迁移、跨文化与环境重匹配话题。',
    sampleTopics: ['移民择时', '海归决策', '跨文化适应', '城市选择'],
  },
};

export function getCommunityCategory(key: string): CommunityCategory | null {
  return COMMUNITY_CATEGORIES[key] || null;
}