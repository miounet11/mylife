export type NamingMode = 'person' | 'company' | 'product';

export type Gender = 'male' | 'female' | 'neutral';

export type Wuxing = '木' | '火' | '土' | '金' | '水';

export type NameScoreBreakdown = {
  wuxing: number;
  phonology: number;
  semantics: number;
  wuge?: number;
  brandability?: number;
  total: number;
};

export type NameCandidate = {
  name: string;
  fullName?: string;
  score: number;
  breakdown: NameScoreBreakdown;
  elements: Array<{ char: string; element: Wuxing | '未知' }>;
  reason: string;
  styleTags?: string[];
  english?: string;
  /** 公司名：法域 / 主体形式 / 模式标签 */
  jurisdiction?: string;
  entityForm?: string;
  patternLabel?: string;
};

export type PersonGenerateInput = {
  surname: string;
  gender?: Gender;
  yongShen?: string[];
  jiShen?: string[];
  generationChar?: string;
  tabooChars?: string[];
  style?: 'classic' | 'modern' | 'literary';
  count?: number;
  enableWuge?: boolean;
};

export type CompanyGenerateInput = {
  industry?: string;
  keywords?: string[];
  /** 核心字号，如「伙计」；优先于 keywords 第一项 */
  tradeName?: string;
  /** 省/市 行政区，如 广东、深圳 */
  region?: string;
  /** CN | HK | US | ... */
  jurisdiction?: string;
  /** co_ltd | joint_stock | group | brand_only */
  entityForm?: string;
  preferredLength?: 2 | 3 | 4;
  yongShen?: string[];
  count?: number;
  enableWuge?: boolean;
};

export type ProductGenerateInput = {
  category?: string;
  keywords?: string[];
  style?: 'steady' | 'tech' | 'guofeng' | 'global';
  count?: number;
  bilingual?: boolean;
};

export type NamingGenerateResult = {
  mode: NamingMode;
  generatedAt: string;
  candidates: NameCandidate[];
  disclaimer: string;
  meta?: Record<string, unknown>;
};

export type NamingScoreInput = {
  mode: NamingMode;
  name: string;
  surname?: string;
  yongShen?: string[];
  jiShen?: string[];
  industry?: string;
  enableWuge?: boolean;
};
