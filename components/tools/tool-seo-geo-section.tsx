import Link from 'next/link';
import SocialShareBar from '@/components/social-share-bar';
import { absoluteUrl } from '@/lib/seo';
import {
  buildToolJsonLdGraph,
  type ToolSeoGeoPack,
  toolPackToGeoMeta,
} from '@/lib/tools/tool-seo-geo';
import { isGeoReadySoft } from '@/lib/content-geo';

/**
 * SEO body content + GEO answer box + FAQ + HowTo + share.
 * Place below the interactive tool so crawlers and users both get substance.
 */
export function ToolSeoGeoSection({
  pack,
  compact = false,
}: {
  pack: ToolSeoGeoPack;
  compact?: boolean;
}) {
  const geo = toolPackToGeoMeta(pack);
  const geoOk = isGeoReadySoft(geo);
  const shareUrl = absoluteUrl(pack.path);

  return (
    <section
      className="space-y-5 border-t border-[color:var(--hairline)] pt-8"
      aria-label={`${pack.name} 说明与分享`}
      data-tool-seo={pack.slug}
      data-geo-ready={geoOk ? '1' : '0'}
    >
      <div className="rounded-xl border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4 md:p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
          直接回答 · GEO
        </p>
        <h2 className="mt-1 text-[17px] font-bold tracking-tight text-[color:var(--ink-1)] md:text-[19px]">
          {pack.name}是什么？
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-[color:var(--ink-3)] md:text-[14px]">
          {pack.answerSummary}
        </p>
        {pack.searchIntents.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {pack.searchIntents.slice(0, 6).map((intent) => (
              <li
                key={intent}
                className="rounded-full border border-[color:var(--hairline)] px-2.5 py-0.5 text-[11px] text-[color:var(--ink-4)]"
              >
                {intent}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {!compact && pack.howTo.length > 0 ? (
        <div>
          <h2 className="text-[15px] font-bold text-[color:var(--ink-1)]">如何使用</h2>
          <ol className="mt-2 space-y-2">
            {pack.howTo.map((step, i) => (
              <li
                key={step.step}
                className="flex gap-3 rounded-lg border border-[color:var(--hairline)]/80 bg-[color:var(--bg-sunken)]/30 px-3 py-2"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[color:var(--ink-1)] text-[11px] font-bold text-white">
                  {i + 1}
                </span>
                <div>
                  <div className="text-[13px] font-semibold text-[color:var(--ink-1)]">{step.step}</div>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-[color:var(--ink-4)]">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      {pack.faqs.length > 0 ? (
        <div>
          <h2 className="text-[15px] font-bold text-[color:var(--ink-1)]">常见问题</h2>
          <div className="mt-2 divide-y divide-[color:var(--hairline)] rounded-xl border border-[color:var(--hairline)]">
            {pack.faqs.map((faq) => (
              <details key={faq.question} className="group px-3 py-2.5">
                <summary className="cursor-pointer list-none text-[13px] font-semibold text-[color:var(--ink-1)] marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="flex items-start justify-between gap-2">
                    {faq.question}
                    <span className="text-[color:var(--ink-5)] group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="mt-1.5 text-[12px] leading-relaxed text-[color:var(--ink-4)]">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      ) : null}

      {pack.related.length > 0 ? (
        <div>
          <h2 className="text-[15px] font-bold text-[color:var(--ink-1)]">相关工具与内容</h2>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {pack.related.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block rounded-lg border border-[color:var(--hairline)] px-3 py-2.5 transition hover:bg-[color:var(--bg-sunken)]"
                >
                  <span className="text-[13px] font-semibold text-[color:var(--ink-1)]">{link.label}</span>
                  {link.description ? (
                    <span className="mt-0.5 block text-[11px] text-[color:var(--ink-5)]">
                      {link.description}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="rounded-xl border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)]/40 p-3 md:p-4">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--brand-strong)]">
          分享这个工具
        </p>
        <p className="mb-3 text-[12px] text-[color:var(--ink-4)]">
          复制链接或发到社交平台；结果页另有脱敏发文时请勿带出门牌隐私。
        </p>
        <SocialShareBar
          text={pack.shareText}
          url={shareUrl}
          title={pack.name}
          tone="light"
          compact={false}
          primaryLabel="分享本工具"
        />
      </div>

      {pack.disclaimer ? (
        <p className="text-[11px] leading-relaxed text-[color:var(--ink-5)]">{pack.disclaimer}</p>
      ) : null}

      {!compact && pack.entityKeywords.length > 0 ? (
        <p className="text-[10px] leading-relaxed text-[color:var(--ink-5)]">
          相关概念：{pack.entityKeywords.join(' · ')}
        </p>
      ) : null}
    </section>
  );
}

/** Server-only JSON-LD script tags for a tool pack */
export function ToolJsonLd({ pack }: { pack: ToolSeoGeoPack }) {
  const graph = buildToolJsonLdGraph(pack);
  return (
    <>
      {graph.map((node, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(node) }}
        />
      ))}
    </>
  );
}
