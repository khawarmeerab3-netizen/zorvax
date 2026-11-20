import { describe, expect, it } from 'vitest';
import { isValidEmail, validatePassword, validateSignup } from '../lib/utils';

describe('email validation', () => {
  it('accepts a normal email', () => {
    expect(isValidEmail('nova@zorvax.app')).toBe(true);
  });

  it('rejects missing @', () => {
    expect(isValidEmail('novazorvax.app')).toBe(false);
  });

  it('rejects missing domain', () => {
    expect(isValidEmail('nova@')).toBe(false);
  });

  it('rejects blank input', () => {
    expect(isValidEmail('   ')).toBe(false);
  });
});

describe('password policy', () => {
  it('accepts a strong password', () => {
    expect(validatePassword('Starlight42')).toBeNull();
  });

  it('rejects short passwords', () => {
    expect(validatePassword('Ab1')).toContain('8 characters');
  });

  it('rejects passwords without a digit', () => {
    expect(validatePassword('Starlightxx')).toContain('number');
  });

  it('rejects passwords without a letter', () => {
    expect(validatePassword('12345678')).toContain('letter');
  });
});

describe('signup form validation', () => {
  it('passes with valid input', () => {
    expect(
      validateSignup({ email: 'nova@zorvax.app', password: 'Starlight42', confirmPassword: 'Starlight42' })
    ).toEqual({});
  });

  it('flags a bad email', () => {
    const errors = validateSignup({ email: 'nope', password: 'Starlight42', confirmPassword: 'Starlight42' });
    expect(errors.email).toBeDefined();
  });

  it('flags mismatched passwords', () => {
    const errors = validateSignup({
      email: 'nova@zorvax.app',
      password: 'Starlight42',
      confirmPassword: 'Starlight43',
    });
    expect(errors.confirmPassword).toContain('do not match');
  });

  it('flags a weak password', () => {
    const errors = validateSignup({ email: 'nova@zorvax.app', password: 'weak', confirmPassword: 'weak' });
    expect(errors.password).toBeDefined();
  });
});
