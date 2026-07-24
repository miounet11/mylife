export type XiangxueKind = 'face' | 'palm';

export type XiangxueLayer = 'physical' | 'mingli' | 'meta';

export type XiangxueDimScore = {
  id: string;
  label: string;
  score: number;
  note: string;
  layer: XiangxueLayer;
  /** 置信度 0-100：成像/遮挡/推断 */
  confidence?: number;
  /** 证据：visible | inferred | weak */
  evidence?: 'visible' | 'inferred' | 'weak';
};

export type XiangxueObservation = {
  id: string;
  title: string;
  body: string;
  layer: XiangxueLayer;
  tone?: 'default' | 'positive' | 'warning' | 'muted';
};

/** 系统化报告章节：先物理，再命理，再综合 */
export type XiangxueSection = {
  id: string;
  layer: XiangxueLayer;
  heading: string;
  /** 章节导语 */
  lead?: string;
  /** 章节序号展示用 */
  step?: number;
  items: Array<{
    title: string;
    body: string;
    /** 子标签，如「可见」「教学」 */
    tag?: string;
  }>;
};

/** 经典框架条目：物理特征 → 传统阅读名 */
export type XiangxueFrameworkItem = {
  id: string;
  classicName: string;
  physicalFocus: string;
  note: string;
  layer: XiangxueLayer;
};

export type XiangxueSessionResult = {
  schema: 'life-kline.xiangxue.v3' | 'life-kline.xiangxue.v2';
  kind: XiangxueKind;
  title: string;
  summary: string;
  /** 一句话物理结论 */
  physicalHeadline: string;
  /** 一句话命理交叉结论 */
  mingliHeadline: string;
  /** 综合一句（行动取向） */
  synthesisHeadline?: string;
  generatedAt: string;
  overallScore: number;
  physicalScore: number;
  mingliScore: number;
  /** 整体可信度（主要看成像） */
  confidenceScore?: number;
  dims: XiangxueDimScore[];
  /** 有序章节：物理 → 命理 → 综合 */
  sections: XiangxueSection[];
  observations: XiangxueObservation[];
  actions: string[];
  disclaimers: string[];
  readingPath: string[];
  /** 经典框架对照表 */
  framework?: XiangxueFrameworkItem[];
  /** 物理层优势点 */
  strengths?: string[];
  /** 需关注 / 补拍 / 弱证据 */
  watchpoints?: string[];
  media: {
    id: string;
    publicPath: string;
    r2Key: string | null;
    kind: string;
    allowSeoLineArt: boolean;
  };
  birth?: {
    birthDate?: string;
    gender?: string;
    yongShen?: string[];
    dayMaster?: string;
    note?: string;
  };
  llmUsed: boolean;
  visibleTags: string[];
  photoQuality: {
    score: number;
    level: 'good' | 'ok' | 'poor';
    tips: string[];
  };
};

export type XiangxueRunInput = {
  kind: XiangxueKind;
  imageDataUrl: string;
  birthDate?: string;
  birthTime?: string;
  birthPlace?: string;
  gender?: string;
  yongShen?: string[];
  fortuneId?: string;
  note?: string;
  allowSeoLineArt?: boolean;
  side?: 'left' | 'right' | 'unknown';
};
