'use client';

import { useEffect, useState } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { apiCall, clearAuthToken, formatDate, getAuthToken } from '@/lib/utils';
import type { Profile, UpdateProfileInput } from '@zorvax/shared';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState<UpdateProfileInput>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }
    apiCall<Profile>('/user/me', { token })
      .then((p) => {
        setProfile(p);
        setForm({
          firstName: p.firstName ?? '',
          lastName: p.lastName ?? '',
          birthDate: p.birthDate ?? '',
          birthLocation: p.birthLocation ?? '',
          locale: p.locale,
        });
      })
      .catch(() => setMessage('Could not load profile.'))
      .finally(() => setLoading(false));
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAuthToken();
    if (!token) return;
    setSaving(true);
    setMessage(null);
    try {
      const updated = await apiCall<Profile>('/user/profile', {
        method: 'PATCH',
        token,
        body: form,
      });
      setProfile(updated);
      setMessage('Profile saved.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const logout = () => {
    clearAuthToken();
    router.push('/login');
  };

  const set = (k: keyof UpdateProfileInput) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  if (loading) return <p className="container-page py-10 text-slate-400">Loading…</p>;

  return (
    <section className="container-page max-w-3xl py-10">
      <h1 className="mb-6 text-3xl font-extrabold">Settings</h1>

      <Card className="mb-6">
        <CardTitle className="mb-4">Profile</CardTitle>
        <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
          <Input label="First name" value={form.firstName ?? ''} onChange={set('firstName')} />
          <Input label="Last name" value={form.lastName ?? ''} onChange={set('lastName')} />
          <Input label="Birth date" type="date" value={form.birthDate ?? ''} onChange={set('birthDate')} />
          <Input
            label="Birth location"
            value={form.birthLocation ?? ''}
            onChange={set('birthLocation')}
            placeholder="City, Country"
          />
          <Input label="Language" value={form.locale ?? ''} onChange={set('locale')} hint="e.g. en, hi, ar, es" />
          <div className="md:col-span-2">
            <Button type="submit" loading={saving}>
              Save changes
            </Button>
            {message && <p className="mt-2 text-sm text-slate-300">{message}</p>}
          </div>
        </form>
        {profile && (
          <p className="mt-4 text-xs text-slate-500">
            {profile.email} · member since {formatDate((profile as unknown as { createdAt?: string }).createdAt)}
          </p>
        )}
      </Card>

      <Card className="mb-6">
        <CardTitle className="mb-2">Subscription</CardTitle>
        <p className="text-sm text-slate-300">
          Current plan:{' '}
          <span className="font-semibold capitalize text-white">
            {profile?.subscription?.tier ?? 'free'}
          </span>
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Paid tiers unlock unlimited Lyra chats and compatibility readings.
        </p>
      </Card>

      <Card>
        <CardTitle className="mb-2">Sign out</CardTitle>
        <Button variant="danger" size="sm" onClick={logout}>
          Log out
        </Button>
      </Card>
    </section>
  );
}
