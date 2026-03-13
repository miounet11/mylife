export interface SpatialFactorsSignals {
  favorableDirections: string[];
  unfavorableDirections: string[];
  movementAdvice: string[];
  environmentAdvice: string[];
}

export function getSpatialFactors(params: {
  favoredDirections?: string[];
  favoredElements?: string[];
  avoidedElements?: string[];
}): SpatialFactorsSignals {
  const favorableDirections = [...new Set(params.favoredDirections || inferDirectionsFromElements(params.favoredElements || []))];
  const unfavorableDirections = inferDirectionsFromElements(params.avoidedElements || []);

  return {
    favorableDirections,
    unfavorableDirections,
    movementAdvice: buildMovementAdvice(favorableDirections),
    environmentAdvice: buildEnvironmentAdvice(params.favoredElements || []),
  };
}

function inferDirectionsFromElements(elements: string[]) {
  const directions = new Set<string>();

  for (const element of elements) {
    if (element === '木') directions.add('东方').add('东南');
    if (element === '火') directions.add('南方');
    if (element === '土') directions.add('中部').add('西南');
    if (element === '金') directions.add('西方').add('西北');
    if (element === '水') directions.add('北方');
  }

  return [...directions];
}

function buildMovementAdvice(directions: string[]) {
  if (!directions.length) {
    return ['迁移与布局优先看工作机会质量和长期稳定性。'];
  }

  return [
    `优先考虑向${directions.join('、')}延展资源，而不是在不利方向硬推。`,
    '短期无法迁移时，可先通过办公位置、出差方向、客户布局做局部修正。',
  ];
}

function buildEnvironmentAdvice(elements: string[]) {
  const advice: string[] = [];

  if (elements.includes('木')) advice.push('环境宜有成长感和学习氛围，避免过度封闭。');
  if (elements.includes('火')) advice.push('环境宜明亮、开放、节奏积极，但要控制过热。');
  if (elements.includes('土')) advice.push('环境宜稳定、有秩序、有沉淀感。');
  if (elements.includes('金')) advice.push('环境宜规则清晰、结构明确、效率导向。');
  if (elements.includes('水')) advice.push('环境宜具备流动性、连接性和信息交换效率。');

  return advice.length ? advice : ['空间环境建议需要结合职业场景和居住节奏一起判断。'];
}
