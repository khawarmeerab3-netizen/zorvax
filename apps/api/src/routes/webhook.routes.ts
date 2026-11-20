import type { FastifyInstance } from 'fastify';

/**
 * Stripe webhooks — placeholder in Phase 1.
 * Phase 2 wires signature verification + subscription tier updates.
 */
export async function webhookRoutes(app: FastifyInstance): Promise<void> {
  app.post('/webhook/stripe', async (request, reply) => {
    const event = request.body as { type?: string } | undefined;
    app.log.info({ eventType: event?.type ?? 'unknown' }, 'stripe webhook received (placeholder)');
    return reply.send({ success: true, data: { received: true } });
  });
}
