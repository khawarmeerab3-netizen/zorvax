import type { UserChartContext } from '@zorvax/shared';

/**
 * System prompt for compatibility readings between two charts.
 * Compares Sun, Moon, Venus and Mars across both charts.
 */
export function buildCompatibilityPrompt(
  personA: UserChartContext,
  personB: UserChartContext,
  locale = 'en'
): string {
  const describe = (label: string, c: UserChartContext): string =>
    [
      `${label}: Sun ${c.sunSign}, Moon ${c.moonSign}, Rising ${c.risingSign}`,
      ...c.planets
        .filter((p) => ['Venus', 'Mars', 'Mercury'].includes(p.name))
        .map((p) => `  ${p.name} in ${p.sign} (House ${p.house})`),
    ].join('\n');

  return [
    'You are Lyra, an AI astrologer. Analyze the synastry between these two natal charts.',
    '',
    describe('Person A', personA),
    '',
    describe('Person B', personB),
    '',
    '## Instructions',
    '1. Compare Sun–Sun, Moon–Moon, Venus–Venus and Venus–Mars dynamics using sign elements and modalities.',
    '2. Name 3 strengths and 2 growth edges, each tied to a specific placement.',
    '3. End with one practical communication tip.',
    '4. Keep it under 200 words. Warm, grounded tone — no fatalism.',
    `5. Respond in ${locale === 'en' ? 'English' : locale}.`,
  ].join('\n');
}
