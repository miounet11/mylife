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
      className="group block overflow-hidden rounded-[1.75rem] border border-[color:var(--line)] bg-white/86 shadow-[0_18px_46px_rgba(47,32,14,0.08)] transition hover:-translate-y-0.5 hover:border-[color:var(--accent)]"
    >
      <div className={asset.ratio === '4:5' ? 'mx-auto aspect-[4/5] max-h-[520px] overflow-hidden bg-[#f7efe2]' : 'aspect-video overflow-hidden bg-[#f7efe2]'}>
        <img
          src={asset.publicUrl}
          alt={asset.altText}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]"
        />
      </div>
      <div className={compact ? 'p-4' : 'p-5'}>
        <div className="product-kicker">{asset.id} · {asset.module}</div>
        <h3 className="mt-2 text-xl font-black text-[color:var(--ink)]">{asset.title}</h3>
        {!compact ? (
          <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{asset.description}</p>
        ) : null}
        <div className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[color:var(--accent-strong)]">
          查看图片与解读
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </Link>
  );
}
