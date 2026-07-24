/**
 * 选址顾问：阳宅 / 铺面 / 阴宅 对比评分 + 人流估算
 * 结构启发式 + 可选周边 POI 密度；非官方客流数据。
 */

export type SitePurpose = 'house' | 'shop' | 'yinzhai';

export const SITE_PURPOSE_LABELS: Record<SitePurpose, string> = {
  house: '选房子（阳宅）',
  shop: '选铺面',
  yinzhai: '选阴宅',
};

export type SitePoiBucket =
  | 'transit'
  | 'retail'
  | 'food'
  | 'education'
  | 'park'
  | 'office'
  | 'medical'
  | 'cemetery'
  | 'water'
  | 'road'
  | 'other';

export interface SitePoiCounts {
  transit: number;
  retail: number;
  food: number;
  education: number;
  park: number;
  office: number;
  medical: number;
  cemetery: number;
  water: number;
  road: number;
  other: number;
  /** 半径米 */
  radiusM: number;
  /** 数据来源 */
  source: 'overpass' | 'heuristic' | 'manual';
}

export interface SiteCandidateInput {
  id?: string;
  label?: string;
  address: string;
  lat: number;
  lng: number;
  /** 门向 / 朝向 */
  facing?: string;
  /** 面积㎡ */
  areaSqm?: number;
  /** 楼层：住宅/铺面 */
  floor?: number;
  /** 铺面业态关键词 */
  industry?: string;
  /** 是否转角铺 / 临街 */
  corner?: boolean;
  streetFront?: boolean;
  /** 阴宅：是否有靠山 / 明堂开阔 用户自述 */
  hasBackMountain?: boolean;
  openMingTang?: boolean;
  notes?: string;
  poi?: Partial<SitePoiCounts>;
}

export interface ScoreDim {
  key: string;
  label: string;
  score: number; // 0-100
  weight: number;
  note: string;
}

export interface FootTrafficEstimate {
  /** 工作日日均过店人次（估算区间中点） */
  weekdayDaily: number;
  weekendDaily: number;
  peakHour: number;
  peakHourLabel: string;
  /** 0-100 人流指数 */
  index: number;
  band: '冷清' | '平稳' | '活跃' | '旺盛' | '过载';
  hourly: Array<{ hour: number; level: number }>;
  method: string;
  caveats: string[];
}

export interface SiteCandidateResult {
  id: string;
  label: string;
  address: string;
  lat: number;
  lng: number;
  purpose: SitePurpose;
  totalScore: number;
  rankHint: string;
  dimensions: ScoreDim[];
  footTraffic: FootTrafficEstimate;
  pros: string[];
  cons: string[];
  actions: string[];
  poi: SitePoiCounts;
  suggestedDomain: 'residential' | 'shop' | 'tomb' | 'villa' | 'apartment';
}

export interface SiteAdviseResult {
  purpose: SitePurpose;
  purposeLabel: string;
  generatedAt: string;
  candidates: SiteCandidateResult[];
  winnerId: string | null;
  summary: string;
  disclaimer: string;
}

const EMPTY_POI = (radiusM = 400): SitePoiCounts => ({
  transit: 0,
  retail: 0,
  food: 0,
  education: 0,
  park: 0,
  office: 0,
  medical: 0,
  cemetery: 0,
  water: 0,
  road: 0,
  other: 0,
  radiusM,
  source: 'heuristic',
});

function clamp(n: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, n));
}

function sumPoi(p: SitePoiCounts) {
  return (
    p.transit +
    p.retail +
    p.food +
    p.education +
    p.park +
    p.office +
    p.medical +
    p.cemetery +
    p.water +
    p.road +
    p.other
  );
}

/** 从地址文本推断周边形态（无 POI 时的底噪） */
export function heuristicPoiFromAddress(address: string, radiusM = 400): SitePoiCounts {
  const a = address || '';
  const p = EMPTY_POI(radiusM);
  p.source = 'heuristic';

  const hit = (re: RegExp, key: keyof SitePoiCounts, n: number) => {
    if (re.test(a)) (p as Record<string, number | string>)[key] = ((p as any)[key] as number) + n;
  };

  hit(/地铁|轨道交通|轻轨|站/, 'transit', 3);
  hit(/公交|车站|客运/, 'transit', 1);
  hit(/商业|商圈|步行街|广场|mall|购物中心|万达|吾悦|银泰/, 'retail', 4);
  hit(/路|街|道|巷/, 'road', 2);
  hit(/餐饮|美食|小吃|夜市/, 'food', 2);
  hit(/学校|中学|小学|大学|幼儿园/, 'education', 2);
  hit(/公园|绿地|湿地|湖|江|河|海/, 'park', 2);
  hit(/江|河|湖|海|溪|水库/, 'water', 2);
  hit(/写字楼|CBD|科技园|产业园/, 'office', 3);
  hit(/医院|诊所/, 'medical', 1);
  hit(/陵园|公墓|墓园|骨灰|安息/, 'cemetery', 3);
  hit(/山|岭|岗|坡|峰/, 'other', 1);
  hit(/村|镇|乡|宅基地/, 'other', 1);

  // 坐标数字本身不贡献；关键词密度有限时给底分
  if (sumPoi(p) === 0) p.road = 1;
  return p;
}

export function mergePoi(
  base: SitePoiCounts,
  extra?: Partial<SitePoiCounts> | null,
): SitePoiCounts {
  if (!extra) return base;
  return {
    transit: Math.max(base.transit, Number(extra.transit) || 0),
    retail: Math.max(base.retail, Number(extra.retail) || 0),
    food: Math.max(base.food, Number(extra.food) || 0),
    education: Math.max(base.education, Number(extra.education) || 0),
    park: Math.max(base.park, Number(extra.park) || 0),
    office: Math.max(base.office, Number(extra.office) || 0),
    medical: Math.max(base.medical, Number(extra.medical) || 0),
    cemetery: Math.max(base.cemetery, Number(extra.cemetery) || 0),
    water: Math.max(base.water, Number(extra.water) || 0),
    road: Math.max(base.road, Number(extra.road) || 0),
    other: Math.max(base.other, Number(extra.other) || 0),
    radiusM: Number(extra.radiusM) || base.radiusM,
    source: (extra.source as SitePoiCounts['source']) || base.source,
  };
}

/**
 * 人流估算：以 POI 密度 + 业态/临街/转角 驱动，输出日均与分时曲线。
 * 仅为选址相对比较用，非实测摄像头数据。
 */
export function estimateFootTraffic(
  purpose: SitePurpose,
  poi: SitePoiCounts,
  opts?: {
    corner?: boolean;
    streetFront?: boolean;
    industry?: string;
    floor?: number;
    address?: string;
  },
): FootTrafficEstimate {
  const density =
    poi.transit * 18 +
    poi.retail * 14 +
    poi.food * 12 +
    poi.office * 10 +
    poi.education * 8 +
    poi.medical * 6 +
    poi.park * 4 +
    poi.road * 5 +
    poi.other * 2;

  let base = 80 + density * 3.2;
  if (opts?.streetFront !== false && purpose === 'shop') base *= 1.15;
  if (opts?.corner) base *= 1.22;
  if (opts?.floor != null && opts.floor >= 2) base *= Math.max(0.45, 1 - (opts.floor - 1) * 0.18);
  if (opts?.industry) {
    const ind = opts.industry;
    if (/餐饮|咖啡|奶茶|快餐/.test(ind)) base *= 1.2;
    if (/美业|理发|美甲/.test(ind)) base *= 0.85;
    if (/教育|培训/.test(ind)) base *= 0.75;
    if (/便利|零售|超市/.test(ind)) base *= 1.1;
  }

  // 阴宅几乎无「商业人流」，给祭扫/近陵园相对指数
  if (purpose === 'yinzhai') {
    base = 40 + poi.cemetery * 8 + poi.road * 6 + poi.park * 4;
  }
  // 住宅关注安静：人流过高反而扣「宜居」但这里仍报告周边人流
  if (purpose === 'house') {
    base = 60 + density * 2.2;
  }

  const weekdayDaily = Math.round(clamp(base, 30, 28000));
  const weekendDaily = Math.round(weekdayDaily * (purpose === 'shop' ? 1.25 : 0.92));
  const index = clamp(Math.round((Math.log10(weekdayDaily + 10) - 1.5) * 55));

  let band: FootTrafficEstimate['band'] = '平稳';
  if (index < 25) band = '冷清';
  else if (index < 45) band = '平稳';
  else if (index < 65) band = '活跃';
  else if (index < 82) band = '旺盛';
  else band = '过载';

  // 分时相对强度 0-100
  const hourly = Array.from({ length: 24 }, (_, hour) => {
    let level = 8;
    if (purpose === 'shop') {
      if (hour >= 7 && hour <= 9) level = 55;
      if (hour >= 11 && hour <= 13) level = 78;
      if (hour >= 17 && hour <= 20) level = 92;
      if (hour >= 21 && hour <= 22) level = 48;
      if (hour < 7 || hour > 22) level = 6;
      if (poi.office > 2 && hour >= 12 && hour <= 13) level = Math.max(level, 85);
      if (poi.food > 3 && hour >= 18 && hour <= 21) level = Math.max(level, 95);
    } else if (purpose === 'house') {
      if (hour >= 7 && hour <= 9) level = 50;
      if (hour >= 17 && hour <= 19) level = 58;
      if (hour >= 22 || hour < 6) level = 12;
      else level = 28;
    } else {
      // 阴宅：清明等季节不建模，日常偏安静
      if (hour >= 9 && hour <= 16) level = 35;
      else level = 10;
    }
    // 密度微调
    level = clamp(level + Math.min(18, density / 12));
    return { hour, level };
  });

  const peak = hourly.reduce((a, b) => (b.level > a.level ? b : a), hourly[0]);
  const peakHour = Math.max(40, Math.round(weekdayDaily * (peak.level / 100) * 0.12));

  return {
    weekdayDaily,
    weekendDaily,
    peakHour,
    peakHourLabel: `${peak.hour}:00–${(peak.hour + 1) % 24}:00`,
    index,
    band,
    hourly,
    method:
      poi.source === 'overpass'
        ? `周边 ${poi.radiusM}m OSM 设施密度 + 业态/临街修正`
        : `地址语义启发 + 业态/临街修正（建议配置地图 key 或连 OSM 提高精度）`,
    caveats: [
      '人流为结构估算，用于候选对比，非物业/运营商实测',
      '节假日、活动、修路、竞品开业会显著改变结果',
    ],
  };
}

function weightedTotal(dims: ScoreDim[]) {
  const w = dims.reduce((s, d) => s + d.weight, 0) || 1;
  return Math.round(dims.reduce((s, d) => s + d.score * d.weight, 0) / w);
}

function scoreHouse(c: SiteCandidateInput, poi: SitePoiCounts, ft: FootTrafficEstimate): {
  dimensions: ScoreDim[];
  pros: string[];
  cons: string[];
  actions: string[];
} {
  const pros: string[] = [];
  const cons: string[] = [];
  const actions: string[] = [];

  const transitScore = clamp(40 + poi.transit * 18);
  const quietScore = clamp(92 - ft.index * 0.55 - poi.retail * 4 - poi.food * 3);
  const greenScore = clamp(35 + poi.park * 16 + poi.water * 10);
  const eduScore = clamp(30 + poi.education * 20);
  const formScore = clamp(
    55 +
      (/山|岭|岗/.test(c.address) ? 12 : 0) +
      (/江|河|湖/.test(c.address) ? 10 : 0) +
      (c.facing && /南|东南|东/.test(c.facing) ? 12 : 0) +
      (c.facing && /北|西/.test(c.facing) ? -6 : 0),
  );
  const areaScore =
    c.areaSqm == null
      ? 60
      : clamp(40 + Math.min(40, (c.areaSqm - 40) * 0.6) - Math.max(0, c.areaSqm - 160) * 0.15);

  if (poi.transit >= 2) pros.push('公共交通可达性较好');
  if (quietScore >= 70) pros.push('周边相对安静，宜居指数偏高');
  else cons.push('人流/商业偏密，夜间噪声与扰民风险需现场确认');
  if (greenScore >= 65) pros.push('公园或水系线索明显，利于采光通风心理场');
  if (poi.education >= 1) pros.push('附近有教育设施信号');
  if (c.facing && /南|东南/.test(c.facing)) pros.push(`朝向 ${c.facing}，采光通常更稳`);
  if (ft.index >= 75) cons.push('周边人流旺盛，更偏商住或临街，纯居需降噪');
  if (poi.cemetery >= 1) cons.push('附近有陵园/公墓类设施信号，需按家庭偏好权衡');

  actions.push('对照楼盘日照与噪音时段（早高峰/夜宵街）实地走一遍');
  actions.push('把门向与户型注入空间场，看光风九宫是否通透');
  if (poi.transit < 1) actions.push('核验最后一公里通勤与停车');

  return {
    dimensions: [
      { key: 'transit', label: '通勤可达', score: transitScore, weight: 1.1, note: `公交/轨道信号 ${poi.transit}` },
      { key: 'quiet', label: '宜居安静', score: quietScore, weight: 1.3, note: `人流指数 ${ft.index}（${ft.band}）` },
      { key: 'green', label: '景观水系', score: greenScore, weight: 1.0, note: `公园 ${poi.park} · 水 ${poi.water}` },
      { key: 'edu', label: '教育配套', score: eduScore, weight: 0.9, note: `教育 POI ${poi.education}` },
      { key: 'form', label: '形峦朝向', score: formScore, weight: 1.2, note: c.facing ? `门向 ${c.facing}` : '未填朝向' },
      { key: 'area', label: '面积匹配', score: areaScore, weight: 0.8, note: c.areaSqm ? `${c.areaSqm}㎡` : '未填面积' },
    ],
    pros,
    cons,
    actions,
  };
}

function scoreShop(c: SiteCandidateInput, poi: SitePoiCounts, ft: FootTrafficEstimate): {
  dimensions: ScoreDim[];
  pros: string[];
  cons: string[];
  actions: string[];
} {
  const pros: string[] = [];
  const cons: string[] = [];
  const actions: string[] = [];

  const trafficScore = clamp(ft.index + (c.corner ? 8 : 0) + (c.streetFront !== false ? 5 : -12));
  const transitScore = clamp(35 + poi.transit * 16 + poi.office * 6);
  const retailEco = clamp(30 + poi.retail * 10 + poi.food * 8);
  // 竞争过密略扣分
  const competitionPenalty = Math.max(0, poi.retail + poi.food - 12) * 3;
  const competitionScore = clamp(78 - competitionPenalty);
  const visibility = clamp(
    50 +
      (c.corner ? 18 : 0) +
      (c.streetFront !== false ? 12 : -15) +
      (c.floor != null && c.floor >= 2 ? -20 : 10) +
      poi.road * 4,
  );
  const industryFit = clamp(
    55 +
      (c.industry && /餐饮|咖啡/.test(c.industry) && poi.office + poi.retail > 3 ? 15 : 0) +
      (c.industry && /美业|教育/.test(c.industry) && ft.index > 80 ? -8 : 5),
  );
  const rentProxy = clamp(88 - ft.index * 0.35); // 人流越高租金压力越大（粗）

  if (ft.band === '旺盛' || ft.band === '活跃') pros.push(`预估人流${ft.band}：工作日约 ${ft.weekdayDaily} 人次级`);
  if (c.corner) pros.push('转角铺可视面更长，截流优势');
  if (poi.transit >= 2) pros.push('轨道/公交可导流');
  if (competitionScore < 55) cons.push('同类商业密度偏高，需差异化与租金精算');
  if (ft.band === '冷清') cons.push('人流偏冷，更依赖会员/到店目的性消费');
  if (c.floor != null && c.floor >= 2) cons.push('二楼及以上自然到店衰减明显');
  if (ft.band === '过载') cons.push('过载人流不等于转化，需看驻足与业态匹配');

  actions.push('连续三个工作日/周末各蹲点 1 小时，核对高峰时段');
  actions.push('量门宽净高、是否被柱/树/电箱挡视线');
  actions.push('用本工具加载商铺预设 + 门头朝向，看动线与财位是否冲突');

  return {
    dimensions: [
      {
        key: 'traffic',
        label: '人流强度',
        score: trafficScore,
        weight: 1.5,
        note: `日均约 ${ft.weekdayDaily} · 高峰 ${ft.peakHourLabel}`,
      },
      { key: 'transit', label: '公共交通', score: transitScore, weight: 1.1, note: `轨道/公交 ${poi.transit}` },
      { key: 'ecosystem', label: '商业生态', score: retailEco, weight: 1.0, note: `零售 ${poi.retail} · 餐饮 ${poi.food}` },
      { key: 'competition', label: '竞争舒适度', score: competitionScore, weight: 1.0, note: competitionPenalty ? '密度偏高' : '密度适中' },
      { key: 'visibility', label: '展示可见', score: visibility, weight: 1.2, note: c.corner ? '转角' : '标准临街' },
      { key: 'industry', label: '业态匹配', score: industryFit, weight: 1.0, note: c.industry || '未填业态' },
      { key: 'rent', label: '租金压力（反）', score: rentProxy, weight: 0.8, note: '人流越高通常租金越贵' },
    ],
    pros,
    cons,
    actions,
  };
}

function scoreYinzhai(c: SiteCandidateInput, poi: SitePoiCounts, ft: FootTrafficEstimate): {
  dimensions: ScoreDim[];
  pros: string[];
  cons: string[];
  actions: string[];
} {
  const pros: string[] = [];
  const cons: string[] = [];
  const actions: string[] = [];

  const quietScore = clamp(88 - ft.index * 0.4 - poi.retail * 5 - poi.food * 4);
  const backScore = clamp(
    50 +
      (c.hasBackMountain ? 25 : 0) +
      (/山|岭|岗|坡|峰|靠/.test(c.address + (c.notes || '')) ? 18 : 0) +
      (poi.park > 0 ? 5 : 0),
  );
  const mingTang = clamp(
    48 +
      (c.openMingTang ? 22 : 0) +
      (/明堂|开阔|平地|田/.test(c.notes || '') ? 12 : 0) +
      (poi.water > 0 ? 8 : 0) -
      (poi.road > 6 ? 10 : 0),
  );
  const waterScore = clamp(40 + poi.water * 18 + (/水|河|湖|江|溪/.test(c.address) ? 12 : 0));
  const accessScore = clamp(35 + poi.road * 10 + poi.transit * 6 + (poi.cemetery >= 1 ? 12 : 0));
  const formScore = clamp(
    55 +
      (c.facing && /北|东北|西北/.test(c.facing) ? 6 : 0) +
      (c.facing && /南/.test(c.facing) ? 8 : 0) +
      (/陵园|公墓|墓园/.test(c.address) ? 10 : 0),
  );

  if (quietScore >= 70) pros.push('周边相对清静，符合阴宅宜静忌闹');
  else cons.push('商业/道路扰动偏强，需看陵园内微地形是否隔离');
  if (backScore >= 70) pros.push('靠山/后靠线索较好');
  else actions.push('现场确认穴位后侧是否有实靠（山体/高地/建筑物环抱）');
  if (mingTang >= 65) pros.push('明堂开阔度线索正面');
  else cons.push('明堂可能局促或正对硬直冲，需罗盘与现场目视');
  if (waterScore >= 60) pros.push('有水系环绕或邻近信号');
  if (poi.cemetery >= 1) pros.push('位于/邻近专业陵园设施带，管理与祭扫动线更清晰');

  actions.push('以罗盘核朝向，忌硬直路、尖角、高压线正对');
  actions.push('在本工具切换「阴宅」预设，注入坐标后看奇门/九宫结构示意');
  actions.push('优先合规合法墓位，遵守地方殡葬规划');

  return {
    dimensions: [
      { key: 'quiet', label: '清静度', score: quietScore, weight: 1.3, note: `人流指数 ${ft.index}` },
      { key: 'back', label: '靠山后靠', score: backScore, weight: 1.4, note: c.hasBackMountain ? '用户确认有靠' : '待现场确认' },
      { key: 'mingtang', label: '明堂开阔', score: mingTang, weight: 1.3, note: c.openMingTang ? '用户确认开阔' : '待现场确认' },
      { key: 'water', label: '水系砂水', score: waterScore, weight: 1.0, note: `水 POI ${poi.water}` },
      { key: 'access', label: '祭扫可达', score: accessScore, weight: 0.9, note: '道路与陵园配套' },
      { key: 'form', label: '形局朝向', score: formScore, weight: 1.1, note: c.facing || '未填朝向' },
    ],
    pros,
    cons,
    actions,
  };
}

function suggestedDomain(
  purpose: SitePurpose,
  c: SiteCandidateInput,
): SiteCandidateResult['suggestedDomain'] {
  if (purpose === 'shop') return 'shop';
  if (purpose === 'yinzhai') return 'tomb';
  if (c.areaSqm && c.areaSqm >= 180) return 'villa';
  if (/公寓/.test(c.address + (c.label || ''))) return 'apartment';
  return 'residential';
}

export function adviseSiteCandidate(
  purpose: SitePurpose,
  raw: SiteCandidateInput,
  index: number,
): SiteCandidateResult {
  const id = raw.id || `site-${index + 1}`;
  const label = raw.label || raw.address.split(/[,，]/)[0] || `候选 ${index + 1}`;
  const basePoi = heuristicPoiFromAddress(raw.address);
  const poi = mergePoi(basePoi, raw.poi);
  if (raw.poi?.source) poi.source = raw.poi.source;

  const ft = estimateFootTraffic(purpose, poi, {
    corner: raw.corner,
    streetFront: raw.streetFront,
    industry: raw.industry,
    floor: raw.floor,
    address: raw.address,
  });

  const pack =
    purpose === 'shop'
      ? scoreShop(raw, poi, ft)
      : purpose === 'yinzhai'
        ? scoreYinzhai(raw, poi, ft)
        : scoreHouse(raw, poi, ft);

  const totalScore = weightedTotal(pack.dimensions);
  let rankHint = '可继续对比';
  if (totalScore >= 80) rankHint = '优先考虑';
  else if (totalScore >= 68) rankHint = '值得细看';
  else if (totalScore >= 55) rankHint = '中性，看短板能否改';
  else rankHint = '风险偏多，谨慎';

  return {
    id,
    label: String(label).slice(0, 40),
    address: raw.address,
    lat: raw.lat,
    lng: raw.lng,
    purpose,
    totalScore,
    rankHint,
    dimensions: pack.dimensions,
    footTraffic: ft,
    pros: pack.pros,
    cons: pack.cons,
    actions: pack.actions,
    poi,
    suggestedDomain: suggestedDomain(purpose, raw),
  };
}

export function adviseSites(
  purpose: SitePurpose,
  candidates: SiteCandidateInput[],
): SiteAdviseResult {
  const list = (candidates || [])
    .filter((c) => c && c.address && Number.isFinite(c.lat) && Number.isFinite(c.lng))
    .slice(0, 8)
    .map((c, i) => adviseSiteCandidate(purpose, c, i))
    .sort((a, b) => b.totalScore - a.totalScore);

  const winnerId = list[0]?.id ?? null;
  const purposeLabel = SITE_PURPOSE_LABELS[purpose];
  let summary = `已评估 ${list.length} 个${purposeLabel}候选。`;
  if (list[0]) {
    summary += `综合领先：「${list[0].label}」${list[0].totalScore} 分（${list[0].rankHint}）。`;
    if (purpose === 'shop' && list[0].footTraffic) {
      summary += `人流指数 ${list[0].footTraffic.index}（${list[0].footTraffic.band}），工作日约 ${list[0].footTraffic.weekdayDaily} 人次级。`;
    }
  } else {
    summary += '请先通过地图搜索加入至少 1 个地址。';
  }

  return {
    purpose,
    purposeLabel,
    generatedAt: new Date().toISOString(),
    candidates: list,
    winnerId,
    summary,
    disclaimer:
      '选址与人流为结构启发式评估，用于多案对比与风水形局讨论，不构成置业/投资/殡葬法定意见；请结合现场、规划与专业测绘。',
  };
}
