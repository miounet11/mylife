export interface GeoClimateSignals {
  birthPlace?: string;
  currentPlace?: string;
  targetPlaces?: string[];
  climateBias: string[];
  geographyPreference: string[];
  cityEnergyTags: string[];
}

export function getGeoClimateSignals(params: {
  birthPlace?: string;
  currentPlace?: string;
  targetPlaces?: string[];
  favoredElements?: string[];
  avoidedElements?: string[];
}): GeoClimateSignals {
  const birthPlace = normalizePlaceName(params.birthPlace);
  const currentPlace = normalizePlaceName(params.currentPlace);
  const targetPlaces = (params.targetPlaces || []).map((place) => normalizePlaceName(place)).filter(Boolean) as string[];
  const tags = [
    ...inferPlaceTags(birthPlace),
    ...inferPlaceTags(currentPlace),
    ...targetPlaces.flatMap((place) => inferPlaceTags(place)),
  ];

  return {
    birthPlace,
    currentPlace,
    targetPlaces,
    climateBias: inferClimateBias(params.favoredElements || [], params.avoidedElements || []),
    geographyPreference: inferGeographyPreference(params.favoredElements || []),
    cityEnergyTags: [...new Set(tags)],
  };
}

function inferClimateBias(favoredElements: string[], avoidedElements: string[]) {
  const biases: string[] = [];

  if (favoredElements.includes('火')) biases.push('偏温暖、活跃、日照较强的环境更容易放大状态。');
  if (favoredElements.includes('木')) biases.push('适合生长感强、教育文化资源密集的环境。');
  if (favoredElements.includes('土')) biases.push('更适合稳定、扎根、节奏规律的城市环境。');
  if (favoredElements.includes('金')) biases.push('适合规则清晰、金融制造资源密集的地区。');
  if (favoredElements.includes('水')) biases.push('适合流动性强、跨区域连接强的环境。');

  if (avoidedElements.includes('火')) biases.push('需避免长期高压、过热、过度外放的环境。');
  if (avoidedElements.includes('水')) biases.push('需避免长期漂移、节奏紊乱、情绪化强的环境。');

  return biases.length ? biases : ['地理环境需要和作息、行业、迁移路径一起综合判断。'];
}

function inferGeographyPreference(favoredElements: string[]) {
  const preferences: string[] = [];

  if (favoredElements.includes('火')) preferences.push('南方或东南方向更容易形成外部助力。');
  if (favoredElements.includes('木')) preferences.push('东向、园区、校园、文化密度高的区域更有利。');
  if (favoredElements.includes('土')) preferences.push('中心城区、产业腹地、稳定居住区更有利于沉淀。');
  if (favoredElements.includes('金')) preferences.push('西向、商务区、金融制造聚集区更容易发挥效率。');
  if (favoredElements.includes('水')) preferences.push('北向、沿江沿海、跨城流动便利区域更有利。');

  return preferences.length ? preferences : ['地理偏好暂无强信号，优先选低摩擦、高匹配环境。'];
}

function inferPlaceTags(place?: string) {
  if (!place) return [];

  const tags: string[] = [];
  if (/(北京|西安|洛阳|郑州|太原)/.test(place)) tags.push('北方干燥', '政策与中枢资源');
  if (/(上海|杭州|宁波|苏州|南京)/.test(place)) tags.push('江南湿润', '商业与技术复合');
  if (/(广州|深圳|厦门|福州|珠海)/.test(place)) tags.push('沿海流动性强', '贸易与外向型资源');
  if (/(成都|重庆|昆明|贵阳)/.test(place)) tags.push('西南缓冲带', '生活与内容产业融合');
  if (/(青岛|大连|天津)/.test(place)) tags.push('北方沿海', '制造与港口属性');

  return tags.length ? tags : ['城市标签待补充'];
}

function normalizePlaceName(place?: string) {
  const cleaned = `${place || ''}`
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned || cleaned === '--') {
    return undefined;
  }

  const parts = cleaned
    .split(' ')
    .map((item) => item.trim())
    .filter((item) => item && item !== '--' && item !== '北京时间' && item !== '未知地');

  if (parts.length === 0) {
    return undefined;
  }

  return [...new Set(parts)].join(' ');
}
