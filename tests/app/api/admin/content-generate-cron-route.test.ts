jest.mock('@/lib/content-generation-jobs', () => ({
  processContentGenerationJobBatch: jest.fn(),
}));

import { POST } from '@/app/api/admin/content/generate/cron/route';
import { processContentGenerationJobBatch } from '@/lib/content-generation-jobs';

const mockedProcessContentGenerationJobBatch = processContentGenerationJobBatch as jest.MockedFunction<typeof processContentGenerationJobBatch>;

describe('POST /api/admin/content/generate/cron', () => {
  const originalToken = process.env.CONTENT_GENERATION_CRON_TOKEN;

  beforeEach(() => {
    process.env.CONTENT_GENERATION_CRON_TOKEN = 'content-token';
  });

  afterEach(() => {
    jest.clearAllMocks();
    process.env.CONTENT_GENERATION_CRON_TOKEN = originalToken;
  });

  it('processes queued jobs with the cron token', async () => {
    mockedProcessContentGenerationJobBatch.mockResolvedValue({
      processed: true,
      processedCount: 1,
      reason: 'completed',
      jobs: [{ processed: true, status: 'completed', jobId: 'content_job_1' }],
    });

    const response = await POST(new Request('http://localhost/api/admin/content/generate/cron', {
      method: 'POST',
      headers: {
        'x-content-generation-cron-token': 'content-token',
      },
    }) as any);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.processedCount).toBe(1);
    expect(mockedProcessContentGenerationJobBatch).toHaveBeenCalledTimes(1);
  });

  it('rejects invalid cron tokens', async () => {
    const response = await POST(new Request('http://localhost/api/admin/content/generate/cron', {
      method: 'POST',
    }) as any);
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.success).toBe(false);
    expect(mockedProcessContentGenerationJobBatch).not.toHaveBeenCalled();
  });
});
