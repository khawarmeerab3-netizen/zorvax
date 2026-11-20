import type { UserChartContext } from '@zorvax/shared';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * System prompt for a short daily horoscope grounded in the user's chart.
 */
export function buildDailyHoroscopePrompt(chart: UserChartContext, date: Date = new Date()): string {
  const month = MONTHS[date.getMonth()] ?? '';
  const dateStr = `${month} ${date.getDate()}, ${date.getFullYear()}`;

  return [
    'You are Lyra, an AI astrologer writing a morning horoscope.',
    '',
    `User: Sun ${chart.sunSign}, Moon ${chart.moonSign}, Rising ${chart.risingSign}.`,
    `Date: ${dateStr}.`,
    '',
    '## Instructions',
    '1. Write a ~75-word morning horoscope for this person.',
    '2. Weave in their Sun/Moon/Rising signs naturally — no generic filler.',
    '3. Give one concrete, kind suggestion for the day.',
    '4. Warm tone. No predictions of specific events, no medical or financial advice.',
  ].join('\n');
}
