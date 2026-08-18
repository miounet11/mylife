import type { CohortFacts, CohortLensId, CohortRegion } from './types';
import { regionLabel } from './cohorts';

export const COHORT_LENS_META: Record<
  CohortLensId,
  { title: string; subtitle: string; titleEn: string; subtitleEn: string }
> = {
  childhood: {
    title: '童年背景',
    subtitle: '共同的信息环境、家庭形状和学校气氛',
    titleEn: 'Childhood decoder',
    subtitleEn: 'Shared media, family shape, and school weather',
  },
  personality: {
    title: '人格演化',
    subtitle: '和更早、更晚一辈比，你们默认怎么看世界',
    titleEn: 'Personality map',
    subtitleEn: 'How this cohort thinks versus older and younger peers',
  },
  career: {
    title: '职业指南针',
    subtitle: '入场时的经济和技术条件，适合什么样的路',
    titleEn: 'Career compass',
    subtitleEn: 'Paths that fit the job market you walked into',
  },
  relationship: {
    title: '关系模式',
    subtitle: '沟通、依恋和冲突里最常见的倾向（不含占星）',
    titleEn: 'Relationship scan',
    subtitleEn: 'Attachment and conflict patterns, no astrology',
  },
  money: {
    title: '金钱思维',
    subtitle: '风险、储蓄和长期财富的默认剧本',
    titleEn: 'Money matrix',
    subtitleEn: 'How this cohort treats risk, saving, and wealth',
  },
  blindspot: {
    title: '隐性盲点',
    subtitle: '这代经历最容易留下的看不见的习惯',
    titleEn: 'Hidden struggles',
    subtitleEn: 'Blind spots this upbringing tends to leave',
  },
  roadmap: {
    title: '人生路线图',
    subtitle: '各阶段更常遇到的机会、压力和该做的决定',
    titleEn: 'Life roadmap',
    subtitleEn: 'Stage-by-stage priorities and decisions',
  },
};

export function buildLensOverview(
  lensId: CohortLensId,
  facts: CohortFacts,
  region: CohortRegion,
): string {
  const regionBit = region === 'cn-mainland' ? '' : `（已按${regionLabel(region)}微调，不是大陆默认叙事。）`;
  switch (lensId) {
    case 'childhood':
      return `${facts.label}最常见的童年底色是${facts.childhoodSetting}。信息环境更接近「${facts.mediaDiet}」，家庭形状是${facts.familyShape}。这些不是命运，只是同代人最常共享的背景音。${regionBit}`;
    case 'personality':
      return `相对更早一辈，你们${facts.olderContrast}；相对更晚一辈，${facts.youngerContrast}。核心价值观常常落在「${facts.valueCore}」。若你觉得不像，标出来——那恰恰是你的个人轨迹，不是这代人的失败。`;
    case 'career':
      return `你们走进职场时，面对的是${facts.jobMarketEntry}。结构优势往往是${facts.careerAdvantage}；常见陷阱是${facts.careerTrap}。职业建议必须和命局用神一起看：世代给赛道，八字给发挥方式。`;
    case 'relationship':
      return `这一代常见的关系脚本是${facts.relationshipNorm}。依恋上更常出现「${facts.attachmentPull}」。以下判断来自代际观察和可核对的行为模式，不使用星座或占星。`;
    case 'money':
      return `塑造金钱观的公共事件更接近${facts.moneyFormative}。默认习惯是${facts.moneyHabit}；常见盲点是${facts.moneyBlind}。准不准，比八字里的财星更快能被你自己验证。`;
    case 'blindspot':
      return `这代人最容易看不见的是：${facts.blindspot}。日常生活里会变成${facts.blindspotDaily}。把它翻过来的实用策略是：${facts.blindspotFlip}。`;
    case 'roadmap':
      return `把人生当成可回访的阶段，而不是一句「你们这代人」。当前先核对你所在的年龄段：优先事项是什么、最容易误判的是什么、现在最该做的一个决定是什么。`;
  }
}
