'use client';

/**
 * Applies locale to already-rendered DOM:
 * - zh-Hant: Simplified → Traditional via chinese-conv
 * - en: replace known UI phrases; leave long-form Chinese mostly as-is
 *
 * Skips script/style/input/textarea/code and elements with data-no-i18n.
 */

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useLocale } from '@/components/i18n/locale-provider';
import { buildEnglishPhraseMap } from '@/lib/i18n/ui-messages';

const SKIP_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'NOSCRIPT',
  'CODE',
  'PRE',
  'TEXTAREA',
  'INPUT',
  'SELECT',
  'OPTION',
  'SVG',
  'MATH',
]);

function shouldSkip(node: Node): boolean {
  let el: Element | null =
    node.nodeType === Node.ELEMENT_NODE
      ? (node as Element)
      : node.parentElement;
  while (el) {
    if (SKIP_TAGS.has(el.tagName)) return true;
    if (el.getAttribute('data-no-i18n') === 'true' || el.getAttribute('data-no-i18n') === '') {
      return true;
    }
    if (el.isContentEditable) return true;
    el = el.parentElement;
  }
  return false;
}

function walkTextNodes(root: Node, visit: (node: Text) => void) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      if (shouldSkip(node)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const list: Text[] = [];
  let current = walker.nextNode();
  while (current) {
    list.push(current as Text);
    current = walker.nextNode();
  }
  list.forEach(visit);
}

export default function AutoLocalize() {
  const { locale } = useLocale();
  const pathname = usePathname();
  const appliedRef = useRef<string>('');

  useEffect(() => {
    const key = `${locale}::${pathname}`;
    if (appliedRef.current === key) return;
    // allow re-run when locale or route changes
    appliedRef.current = key;

    let cancelled = false;

    const run = async () => {
      const root = document.body;
      if (!root) return;

      if (locale === 'zh-CN') {
        // Source language — no conversion needed
        return;
      }

      if (locale === 'zh-Hant') {
        let tify: ((s: string) => string) | null = null;
        try {
          const mod = await import('chinese-conv');
          tify =
            (mod as { tify?: (s: string) => string }).tify
            || (mod as { default?: { tify?: (s: string) => string } }).default?.tify
            || null;
        } catch {
          tify = null;
        }
        if (!tify || cancelled) return;

        walkTextNodes(root, (node) => {
          const raw = node.nodeValue || '';
          // only convert if contains CJK
          if (!/[\u4e00-\u9fff]/.test(raw)) return;
          const next = tify!(raw);
          if (next !== raw) node.nodeValue = next;
        });

        // placeholders / titles / aria-labels
        root.querySelectorAll<HTMLElement>('[placeholder],[title],[aria-label]').forEach((el) => {
          if (shouldSkip(el)) return;
          for (const attr of ['placeholder', 'title', 'aria-label'] as const) {
            const v = el.getAttribute(attr);
            if (v && /[\u4e00-\u9fff]/.test(v)) {
              const next = tify!(v);
              if (next !== v) el.setAttribute(attr, next);
            }
          }
        });
        return;
      }

      // English: phrase-level UI replacements
      const phrases = buildEnglishPhraseMap();
      walkTextNodes(root, (node) => {
        let text = node.nodeValue || '';
        if (!/[\u4e00-\u9fff]/.test(text)) return;
        let changed = false;
        for (const [from, to] of phrases) {
          if (text.includes(from)) {
            text = text.split(from).join(to);
            changed = true;
          }
        }
        if (changed) node.nodeValue = text;
      });

      root.querySelectorAll<HTMLElement>('[placeholder],[title],[aria-label]').forEach((el) => {
        if (shouldSkip(el)) return;
        for (const attr of ['placeholder', 'title', 'aria-label'] as const) {
          let v = el.getAttribute(attr);
          if (!v || !/[\u4e00-\u9fff]/.test(v)) continue;
          for (const [from, to] of phrases) {
            if (v.includes(from)) v = v.split(from).join(to);
          }
          el.setAttribute(attr, v);
        }
      });
    };

    // Defer slightly so client hydration finishes first
    const timer = window.setTimeout(() => {
      void run();
    }, 40);

    // Observe late-mounted content (chat panels, etc.)
    const observer = new MutationObserver(() => {
      if (cancelled) return;
      window.clearTimeout((observer as unknown as { _t?: number })._t);
      (observer as unknown as { _t?: number })._t = window.setTimeout(() => {
        void run();
      }, 120);
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: false });

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, [locale, pathname]);

  return null;
}
