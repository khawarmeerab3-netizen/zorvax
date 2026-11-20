import { LandingHero } from '@/components/LandingHero';
import { Card, CardTitle } from '@/components/ui/Card';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function HomePage() {
  return (
    <>
      <LandingHero />
      <section className="container-page pb-20">
        <Card className="flex flex-col items-center gap-4 text-center">
          <CardTitle className="text-2xl">How Zorvax works</CardTitle>
          <ol className="grid gap-4 text-left text-sm text-slate-300 md:grid-cols-3">
            <li className="rounded-xl bg-ink-900/60 p-4">
              <span className="font-bold text-primary-400">1.</span> Tell us your birth date, time
              and place.
            </li>
            <li className="rounded-xl bg-ink-900/60 p-4">
              <span className="font-bold text-primary-400">2.</span> We calculate your chart and
              numerology.
            </li>
            <li className="rounded-xl bg-ink-900/60 p-4">
              <span className="font-bold text-primary-400">3.</span> Chat with Lyra about anything —
              she knows your placements.
            </li>
          </ol>
          <Link href="/register">
            <Button size="lg">Start your chart</Button>
          </Link>
        </Card>
      </section>
    </>
  );
}
