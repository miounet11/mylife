export function appendSourceToHref(href: string, rawSource?: string | null) {
  const source = `${rawSource || ''}`.trim();
  if (!source || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return href;
  }

  if (/^https?:\/\//i.test(href)) {
    try {
      const url = new URL(href);
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
  const separator = baseWithQuery.includes('?') ? '&' : '?';

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
