const PUBLIC_CONTENT_SOURCE_PREFIXES = [
  'knowledge_article:',
  'case_article:',
  'insight:',
  'visual_asset:',
];

const PUBLIC_CONTENT_PATH_PREFIXES = [
  '/knowledge/',
  '/cases/',
  '/insights/',
  '/visual-assets/',
  '/tools/',
  '/world-yi',
  '/community/',
  '/docs/',
];

function isPublicContentSource(source: string) {
  return PUBLIC_CONTENT_SOURCE_PREFIXES.some((prefix) => source.startsWith(prefix));
}

function isPublicContentHref(pathname: string) {
  return PUBLIC_CONTENT_PATH_PREFIXES.some((prefix) => pathname === prefix.replace(/\/$/, '') || pathname.startsWith(prefix));
}

export function appendSourceToHref(href: string, rawSource?: string | null) {
  const source = `${rawSource || ''}`.trim();
  if (!source || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return href;
  }

  if (/^https?:\/\//i.test(href)) {
    try {
      const url = new URL(href);
      if (isPublicContentSource(source) && isPublicContentHref(url.pathname)) {
        return href;
      }
      if (!url.searchParams.get('source')) {
        url.searchParams.set('source', source);
      }
      return url.toString();
    } catch {
      return href;
    }
  }

  const hashIndex = href.indexOf('#');
  const baseWithQuery = hashIndex >= 0 ? href.slice(0, hashIndex) : href;
  const hash = hashIndex >= 0 ? href.slice(hashIndex) : '';
  const [pathname] = baseWithQuery.split('?', 1);
  const separator = baseWithQuery.includes('?') ? '&' : '?';

  if (isPublicContentSource(source) && isPublicContentHref(pathname)) {
    return href;
  }

  if (/(^|[?&])source=/.test(baseWithQuery)) {
    return href;
  }

  return `${baseWithQuery}${separator}source=${encodeURIComponent(source)}${hash}`;
}

export function appendSearchParamsToHref(href: string, params: Record<string, string | null | undefined>) {
  if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return href;
  }

  const normalizedEntries = Object.entries(params)
    .map(([key, value]) => [key, `${value || ''}`.trim()] as const)
    .filter(([, value]) => value);

  if (normalizedEntries.length === 0) {
    return href;
  }

  if (/^https?:\/\//i.test(href)) {
    try {
      const url = new URL(href);
      for (const [key, value] of normalizedEntries) {
        if (!url.searchParams.get(key)) {
          url.searchParams.set(key, value);
        }
      }
      return url.toString();
    } catch {
      return href;
    }
  }

  const hashIndex = href.indexOf('#');
  const baseWithQuery = hashIndex >= 0 ? href.slice(0, hashIndex) : href;
  const hash = hashIndex >= 0 ? href.slice(hashIndex) : '';
  const [pathname, query = ''] = baseWithQuery.split('?', 2);
  const searchParams = new URLSearchParams(query);

  for (const [key, value] of normalizedEntries) {
    if (!searchParams.get(key)) {
      searchParams.set(key, value);
    }
  }

  const nextQuery = searchParams.toString();
  return `${pathname}${nextQuery ? `?${nextQuery}` : ''}${hash}`;
}
