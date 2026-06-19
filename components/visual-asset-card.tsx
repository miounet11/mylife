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
      className="fb-card group block overflow-hidden transition-colors hover:border-[color:var(--fb-blue)] hover:bg-[color:var(--fb-action-bg)] hover:no-underline"
    >
      <div
        className={
          asset.ratio === '4:5'
            ? 'relative mx-auto aspect-[4/5] max-h-[520px] overflow-hidden bg-[#f5f6f7]'
            : 'relative aspect-video overflow-hidden bg-[#f5f6f7]'
        }
      >
        <Image
          src={asset.publicUrl}
          alt={asset.altText}
          fill
          sizes={compact ? '(min-width: 1024px) 25vw, 50vw' : '(min-width: 1024px) 33vw, 100vw'}
          className="object-cover"
        />
      </div>
      <div className={compact ? 'p-3' : 'p-4'}>
        <div className="text-xs font-bold uppercase tracking-[0.04em] text-[color:var(--fb-ink-3)]">
          {asset.id} · {asset.module}
        </div>
        <h3 className="mt-1 text-[14px] font-bold leading-[1.35] text-[color:var(--fb-ink-1)] md:text-[15px]">
          {asset.title}
        </h3>
        {!compact ? (
          <p className="mt-1.5 text-[12px] leading-[1.5] text-[color:var(--fb-ink-2)]">{asset.description}</p>
        ) : null}
        <div className="mt-2 inline-flex items-center gap-1 text-[12px] font-bold text-[color:var(--fb-blue-link)]">
          查看图片与解读
          <ArrowRight className="h-3 w-3" />
        </div>
      </div>
    </Link>
  );
}
