import type { FastifyInstance, FastifyRequest } from 'fastify';
import { calculateChart, compatibility } from '../services/chart.service';
import { Errors } from '../services/errors';
import { requireAuth } from '../middleware/auth';
import { createChart, getChartById } from '../lib/supabase';
import type { CalculateChartInput, Chart } from '@zorvax/shared';

function userIdOf(req: FastifyRequest): string {
  if (!req.user) throw new Error('unreachable: requireAuth did not set user');
  return req.user.userId;
}

/**
 * Tiny in-memory rate limit for the public calculator: 30 requests per IP
 * per minute. Public by design, so it must not let one client hammer the
 * endpoint. Test-only reset exported for isolation (same pattern as the
 * in-memory Supabase store).
 */
const PUBLIC_WINDOW_MS = 60_000;
const PUBLIC_MAX_REQUESTS = 30;
const publicHits = new Map<string, { count: number; resetAt: number }>();

export function __resetPublicChartRateLimit(): void {
  publicHits.clear();
}

function checkPublicRateLimit(ip: string): void {
  const now = Date.now();
  const entry = publicHits.get(ip);
  if (!entry || now >= entry.resetAt) {
    publicHits.set(ip, { count: 1, resetAt: now + PUBLIC_WINDOW_MS });
    return;
  }
  entry.count += 1;
  if (entry.count > PUBLIC_MAX_REQUESTS) throw Errors.rateLimited();
}

async function ownedChart(chartId: string, userId: string): Promise<Chart> {
  const chart = await getChartById(chartId);
  if (!chart || chart.userId !== userId) throw Errors.chartNotFound();
  return chart;
}

export async function chartRoutes(app: FastifyInstance): Promise<void> {
  /**
   * Public birth-chart calculator for the SEO landing page. No auth, no
   * database save (userId is the constant 'public'), IP rate-limited.
   * The page at /birth-chart-calculator calls this from the browser.
   */
  app.post<{ Body: CalculateChartInput }>(
    '/chart/calculate-public',
    async (request, reply) => {
      checkPublicRateLimit(request.ip);
      const chart = calculateChart(request.body, 'public');
      return reply.send({ success: true, data: chart });
    }
  );

  app.post<{ Body: CalculateChartInput }>(
    '/chart/calculate',
    { preHandler: requireAuth },
    async (request, reply) => {
      const chart = calculateChart(request.body, userIdOf(request));
      await createChart(chart);
      return reply.code(201).send({ success: true, data: chart });
    }
  );

  app.get<{ Params: { id: string } }>(
    '/chart/:id',
    { preHandler: requireAuth },
    async (request, reply) => {
      const chart = await ownedChart(request.params.id, userIdOf(request));
      return reply.send({ success: true, data: chart });
    }
  );

  app.post<{ Body: { personA: CalculateChartInput; personB: CalculateChartInput } }>(
    '/chart/compatibility',
    { preHandler: requireAuth },
    async (request, reply) => {
      const userId = userIdOf(request);
      const chartA = calculateChart(request.body.personA, userId);
      const chartB = calculateChart(request.body.personB, userId);
      const result = compatibility(chartA, chartB);
      return reply.send({ success: true, data: result });
    }
  );
}
