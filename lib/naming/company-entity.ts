/**
 * 公司/商号命名：字号 + 行业特征 + 主体组织形式
 * 对标常见生成器（字号在前、行业、有限公司）与多法域后缀
 */

export type CompanyJurisdiction =
  | 'CN' // 中国大陆
  | 'HK' // 香港
  | 'TW' // 台湾
  | 'SG' // 新加坡
  | 'US' // 美国
  | 'JP' // 日本
  | 'UK' // 英国
  | 'GLOBAL'; // 品牌短名 / 多地区参考

export type CompanyEntityForm =
  | 'co_ltd' // 有限公司
  | 'joint_stock' // 股份有限公司
  | 'group' // 集团有限公司
  | 'studio' // 工作室/中心（轻主体）
  | 'brand_only'; // 仅品牌短名

export type CompanyNamePattern = {
  /** 展示用全称（可含有限公司） */
  fullName: string;
  /** 短名/字号侧重点 */
  brandCore: string;
  /** 英文/罗马化辅助 */
  english?: string;
  jurisdiction: CompanyJurisdiction;
  entityForm: CompanyEntityForm;
  patternLabel: string;
};

/** 行业 → 工商常见行业特征表述 */
const INDUSTRY_TAGS: Record<string, string[]> = {
  科技: ['科技', '信息科技', '网络科技', '智能科技', '数字科技'],
  软件: ['软件', '信息科技', '网络科技'],
  互联网: ['网络科技', '信息科技', '电子商务'],
  电商: ['电子商务', '商贸', '网络科技'],
  教育: ['教育科技', '文化', '培训'],
  文化: ['文化', '传媒', '文化传媒'],
  传媒: ['传媒', '文化传媒', '影视'],
  餐饮: ['餐饮', '餐饮管理', '食品'],
  食品: ['食品', '食品科技', '商贸'],
  医疗: ['医疗科技', '健康', '生物'],
  健康: ['健康管理', '医疗科技', '生物'],
  金融: ['金融', '资产管理', '信息科技'],
  咨询: ['企业管理', '咨询', '商务咨询'],
  制造: ['智能制造', '机电', '工业'],
  建筑: ['建筑工程', '建设', '工程'],
  贸易: ['商贸', '贸易', '进出口'],
  物流: ['物流', '供应链', '运输'],
  地产: ['房地产', '置业', '建设'],
  农业: ['农业科技', '生物', '商贸'],
  游戏: ['网络科技', '信息科技', '文化'],
  设计: ['设计', '文化创意', '广告'],
  广告: ['广告', '传媒', '营销'],
  默认: ['科技', '实业', '商贸', '信息'],
};

const CN_ENTITY: Record<CompanyEntityForm, string> = {
  co_ltd: '有限公司',
  joint_stock: '股份有限公司',
  group: '集团有限公司',
  studio: '工作室',
  brand_only: '',
};

const JURISDICTION_LABEL: Record<CompanyJurisdiction, string> = {
  CN: '中国大陆',
  HK: '中国香港',
  TW: '中国台湾',
  SG: '新加坡',
  US: '美国',
  JP: '日本',
  UK: '英国',
  GLOBAL: '品牌/多地区',
};

export function jurisdictionLabel(j: CompanyJurisdiction): string {
  return JURISDICTION_LABEL[j] || j;
}

export function industryFeatureTags(industry?: string): string[] {
  const key = (industry || '').trim();
  if (!key) return INDUSTRY_TAGS.默认;
  if (INDUSTRY_TAGS[key]) return INDUSTRY_TAGS[key];
  for (const [k, tags] of Object.entries(INDUSTRY_TAGS)) {
    if (key.includes(k) || k.includes(key)) return tags;
  }
  // 用户自定义行业词直接可用
  return [key.slice(0, 6), ...INDUSTRY_TAGS.默认].slice(0, 4);
}

/** 从关键词提取字号（优先完整中文词，如「伙计」） */
export function extractTradeName(keywords: string[], fallbackPool: string[]): string[] {
  const out: string[] = [];
  for (const k of keywords) {
    const pure = [...k].filter((c) => /[\u4e00-\u9fff]/.test(c)).join('');
    if (pure.length >= 1 && pure.length <= 4) out.push(pure);
  }
  for (const f of fallbackPool) {
    if (f && !out.includes(f)) out.push(f);
  }
  return [...new Set(out)].slice(0, 24);
}

export function buildCompanyNamePatterns(input: {
  tradeNames: string[];
  industry?: string;
  region?: string; // 省/市 如 广东、深圳
  jurisdiction?: CompanyJurisdiction;
  entityForm?: CompanyEntityForm;
  count?: number;
}): CompanyNamePattern[] {
  const jurisdiction = input.jurisdiction || 'CN';
  const entityForm = input.entityForm || 'co_ltd';
  const region = (input.region || '').replace(/省|市|自治区|特别行政区/g, (m) => m).trim();
  const regionShort = region.replace(/(省|市|壮族自治区|维吾尔自治区|回族自治区|自治区|特别行政区)$/,'');
  const tags = industryFeatureTags(input.industry);
  const trades = input.tradeNames.length ? input.tradeNames : ['启明', '云启', '星驰'];
  const max = Math.min(48, Math.max(12, input.count || 24));
  const patterns: CompanyNamePattern[] = [];

  const push = (p: CompanyNamePattern) => {
    if (patterns.some((x) => x.fullName === p.fullName)) return;
    patterns.push(p);
  };

  for (const trade of trades) {
    for (const tag of tags) {
      // —— 中国大陆常见 ——
      if (jurisdiction === 'CN' || jurisdiction === 'GLOBAL') {
        const suffix = CN_ENTITY[entityForm];
        // 字号 + 行业 + 有限公司
        if (suffix) {
          push({
            fullName: `${trade}${tag}${suffix}`,
            brandCore: trade,
            english: toEnBrand(trade),
            jurisdiction: 'CN',
            entityForm,
            patternLabel: '字号+行业+主体',
          });
          // 字号 + 公司（略短）
          push({
            fullName: `${trade}${tag}公司`,
            brandCore: trade,
            english: toEnBrand(trade),
            jurisdiction: 'CN',
            entityForm,
            patternLabel: '字号+行业+公司',
          });
        } else {
          push({
            fullName: `${trade}${tag}`,
            brandCore: trade,
            english: toEnBrand(trade),
            jurisdiction: 'CN',
            entityForm: 'brand_only',
            patternLabel: '品牌短名',
          });
        }
        // 行政区 + 字号 + 行业 + 有限公司
        if (regionShort && suffix) {
          push({
            fullName: `${regionShort}${trade}${tag}${suffix}`,
            brandCore: trade,
            english: toEnBrand(trade),
            jurisdiction: 'CN',
            entityForm,
            patternLabel: '行政区+字号+行业+主体',
          });
        }
      }

      // —— 香港 ——
      if (jurisdiction === 'HK' || jurisdiction === 'GLOBAL') {
        push({
          fullName: `${trade}${tag}有限公司`,
          brandCore: trade,
          english: `${toEnBrand(trade)} Limited`,
          jurisdiction: 'HK',
          entityForm: 'co_ltd',
          patternLabel: 'HK 中文有限公司',
        });
        push({
          fullName: `${toEnBrand(trade)} Limited`,
          brandCore: trade,
          english: `${toEnBrand(trade)} Limited`,
          jurisdiction: 'HK',
          entityForm: 'co_ltd',
          patternLabel: 'HK English Limited',
        });
      }

      // —— 台湾 ——
      if (jurisdiction === 'TW' || jurisdiction === 'GLOBAL') {
        push({
          fullName: `${trade}${tag}股份有限公司`,
          brandCore: trade,
          english: `${toEnBrand(trade)} Co., Ltd.`,
          jurisdiction: 'TW',
          entityForm: 'joint_stock',
          patternLabel: 'TW 股份有限公司',
        });
        push({
          fullName: `${trade}${tag}有限公司`,
          brandCore: trade,
          english: `${toEnBrand(trade)} Co., Ltd.`,
          jurisdiction: 'TW',
          entityForm: 'co_ltd',
          patternLabel: 'TW 有限公司',
        });
      }

      // —— 新加坡 ——
      if (jurisdiction === 'SG' || jurisdiction === 'GLOBAL') {
        push({
          fullName: `${toEnBrand(trade)} Pte. Ltd.`,
          brandCore: trade,
          english: `${toEnBrand(trade)} Pte. Ltd.`,
          jurisdiction: 'SG',
          entityForm: 'co_ltd',
          patternLabel: 'SG Pte. Ltd.',
        });
        push({
          fullName: `${trade}${tag}私人有限公司`,
          brandCore: trade,
          english: `${toEnBrand(trade)} Pte. Ltd.`,
          jurisdiction: 'SG',
          entityForm: 'co_ltd',
          patternLabel: 'SG 私人有限公司',
        });
      }

      // —— 美国 ——
      if (jurisdiction === 'US' || jurisdiction === 'GLOBAL') {
        push({
          fullName: `${toEnBrand(trade)} Inc.`,
          brandCore: trade,
          english: `${toEnBrand(trade)} Inc.`,
          jurisdiction: 'US',
          entityForm: 'co_ltd',
          patternLabel: 'US Inc.',
        });
        push({
          fullName: `${toEnBrand(trade)} LLC`,
          brandCore: trade,
          english: `${toEnBrand(trade)} LLC`,
          jurisdiction: 'US',
          entityForm: 'co_ltd',
          patternLabel: 'US LLC',
        });
        push({
          fullName: `${toEnBrand(trade)} Corp.`,
          brandCore: trade,
          english: `${toEnBrand(trade)} Corp.`,
          jurisdiction: 'US',
          entityForm: 'joint_stock',
          patternLabel: 'US Corp.',
        });
      }

      // —— 日本 ——
      if (jurisdiction === 'JP' || jurisdiction === 'GLOBAL') {
        push({
          fullName: `株式会社${trade}`,
          brandCore: trade,
          english: `${toEnBrand(trade)} Co., Ltd.`,
          jurisdiction: 'JP',
          entityForm: 'co_ltd',
          patternLabel: 'JP 株式会社',
        });
        push({
          fullName: `${trade}株式会社`,
          brandCore: trade,
          english: `${toEnBrand(trade)} Co., Ltd.`,
          jurisdiction: 'JP',
          entityForm: 'co_ltd',
          patternLabel: 'JP 株式会社（后置）',
        });
      }

      // —— 英国 ——
      if (jurisdiction === 'UK' || jurisdiction === 'GLOBAL') {
        push({
          fullName: `${toEnBrand(trade)} Ltd`,
          brandCore: trade,
          english: `${toEnBrand(trade)} Ltd`,
          jurisdiction: 'UK',
          entityForm: 'co_ltd',
          patternLabel: 'UK Ltd',
        });
        push({
          fullName: `${toEnBrand(trade)} Limited`,
          brandCore: trade,
          english: `${toEnBrand(trade)} Limited`,
          jurisdiction: 'UK',
          entityForm: 'co_ltd',
          patternLabel: 'UK Limited',
        });
      }

      // 品牌短名（传播用，对标竞品列表）
      if (jurisdiction === 'GLOBAL' || entityForm === 'brand_only') {
        push({
          fullName: `${trade}${tag}`,
          brandCore: trade,
          english: toEnBrand(trade),
          jurisdiction: 'GLOBAL',
          entityForm: 'brand_only',
          patternLabel: '品牌短名',
        });
        push({
          fullName: trade,
          brandCore: trade,
          english: toEnBrand(trade),
          jurisdiction: 'GLOBAL',
          entityForm: 'brand_only',
          patternLabel: '纯字号',
        });
      }

      if (patterns.length >= max * 2) break;
    }
    if (patterns.length >= max * 2) break;
  }

  // 优先：完整主体名称 > 短名
  const ranked = patterns.sort((a, b) => scorePattern(b) - scorePattern(a));
  return ranked.slice(0, max);
}

function scorePattern(p: CompanyNamePattern): number {
  let s = 50;
  if (p.patternLabel.includes('字号+行业+主体')) s += 30;
  if (p.patternLabel.includes('行政区')) s += 20;
  if (p.fullName.includes('有限公司') || p.fullName.includes('Limited') || p.fullName.includes('LLC'))
    s += 15;
  if (p.entityForm === 'brand_only') s -= 5;
  if (p.fullName.length > 18) s -= 8;
  if (p.fullName.length < 4) s -= 10;
  return s;
}

function toEnBrand(zh: string): string {
  const map: Record<string, string> = {
    云: 'Yun',
    启: 'Qi',
    明: 'Ming',
    华: 'Hua',
    科: 'Ke',
    创: 'Chuang',
    新: 'Xin',
    智: 'Zhi',
    源: 'Yuan',
    汇: 'Hui',
    安: 'An',
    信: 'Xin',
    德: 'De',
    和: 'He',
    泰: 'Tai',
    瑞: 'Rui',
    星: 'Xing',
    光: 'Guang',
    远: 'Yuan',
    达: 'Da',
    伙: 'Huo',
    计: 'Ji',
    浩: 'Hao',
    荣: 'Rong',
    优: 'You',
    先: 'Xian',
    锋: 'Feng',
    通: 'Tong',
    城: 'Cheng',
    谷: 'Gu',
    点: 'Dian',
    盟: 'Meng',
    赢: 'Ying',
    宝: 'Bao',
    乐: 'Le',
    客: 'Ke',
  };
  const parts = [...zh].map((c) => map[c] || c);
  const joined = parts.join('');
  // 若全是汉字，给一个 Pascal 占位
  if (/[\u4e00-\u9fff]/.test(joined)) {
    return (
      'Brand' +
      Math.abs(
        [...zh].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7),
      )
        .toString(36)
        .slice(0, 4)
    );
  }
  return joined.charAt(0).toUpperCase() + joined.slice(1);
}

export const COMPANY_JURISDICTIONS: Array<{ id: CompanyJurisdiction; label: string }> = [
  { id: 'CN', label: '中国大陆（有限公司）' },
  { id: 'HK', label: '中国香港（Limited）' },
  { id: 'TW', label: '中国台湾（股份有限公司）' },
  { id: 'SG', label: '新加坡（Pte. Ltd.）' },
  { id: 'US', label: '美国（Inc. / LLC）' },
  { id: 'JP', label: '日本（株式会社）' },
  { id: 'UK', label: '英国（Ltd）' },
  { id: 'GLOBAL', label: '多地区 / 品牌短名' },
];

export const COMPANY_ENTITY_FORMS: Array<{ id: CompanyEntityForm; label: string }> = [
  { id: 'co_ltd', label: '有限公司' },
  { id: 'joint_stock', label: '股份有限公司' },
  { id: 'group', label: '集团有限公司' },
  { id: 'studio', label: '工作室 / 中心' },
  { id: 'brand_only', label: '仅品牌短名' },
];
