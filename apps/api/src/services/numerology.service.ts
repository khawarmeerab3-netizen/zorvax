import { randomUUID } from 'crypto';
import { AppError, Errors } from './errors';
import type { CalculateNumerologyInput, NumerologyReading } from '@zorvax/shared';

/** Pythagorean letter → number map. */
const LETTER_VALUES: Record<string, number> = {
  a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8, i: 9,
  j: 1, k: 2, l: 3, m: 4, n: 5, o: 6, p: 7, q: 8, r: 9,
  s: 1, t: 2, u: 3, v: 4, w: 5, x: 6, y: 7, z: 8,
};

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);
const MASTER_NUMBERS = new Set([11, 22, 33]);

/** Reduce to a single digit, preserving master numbers 11/22/33. */
export function reduceNumber(n: number): number {
  let v = Math.abs(Math.floor(n));
  while (v > 9 && !MASTER_NUMBERS.has(v)) {
    v = String(v).split('').reduce((sum, d) => sum + Number(d), 0);
  }
  return v;
}

function nameValue(name: string, onlyVowels: boolean, onlyConsonants: boolean): number {
  const letters = name.toLowerCase().replace(/[^a-z]/g, '').split('');
  let total = 0;
  for (const ch of letters) {
    const isVowel = VOWELS.has(ch);
    if (onlyVowels && !isVowel) continue;
    if (onlyConsonants && isVowel) continue;
    // 'y' counts as a vowel when no other vowel is present — simplified: consonant.
    total += LETTER_VALUES[ch] ?? 0;
  }
  return total;
}

function digitsOf(dateIso: string): number[] {
  return dateIso.replace(/\D/g, '').split('').map(Number);
}

/**
 * Full Pythagorean numerology reading.
 * All reductions preserve master numbers (11, 22, 33).
 */
export function calculateNumerology(
  input: CalculateNumerologyInput,
  userId: string
): NumerologyReading {
  if (!input.fullName || !input.fullName.trim()) {
    throw new AppError('INVALID_NAME', 'fullName is required.', 400);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.birthDate)) {
    throw Errors.invalidBirthDate();
  }

  const name = input.fullName.trim();
  const digitSum = digitsOf(input.birthDate).reduce((a, b) => a + b, 0);
  const lifePath = reduceNumber(digitSum);

  const expressionNumber = reduceNumber(nameValue(name, false, false));
  const soulUrge = reduceNumber(nameValue(name, true, false));
  const personalityNumber = reduceNumber(nameValue(name, false, true));

  const day = Number(input.birthDate.split('-')[2]);
  const birthdayNumber = reduceNumber(day ?? 0);
  const maturityNumber = reduceNumber(lifePath + expressionNumber);

  const now = new Date();
  const yearDigits = String(now.getUTCFullYear()).split('').map(Number).reduce((a, b) => a + b, 0);
  const monthDigits = String(now.getUTCMonth() + 1).split('').map(Number).reduce((a, b) => a + b, 0);
  const dayDigits = String(now.getUTCDate()).split('').map(Number).reduce((a, b) => a + b, 0);
  const currentYearNumber = reduceNumber(yearDigits + monthDigits + dayDigits + lifePath);

  return {
    id: randomUUID(),
    userId,
    lifePath,
    expressionNumber,
    soulUrge,
    personalityNumber,
    birthdayNumber,
    maturityNumber,
    currentYearNumber,
    createdAt: now.toISOString(),
  };
}

/** One-line meaning for a core number (used by Lyra prompts). */
export function numberMeaning(n: number): string {
  const meanings: Record<number, string> = {
    1: 'the independent leader',
    2: 'the sensitive diplomat',
    3: 'the creative communicator',
    4: 'the steady builder',
    5: 'the freedom-seeking adventurer',
    6: 'the nurturing harmonizer',
    7: 'the analytical mystic',
    8: 'the ambitious achiever',
    9: 'the compassionate humanitarian',
    11: 'the inspired visionary (master number)',
    22: 'the master builder (master number)',
    33: 'the master teacher (master number)',
  };
  return meanings[n] ?? 'a unique vibration';
}
