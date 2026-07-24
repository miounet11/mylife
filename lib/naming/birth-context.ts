/**
 * 从生辰或档案解析用神，供起名天时维
 */

import { buildDimensionEnginePack } from '@/lib/dimensions/engine-pack';
import type { BirthInput } from '@/lib/fortune-context-builder';

export type NamingBirthContext = {
  birthDate?: string;
  birthTime?: string;
  birthPlace?: string;
  gender?: string;
  yongShen: string[];
  jiShen: string[];
  dayMaster?: string;
  birthSignature?: string;
  source: 'birth_engine' | 'profile' | 'manual' | 'none';
  note: string;
};

export function resolveNamingBirthContext(input: {
  birthDate?: string;
  birthTime?: string;
  birthPlace?: string;
  gender?: string;
  birthAccuracy?: string;
  /** 已从档案带入 */
  yongShen?: string[];
  jiShen?: string[];
  dayMaster?: string;
  fortuneId?: string;
}): NamingBirthContext {
  // 档案/手填用神优先，仍可叠加生辰签名
  const manualYong = (input.yongShen || []).filter(Boolean);
  const manualJi = (input.jiShen || []).filter(Boolean);

  if (input.birthDate && /^\d{4}-\d{2}-\d{2}/.test(input.birthDate)) {
    try {
      const birth: BirthInput = {
        birthDate: input.birthDate.slice(0, 10),
        birthTime: input.birthTime || undefined,
        birthPlace: input.birthPlace || '北京',
        birthAccuracy: (input.birthAccuracy as BirthInput['birthAccuracy']) || 'approx',
        gender: input.gender === 'female' || input.gender === '女' ? 'female' : 'male',
      };
      const pack = buildDimensionEnginePack(birth);
      const ys = pack.truthInput?.yongShen as
        | { yongShen?: string[]; xiShen?: string[]; jiShen?: string[] }
        | string[]
        | undefined;
      let yongShen: string[] = [];
      let jiShen: string[] = [];
      if (Array.isArray(ys)) {
        yongShen = ys;
      } else if (ys && typeof ys === 'object') {
        yongShen = [...(ys.yongShen || []), ...(ys.xiShen || [])];
        jiShen = [...(ys.jiShen || [])];
      }
      if (manualYong.length) yongShen = manualYong;
      if (manualJi.length) jiShen = manualJi;

      const pillars = (pack.truthInput as { pillars?: Array<{ gan?: string }> })?.pillars;
      const dayMaster =
        input.dayMaster ||
        (pillars && pillars[2]?.gan) ||
        (pack.truthInput as { dayMaster?: string })?.dayMaster;

      return {
        birthDate: birth.birthDate,
        birthTime: birth.birthTime,
        birthPlace: birth.birthPlace,
        gender: birth.gender,
        yongShen: [...new Set(yongShen)].slice(0, 6),
        jiShen: [...new Set(jiShen)].slice(0, 6),
        dayMaster: dayMaster ? String(dayMaster) : undefined,
        birthSignature: pack.birthSignature,
        source: input.fortuneId ? 'profile' : 'birth_engine',
        note: yongShen.length
          ? `生辰已排盘 · 用神 ${yongShen.join('、')}`
          : '生辰已录入，用神偏弱提示待人工复核',
      };
    } catch (err) {
      console.error('[naming/birth-context]', err);
    }
  }

  if (manualYong.length || input.fortuneId) {
    return {
      birthDate: input.birthDate,
      birthTime: input.birthTime,
      birthPlace: input.birthPlace,
      gender: input.gender,
      yongShen: manualYong,
      jiShen: manualJi,
      dayMaster: input.dayMaster,
      source: input.fortuneId ? 'profile' : 'manual',
      note: manualYong.length ? `用神 ${manualYong.join('、')}` : '已关联档案',
    };
  }

  return {
    yongShen: [],
    jiShen: [],
    source: 'none',
    note: '未填生辰：天时/用神维降权，建议填写出生时间',
  };
}
