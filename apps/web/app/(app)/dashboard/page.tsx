'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { apiCall, getAuthToken } from '@/lib/utils';
import type { Chart, Profile } from '@zorvax/shared';

interface ChatMessage {
  role: 'user' | 'lyra';
  text: string;
  provider?: string;
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [chart, setChart] = useState<Chart | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;
    (async () => {
      try {
        const me = await apiCall<Profile>('/user/me', { token });
        setProfile(me);
        if (me.birthDate) {
          const c = await apiCall<Chart>('/chart/calculate', {
            method: 'POST',
            token,
            body: { birthDate: me.birthDate },
          });
          setChart(c);
        }
      } catch {
        // Dashboard degrades gracefully; links still work.
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !chart) return;
    const token = getAuthToken();
    if (!token) return;
    setMessages((m) => [...m, { role: 'user', text }]);
    setDraft('');
    setSending(true);
    try {
      const res = await apiCall<{ text: string; provider: string }>('/lyra/chat', {
        method: 'POST',
        token,
        body: { userMessage: text, chartId: chart.id },
      });
      setMessages((m) => [...m, { role: 'lyra', text: res.text, provider: res.provider }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: 'lyra', text: 'Lyra is quiet right now — please try again in a moment.' },
      ]);
    } finally {
      setSending(false);
    }
  };

  const name = profile?.firstName ?? 'stargazer';

  return (
    <section className="container-page py-10">
      <h1 className="mb-1 text-3xl font-extrabold">
        Good evening, <span className="gradient-text">{loading ? '…' : name}</span>
      </h1>
      <p className="mb-8 text-slate-400">The sky has notes for you today.</p>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {chart ? (
            <Card>
              <CardTitle className="mb-3">Your big three</CardTitle>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  ['☉ Sun', chart.sunSign],
                  ['☽ Moon', chart.moonSign],
                  ['↑ Rising', chart.risingSign],
                ].map(([label, sign]) => (
                  <div key={label} className="rounded-xl bg-ink-900/60 p-4">
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="mt-1 text-lg font-semibold text-white">{sign}</p>
                  </div>
                ))}
              </div>
              <Link href="/chart">
                <Button variant="ghost" size="sm" className="mt-4">
                  View full chart →
                </Button>
              </Link>
            </Card>
          ) : (
            <Card>
              <CardTitle className="mb-2">Your chart isn&apos;t ready yet</CardTitle>
              <p className="mb-4 text-sm text-slate-400">
                Add your birth date in settings and Lyra will read your sky.
              </p>
              <Link href="/settings">
                <Button size="sm">Complete profile</Button>
              </Link>
            </Card>
          )}

          <Card>
            <CardTitle className="mb-4">Ask Lyra</CardTitle>
            <div className="mb-4 max-h-72 space-y-3 overflow-y-auto">
              {messages.length === 0 && (
                <p className="text-sm text-slate-500">
                  {chart
                    ? 'Ask about your placements, today’s transits, or what’s on your mind.'
                    : 'Calculate your chart first — then Lyra can speak to your placements.'}
                </p>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={
                    m.role === 'user'
                      ? 'ml-auto max-w-[80%] rounded-xl rounded-br-sm bg-primary-600/80 px-4 py-2 text-sm text-white'
                      : 'mr-auto max-w-[80%] rounded-xl rounded-bl-sm bg-ink-900 px-4 py-2 text-sm text-slate-200'
                  }
                >
                  {m.role === 'lyra' && (
                    <p className="mb-1 text-xs font-semibold text-secondary-400">✦ Lyra</p>
                  )}
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  {m.provider && m.provider !== 'lyra' && (
                    <p className="mt-1 text-[10px] text-slate-500">via {m.provider}</p>
                  )}
                </div>
              ))}
            </div>
            <form onSubmit={send} className="flex gap-2">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={chart ? 'What does my Saturn mean?' : 'Calculate your chart first…'}
                disabled={!chart || sending}
                aria-label="Message Lyra"
              />
              <Button type="submit" loading={sending} disabled={!chart} className="shrink-0">
                Send
              </Button>
            </form>
          </Card>
        </div>

        <div className="space-y-4">
          {[
            { href: '/chart', title: 'Birth chart', body: 'Planets, houses & aspects' },
            { href: '/compatibility', title: 'Compatibility', body: 'Two charts, one story' },
            { href: '/settings', title: 'Settings', body: 'Profile & subscription' },
          ].map((l) => (
            <Link key={l.href} href={l.href}>
              <Card className="transition hover:border-primary-600/50">
                <CardTitle className="text-base">{l.title}</CardTitle>
                <p className="text-sm text-slate-400">{l.body}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
