import type { FastifyReply, FastifyRequest } from 'fastify';
import { verifyToken } from '../utils/jwt';

declare module 'fastify' {
  interface FastifyRequest {
    user?: { userId: string; email: string };
  }
}

/** Pre-handler: require a valid Bearer JWT. */
export async function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const header = request.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;

  if (!token) {
    await reply.code(401).send({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Missing authorization token.' },
    });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    await reply.code(401).send({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token.' },
    });
    return;
  }

  request.user = { userId: payload.userId, email: payload.email };
}
