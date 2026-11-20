'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ChartWheel } from '@/components/ChartWheel';
import { apiCall } from '@/lib/utils';
import type { Chart } from '@zorvax/shared';

/**
 * The free calculator on the public SEO page. No account, no login: it
 * calls POST /chart/calculate-public, which is open and rate-limited.
 * Results stay in the browser; nothing is saved unless the visitor
 * creates an account.
 */
export function PublicChartCalculator() {
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [chart, setChart] = useState<Chart | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!birthDate) {
      setError('Enter your birth date to calculate your chart.');
      return;
    }
    setLoading(true);
    setError(null);
    setChart(null);
    try {
      const c = await apiCall<Chart>('/chart/calculate-public', {
        method: 'POST',
        body: { birthDate, birthTime: birthTime || undefined },
      });
      setChart(c);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not calculate your chart.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="calculator">
      <Card>
        <form onSubmit={calculate} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Input
            label="Birth date"
            type="date"
            name="birthDate"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            required
          />
          <Input
            label="Birth time (optional)"
            type="time"
            name="birthTime"
            value={birthTime}
            onChange={(e) => setBirthTime(e.target.value)}
            hint="Rising sign needs your birth time"
          />
          <Button type="submit" size="lg" loading={loading}>
            Calculate my chart
          </Button>
        </form>
        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      </Card>

      {chart && (
        <div className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {(
              [
                ['Sun sign', chart.sunSign, 'Your core identity — who you are at heart.'],
                ['Moon sign', chart.moonSign, 'Your emotional nature — what you need to feel safe.'],
                ['Rising sign', chart.risingSign, 'Your first impression — how the world sees you.'],
              ] as const
            ).map(([label, sign, blurb]) => (
              <Card key={label} className="text-center">
                <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
                <p className="gradient-text mt-1 text-2xl font-extrabold">{sign}</p>
                <p className="mt-2 text-sm text-slate-400">{blurb}</p>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardTitle className="mb-2 text-center">Your natal wheel</CardTitle>
              <ChartWheel chart={chart} />
              {!chart.precise && (
                <p className="mt-2 text-center text-xs text-slate-500">
                  Sun sign is exact; other placements are approximate.
                </p>
              )}
            </Card>
            <div className="space-y-6">
              <Card>
                <CardTitle className="mb-3">Planets in signs</CardTitle>
                <ul className="space-y-1.5 text-sm">
                  {chart.planets.map((p) => (
                    <li key={p.name} className="flex justify-between text-slate-300">
                      <span>
                        {p.name}
                        {p.retrograde && <span className="text-secondary-400"> ℞</span>}
                      </span>
                      <span className="text-slate-400">
                        {p.sign} · House {p.house}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
              <Card>
                <CardTitle className="mb-3">What this means for you</CardTitle>
                <p className="text-sm leading-relaxed text-slate-300">
                  Your Sun in {chart.sunSign} shapes your drive, your Moon in {chart.moonSign}{' '}
                  shapes your feelings, and your {chart.risingSign} rising shapes the way you
                  come across. Save this chart and ask Lyra, your AI astrologer, what it means
                  for love, work and the year ahead.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <a href="/register">
                    <Button size="sm">Save my chart — it&rsquo;s free</Button>
                  </a>
                  <a href="/compatibility">
                    <Button size="sm" variant="secondary">
                      Check compatibility
                    </Button>
                  </a>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
