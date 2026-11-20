import type { FastifyInstance, FastifyRequest } from 'fastify';
import { getProfile, updateProfile } from '../services/user.service';
import { requireAuth } from '../middleware/auth';
import type { UpdateProfileInput } from '@zorvax/shared';

function userIdOf(req: FastifyRequest): string {
  if (!req.user) throw new Error('unreachable: requireAuth did not set user');
  return req.user.userId;
}

export async function userRoutes(app: FastifyInstance): Promise<void> {
  app.get('/user/me', { preHandler: requireAuth }, async (request, reply) => {
    const profile = await getProfile(userIdOf(request));
    return reply.send({ success: true, data: profile });
  });

  app.patch<{ Body: UpdateProfileInput }>('/user/profile', { preHandler: requireAuth }, async (request, reply) => {
    const profile = await updateProfile(userIdOf(request), request.body);
    return reply.send({ success: true, data: profile });
  });
}
