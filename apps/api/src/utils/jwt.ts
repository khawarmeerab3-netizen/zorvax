import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import type { AuthPayload } from '@zorvax/shared';

/** Sign a JWT for a user. */
export function signToken(userId: string, email: string): string {
  const payload = { userId, email };
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn } as jwt.SignOptions);
}

/** Verify a JWT, returning the payload or null. */
export function verifyToken(token: string): AuthPayload | null {
  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    if (typeof decoded === 'string') return null;
    const { userId, email, iat, exp } = decoded as Partial<AuthPayload>;
    if (!userId || !email || iat === undefined || exp === undefined) return null;
    return { userId, email, iat, exp };
  } catch {
    return null;
  }
}
