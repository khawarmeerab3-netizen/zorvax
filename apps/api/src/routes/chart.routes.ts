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

async function ownedChart(chartId: string, userId: string): Promise<Chart> {
  const chart = await getChartById(chartId);
  if (!chart || chart.userId !== userId) throw Errors.chartNotFound();
  return chart;
}

export async function chartRoutes(app: FastifyInstance): Promise<void> {
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
