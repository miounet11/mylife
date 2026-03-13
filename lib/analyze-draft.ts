export interface AnalyzeDraft {
  gender: 'male' | 'female';
  birthDate: string;
  birthTime: string;
  birthSecond?: number;
}

export const ANALYZE_DRAFT_STORAGE_KEY = 'life-kline-analyze-draft';

function canUseStorage() {
  return typeof window !== 'undefined' && !!window.localStorage;
}

export function saveAnalyzeDraft(draft: AnalyzeDraft) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(ANALYZE_DRAFT_STORAGE_KEY, JSON.stringify(draft));
}

export function readAnalyzeDraft(): AnalyzeDraft | null {
  if (!canUseStorage()) {
    return null;
  }

  const raw = window.localStorage.getItem(ANALYZE_DRAFT_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as AnalyzeDraft;
    if (!parsed.birthDate || !parsed.birthTime || !parsed.gender) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearAnalyzeDraft() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(ANALYZE_DRAFT_STORAGE_KEY);
}
