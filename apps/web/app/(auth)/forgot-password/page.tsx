'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardTitle } from '@/components/ui/Card';
import { isValidEmail } from '@/lib/utils';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [sent, setSent] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }
    // Phase 1: placeholder — password reset email is wired in Phase 2.
    setError(undefined);
    setSent(true);
  };

  return (
    <section className="container-page flex max-w-md flex-col py-16">
      <Card>
        <CardTitle className="mb-1 text-2xl">Reset password</CardTitle>
        <p className="mb-6 text-sm text-slate-400">
          Enter your email and we&apos;ll send you a reset link.
        </p>
        {sent ? (
          <p className="rounded-xl border border-primary-600/40 bg-primary-600/10 px-4 py-3 text-sm text-primary-100">
            If that email has an account, a reset link is on its way.
          </p>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error}
              placeholder="you@example.com"
            />
            <Button type="submit" size="lg">
              Send reset link
            </Button>
          </form>
        )}
      </Card>
    </section>
  );
}
