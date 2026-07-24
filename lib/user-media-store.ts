/**
 * 用户上传媒体：本机 public/uploads + 可选 R2（rclone / S3 兼容）
 * 路径约定：user-media/{userId}/{kind}/{id}.{ext}
 * 后续 SEO 可生成 line_art 变体挂同一 mediaId
 */

import { createHash, randomBytes } from 'crypto';
import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { spawnSync } from 'child_process';

export type UserMediaKind = 'face' | 'palm' | 'line_art' | 'other';

export type SavedUserMedia = {
  id: string;
  userId: string;
  kind: UserMediaKind;
  /** 站内可访问路径 */
  publicPath: string;
  /** 绝对 URL（相对站内） */
  publicUrl: string;
  /** R2 object key（若上传成功） */
  r2Key: string | null;
  mime: string;
  bytes: number;
  sha256: string;
  createdAt: string;
  localAbsPath: string;
};

function extFromMime(mime: string): string {
  if (mime.includes('png')) return 'png';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('gif')) return 'gif';
  return 'jpg';
}

export function parseImageDataUrl(value: unknown, maxBytes = 6 * 1024 * 1024): {
  mime: string;
  buffer: Buffer;
  dataUrl: string;
} | null {
  const dataUrl = typeof value === 'string' ? value.trim() : '';
  const match = dataUrl.match(
    /^data:(image\/(?:png|jpe?g|webp|gif));base64,([A-Za-z0-9+/=\s]+)$/i,
  );
  if (!match) return null;
  const mime = match[1].toLowerCase().replace('image/jpg', 'image/jpeg');
  const payload = match[2].replace(/\s/g, '');
  let buffer: Buffer;
  try {
    buffer = Buffer.from(payload, 'base64');
  } catch {
    return null;
  }
  if (buffer.length <= 0 || buffer.length > maxBytes) return null;
  return {
    mime,
    buffer,
    dataUrl: `data:${mime};base64,${payload}`,
  };
}

function loadR2Env(): {
  bucket: string;
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  prefix: string;
} | null {
  try {
    // Prefer process env (PM2 / .env.local may inject)
    const bucket = process.env.R2_BUCKET || process.env.USER_MEDIA_R2_BUCKET || '';
    const endpoint = process.env.R2_ENDPOINT || process.env.USER_MEDIA_R2_ENDPOINT || '';
    const accessKeyId =
      process.env.R2_ACCESS_KEY_ID || process.env.USER_MEDIA_R2_ACCESS_KEY_ID || '';
    const secretAccessKey =
      process.env.R2_SECRET_ACCESS_KEY || process.env.USER_MEDIA_R2_SECRET_ACCESS_KEY || '';
    if (!bucket || !endpoint || !accessKeyId || !secretAccessKey) {
      // try secrets file on production
      const secretPath =
        process.env.R2_BACKUP_ENV_FILE ||
        join(process.cwd(), '.secrets', 'r2-backup.env');
      if (existsSync(secretPath)) {
        const text = require('fs').readFileSync(secretPath, 'utf8') as string;
        const map: Record<string, string> = {};
        for (const line of text.split('\n')) {
          const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
          if (m) map[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
        }
        if (map.R2_BUCKET && map.R2_ENDPOINT && map.R2_ACCESS_KEY_ID && map.R2_SECRET_ACCESS_KEY) {
          return {
            bucket: map.R2_BUCKET,
            endpoint: map.R2_ENDPOINT,
            accessKeyId: map.R2_ACCESS_KEY_ID,
            secretAccessKey: map.R2_SECRET_ACCESS_KEY,
            prefix: `user-media`,
          };
        }
      }
      return null;
    }
    return { bucket, endpoint, accessKeyId, secretAccessKey, prefix: 'user-media' };
  } catch {
    return null;
  }
}

function tryRcloneUpload(localPath: string, r2Key: string, env: NonNullable<ReturnType<typeof loadR2Env>>): boolean {
  try {
    // rclone remote-less S3 flags (same as backup scripts)
    const args = [
      'copyto',
      localPath,
      `:s3:${env.bucket}/${r2Key}`,
      '--s3-provider',
      'Cloudflare',
      '--s3-access-key-id',
      env.accessKeyId,
      '--s3-secret-access-key',
      env.secretAccessKey,
      '--s3-endpoint',
      env.endpoint,
      '--s3-no-check-bucket',
      '--quiet',
    ];
    const r = spawnSync('rclone', args, { timeout: 60_000, encoding: 'utf8' });
    return r.status === 0;
  } catch {
    return false;
  }
}

/**
 * 保存用户上传图：本地 public + 尽力同步 R2
 */
export function saveUserMedia(input: {
  userId: string;
  kind: UserMediaKind;
  buffer: Buffer;
  mime: string;
  /** 关联 session / 用途 */
  purpose?: string;
}): SavedUserMedia {
  const userId = (input.userId || 'anon').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
  const id = `um_${Date.now().toString(36)}_${randomBytes(4).toString('hex')}`;
  const ext = extFromMime(input.mime);
  const sha256 = createHash('sha256').update(input.buffer).digest('hex');
  const relDir = join('uploads', 'user-media', userId, input.kind);
  const publicDir = join(process.cwd(), 'public', relDir);
  mkdirSync(publicDir, { recursive: true });
  const filename = `${id}.${ext}`;
  const localAbsPath = join(publicDir, filename);
  writeFileSync(localAbsPath, input.buffer);

  const publicPath = `/${relDir.replace(/\\/g, '/')}/${filename}`;
  const r2KeyBase = `user-media/${userId}/${input.kind}/${filename}`;
  let r2Key: string | null = null;
  const r2 = loadR2Env();
  if (r2) {
    const ok = tryRcloneUpload(localAbsPath, r2KeyBase, r2);
    if (ok) r2Key = r2KeyBase;
  }

  // side-car meta for later SEO line-art jobs
  try {
    writeFileSync(
      join(publicDir, `${id}.json`),
      JSON.stringify(
        {
          id,
          userId,
          kind: input.kind,
          publicPath,
          r2Key,
          mime: input.mime,
          bytes: input.buffer.length,
          sha256,
          purpose: input.purpose || null,
          createdAt: new Date().toISOString(),
          lineArtStatus: 'pending',
        },
        null,
        2,
      ),
    );
  } catch {
    // ignore
  }

  return {
    id,
    userId,
    kind: input.kind,
    publicPath,
    publicUrl: publicPath,
    r2Key,
    mime: input.mime,
    bytes: input.buffer.length,
    sha256,
    createdAt: new Date().toISOString(),
    localAbsPath,
  };
}
