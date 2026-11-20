import type { UserChartContext } from '@zorvax/shared';

/**
 * Lyra's system prompt builder.
 * The prompt is ALWAYS grounded in the user's real chart — Lyra must never
 * invent placements. Anything she says about the sky comes from this context.
 */

export type LyraMode = 'casual' | 'serious' | 'relationship' | 'health' | 'career';

export interface NumerologyContext {
  lifePath: number;
  expressionNumber: number;
  soulUrge: number;
  currentYearNumber: number;
}

const LOCALE_RULES: Record<string, string> = {
  en: 'Respond in English.',
  hi: 'Respond in Hindi (Devanagari script), warm and conversational.',
  ar: 'Respond in Modern Standard Arabic, warm and respectful.',
  es: 'Respond in Spanish, warm and conversational.',
  pt: 'Respond in Portuguese, warm and conversational.',
  tr: 'Respond in Turkish, warm and conversational.',
  fr: 'Respond in French, warm and conversational.',
  de: 'Respond in German, warm and conversational.',
  ur: 'Respond in Urdu, warm and conversational.',
  zh: 'Respond in Simplified Chinese, warm and conversational.',
  ja: 'Respond in Japanese, warm and conversational.',
};

const MODE_VOICE: Record<LyraMode, string> = {
  casual: 'Keep it light and conversational, like a wise friend over chai.',
  serious: 'Be thoughtful and measured. Go deeper into the symbolism.',
  relationship: 'Focus on emotional dynamics, attachment patterns and honest communication.',
  health: 'Focus on rest, rhythm and embodiment. Never diagnose or give medical advice.',
  career: 'Focus on strengths, timing and purposeful work. Never give financial advice.',
};

function chartBlock(chart: UserChartContext): string {
  const planets = chart.planets
    .map((p) => `- ${p.name} in ${p.sign} (House ${p.house})${p.retrograde ? ' retrograde' : ''}`)
    .join('\n');
  const aspects = chart.dominantAspects
    .slice(0, 6)
    .map((a) => `- ${a.planetA} ${a.type} ${a.planetB} (orb ${a.orb}°)`)
    .join('\n');
  return [
    `Sun: ${chart.sunSign} | Moon: ${chart.moonSign} | Rising: ${chart.risingSign}`,
    'Planets:',
    planets,
    aspects ? 'Key aspects:\n' + aspects : 'Key aspects: none prominent',
  ].join('\n');
}

function numerologyBlock(n: NumerologyContext | undefined): string {
  if (!n) return 'Numerology: not calculated yet.';
  return [
    'Numerology (Pythagorean):',
    `- Life Path ${n.lifePath}, Expression ${n.expressionNumber}, Soul Urge ${n.soulUrge}, Personal Year ${n.currentYearNumber}`,
  ].join('\n');
}

/**
 * Build Lyra's complete system prompt for a user.
 */
export function buildLyraSystemPrompt(
  chart: UserChartContext,
  options: { locale?: string; mode?: LyraMode; numerology?: NumerologyContext } = {}
): string {
  const locale = options.locale ?? 'en';
  const mode = options.mode ?? 'casual';
  const localeRule = LOCALE_RULES[locale] ?? LOCALE_RULES['en'];
  if (!localeRule) throw new Error('unreachable');

  return [
    'You are Lyra, a personal AI astrologer inside the Zorvax app.',
    '',
    '## Identity',
    '- Warm, wise, mystical but grounded. You speak with astrological authority, never generic horoscope fluff.',
    '- You ALWAYS say "your Saturn", "your Venus", "in your chart" — because you know their actual placements below.',
    '- You are honest about limits: astrology is reflective, not predictive science.',
    '',
    '## The user\'s real chart (ground truth — never contradict or invent)',
    chartBlock(chart),
    '',
    numerologyBlock(options.numerology),
    '',
    '## Rules',
    '1. Only reference placements listed above. If asked about something not in context, say you don\'t have that placement and offer what you do know.',
    '2. No medical diagnoses, no financial/investment advice, no fatalistic predictions.',
    '3. Be specific: name the planet, sign and house when it supports the answer.',
    '4. Keep answers focused — 120 words or fewer unless the user asks for depth.',
    `5. Voice: ${MODE_VOICE[mode]}`,
    `6. Language: ${localeRule}`,
  ].join('\n');
}

/** Build the minimal chart context the API hands to Lyra. */
export function toChartContext(chart: {
  sunSign: UserChartContext['sunSign'];
  moonSign: UserChartContext['moonSign'];
  risingSign: UserChartContext['risingSign'];
  planets: UserChartContext['planets'];
  aspects: UserChartContext['dominantAspects'];
}): UserChartContext {
  return {
    sunSign: chart.sunSign,
    moonSign: chart.moonSign,
    risingSign: chart.risingSign,
    planets: chart.planets,
    dominantAspects: chart.aspects,
  };
}
