import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiBaseUrl, apiCall, cn, formatDate } from '../lib/utils';

describe('cn()', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('resolves tailwind conflicts (last wins)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('ignores falsy values', () => {
    expect(cn('a', false, undefined, 'b')).toBe('a b');
  });
});

describe('formatDate()', () => {
  it('formats an ISO date', () => {
    expect(formatDate('1992-04-17')).toContain('1992');
  });

  it('returns an em dash for missing input', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
  });

  it('returns an em dash for garbage', () => {
    expect(formatDate('not-a-date')).toBe('—');
  });
});

describe('apiBaseUrl()', () => {
  it('defaults to localhost:3001', () => {
    expect(apiBaseUrl()).toContain('3001');
  });
});

describe('apiCall()', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('returns data on success envelope', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { hello: 'world' } }),
      }))
    );
    const data = await apiCall<{ hello: string }>('/health');
    expect(data).toEqual({ hello: 'world' });
  });

  it('throws the server error message on failure envelope', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token.' },
        }),
      }))
    );
    await expect(apiCall('/user/me')).rejects.toThrow('Invalid or expired token.');
  });

  it('throws on unparseable responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 500,
        json: async () => null,
      }))
    );
    await expect(apiCall('/nope')).rejects.toThrow('Request failed (500)');
  });
});
