'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { apiCall, validateSignup } from '@/lib/utils';
import type { AuthResult, LoginInput, SignupInput } from '@zorvax/shared';

interface AuthFormProps {
  mode: 'login' | 'register';
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (mode === 'register') {
      const errs = validateSignup({ email, password, confirmPassword });
      if (!birthDate) errs.birthDate = 'Birth date is needed for your chart.';
      setErrors(errs);
      if (Object.keys(errs).length > 0) return;
    } else if (!email || !password) {
      setErrors({ form: 'Email and password are required.' });
      return;
    }

    setLoading(true);
    try {
      const body: LoginInput | SignupInput =
        mode === 'login' ? { email, password } : { email, password, birthDate };
      const result = await apiCall<AuthResult>(
        mode === 'login' ? '/auth/login' : '/auth/signup',
        { method: 'POST', body }
      );
      document.cookie = `zorvax_token=${result.token}; path=/; max-age=604800; SameSite=Lax`;
      router.push('/dashboard');
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex w-full flex-col gap-4" noValidate>
      <Input
        label="Email"
        type="email"
        name="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        autoComplete="email"
      />
      <Input
        label="Password"
        type="password"
        name="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        hint={mode === 'register' ? '8+ characters, with a letter and a number.' : undefined}
      />
      {mode === 'register' && (
        <>
          <Input
            label="Confirm password"
            type="password"
            name="confirmPassword"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={errors.confirmPassword}
            autoComplete="new-password"
          />
          <Input
            label="Birth date"
            type="date"
            name="birthDate"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            error={errors.birthDate}
            hint="Lyra needs this to read your chart."
          />
        </>
      )}
      {errors.form && <p className="text-sm text-red-400">{errors.form}</p>}
      {serverError && <p className="text-sm text-red-400">{serverError}</p>}
      <Button type="submit" loading={loading} size="lg">
        {mode === 'login' ? 'Log in' : 'Create account'}
      </Button>
    </form>
  );
}
