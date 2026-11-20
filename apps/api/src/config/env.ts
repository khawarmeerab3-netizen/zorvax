/**
 * Central environment config. All values have safe dev defaults;
 * production requires JWT_SECRET to be set to a non-placeholder value.
 */

function str(name: string, fallback = ''): string {
  return process.env[name] ?? fallback;
}

function num(name: string, fallback: number): number {
  const raw = process.env[name];
  const parsed = raw === undefined ? NaN : Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const env = {
  nodeEnv: str('NODE_ENV', 'development'),
  port: num('PORT', 3001),

  jwtSecret: str('JWT_SECRET', 'dev-only-insecure-secret'),
  jwtExpiresIn: str('JWT_EXPIRES_IN', '7d'),

  supabaseUrl: str('SUPABASE_URL', ''),
  supabaseServiceRoleKey: str('SUPABASE_SERVICE_ROLE_KEY', ''),

  groqApiKey: str('GROQ_API_KEY', ''),
  groqModel: str('GROQ_MODEL', 'openai/gpt-oss-120b'),
  groqRpm: num('GROQ_RPM', 20),
  groqDaily: num('GROQ_DAILY', 1000),

  geminiApiKey: str('GEMINI_API_KEY', ''),
  geminiModel: str('GEMINI_MODEL', 'gemini-2.5-flash'),
  geminiRpm: num('GEMINI_RPM', 8),
  geminiDaily: num('GEMINI_DAILY', 1500),

  mistralApiKey: str('MISTRAL_API_KEY', ''),
  mistralModel: str('MISTRAL_MODEL', 'mistral-small-latest'),
  mistralRpm: num('MISTRAL_RPM', 8),
  mistralDaily: num('MISTRAL_DAILY', 666),

  cohereApiKey: str('COHERE_API_KEY', ''),
  cohereModel: str('COHERE_MODEL', 'command-r'),
  cohereRpm: num('COHERE_RPM', 3),
  cohereDaily: num('COHERE_DAILY', 166),

  redisUrl: str('REDIS_URL', ''),
  aiCacheTtlHours: num('AI_CACHE_TTL_HOURS', 24),
  aiRateLimitWindowMinutes: num('AI_RATE_LIMIT_WINDOW_MINUTES', 1),

  stripeSecretKey: str('STRIPE_SECRET_KEY', ''),
  stripeWebhookSecret: str('STRIPE_WEBHOOK_SECRET', ''),

  corsOrigins: str('CORS_ORIGINS', 'http://localhost:3000').split(','),
} as const;

export function assertProductionEnv(): void {
  if (env.nodeEnv === 'production' && env.jwtSecret === 'dev-only-insecure-secret') {
    throw new Error('JWT_SECRET must be set to a real secret in production.');
  }
}
