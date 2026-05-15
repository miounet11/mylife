jest.mock('@/lib/auth', () => ({
  getAuthSession: jest.fn(),
}));

jest.mock('@/lib/content-generation-jobs', () => ({
  enqueueContentGenerationJob: jest.fn(),
  getContentGenerationJob: jest.fn(),
}));

import { GET, POST } from '@/app/api/admin/content/generate/route';
import { getAuthSession } from '@/lib/auth';
import { enqueueContentGenerationJob, getContentGenerationJob } from '@/lib/content-generation-jobs';

const mockedGetAuthSession = getAuthSession as jest.MockedFunction<typeof getAuthSession>;
const mockedEnqueueContentGenerationJob = enqueueContentGenerationJob as jest.MockedFunction<typeof enqueueContentGenerationJob>;
const mockedGetContentGenerationJob = getContentGenerationJob as jest.MockedFunction<typeof getContentGenerationJob>;

describe('admin content generate route', () => {
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
    jest.clearAllMocks();
  });

  it('queues asynchronous content generation jobs', async () => {
    mockedEnqueueContentGenerationJob.mockReturnValue({
      id: 'content_job_1',
      userId: 'admin_test_user',
      status: 'pending',
      request: { topic: '测试主题' },
      result: {},
      generatedCount: 0,
      llmSucceededCount: 0,
      fallbackCount: 0,
      attempts: 0,
      maxAttempts: 3,
      nextRunAt: '2026-03-16T02:00:00.000Z',
      meta: { trigger: 'admin-api' },
      createdAt: '2026-03-16T02:00:00.000Z',
      updatedAt: '2026-03-16T02:00:00.000Z',
    });

    const response = await POST(new Request('http://localhost/api/admin/content/generate', {
      method: 'POST',
      body: JSON.stringify({
        topic: '测试主题',
        contentType: 'knowledge',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    }) as any);
    const payload = await response.json();

    expect(response.status).toBe(202);
    expect(payload.success).toBe(true);
    expect(payload.async).toBe(true);
    expect(payload.job.id).toBe('content_job_1');
    expect(mockedEnqueueContentGenerationJob).toHaveBeenCalledTimes(1);
  });

  it('returns job status for polling', async () => {
    mockedGetContentGenerationJob.mockReturnValue({
      id: 'content_job_2',
      userId: 'admin_test_user',
      status: 'completed',
      request: { topic: '测试主题' },
      result: {
        entries: [
          {
            id: 'entry_1',
            title: '已完成内容',
          },
        ],
      },
      generatedCount: 1,
      llmSucceededCount: 1,
      fallbackCount: 0,
      attempts: 1,
      maxAttempts: 3,
      meta: {},
      createdAt: '2026-03-16T02:00:00.000Z',
      updatedAt: '2026-03-16T02:02:00.000Z',
    });

    const response = await GET(new Request('http://localhost/api/admin/content/generate?jobId=content_job_2') as any);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.job.status).toBe('completed');
    expect(payload.job.entries).toHaveLength(1);
  });

  it('rejects unauthorized requests', async () => {
    mockedGetAuthSession.mockResolvedValueOnce({
      authenticated: false,
      user: null,
    });

    const response = await POST(new Request('http://localhost/api/admin/content/generate', {
      method: 'POST',
      body: JSON.stringify({ topic: '测试主题' }),
      headers: {
        'Content-Type': 'application/json',
      },
    }) as any);
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.success).toBe(false);
    expect(mockedEnqueueContentGenerationJob).not.toHaveBeenCalled();
  });
});
