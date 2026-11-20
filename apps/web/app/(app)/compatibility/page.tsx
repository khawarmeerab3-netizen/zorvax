'use client';

import { useState } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { apiCall, getAuthToken } from '@/lib/utils';
import type { CompatibilityResult } from '@zorvax/shared';

export default function CompatibilityPage() {
  const [aDate, setADate] = useState('');
  const [bDate, setBDate] = useState('');
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aDate || !bDate) {
      setError('Both birth dates are required.');
      return;
    }
    const token = getAuthToken();
    if (!token) {
      setError('Please log in.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await apiCall<CompatibilityResult>('/chart/compatibility', {
        method: 'POST',
        token,
        body: { personA: { birthDate: aDate }, personB: { birthDate: bDate } },
      });
      setResult(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not compute compatibility.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="container-page max-w-3xl py-10">
      <h1 className="mb-2 text-3xl font-extrabold">
        <span className="gradient-text">Compatibility</span>
      </h1>
      <p className="mb-8 text-slate-400">Two charts, one story. Enter two birth dates.</p>

      <Card className="mb-6">
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <Input
            label="Person A — birth date"
            type="date"
            value={aDate}
            onChange={(e) => setADate(e.target.value)}
          />
          <Input
            label="Person B — birth date"
            type="date"
            value={bDate}
            onChange={(e) => setBDate(e.target.value)}
          />
          <div className="md:col-span-2">
            <Button type="submit" loading={loading}>
              Reveal compatibility
            </Button>
          </div>
        </form>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      </Card>

      {result && (
        <Card>
          <CardTitle className="mb-2">Harmony score</CardTitle>
          <div className="mb-2 h-3 overflow-hidden rounded-full bg-ink-900">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary-600 to-secondary-500"
              style={{ width: `${result.score}%` }}
            />
          </div>
          <p className="mb-4 text-2xl font-extrabold text-white">{result.score}/100</p>
          <p className="mb-4 text-sm text-slate-300">{result.summary}</p>
          <div className="grid gap-4 text-sm md:grid-cols-2">
            <div>
              <p className="mb-1 font-semibold text-primary-400">Strengths</p>
              <ul className="list-disc space-y-1 pl-5 text-slate-300">
                {result.strengths.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-1 font-semibold text-secondary-400">Watch for</p>
              <ul className="list-disc space-y-1 pl-5 text-slate-300">
                {result.challenges.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm text-slate-400">
            <p>
              <span className="font-semibold text-slate-200">Sun–Moon:</span> {result.sunMoon}
            </p>
            <p>
              <span className="font-semibold text-slate-200">Venus–Mars:</span> {result.venusMars}
            </p>
          </div>
        </Card>
      )}
    </section>
  );
}
