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
    <section className="workspace-panel overflow-hidden p-4 md:p-5">
      <div className={`grid gap-5 lg:grid-cols-[1.08fr_0.92fr] lg:items-center ${reverse ? 'lg:[&>*:first-child]:order-2' : ''}`}>
        <Link
          href={`/visual-assets/${asset.slug}`}
          className={asset.ratio === '4:5'
            ? 'interactive-card relative mx-auto aspect-[4/5] max-h-[620px] w-full max-w-[460px] overflow-hidden rounded-lg bg-[#eef5ef]'
            : 'interactive-card relative aspect-video overflow-hidden rounded-lg bg-[#eef5ef]'}
        >
          <Image
            src={asset.publicUrl}
            alt={asset.altText}
            fill
            sizes="(min-width: 1024px) 48vw, 100vw"
            className="object-cover"
          />
        </Link>

        <div className="p-2 md:p-4">
          <div className="section-label">{label}</div>
          <h2 className="mt-4 text-3xl font-black text-[color:var(--ink)] md:text-4xl">{asset.title}</h2>
          <p className="mt-3 text-sm leading-7 text-[color:var(--muted)] md:text-base">{asset.narrativeExcerpt}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={`/visual-assets/${asset.slug}`} className="action-primary">
              查看解读
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/visual-assets" className="action-secondary">全部图片</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
