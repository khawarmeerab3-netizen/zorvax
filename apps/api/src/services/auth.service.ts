import { hashPassword, verifyPassword } from '../utils/hash';
import { signToken } from '../utils/jwt';
import { Errors } from './errors';
import { createUser, findUserByEmail } from '../lib/supabase';
import type { AuthResult, LoginInput, SignupInput } from '@zorvax/shared';

function validateEmail(email: string): void {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) throw Errors.invalidEmail();
}

function validatePassword(password: string): void {
  if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
    throw Errors.weakPassword();
  }
}

function toAuthResult(user: {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}): AuthResult {
  return {
    token: signToken(user.id, user.email),
    expiresIn: '7d',
    user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName },
  };
}

/** Register a new user and return an auth token. */
export async function signup(input: SignupInput): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase();
  validateEmail(email);
  validatePassword(input.password);

  const existing = await findUserByEmail(email);
  if (existing) throw Errors.emailTaken();

  const user = await createUser({
    email,
    passwordHash: await hashPassword(input.password),
    firstName: input.firstName?.trim() || null,
    lastName: input.lastName?.trim() || null,
    birthDate: input.birthDate || null,
    birthTime: input.birthTime || null,
    birthLocation: input.birthLocation?.trim() || null,
    timezone: input.timezone || null,
    locale: input.locale || 'en',
  });

  return toAuthResult(user);
}

/** Authenticate and return an auth token. */
export async function login(input: LoginInput): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase();
  const user = await findUserByEmail(email);
  if (!user) throw Errors.invalidCredentials();

  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) throw Errors.invalidCredentials();

  return toAuthResult(user);
}

/** Issue a fresh token for a still-valid token (sliding session). */
export async function refresh(userId: string, email: string): Promise<AuthResult> {
  return {
    token: signToken(userId, email),
    expiresIn: '7d',
    user: { id: userId, email, firstName: null, lastName: null },
  };
}
