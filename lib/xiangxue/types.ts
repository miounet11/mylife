import type { SavedUserMedia } from '@/lib/user-media-store';

export type XiangxueKind = 'face' | 'palm';

export type XiangxueDimScore = {
  id: string;
  label: string;
  score: number;
  note: string;
};

export type XiangxueObservation = {
  id: string;
  title: string;
  body: string;
  tone?: 'default' | 'positive' | 'warning' | 'muted';
};

export type XiangxueSessionResult = {
  schema: 'life-kline.xiangxue.v1';
  kind: XiangxueKind;
  title: string;
  summary: string;
  generatedAt: string;
  overallScore: number;
  dims: XiangxueDimScore[];
  observations: XiangxueObservation[];
  actions: string[];
  disclaimers: string[];
  media: {
    id: string;
    publicPath: string;
    r2Key: string | null;
    kind: string;
    /** 是否允许用于脱敏线图 SEO（用户授权后） */
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
  /** 结构真值：可见特征标签（非吉凶） */
  visibleTags: string[];
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
  /** 面相：左右侧重点；手相：左右手 */
  side?: 'left' | 'right' | 'unknown';
};
