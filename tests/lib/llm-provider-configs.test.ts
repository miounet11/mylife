import { describe, expect, test } from '@jest/globals';
import { db } from '@/lib/database';
import {
  deleteLlmProviderConfig,
  listMaskedLlmProviderConfigs,
  normalizeProviderBaseUrl,
  resolveRuntimeLlmProviders,
  saveLlmProviderConfig,
} from '@/lib/llm-provider-configs';

describe('llm provider configs', () => {
  const ids = [
    'test_llm_provider_image_primary',
    'test_llm_provider_image_fallback',
    'test_llm_provider_article_primary',
  ];

  afterEach(() => {
    ids.forEach((id) => deleteLlmProviderConfig(id));
  });

  test('normalizes OpenAI-compatible chat completion URLs to base /v1 URLs', () => {
    expect(normalizeProviderBaseUrl('https://ttqq.inping.com/')).toBe('https://ttqq.inping.com/v1');
    expect(normalizeProviderBaseUrl('https://ttqq.inping.com/v1/chat/completions')).toBe('https://ttqq.inping.com/v1');
    expect(normalizeProviderBaseUrl('https://ttqq.inping.com/v1')).toBe('https://ttqq.inping.com/v1');
  });

  test('orders runtime providers by purpose and priority without exposing raw keys in masked output', () => {
    saveLlmProviderConfig({
      id: ids[0],
      purpose: 'image',
      name: 'primary image',
      baseUrl: 'https://ttqq.inping.com/',
      model: 'gpt-image-2-my',
      apiKey: 'sk-primary-image-key',
      priority: 1,
      enabled: true,
    }, 'test_user');

    saveLlmProviderConfig({
      id: ids[1],
      purpose: 'image',
      name: 'fallback image',
      baseUrl: 'https://www.gemiai.top/v1/chat/completions',
      model: 'gpt-image-2',
      apiKey: 'sk-fallback-image-key',
      priority: 2,
      enabled: true,
    }, 'test_user');

    saveLlmProviderConfig({
      id: ids[2],
      purpose: 'article',
      name: 'article primary',
      baseUrl: 'https://ttqq.inping.com/v1',
      model: 'grok-420-fast',
      apiKey: 'sk-article-key',
      priority: 10,
      enabled: true,
    }, 'test_user');

    const imageProviders = resolveRuntimeLlmProviders('image');
    expect(imageProviders[0]).toEqual(expect.objectContaining({
      id: ids[0],
      baseUrl: 'https://ttqq.inping.com/v1',
      model: 'gpt-image-2-my',
      source: 'admin',
    }));
    expect(imageProviders[1]).toEqual(expect.objectContaining({
      id: ids[1],
      baseUrl: 'https://www.gemiai.top/v1',
      model: 'gpt-image-2',
      source: 'admin',
    }));

    const masked = listMaskedLlmProviderConfigs().filter((provider) => ids.includes(provider.id));
    expect(JSON.stringify(masked)).not.toContain('sk-primary-image-key');
    expect(masked.find((provider) => provider.id === ids[0])?.apiKeyMasked).toContain('sk-pri');
  });

  test('preserves existing key when updating a provider with an empty key field', () => {
    saveLlmProviderConfig({
      id: ids[0],
      purpose: 'image',
      name: 'primary image',
      baseUrl: 'https://ttqq.inping.com/v1',
      model: 'gpt-image-2-my',
      apiKey: 'sk-preserved-key',
      priority: 10,
      enabled: true,
    }, 'test_user');

    saveLlmProviderConfig({
      id: ids[0],
      purpose: 'image',
      name: 'primary image renamed',
      baseUrl: 'https://ttqq.inping.com/v1',
      model: 'gpt-image-2-my',
      priority: 5,
      enabled: true,
    }, 'test_user');

    const row = db.prepare(`SELECT api_key FROM llm_provider_configs WHERE id = ?`).get(ids[0]) as { api_key: string };
    expect(row.api_key).toBe('sk-preserved-key');
  });
});
