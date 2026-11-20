'use client';

import { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { isValidEmail } from '@/lib/utils';

export function LandingHero() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [joined, setJoined] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }
    // Waitlist signup is a placeholder in Phase 1 (no backend call yet).
    setError(undefined);
    setJoined(true);
  };

  return (
    <section className="container-page py-20 text-center md:py-28">
      <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-secondary-400">
        Your personal AI astrologer
      </p>
      <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight md:text-6xl">
        Meet <span className="gradient-text">Lyra</span> — astrology that actually knows your chart
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
        Zorvax reads your real birth chart and numerology, then Lyra answers your questions with
        genuine astrological insight — warm, wise, and grounded in your placements.
      </p>

      <div className="mx-auto mt-10 max-w-md">
        {joined ? (
          <div className="rounded-xl border border-primary-600/40 bg-primary-600/10 px-6 py-4 text-sm text-primary-100">
            ✦ You&apos;re on the waitlist. Lyra will find you soon.
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error}
              aria-label="Email address"
            />
            <Button type="submit" size="lg" className="shrink-0">
              Join waitlist
            </Button>
          </form>
        )}
      </div>

      <div className="mt-16 grid gap-4 text-left md:grid-cols-3">
        {[
          {
            title: 'Real birth charts',
            body: 'Sun, Moon, rising, planets, houses and aspects — calculated from your birth data, not generic horoscopes.',
          },
          {
            title: 'Lyra AI chat',
            body: 'Ask anything. Lyra answers from your actual chart, with a multi-provider AI engine that never leaves you hanging.',
          },
          {
            title: 'Numerology & compatibility',
            body: 'Life path, expression and soul urge numbers, plus synastry-style compatibility between two charts.',
          },
        ].map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-slate-800 bg-ink-800/60 p-6 backdrop-blur"
          >
            <h3 className="mb-2 font-semibold text-white">{f.title}</h3>
            <p className="text-sm text-slate-400">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
