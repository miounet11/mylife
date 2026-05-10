export const EARTHLY_BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'] as const;
export type EarthlyBranch = typeof EARTHLY_BRANCHES[number];

export const HEAVENLY_STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'] as const;
export type HeavenlyStem = typeof HEAVENLY_STEMS[number];

// 地支六冲
export const BRANCH_CLASH: Partial<Record<EarthlyBranch, EarthlyBranch>> = {
  '子': '午', '午': '子',
  '丑': '未', '未': '丑',
  '寅': '申', '申': '寅',
  '卯': '酉', '酉': '卯',
  '辰': '戌', '戌': '辰',
  '巳': '亥', '亥': '巳',
};

// 地支三刑
export const BRANCH_PUNISH: Partial<Record<EarthlyBranch, EarthlyBranch[]>> = {
  '寅': ['巳', '申'],
  '巳': ['申', '寅'],
  '申': ['寅', '巳'],
  '丑': ['戌', '未'],
  '戌': ['未', '丑'],
  '未': ['丑', '戌'],
  '子': ['卯'], '卯': ['子'],
  '辰': ['辰'], '午': ['午'], '酉': ['酉'], '亥': ['亥'],
};

// 地支六害
export const BRANCH_HARM: Partial<Record<EarthlyBranch, EarthlyBranch>> = {
  '子': '未', '未': '子',
  '丑': '午', '午': '丑',
  '寅': '巳', '巳': '寅',
  '卯': '辰', '辰': '卯',
  '申': '亥', '亥': '申',
  '酉': '戌', '戌': '酉',
};

// 地支六破
export const BRANCH_BREAK: Partial<Record<EarthlyBranch, EarthlyBranch>> = {
  '子': '酉', '酉': '子',
  '丑': '辰', '辰': '丑',
  '寅': '亥', '亥': '寅',
  '卯': '午', '午': '卯',
  '巳': '申', '申': '巳',
  '未': '戌', '戌': '未',
};

// 地支三合（4 组）
export const BRANCH_TRINE: Array<[EarthlyBranch, EarthlyBranch, EarthlyBranch]> = [
  ['申', '子', '辰'],
  ['寅', '午', '戌'],
  ['亥', '卯', '未'],
  ['巳', '酉', '丑'],
];

// 地支三会（4 组方位）
export const BRANCH_DIRECTIONS: Array<[EarthlyBranch, EarthlyBranch, EarthlyBranch]> = [
  ['寅', '卯', '辰'],
  ['巳', '午', '未'],
  ['申', '酉', '戌'],
  ['亥', '子', '丑'],
];

// 凶神（流月触发时标 caution）
export const NEGATIVE_SHENSHA = ['羊刃', '劫煞', '亡神', '灾煞'] as const;
