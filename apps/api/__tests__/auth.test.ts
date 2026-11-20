import { beforeEach, describe, expect, it } from 'vitest';
import { login, refresh, signup } from '../src/services/auth.service';
import { verifyToken } from '../src/utils/jwt';
import { __clearMemoryStore } from '../src/lib/supabase';
import { AppError } from '../src/services/errors';

process.env.NODE_ENV = 'test';

beforeEach(() => {
  __clearMemoryStore();
});

describe('signup', () => {
  it('creates a user and returns a token', async () => {
    const result = await signup({ email: 'nova@zorvax.app', password: 'Starlight42' });
    expect(result.token).toBeTruthy();
    expect(result.user.email).toBe('nova@zorvax.app');
    expect(verifyToken(result.token)).toMatchObject({ email: 'nova@zorvax.app' });
  });

  it('normalizes email case', async () => {
    const result = await signup({ email: 'Nova@Zorvax.App', password: 'Starlight42' });
    expect(result.user.email).toBe('nova@zorvax.app');
  });

  it('rejects duplicate emails', async () => {
    await signup({ email: 'nova@zorvax.app', password: 'Starlight42' });
    await expect(signup({ email: 'nova@zorvax.app', password: 'Starlight42' })).rejects.toThrow(
      AppError
    );
  });

  it('rejects invalid email', async () => {
    await expect(signup({ email: 'nope', password: 'Starlight42' })).rejects.toThrow(AppError);
  });

  it('rejects weak passwords', async () => {
    await expect(signup({ email: 'nova@zorvax.app', password: 'short' })).rejects.toThrow(AppError);
  });
});

describe('login', () => {
  it('authenticates with correct credentials', async () => {
    await signup({ email: 'nova@zorvax.app', password: 'Starlight42' });
    const result = await login({ email: 'nova@zorvax.app', password: 'Starlight42' });
    expect(result.token).toBeTruthy();
  });

  it('rejects wrong password', async () => {
    await signup({ email: 'nova@zorvax.app', password: 'Starlight42' });
    await expect(login({ email: 'nova@zorvax.app', password: 'Wrongpass1' })).rejects.toThrow(
      AppError
    );
  });

  it('rejects unknown email', async () => {
    await expect(login({ email: 'ghost@zorvax.app', password: 'Starlight42' })).rejects.toThrow(
      AppError
    );
  });
});

describe('refresh', () => {
  it('issues a fresh token', async () => {
    const result = await refresh('user-123', 'nova@zorvax.app');
    expect(verifyToken(result.token)).toMatchObject({ userId: 'user-123' });
  });
});

describe('verifyToken', () => {
  it('returns null for garbage', () => {
    expect(verifyToken('not-a-token')).toBeNull();
  });
});
