import type { FastifyInstance, FastifyRequest } from 'fastify';
import { chatLyra, streamLyraResponse, type LyraChatOptions } from '../ai/lyra.service';
import { AppError, Errors } from '../services/errors';
import { requireAuth } from '../middleware/auth';
import { getChartById } from '../lib/supabase';
import { getNumerologyByUser } from '../lib/supabase';
import type { Chart } from '@zorvax/shared';

function userIdOf(req: FastifyRequest): string {
  if (!req.user) throw new Error('unreachable: requireAuth did not set user');
  return req.user.userId;
}

async function ownedChart(chartId: string, userId: string): Promise<Chart> {
  const chart = await getChartById(chartId);
  if (!chart || chart.userId !== userId) throw Errors.chartNotFound();
  return chart;
}

interface LyraChatBody {
  userMessage: string;
  chartId: string;
  locale?: string;
  mode?: LyraChatOptions['mode'];
}

export async function lyraRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: LyraChatBody }>('/lyra/chat', { preHandler: requireAuth }, async (request, reply) => {
    const { userMessage, chartId, locale, mode } = request.body;
    if (!userMessage || !userMessage.trim()) {
      throw new AppError('EMPTY_MESSAGE', 'userMessage is required.', 400);
    }
    const userId = userIdOf(request);
    const chart = await ownedChart(chartId, userId);
    const numerology = (await getNumerologyByUser(userId)) ?? undefined;
    const response = await chatLyra(chart, userMessage.trim(), { locale, mode, numerology });
    return reply.send({
      success: true,
      data: {
        text: response.text,
        provider: response.provider,
        cached: response.cached,
        tokens: response.tokens,
      },
    });
  });

  // Server-sent events stream.
  app.post<{ Body: LyraChatBody }>('/lyra/stream', { preHandler: requireAuth }, async (request, reply) => {
    const { userMessage, chartId, locale, mode } = request.body;
    if (!userMessage || !userMessage.trim()) {
      throw new AppError('EMPTY_MESSAGE', 'userMessage is required.', 400);
    }
    const userId = userIdOf(request);
    const chart = await ownedChart(chartId, userId);
    const numerology = (await getNumerologyByUser(userId)) ?? undefined;

    reply.hijack();
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    try {
      for await (const chunk of streamLyraResponse(chart, userMessage.trim(), { locale, mode, numerology })) {
        reply.raw.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }
      reply.raw.write('data: "[DONE]"\n\n');
    } catch (err) {
      reply.raw.write(`data: ${JSON.stringify('[stream error]')}\n\n`);
      app.log.error(err);
    }
    reply.raw.end();
  });
}
