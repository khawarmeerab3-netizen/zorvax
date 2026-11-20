import { createHash, randomUUID } from 'crypto';
import { env } from '../config/env';

/**
 * ZORVAX multi-provider AI system.
 *
 * Request flow:
 *   cache → Groq → Gemini → Mistral → Cohere → static fallback
 *
 * Every provider has:
 *  - per-minute rate limiting (Redis when configured, memory otherwise)
 *  - a circuit breaker (5 failures in 10 min → 60s cooldown)
 *  - 24h response caching (sha256 of system prompt + user message)
 *
 * Model IDs and limits are environment-driven so they can be updated
 * as providers change their free tiers — check each provider's docs
 * for current limits.
 */

// ============================================================
// TYPES
// ============================================================

export type ProviderName = 'groq' | 'gemini' | 'mistral' | 'cohere';

export interface ProviderConfig {
  name: ProviderName;
  apiKey: string;
  model: string;
  requestsPerMinute: number;
  dailyLimit: number;
}

export interface AIResponse {
  text: string;
  provider: ProviderName | 'cache' | 'fallback';
  cached: boolean;
  tokens: { input: number; output: number };
}

export interface ChatOptions {
  sunSign?: string;
  maxTokens?: number;
  temperature?: number;
}

// ============================================================
// RATE LIMIT STORE (Redis when available, memory fallback)
// ============================================================

interface RateLimitStore {
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<void>;
  ttl(key: string): Promise<number>;
  get(key: string): Promise<string | null>;
  setex(key: string, seconds: number, value: string): Promise<void>;
  del(key: string): Promise<void>;
}

class MemoryRateLimitStore implements RateLimitStore {
  private data = new Map<string, { value: number | string; expiresAt: number }>();

  private read(key: string): { value: number | string; expiresAt: number } | undefined {
    const entry = this.data.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.data.delete(key);
      return undefined;
    }
    return entry;
  }

  async incr(key: string): Promise<number> {
    const entry = this.read(key);
    const next = typeof entry?.value === 'number' ? entry.value + 1 : 1;
    this.data.set(key, { value: next, expiresAt: entry?.expiresAt ?? Date.now() + 60_000 });
    return next;
  }

  async expire(key: string, seconds: number): Promise<void> {
    const entry = this.read(key);
    if (entry) this.data.set(key, { ...entry, expiresAt: Date.now() + seconds * 1000 });
  }

  async ttl(key: string): Promise<number> {
    const entry = this.read(key);
    if (!entry) return -2;
    return Math.max(0, Math.ceil((entry.expiresAt - Date.now()) / 1000));
  }

  async get(key: string): Promise<string | null> {
    const entry = this.read(key);
    return entry ? String(entry.value) : null;
  }

  async setex(key: string, seconds: number, value: string): Promise<void> {
    this.data.set(key, { value, expiresAt: Date.now() + seconds * 1000 });
  }

  async del(key: string): Promise<void> {
    this.data.delete(key);
  }
}

class RedisRateLimitStore implements RateLimitStore {
  // Lazily loaded so the module works without ioredis installed.
  private client: {
    incr(k: string): Promise<number>;
    expire(k: string, s: number): Promise<number>;
    ttl(k: string): Promise<number>;
    get(k: string): Promise<string | null>;
    setex(k: string, s: number, v: string): Promise<unknown>;
    del(k: string): Promise<number>;
  } | null = null;
  private initPromise: Promise<void> | null = null;

  constructor(private url: string) {}

  private async init(): Promise<void> {
    if (this.client) return;
    if (!this.initPromise) {
      this.initPromise = (async () => {
        const mod = await import('ioredis');
        const Redis = mod.default;
        this.client = new Redis(this.url, { maxRetriesPerRequest: 2, lazyConnect: true });
        await (this.client as unknown as { connect(): Promise<void> }).connect().catch(() => {
          this.client = null;
        });
      })();
    }
    await this.initPromise;
  }

  private async ready() {
    await this.init();
    if (!this.client) throw new Error('redis unavailable');
  }

  async incr(key: string): Promise<number> {
    await this.ready();
    return this.client!.incr(key);
  }
  async expire(key: string, seconds: number): Promise<void> {
    await this.ready();
    await this.client!.expire(key, seconds);
  }
  async ttl(key: string): Promise<number> {
    await this.ready();
    return this.client!.ttl(key);
  }
  async get(key: string): Promise<string | null> {
    await this.ready();
    return this.client!.get(key);
  }
  async setex(key: string, seconds: number, value: string): Promise<void> {
    await this.ready();
    await this.client!.setex(key, seconds, value);
  }
  async del(key: string): Promise<void> {
    await this.ready();
    await this.client!.del(key);
  }
}

/** Store with graceful degradation: Redis → memory. */
class ResilientStore implements RateLimitStore {
  private memory = new MemoryRateLimitStore();
  private redis: RedisRateLimitStore | null;

  constructor() {
    this.redis = env.redisUrl ? new RedisRateLimitStore(env.redisUrl) : null;
  }

  private async withFallback<T>(fn: (s: RateLimitStore) => Promise<T>, memFn: () => Promise<T>): Promise<T> {
    if (this.redis) {
      try {
        return await fn(this.redis);
      } catch {
        this.redis = null; // stop trying Redis for this process
      }
    }
    return memFn();
  }

  incr(key: string) {
    return this.withFallback((s) => s.incr(key), () => this.memory.incr(key));
  }
  expire(key: string, seconds: number) {
    return this.withFallback((s) => s.expire(key, seconds), () => this.memory.expire(key, seconds));
  }
  ttl(key: string) {
    return this.withFallback((s) => s.ttl(key), () => this.memory.ttl(key));
  }
  get(key: string) {
    return this.withFallback((s) => s.get(key), () => this.memory.get(key));
  }
  setex(key: string, seconds: number, value: string) {
    return this.withFallback(
      (s) => s.setex(key, seconds, value),
      () => this.memory.setex(key, seconds, value)
    );
  }
  del(key: string) {
    return this.withFallback((s) => s.del(key), () => this.memory.del(key));
  }
}

// ============================================================
// RATE LIMITER + CIRCUIT BREAKER
// ============================================================

class RateLimiter {
  private store = new ResilientStore();
  private providers = new Map<ProviderName, ProviderConfig>();

  registerProvider(config: ProviderConfig): void {
    this.providers.set(config.name, config);
  }

  isConfigured(name: ProviderName): boolean {
    return Boolean(this.providers.get(name)?.apiKey);
  }

  async checkRateLimit(name: ProviderName): Promise<{ canRequest: boolean; waitMs: number }> {
    const windowMinutes = env.aiRateLimitWindowMinutes;
    const windowSeconds = windowMinutes * 60;

    const circuitOpen = await this.store.get(`circuit:${name}`);
    if (circuitOpen === 'open') return { canRequest: false, waitMs: 60_000 };

    const key = `ratelimit:${name}`;
    const current = await this.store.incr(key);
    if (current === 1) await this.store.expire(key, windowSeconds);

    const limit = this.providers.get(name)?.requestsPerMinute ?? 10;
    if (current <= limit) return { canRequest: true, waitMs: 0 };

    const ttl = await this.store.ttl(key);
    return { canRequest: false, waitMs: Math.max(ttl, 1) * 1000 };
  }

  async recordFailure(name: ProviderName): Promise<void> {
    const count = await this.store.incr(`failures:${name}`);
    await this.store.expire(`failures:${name}`, 600);
    if (count >= 5) {
      await this.store.setex(`circuit:${name}`, 60, 'open');
    }
  }

  async recordSuccess(name: ProviderName): Promise<void> {
    await this.store.del(`failures:${name}`);
  }

  /** Daily usage counter (informational; resets every 24h). */
  async recordUsage(name: ProviderName): Promise<void> {
    const count = await this.store.incr(`daily:${name}`);
    if (count === 1) await this.store.expire(`daily:${name}`, 86_400);
  }
}

// ============================================================
// STATIC FALLBACK (no API call needed)
// ============================================================

const STATIC_FALLBACKS: string[] = [
  'The stars are quiet for a moment, {sign} soul. Your chart hasn\'t changed — what was true yesterday about your placements is still true today. Breathe, ground, and ask me again in a minute.',
  'I\'m catching my breath between the stars, {sign}. While I gather myself: your Sun in {sign} is still radiating exactly as it should. Try me again shortly.',
  'High cosmic demand right now, {sign} friend. Here\'s what I know for certain: the planets keep their promises, even when I need a moment. Ask again in a minute.',
];

function staticFallback(sunSign?: string): string {
  const sign = sunSign ?? 'dear';
  const template = STATIC_FALLBACKS[Math.floor(Math.random() * STATIC_FALLBACKS.length)];
  return (template ?? STATIC_FALLBACKS[0]!).replaceAll('{sign}', sign);
}

// ============================================================
// AI PROVIDER MANAGER
// ============================================================

export class AIProviderManager {
  private rateLimiter = new RateLimiter();
  private store = new ResilientStore();
  private memoryCache = new Map<string, string>();
  private cacheTtlSeconds = env.aiCacheTtlHours * 3600;

  constructor() {
    const providers: ProviderConfig[] = [
      { name: 'groq', apiKey: env.groqApiKey, model: env.groqModel, requestsPerMinute: env.groqRpm, dailyLimit: env.groqDaily },
      { name: 'gemini', apiKey: env.geminiApiKey, model: env.geminiModel, requestsPerMinute: env.geminiRpm, dailyLimit: env.geminiDaily },
      { name: 'mistral', apiKey: env.mistralApiKey, model: env.mistralModel, requestsPerMinute: env.mistralRpm, dailyLimit: env.mistralDaily },
      { name: 'cohere', apiKey: env.cohereApiKey, model: env.cohereModel, requestsPerMinute: env.cohereRpm, dailyLimit: env.cohereDaily },
    ];
    for (const p of providers) this.rateLimiter.registerProvider(p);
  }

  private cacheKey(systemPrompt: string, userMessage: string): string {
    return createHash('sha256').update(systemPrompt + '\n' + userMessage).digest('hex');
  }

  private async getCached(key: string): Promise<string | null> {
    const hit = await this.store.get(`response:${key}`);
    if (hit) return hit;
    return this.memoryCache.get(key) ?? null;
  }

  private async setCached(key: string, response: string): Promise<void> {
    await this.store.setex(`response:${key}`, this.cacheTtlSeconds, response);
    if (this.memoryCache.size > 500) {
      const first = this.memoryCache.keys().next();
      if (!first.done) this.memoryCache.delete(first.value);
    }
    this.memoryCache.set(key, response);
  }

  private async postJson(
    url: string,
    headers: Record<string, string>,
    body: unknown,
    timeoutMs = 30_000
  ): Promise<{ ok: boolean; status: number; json: unknown }> {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
    const json = (await res.json().catch(() => null)) as unknown;
    return { ok: res.ok, status: res.status, json };
  }

  private async tryProvider(
    name: ProviderName,
    systemPrompt: string,
    userMessage: string,
    opts: ChatOptions
  ): Promise<AIResponse | null> {
    if (!this.rateLimiter.isConfigured(name)) return null;

    const { canRequest } = await this.rateLimiter.checkRateLimit(name);
    if (!canRequest) return null;

    try {
      const result = await this.callProvider(name, systemPrompt, userMessage, opts);
      if (!result || !result.text.trim()) {
        await this.rateLimiter.recordFailure(name);
        return null;
      }
      await this.rateLimiter.recordSuccess(name);
      await this.rateLimiter.recordUsage(name);
      return result;
    } catch (err) {
      await this.rateLimiter.recordFailure(name);
      console.error(`[AI:${name}]`, err instanceof Error ? err.message : err);
      return null;
    }
  }

  private async callProvider(
    name: ProviderName,
    systemPrompt: string,
    userMessage: string,
    opts: ChatOptions
  ): Promise<AIResponse | null> {
    const maxTokens = opts.maxTokens ?? 500;
    const temperature = opts.temperature ?? 0.7;

    switch (name) {
      case 'groq': {
        // OpenAI-compatible endpoint.
        const { ok, status, json } = await this.postJson(
          'https://api.groq.com/openai/v1/chat/completions',
          { Authorization: `Bearer ${env.groqApiKey}` },
          {
            model: env.groqModel,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userMessage },
            ],
            temperature,
            max_tokens: maxTokens,
          }
        );
        if (!ok) throw new Error(`HTTP ${status}`);
        const data = json as {
          choices?: Array<{ message?: { content?: string } }>;
          usage?: { prompt_tokens?: number; completion_tokens?: number };
        };
        return {
          text: data.choices?.[0]?.message?.content ?? '',
          provider: 'groq',
          cached: false,
          tokens: {
            input: data.usage?.prompt_tokens ?? 0,
            output: data.usage?.completion_tokens ?? 0,
          },
        };
      }

      case 'gemini': {
        const url =
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(env.geminiModel)}` +
          `:generateContent?key=${encodeURIComponent(env.geminiApiKey)}`;
        const { ok, status, json } = await this.postJson(url, {}, {
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: userMessage }] }],
          generationConfig: { temperature, maxOutputTokens: maxTokens },
        });
        if (!ok) throw new Error(`HTTP ${status}`);
        const data = json as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
          usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
        };
        return {
          text: data.candidates?.[0]?.content?.parts?.[0]?.text ?? '',
          provider: 'gemini',
          cached: false,
          tokens: {
            input: data.usageMetadata?.promptTokenCount ?? 0,
            output: data.usageMetadata?.candidatesTokenCount ?? 0,
          },
        };
      }

      case 'mistral': {
        const { ok, status, json } = await this.postJson(
          'https://api.mistral.ai/v1/chat/completions',
          { Authorization: `Bearer ${env.mistralApiKey}` },
          {
            model: env.mistralModel,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userMessage },
            ],
            temperature,
            max_tokens: maxTokens,
          }
        );
        if (!ok) throw new Error(`HTTP ${status}`);
        const data = json as {
          choices?: Array<{ message?: { content?: string } }>;
          usage?: { prompt_tokens?: number; completion_tokens?: number };
        };
        return {
          text: data.choices?.[0]?.message?.content ?? '',
          provider: 'mistral',
          cached: false,
          tokens: {
            input: data.usage?.prompt_tokens ?? 0,
            output: data.usage?.completion_tokens ?? 0,
          },
        };
      }

      case 'cohere': {
        const { ok, status, json } = await this.postJson(
          'https://api.cohere.ai/v2/chat',
          { Authorization: `Bearer ${env.cohereApiKey}` },
          {
            model: env.cohereModel,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userMessage },
            ],
            temperature,
            max_tokens: maxTokens,
          }
        );
        if (!ok) throw new Error(`HTTP ${status}`);
        const data = json as {
          message?: { content?: Array<{ type?: string; text?: string }> };
          usage?: { tokens?: { input_tokens?: number; output_tokens?: number } };
        };
        const text =
          data.message?.content?.find((c) => typeof c.text === 'string')?.text ?? '';
        return {
          text,
          provider: 'cohere',
          cached: false,
          tokens: {
            input: data.usage?.tokens?.input_tokens ?? 0,
            output: data.usage?.tokens?.output_tokens ?? 0,
          },
        };
      }
    }
  }

  /**
   * Main entry point. Tries cache, then each provider in order,
   * then a static fallback — it always returns *something*.
   */
  async chat(
    systemPrompt: string,
    userMessage: string,
    opts: ChatOptions = {}
  ): Promise<AIResponse> {
    const key = this.cacheKey(systemPrompt, userMessage);
    const cached = await this.getCached(key);
    if (cached) {
      return { text: cached, provider: 'cache', cached: true, tokens: { input: 0, output: 0 } };
    }

    const order: ProviderName[] = ['groq', 'gemini', 'mistral', 'cohere'];
    for (const name of order) {
      const result = await this.tryProvider(name, systemPrompt, userMessage, opts);
      if (result) {
        await this.setCached(key, result.text);
        return result;
      }
    }

    return {
      text: staticFallback(opts.sunSign),
      provider: 'fallback',
      cached: false,
      tokens: { input: 0, output: 0 },
    };
  }

  /** For tests: unique id so parallel managers don't share cache keys. */
  static testId(): string {
    return randomUUID();
  }
}
