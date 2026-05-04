import Image from 'next/image';
import { ArrowRight, Image as ImageIcon, Sparkles } from 'lucide-react';
import ContentCardLink from '@/components/content-card-link';
import type { VisualAssetLibraryItem } from '@/lib/visual-asset-library';

type ContentVisualAssetPanelProps = {
  assets: VisualAssetLibraryItem[];
  page: string;
  source: string;
  contentLabel: string;
  contentTitle: string;
  className?: string;
};

const moduleLabels: Record<VisualAssetLibraryItem['module'], string> = {
  PRODUCT_WORLD_YI: '产品路径',
  REPORT: '报告阅读',
  TOOLS: '工具矩阵',
  CONTENT: '内容体系',
  WORLD_YI: '世界易方法',
  MINGLI: '命理易学',
  SOCIAL: '传播卡',
};

function buildAssetExplanation(asset: VisualAssetLibraryItem, contentLabel: string, contentTitle: string) {
  if (asset.module === 'MINGLI') {
    return `这张图把《${contentTitle}》里的命理概念转成关系、边界和应用场景，适合先看图建立结构，再回到${contentLabel}正文理解细节。`;
  }

  if (asset.module === 'WORLD_YI') {
    return `这张图把《${contentTitle}》接回世界易的判断语言：结构、时位、环境、行动与复盘，避免只停留在概念阅读。`;
  }

  if (asset.module === 'REPORT') {
    return `这张图说明用户从当前${contentLabel}进入测算报告后，应该先看什么、如何分层阅读，以及何时进入深入报告。`;
  }

  if (asset.module === 'TOOLS') {
    return `这张图说明当前${contentLabel}对应的问题如何被拆成单项工具，帮助用户从“看懂”进入“验证和行动”。`;
  }

  if (asset.module === 'SOCIAL') {
    return `这张图适合把《${contentTitle}》中的高传播主题做成可分享入口，但仍然保持非恐吓、非宿命论的表达边界。`;
  }

  return `这张图把《${contentTitle}》放回人生K线内容体系，让用户知道当前阅读如何继续连接测算、工具、案例和复访。`;
}

export default function ContentVisualAssetPanel({
  assets,
  page,
  source,
  contentLabel,
  contentTitle,
  className = '',
}: ContentVisualAssetPanelProps) {
  if (assets.length === 0) return null;

  const [primary, ...secondary] = assets;

  return (
    <section className={`rounded-[2rem] border border-[color:var(--line)] bg-[linear-gradient(135deg,rgba(255,253,248,0.94),rgba(244,235,221,0.78))] p-5 shadow-[0_18px_46px_rgba(47,32,14,0.07)] ${className}`}>
      <div className="section-label">
        <ImageIcon className="h-3.5 w-3.5" />
        视觉说明
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
        <ContentCardLink
          href={`/visual-assets/${primary.slug}`}
          page={page}
          source={source}
          meta={{
            surfaceKey: `${source}:visual_assets`,
            targetSurfaceKey: `visual_asset:${primary.slug}`,
            contentType: 'visual_asset',
            assetId: primary.id,
            assetModule: primary.module,
          }}
          className={primary.ratio === '4:5'
            ? 'mx-auto block max-h-[560px] max-w-[420px] overflow-hidden rounded-[1.5rem] bg-[#f7efe2] shadow-[0_18px_44px_rgba(47,32,14,0.12)]'
            : 'block overflow-hidden rounded-[1.5rem] bg-[#f7efe2] shadow-[0_18px_44px_rgba(47,32,14,0.12)]'}
        >
          <Image
            src={primary.publicUrl}
            alt={primary.altText}
            width={primary.ratio === '4:5' ? 960 : 1280}
            height={primary.ratio === '4:5' ? 1200 : 720}
            sizes={primary.ratio === '4:5' ? '(min-width: 1024px) 420px, 90vw' : '(min-width: 1024px) 48vw, 90vw'}
            className={primary.ratio === '4:5' ? 'h-full w-full object-cover' : 'aspect-video h-full w-full object-cover'}
          />
        </ContentCardLink>

        <div>
          <div className="product-kicker">{primary.id} · {moduleLabels[primary.module]}</div>
          <h2 className="mt-3 text-3xl font-black leading-tight text-[color:var(--ink)]">{primary.title}</h2>
          <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">{buildAssetExplanation(primary, contentLabel, contentTitle)}</p>
          <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">{primary.narrativeExcerpt}</p>
          <ContentCardLink
            href={`/visual-assets/${primary.slug}`}
            page={page}
            source={source}
            meta={{
              surfaceKey: `${source}:visual_asset_primary`,
              targetSurfaceKey: `visual_asset:${primary.slug}`,
              contentType: 'visual_asset',
              assetId: primary.id,
            }}
            className="action-primary mt-5 inline-flex"
          >
            查看图片解读
            <ArrowRight className="h-4 w-4" />
          </ContentCardLink>
        </div>
      </div>

      {secondary.length > 0 ? (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {secondary.map((asset) => (
            <ContentCardLink
              key={asset.id}
              href={`/visual-assets/${asset.slug}`}
              page={page}
              source={source}
              meta={{
                surfaceKey: `${source}:visual_asset_related`,
                targetSurfaceKey: `visual_asset:${asset.slug}`,
                contentType: 'visual_asset',
                assetId: asset.id,
                assetModule: asset.module,
              }}
              className="grid grid-cols-[7.5rem_1fr] gap-3 rounded-[1.35rem] border border-[color:var(--line)] bg-white/78 p-3 transition hover:-translate-y-0.5 hover:border-[color:var(--accent)]"
            >
              <div className="aspect-video overflow-hidden rounded-[1rem] bg-[#f7efe2]">
                <Image
                  src={asset.publicUrl}
                  alt={asset.altText}
                  width={320}
                  height={180}
                  sizes="7.5rem"
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-1 text-xs font-bold tracking-[0.14em] text-[color:var(--muted)]">
                  <Sparkles className="h-3 w-3" />
                  {moduleLabels[asset.module]}
                </div>
                <div className="mt-2 text-sm font-black leading-5 text-[color:var(--ink)]">{asset.title}</div>
              </div>
            </ContentCardLink>
          ))}
        </div>
      ) : null}
    </section>
  );
}
