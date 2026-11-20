import { beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/index';
import { __resetPublicChartRateLimit } from '../src/routes/chart.routes';

process.env.NODE_ENV = 'test';

beforeEach(() => {
  __resetPublicChartRateLimit();
});

describe('POST /chart/calculate-public', () => {
  it('calculates a chart without any auth', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/chart/calculate-public',
      payload: { birthDate: '1992-04-17', birthTime: '06:30' },
    });
    expect(res.statusCode).toBe(200);
    const json = res.json() as {
      success: boolean;
      data: { sunSign: string; userId: string; planets: unknown[] };
    };
    expect(json.success).toBe(true);
    expect(json.data.sunSign).toBe('Aries');
    expect(json.data.userId).toBe('public');
    expect(json.data.planets).toHaveLength(10);
    await app.close();
  });

  it('rejects an invalid birth date with 400', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/chart/calculate-public',
      payload: { birthDate: 'not-a-date' },
    });
    expect(res.statusCode).toBe(400);
    await app.close();
  });

  it('rate-limits after 30 requests per minute from one IP', async () => {
    const app = await buildApp();
    let lastStatus = 0;
    for (let i = 0; i < 31; i++) {
      const res = await app.inject({
        method: 'POST',
        url: '/chart/calculate-public',
        payload: { birthDate: '1992-04-17' },
      });
      lastStatus = res.statusCode;
    }
    expect(lastStatus).toBe(429);
    await app.close();
  });
});
