/** Site text scale preference for readability (esp. middle-aged users). */

export type TextScale = 'normal' | 'large';

export const TEXT_SCALE_STORAGE_KEY = 'lk:text-scale';
export const TEXT_SCALE_ATTR = 'data-text-scale';

export function isTextScale(value: unknown): value is TextScale {
  return value === 'normal' || value === 'large';
}

export function readStoredTextScale(): TextScale {
  if (typeof window === 'undefined') return 'normal';
  try {
    const raw = window.localStorage.getItem(TEXT_SCALE_STORAGE_KEY);
    if (isTextScale(raw)) return raw;
  } catch {
    // ignore
  }
  return 'normal';
}

/** Apply scale on <html> immediately (client). */
export function applyTextScale(scale: TextScale) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (scale === 'normal') {
    root.removeAttribute(TEXT_SCALE_ATTR);
  } else {
    root.setAttribute(TEXT_SCALE_ATTR, scale);
  }
}

export function persistTextScale(scale: TextScale) {
  try {
    window.localStorage.setItem(TEXT_SCALE_STORAGE_KEY, scale);
  } catch {
    // ignore
  }
  applyTextScale(scale);
}

/** Inline script body for layout (FOUC prevention). */
export const TEXT_SCALE_BOOT_SCRIPT = `(function(){try{var k=${JSON.stringify(TEXT_SCALE_STORAGE_KEY)};var v=localStorage.getItem(k);if(v==='large')document.documentElement.setAttribute(${JSON.stringify(TEXT_SCALE_ATTR)},'large');}catch(e){}})();`;
