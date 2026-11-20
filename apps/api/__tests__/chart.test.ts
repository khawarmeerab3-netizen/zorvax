import { describe, expect, it } from 'vitest';
import {
  calculateChart,
  compatibility,
  sunSignFromMonthDay,
} from '../src/services/chart.service';
import { calculateNumerology, numberMeaning, reduceNumber } from '../src/services/numerology.service';
import { buildLyraSystemPrompt, toChartContext } from '../src/ai/lyra.prompt';
import { AIProviderManager } from '../src/lib/ai-provider';

process.env.NODE_ENV = 'test';

describe('sunSignFromMonthDay', () => {
  it('returns Aries for April 17', () => {
    expect(sunSignFromMonthDay(4, 17)).toBe('Aries');
  });

  it('handles cusp: March 21 is Aries, March 20 is Pisces', () => {
    expect(sunSignFromMonthDay(3, 21)).toBe('Aries');
    expect(sunSignFromMonthDay(3, 20)).toBe('Pisces');
  });

  it('handles year boundary: January 10 is Capricorn', () => {
    expect(sunSignFromMonthDay(1, 10)).toBe('Capricorn');
    expect(sunSignFromMonthDay(1, 20)).toBe('Aquarius');
  });
});

describe('calculateChart', () => {
  it('computes an exact Sun sign', () => {
    const chart = calculateChart({ birthDate: '1992-04-17' }, 'user-1');
    expect(chart.sunSign).toBe('Aries');
    expect(chart.userId).toBe('user-1');
  });

  it('returns 10 planets, 12 houses, sorted aspects', () => {
    const chart = calculateChart({ birthDate: '1992-04-17', birthTime: '06:30' }, 'user-1');
    expect(chart.planets).toHaveLength(10);
    expect(chart.houses).toHaveLength(12);
    const orbs = chart.aspects.map((a) => a.orb);
    expect([...orbs].sort((a, b) => a - b)).toEqual(orbs);
    expect(chart.precise).toBe(false);
  });

  it('is deterministic for the same input', () => {
    const a = calculateChart({ birthDate: '2000-01-01' }, 'u');
    const b = calculateChart({ birthDate: '2000-01-01' }, 'u');
    expect(a.planets).toEqual(b.planets);
  });

  it('rejects invalid birth dates', () => {
    expect(() => calculateChart({ birthDate: 'not-a-date' }, 'u')).toThrow();
  });
});

describe('compatibility', () => {
  it('scores within 5..99 with strengths and challenges', () => {
    const a = calculateChart({ birthDate: '1992-04-17' }, 'a');
    const b = calculateChart({ birthDate: '1990-11-03' }, 'b');
    const result = compatibility(a, b);
    expect(result.score).toBeGreaterThanOrEqual(5);
    expect(result.score).toBeLessThanOrEqual(99);
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.challenges.length).toBeGreaterThan(0);
    expect(result.summary).toContain('Aries');
  });
});

describe('numerology', () => {
  it('reduces while preserving master numbers', () => {
    expect(reduceNumber(29)).toBe(11); // 2+9=11 master
    expect(reduceNumber(38)).toBe(11);
    expect(reduceNumber(10)).toBe(1);
    expect(reduceNumber(33)).toBe(33);
  });

  it('computes a life path of 33 for 1992-04-17', () => {
    const r = calculateNumerology({ fullName: 'Nova Star', birthDate: '1992-04-17' }, 'u');
    // 1+9+9+2+0+4+1+7 = 33 (master number)
    expect(r.lifePath).toBe(33);
  });

  it('computes expression/soul-urge/personality for a simple name', () => {
    const r = calculateNumerology({ fullName: 'Jo', birthDate: '2000-01-01' }, 'u');
    expect(r.expressionNumber).toBe(7); // J(1)+O(6)
    expect(r.soulUrge).toBe(6); // O(6)
    expect(r.personalityNumber).toBe(1); // J(1)
  });

  it('describes master numbers', () => {
    expect(numberMeaning(11)).toContain('master number');
    expect(numberMeaning(5)).toContain('adventurer');
  });
});

describe('lyra prompt', () => {
  it('grounds the prompt in the real chart', () => {
    const chart = calculateChart({ birthDate: '1992-04-17' }, 'u');
    const prompt = buildLyraSystemPrompt(toChartContext(chart), { locale: 'en' });
    expect(prompt).toContain('Aries');
    expect(prompt).toContain('never contradict or invent');
    expect(prompt).toContain('Respond in English.');
  });

  it('supports other locales', () => {
    const chart = calculateChart({ birthDate: '1992-04-17' }, 'u');
    const prompt = buildLyraSystemPrompt(toChartContext(chart), { locale: 'hi' });
    expect(prompt).toContain('Hindi');
  });
});

describe('AI provider fallback', () => {
  it('always returns a static fallback when no keys are configured', async () => {
    const manager = new AIProviderManager();
    const res = await manager.chat('system', 'hello', { sunSign: 'Leo' });
    expect(res.provider).toBe('fallback');
    expect(res.text).toContain('Leo');
    expect(res.text.length).toBeGreaterThan(20);
  });
});
