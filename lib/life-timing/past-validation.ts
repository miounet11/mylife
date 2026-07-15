import type { PastValidation, DetectorInput } from './types';

export function generatePastValidations(input: DetectorInput): PastValidation[] {
  const validations: PastValidation[] = [];

  if (input.pattern === '身弱') {
    validations.push({
      id: 'pattern_weak_self',
      category: 'pattern',
      rawTemplate: '身弱结构的人，在外部压力大的时候容易透支身体或情绪',
      rawTemplateEn:
        'People with a weaker-self structure often overdraw body or emotion under heavy external pressure',
      context: { pattern: '身弱' },
    });
  }
  if (input.pattern === '身旺') {
    validations.push({
      id: 'pattern_strong_self',
      category: 'pattern',
      rawTemplate: '身旺结构的人，长期靠"硬扛"行事，容易在关系上消耗',
      rawTemplateEn:
        'People with a strong-self structure often “push through” for years and burn relationships',
      context: { pattern: '身旺' },
    });
  }

  const shenShaNames = (input.shenShaList || []).map((s) => s.name);
  if (shenShaNames.includes('羊刃')) {
    validations.push({
      id: 'shensha_yangren',
      category: 'shen_sha',
      rawTemplate: '羊刃在命的人，过去多次有"冲动决策造成的损失"',
      rawTemplateEn:
        'Blade-mark charts often show past losses from impulsive decisions',
      context: { shenSha: '羊刃' },
    });
  }
  if (shenShaNames.includes('文昌')) {
    validations.push({
      id: 'shensha_wenchang',
      category: 'shen_sha',
      rawTemplate: '文昌在命的人，学习/创作上有过不寻常的灵光时刻',
      rawTemplateEn:
        'Literary-star charts often had unusual flashes in learning or creative work',
      context: { shenSha: '文昌' },
    });
  }
  if (shenShaNames.includes('天乙贵人')) {
    validations.push({
      id: 'shensha_tianyi',
      category: 'shen_sha',
      rawTemplate: '天乙贵人在命的人，关键时刻总有人主动帮忙',
      rawTemplateEn:
        'Heavenly-helper charts often get proactive help at critical moments',
      context: { shenSha: '天乙贵人' },
    });
  }

  const currentAge = input.currentDate.getFullYear() - input.birthDate.getFullYear();
  const pastDayuns = (input.dayunResult.dayuns || []).filter((d) => d.startAge < currentAge);

  if (pastDayuns.length >= 1) {
    const recentPast = pastDayuns[pastDayuns.length - 1];
    if (recentPast.quality === 'good' || recentPast.quality === 'excellent') {
      validations.push({
        id: 'dayun_imprint_recent_good',
        category: 'dayun_imprint',
        rawTemplate: `过去 10 年（${recentPast.ganZhi}大运）你应该有过一段做事相对顺手的时间`,
        rawTemplateEn: `In the past decade (${recentPast.ganZhi} luck), you likely had a stretch where work felt relatively smooth`,
        context: { ganZhi: recentPast.ganZhi },
      });
    }
  }

  return validations.slice(0, 4);
}
