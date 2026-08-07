import type { ElementKey, ModalityKey, SignKey } from '@/lib/astro/types';
import { ASTRO_SIGNS } from '@/lib/astro/signs-data';

export type ElementSlug = 'fire' | 'earth' | 'air' | 'water';

export const ELEMENT_CATALOG: Array<{
  slug: ElementSlug;
  zh: ElementKey;
  en: string;
  blurb: string;
  worldYi: string;
}> = [
  {
    slug: 'fire',
    zh: '火',
    en: 'Fire',
    blurb: '白羊 · 狮子 · 射手：推进、可见度、意义扩张。',
    worldYi: '火象更贴事业进入窗口与角色可见度，先看阶段是否允许冲。',
  },
  {
    slug: 'earth',
    zh: '土',
    en: 'Earth',
    blurb: '金牛 · 处女 · 摩羯：落地、质控、台阶式积累。',
    worldYi: '土象更贴财富保留与组织责任，先问能守住什么。',
  },
  {
    slug: 'air',
    zh: '风',
    en: 'Air',
    blurb: '双子 · 天秤 · 水瓶：信息、协商、系统与网络。',
    worldYi: '风象更贴协作边界与全球网络叙事。',
  },
  {
    slug: 'water',
    zh: '水',
    en: 'Water',
    blurb: '巨蟹 · 天蝎 · 双鱼：归属、深度转化、情绪与叙事场。',
    worldYi: '水象更贴关系边界与家庭照护轴。',
  },
];

export function getElementBySlug(slug: string | null | undefined) {
  return ELEMENT_CATALOG.find((e) => e.slug === slug) || null;
}

export function signsForElement(el: ElementKey): SignKey[] {
  return ASTRO_SIGNS.filter((s) => s.element === el).map((s) => s.key);
}

export type ModalitySlug = 'cardinal' | 'fixed' | 'mutable';

export const MODALITY_CATALOG: Array<{
  slug: ModalitySlug;
  zh: ModalityKey;
  en: string;
  blurb: string;
}> = [
  { slug: 'cardinal', zh: '基本', en: 'Cardinal', blurb: '白羊 · 巨蟹 · 天秤 · 摩羯：开局与定调。' },
  { slug: 'fixed', zh: '固定', en: 'Fixed', blurb: '金牛 · 狮子 · 天蝎 · 水瓶：持守与加深。' },
  { slug: 'mutable', zh: '变动', en: 'Mutable', blurb: '双子 · 处女 · 射手 · 双鱼：调节与过渡。' },
];

export function getModalityBySlug(slug: string | null | undefined) {
  return MODALITY_CATALOG.find((m) => m.slug === slug) || null;
}

export function signsForModality(m: ModalityKey): SignKey[] {
  return ASTRO_SIGNS.filter((s) => s.modality === m).map((s) => s.key);
}
