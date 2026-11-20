import { AIProviderManager, type AIResponse } from '../lib/ai-provider';
import { buildLyraSystemPrompt, toChartContext, type LyraMode } from './lyra.prompt';
import type { Chart, NumerologyReading } from '@zorvax/shared';

const manager = new AIProviderManager();

export interface LyraChatOptions {
  locale?: string;
  mode?: LyraMode;
  numerology?: NumerologyReading;
}

/** Non-streaming Lyra chat: full response via the multi-provider system. */
export async function chatLyra(
  chart: Chart,
  userMessage: string,
  options: LyraChatOptions = {}
): Promise<AIResponse> {
  const systemPrompt = buildLyraSystemPrompt(toChartContext(chart), {
    locale: options.locale,
    mode: options.mode,
    numerology: options.numerology
      ? {
          lifePath: options.numerology.lifePath,
          expressionNumber: options.numerology.expressionNumber,
          soulUrge: options.numerology.soulUrge,
          currentYearNumber: options.numerology.currentYearNumber,
        }
      : undefined,
  });
  return manager.chat(systemPrompt, userMessage, { sunSign: chart.sunSign });
}

/**
 * Streaming Lyra chat. Yields text chunks as they arrive.
 * Providers return complete texts, so chunks are emitted word-by-word
 * for a natural streaming feel over SSE.
 */
export async function* streamLyraResponse(
  chart: Chart,
  userMessage: string,
  options: LyraChatOptions = {}
): AsyncGenerator<string> {
  const response = await chatLyra(chart, userMessage, options);
  const words = response.text.split(/(\s+)/);
  for (const word of words) {
    yield word;
  }
}
