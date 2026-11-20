import type { FastifyInstance, FastifyRequest } from 'fastify';
import { login, refresh, signup } from '../services/auth.service';
import { requireAuth } from '../middleware/auth';
import type { LoginInput, SignupInput } from '@zorvax/shared';

function authed(req: FastifyRequest): { userId: string; email: string } {
  const user = req.user;
  if (!user) throw new Error('unreachable: requireAuth did not set user');
  return user;
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: SignupInput }>('/auth/signup', async (request, reply) => {
    const result = await signup(request.body);
    return reply.code(201).send({ success: true, data: result });
  });

  app.post<{ Body: LoginInput }>('/auth/login', async (request, reply) => {
    const result = await login(request.body);
    return reply.send({ success: true, data: result });
  });

  app.post('/auth/refresh', { preHandler: requireAuth }, async (request, reply) => {
    const { userId, email } = authed(request);
    const result = await refresh(userId, email);
    return reply.send({ success: true, data: result });
  });
}
