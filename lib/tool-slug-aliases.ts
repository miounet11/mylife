/** Marketing / portal slugs → canonical tool slugs (production lib/tools.ts). */
export const TOOL_SLUG_ALIASES: Record<string, string> = {
  '2026-window': 'timing-yearly-window',
  'palm-reading': 'application-palmistry-reading',
};

export function resolveToolSlug(slug: string): string {
  return TOOL_SLUG_ALIASES[slug] || slug;
}