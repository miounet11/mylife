import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { VisualAssetLibraryItem } from '@/lib/visual-asset-library';

type VisualAssetCardProps = {
  asset: VisualAssetLibraryItem;
  priority?: boolean;
  compact?: boolean;
};

export default function VisualAssetCard({ asset, compact = false }: VisualAssetCardProps) {
  return (
    <Link
      href={`/visual-assets/${asset.slug}`}
      className="group block overflow-hidden rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] transition hover:-translate-y-px hover:border-[color:var(--brand)]"
    >
      <div
        className={
          asset.ratio === '4:5'
            ? 'relative mx-auto aspect-[4/5] max-h-[520px] overflow-hidden bg-[color:var(--bg-sunken)]'
            : 'relative aspect-video overflow-hidden bg-[color:var(--bg-sunken)]'
        }
      >
        <Image
          src={asset.publicUrl}
          alt={asset.altText}
          fill
          sizes={compact ? '(min-width: 1024px) 25vw, 50vw' : '(min-width: 1024px) 33vw, 100vw'}
          className="object-cover transition duration-500 group-hover:scale-[1.02]"
        />
      </div>
      <div className={compact ? 'p-4' : 'p-5'}>
        <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[color:var(--ink-5)]">
          {asset.id} · {asset.module}
        </div>
        <h3 className="mt-1.5 text-base font-bold leading-snug text-[color:var(--ink-1)] md:text-lg">
          {asset.title}
        </h3>
        {!compact ? (
          <p className="mt-2 text-xs leading-5 text-[color:var(--ink-4)]">{asset.description}</p>
        ) : null}
        <div className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[color:var(--brand-strong)] transition-all group-hover:gap-1.5">
          查看图片与解读
          <ArrowRight className="h-3 w-3" />
        </div>
      </div>
    </Link>
  );
}
