import Link from 'next/link';

function pageHref(basePath: string, page: number) {
  if (page <= 1) {
    if (!basePath.includes('?')) return basePath;
    const [path, qs] = basePath.split('?');
    const params = new URLSearchParams(qs);
    params.delete('page');
    const next = params.toString();
    return next ? `${path}?${next}` : path;
  }

  if (!basePath.includes('?')) {
    return `${basePath}?page=${page}`;
  }
  const [path, qs] = basePath.split('?');
  const params = new URLSearchParams(qs);
  params.set('page', String(page));
  return `${path}?${params.toString()}`;
}

export default function ContentListPagination({
  basePath,
  page,
  totalPages,
}: {
  basePath: string;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const prev = page > 1 ? page - 1 : null;
  const next = page < totalPages ? page + 1 : null;

  return (
    <nav className="mt-4 flex items-center justify-between gap-3 text-[13px]" aria-label="分页">
      {prev ? (
        <Link
          href={pageHref(basePath, prev)}
          className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
        >
          上一页
        </Link>
      ) : (
        <span />
      )}
      <span className="text-[12px] text-[color:var(--ink-5)]">
        {page} / {totalPages}
      </span>
      {next ? (
        <Link
          href={pageHref(basePath, next)}
          className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
        >
          下一页
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
