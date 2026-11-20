'use client';

import { useEffect, useState } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ChartWheel } from '@/components/ChartWheel';
import { apiCall, getAuthToken } from '@/lib/utils';
import type { Chart, Profile } from '@zorvax/shared';

export default function ChartPage() {
  const [chart, setChart] = useState<Chart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const token = getAuthToken();
    if (!token) {
      setError('Please log in.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const me = await apiCall<Profile>('/user/me', { token });
      if (!me.birthDate) {
        setError('Add your birth date in settings to calculate your chart.');
        return;
      }
      const c = await apiCall<Chart>('/chart/calculate', {
        method: 'POST',
        token,
        body: { birthDate: me.birthDate },
      });
      setChart(c);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not calculate chart.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="container-page py-10">
      <h1 className="mb-6 text-3xl font-extrabold">
        Your <span className="gradient-text">birth chart</span>
      </h1>

      {loading && <p className="text-slate-400">Reading the sky…</p>}
      {error && (
        <Card>
          <p className="text-sm text-red-400">{error}</p>
          <Button size="sm" className="mt-4" onClick={load}>
            Try again
          </Button>
        </Card>
      )}
      {chart && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardTitle className="mb-2 text-center">Natal wheel</CardTitle>
            <ChartWheel chart={chart} />
            {!chart.precise && (
              <p className="mt-2 text-center text-xs text-slate-500">
                Demo precision — Sun sign is exact; other placements are approximate.
              </p>
            )}
          </Card>
          <div className="space-y-6">
            <Card>
              <CardTitle className="mb-3">Planets</CardTitle>
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
              <CardTitle className="mb-3">Major aspects</CardTitle>
              {chart.aspects.length === 0 ? (
                <p className="text-sm text-slate-500">No major aspects in this chart.</p>
              ) : (
                <ul className="space-y-1.5 text-sm text-slate-300">
                  {chart.aspects.slice(0, 12).map((a, i) => (
                    <li key={i}>
                      {a.planetA} <span className="text-primary-400">{a.type}</span> {a.planetB}
                      <span className="text-slate-500"> · orb {a.orb.toFixed(1)}°</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}
    </section>
  );
}
