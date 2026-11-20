import type { FastifyInstance, FastifyRequest } from 'fastify';
import { calculateNumerology } from '../services/numerology.service';
import { requireAuth } from '../middleware/auth';
import { getNumerologyByUser, saveNumerology } from '../lib/supabase';
import type { CalculateNumerologyInput } from '@zorvax/shared';

function userIdOf(req: FastifyRequest): string {
  if (!req.user) throw new Error('unreachable: requireAuth did not set user');
  return req.user.userId;
}

export async function numerologyRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: CalculateNumerologyInput }>(
    '/numerology/calculate',
    { preHandler: requireAuth },
    async (request, reply) => {
      const reading = calculateNumerology(request.body, userIdOf(request));
      await saveNumerology(reading);
      return reply.code(201).send({ success: true, data: reading });
    }
  );

  app.get('/numerology/me', { preHandler: requireAuth }, async (request, reply) => {
    const reading = await getNumerologyByUser(userIdOf(request));
    return reply.send({ success: true, data: reading });
  });
}
