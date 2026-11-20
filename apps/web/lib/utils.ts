import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind class names safely. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Base URL of the Zorvax API. */
export function apiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
}

/** Read the JWT stored by AuthForm (non-HttpOnly by design in Phase 1). */
export function getAuthToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)zorvax_token=([^;]+)/);
  return match?.[1] ? decodeURIComponent(match[1] as string) : null;
}

/** Clear the auth cookie (logout). */
export function clearAuthToken(): void {
  document.cookie = 'zorvax_token=; path=/; max-age=0; SameSite=Lax';
}

export interface ApiCallOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  token?: string;
  body?: unknown;
}

/** Typed fetch wrapper for the Zorvax API. Throws on non-2xx. */
export async function apiCall<T>(path: string, options: ApiCallOptions = {}): Promise<T> {
  const res = await fetch(`${apiBaseUrl()}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const json = (await res.json().catch(() => null)) as {
    success?: boolean;
    data?: T;
    error?: { message?: string };
  } | null;

  if (!res.ok || !json || json.success === false) {
    throw new Error(json?.error?.message ?? `Request failed (${res.status})`);
  }
  return json.data as T;
}

/** Very small email check — server validates properly. */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

/** Password policy: 8+ chars, at least one letter and one digit. */
export function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (!/[a-zA-Z]/.test(password)) return 'Password must include a letter.';
  if (!/\d/.test(password)) return 'Password must include a number.';
  return null;
}

/** Validate a signup form; returns field errors (empty object = valid). */
export function validateSignup(input: {
  email: string;
  password: string;
  confirmPassword: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!isValidEmail(input.email)) errors.email = 'Enter a valid email address.';
  const pwError = validatePassword(input.password);
  if (pwError) errors.password = pwError;
  if (input.password !== input.confirmPassword) errors.confirmPassword = 'Passwords do not match.';
  return errors;
}

/** Format an ISO date for display. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
