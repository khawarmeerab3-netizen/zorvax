import Fastify from 'fastify';
import { assertProductionEnv, env } from './config/env';
import { registerCors } from './middleware/cors';
import { registerErrorHandler } from './middleware/error-handler';
import { authRoutes } from './routes/auth.routes';
import { userRoutes } from './routes/user.routes';
import { chartRoutes } from './routes/chart.routes';
import { numerologyRoutes } from './routes/numerology.routes';
import { lyraRoutes } from './routes/lyra.routes';
import { webhookRoutes } from './routes/webhook.routes';

export async function buildApp() {
  const app = Fastify({ logger: env.nodeEnv !== 'test' });

  await registerCors(app);
  registerErrorHandler(app);

  app.get('/health', async () => ({
    success: true,
    data: { status: 'ok', time: new Date().toISOString() },
  }));

  await app.register(authRoutes);
  await app.register(userRoutes);
  await app.register(chartRoutes);
  await app.register(numerologyRoutes);
  await app.register(lyraRoutes);
  await app.register(webhookRoutes);

  return app;
}

async function start(): Promise<void> {
  assertProductionEnv();
  const app = await buildApp();
  await app.listen({ port: env.port, host: '0.0.0.0' });
  console.log(`✦ Zorvax API listening on :${env.port}`);
}

const invoked = process.argv[1] ?? '';
if (invoked.endsWith('index.ts') || invoked.endsWith('index.js')) {
  start().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
