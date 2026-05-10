/**
 * GSC 客户端 — 用 service account 直接签 JWT 换 access_token，再调 webmasters v3 API。
 * 不依赖 googleapis SDK（90MB+），只用现有 jose。
 *
 * 配置（环境变量）：
 *   GSC_SERVICE_ACCOUNT_JSON  — service-account JSON（整段 base64 或裸 JSON 字符串）
 *   GSC_SITE_URL              — 'https://www.life-kline.com/' 或 'sc-domain:life-kline.com'
 */

import { SignJWT, importPKCS8 } from 'jose';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';

interface ServiceAccountKey {
  type: string;
  client_email: string;
  private_key: string;
  token_uri?: string;
}

function loadServiceAccountKey(): ServiceAccountKey {
  const raw = process.env.GSC_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error('GSC_SERVICE_ACCOUNT_JSON not set');
  }
  let json = raw.trim();
  if (!json.startsWith('{')) {
    json = Buffer.from(json, 'base64').toString('utf8');
  }
  const key = JSON.parse(json) as ServiceAccountKey;
  if (key.type !== 'service_account' || !key.client_email || !key.private_key) {
    throw new Error('GSC_SERVICE_ACCOUNT_JSON is not a valid service_account key');
  }
  return key;
}

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }
  const key = loadServiceAccountKey();
  const now = Math.floor(Date.now() / 1000);
  const privateKey = await importPKCS8(key.private_key, 'RS256');

  const jwt = await new SignJWT({ scope: SCOPE })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(key.client_email)
    .setSubject(key.client_email)
    .setAudience(key.token_uri || TOKEN_URL)
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(privateKey);

  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: jwt,
  });
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) {
    throw new Error(`GSC token exchange failed: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
  return json.access_token;
}

export interface GscQueryRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscQueryParams {
  startDate: string;
  endDate: string;
  dimensions?: ('query' | 'page' | 'country' | 'device' | 'date' | 'searchAppearance')[];
  rowLimit?: number;
  startRow?: number;
  type?: 'web' | 'image' | 'video' | 'news' | 'discover' | 'googleNews';
}

export async function queryGsc(params: GscQueryParams): Promise<GscQueryRow[]> {
  const siteUrl = process.env.GSC_SITE_URL;
  if (!siteUrl) {
    throw new Error('GSC_SITE_URL not set (e.g. https://www.life-kline.com/ or sc-domain:life-kline.com)');
  }
  const token = await getAccessToken();
  const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;

  const all: GscQueryRow[] = [];
  let startRow = params.startRow ?? 0;
  const pageSize = Math.min(params.rowLimit ?? 25000, 25000);

  while (true) {
    const body = {
      startDate: params.startDate,
      endDate: params.endDate,
      dimensions: params.dimensions ?? ['query'],
      rowLimit: pageSize,
      startRow,
      type: params.type,
    };
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(`GSC query failed: ${res.status} ${await res.text()}`);
    }
    const json = (await res.json()) as { rows?: GscQueryRow[] };
    const rows = json.rows ?? [];
    all.push(...rows);
    if (rows.length < pageSize) break;
    startRow += rows.length;
    if (params.rowLimit && all.length >= params.rowLimit) break;
  }
  return all;
}
