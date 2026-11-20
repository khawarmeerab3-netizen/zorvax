import type { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { env } from '../config/env';

/** Register CORS with the configured origins. */
export async function registerCors(app: FastifyInstance): Promise<void> {
  await app.register(cors, {
    origin: env.corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });
}
