import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { VisualAssetLibraryItem } from '@/lib/visual-asset-library';

type VisualAssetFeatureProps = {
  asset: VisualAssetLibraryItem;
  label?: string;
  reverse?: boolean;
};

export default function VisualAssetFeature({ asset, label = '视觉说明图', reverse = false }: VisualAssetFeatureProps) {
  return (
    <section className="overflow-hidden rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4 md:p-5">
      <div className={`grid gap-5 lg:grid-cols-[1.08fr_0.92fr] lg:items-center ${reverse ? 'lg:[&>*:first-child]:order-2' : ''}`}>
        <Link
          href={`/visual-assets/${asset.slug}`}
          className={
            asset.ratio === '4:5'
              ? 'group relative mx-auto block aspect-[4/5] max-h-[620px] w-full max-w-[460px] overflow-hidden rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] transition hover:border-[color:var(--brand)]'
              : 'group relative block aspect-video overflow-hidden rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] transition hover:border-[color:var(--brand)]'
          }
        >
          <Image
            src={asset.publicUrl}
            alt={asset.altText}
            fill
            sizes="(min-width: 1024px) 48vw, 100vw"
            className="object-cover transition duration-200 group-hover:scale-[1.01]"
          />
        </Link>

        <div className="p-1 md:p-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
            {label}
          </div>
          <h2 className="mt-2 text-xl font-black leading-tight text-[color:var(--ink-1)] md:text-2xl">
            {asset.title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[color:var(--ink-3)] md:text-base md:leading-7">
            {asset.narrativeExcerpt}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/visual-assets/${asset.slug}`}
              className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] bg-[color:var(--brand-strong)] px-4 text-sm font-semibold text-white hover:bg-[color:var(--brand-deep)]"
            >
              查看解读
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/visual-assets"
              className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] hover:border-[color:var(--brand)]"
            >
              全部图片
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
