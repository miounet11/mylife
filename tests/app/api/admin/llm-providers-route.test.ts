jest.mock('@/lib/auth', () => ({
  getAuthSession: jest.fn(),
}));

import { DELETE, GET, POST } from '@/app/api/admin/llm-providers/route';
import { getAuthSession } from '@/lib/auth';
import { deleteLlmProviderConfig } from '@/lib/llm-provider-configs';

const mockedGetAuthSession = getAuthSession as jest.MockedFunction<typeof getAuthSession>;

describe('admin llm providers route', () => {
  const id = 'test_route_llm_provider';

  beforeEach(() => {
    mockedGetAuthSession.mockResolvedValue({
      authenticated: true,
      user: {
        id: 'admin_test_user',
        name: 'Admin Test',
        email: 'admin@example.com',
        role: 'admin',
        emailVerified: true,
      },
    });
  });

  afterEach(() => {
    deleteLlmProviderConfig(id);
    jest.clearAllMocks();
  });

  it('saves and lists masked llm provider configs', async () => {
    const response = await POST(new Request('http://localhost/api/admin/llm-providers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        purpose: 'image',
        name: 'route image',
        baseUrl: 'https://ttqq.inping.com/v1/chat/completions',
        model: 'gpt-image-2-my',
        apiKey: 'sk-route-secret-key',
        priority: 10,
        enabled: true,
      }),
    }) as any);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(JSON.stringify(payload)).not.toContain('sk-route-secret-key');

    const listResponse = await GET();
    const listPayload = await listResponse.json();
    const saved = listPayload.providers.find((provider: { id: string }) => provider.id === id);

    expect(saved).toBeTruthy();
    expect(saved.apiKeyMasked).toContain('sk-rou');
    expect(JSON.stringify(saved)).not.toContain('sk-route-secret-key');
  });

  it('rejects unauthorized requests', async () => {
    mockedGetAuthSession.mockResolvedValueOnce({
      authenticated: false,
      user: null,
    });

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.success).toBe(false);
  });

  it('deletes provider configs', async () => {
    await POST(new Request('http://localhost/api/admin/llm-providers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        purpose: 'article',
        name: 'route article',
        baseUrl: 'https://ttqq.inping.com/v1',
        model: 'grok-420-fast',
        apiKey: 'sk-route-secret-key',
        priority: 10,
        enabled: true,
      }),
    }) as any);

    const response = await DELETE(new Request('http://localhost/api/admin/llm-providers', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }) as any);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
  });
});
