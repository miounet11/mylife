#!/usr/bin/env node

const fs = require('fs');
const http = require('http');
const https = require('https');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const EXPECTED_TOOL_COUNT = Number(process.env.EXPECTED_TOOL_COUNT || 120);
const DOC_PATH = process.env.TOOL_DOC_PATH || 'docs/tool-center-120-catalog.md';

function request(pathOrUrl) {
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${BASE_URL}${pathOrUrl}`;
  const client = url.startsWith('https') ? https : http;
  return new Promise((resolve, reject) => {
    client
      .get(url, (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          resolve({
            status: res.statusCode || 0,
            body,
            headers: res.headers,
            url,
          });
        });
      })
      .on('error', reject);
  });
}

function extractDocToolSlugs(text) {
  const matches = text.matchAll(/https:\/\/www\.life-kline\.com\/tools\/([a-z0-9-]+)/g);
  return Array.from(new Set(Array.from(matches, (item) => item[1])));
}

async function verify() {
  const failures = [];
  const summary = [];

  const catalogRes = await request('/api/tools/catalog');
  if (catalogRes.status !== 200) {
    throw new Error(`Catalog endpoint failed: ${catalogRes.status}`);
  }

  const catalog = JSON.parse(catalogRes.body);
  const tools = catalog?.data?.tools || [];
  const toolSlugs = tools.map((item) => item.slug).filter(Boolean);

  summary.push(`catalog tools=${toolSlugs.length}`);
  if (toolSlugs.length !== EXPECTED_TOOL_COUNT) {
    failures.push(
      `Expected ${EXPECTED_TOOL_COUNT} tools, got ${toolSlugs.length}`,
    );
  }

  for (const slug of toolSlugs) {
    const res = await request(`/tools/${slug}`);
    if (res.status !== 200) {
      failures.push(`/tools/${slug} -> ${res.status}`);
    }
  }
  summary.push(`tool pages checked=${toolSlugs.length}`);

  const homeRes = await request('/');
  if (homeRes.status !== 200) {
    failures.push(`Homepage status ${homeRes.status}`);
  } else {
    const hrefMatches = homeRes.body.matchAll(/href="(\/[^"]*)"/g);
    const links = Array.from(
      new Set(
        Array.from(hrefMatches, (item) => item[1]).filter(
          (href) =>
            href &&
            !href.startsWith('/_next') &&
            !href.startsWith('/api') &&
            !href.startsWith('/?') &&
            !href.includes('#'),
        ),
      ),
    );

    for (const href of links) {
      const res = await request(href);
      if (res.status >= 400) {
        failures.push(`Home link ${href} -> ${res.status}`);
      }
    }
    summary.push(`homepage links checked=${links.length}`);
  }

  if (!fs.existsSync(DOC_PATH)) {
    failures.push(`Missing tool doc: ${DOC_PATH}`);
  } else {
    const text = fs.readFileSync(DOC_PATH, 'utf8');
    const docSlugs = extractDocToolSlugs(text);
    summary.push(`doc tools=${docSlugs.length}`);

    if (docSlugs.length !== EXPECTED_TOOL_COUNT) {
      failures.push(
        `Doc ${DOC_PATH} expected ${EXPECTED_TOOL_COUNT} tools, got ${docSlugs.length}`,
      );
    }

    const missingInDoc = toolSlugs.filter((slug) => !docSlugs.includes(slug));
    const missingInCatalog = docSlugs.filter((slug) => !toolSlugs.includes(slug));
    if (missingInDoc.length > 0) {
      failures.push(`Missing in doc (${missingInDoc.length}): ${missingInDoc.join(', ')}`);
    }
    if (missingInCatalog.length > 0) {
      failures.push(`Missing in catalog (${missingInCatalog.length}): ${missingInCatalog.join(', ')}`);
    }
  }

  return { failures, summary };
}

verify()
  .then(({ failures, summary }) => {
    summary.forEach((line) => console.log(`[summary] ${line}`));
    if (failures.length > 0) {
      failures.forEach((line) => console.error(`[failed] ${line}`));
      process.exit(1);
    }
    console.log('[ok] runtime verification passed');
  })
  .catch((error) => {
    console.error('[error] runtime verification failed');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
