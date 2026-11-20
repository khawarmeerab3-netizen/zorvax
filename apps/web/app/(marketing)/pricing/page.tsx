import Link from 'next/link';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const tiers = [
  {
    name: 'Free',
    price: '$0',
    blurb: 'Taste the stars.',
    features: ['Natal chart calculation', 'Daily horoscope', '5 Lyra chats / day'],
    cta: 'Get started',
    href: '/register',
    featured: false,
  },
  {
    name: 'Pro',
    price: '$9/mo',
    blurb: 'Your full cosmic companion.',
    features: [
      'Everything in Free',
      'Unlimited Lyra chats',
      'Compatibility readings',
      'Numerology deep-dives',
      'Transit alerts',
    ],
    cta: 'Go Pro',
    href: '/register',
    featured: true,
  },
  {
    name: 'Elite',
    price: '$19/mo',
    blurb: 'For the devoted.',
    features: ['Everything in Pro', 'Priority AI responses', 'Year-ahead forecast', '1:1 onboarding'],
    cta: 'Go Elite',
    href: '/register',
    featured: false,
  },
];

export default function PricingPage() {
  return (
    <section className="container-page py-16">
      <h1 className="mb-2 text-center text-4xl font-extrabold">
        Simple <span className="gradient-text">pricing</span>
      </h1>
      <p className="mb-10 text-center text-slate-400">Start free. Upgrade when the stars align.</p>
      <div className="grid gap-6 md:grid-cols-3">
        {tiers.map((t) => (
          <Card
            key={t.name}
            className={cn('flex flex-col', t.featured && 'border-primary-600/60 shadow-primary-600/10')}
          >
            <CardTitle>{t.name}</CardTitle>
            <p className="mt-2 text-3xl font-extrabold text-white">{t.price}</p>
            <p className="mt-1 text-sm text-slate-400">{t.blurb}</p>
            <ul className="mt-4 flex-1 space-y-2 text-sm text-slate-300">
              {t.features.map((f) => (
                <li key={f}>✦ {f}</li>
              ))}
            </ul>
            <Link href={t.href} className="mt-6">
              <Button variant={t.featured ? 'primary' : 'secondary'} className="w-full">
                {t.cta}
              </Button>
            </Link>
          </Card>
        ))}
      </div>
    </section>
  );
}
