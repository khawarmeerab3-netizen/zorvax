import type { Metadata } from 'next';
import { PublicChartCalculator } from '@/components/PublicChartCalculator';
import { Card, CardTitle } from '@/components/ui/Card';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL;

export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  title: 'Free Birth Chart Calculator — Your Natal Chart in Seconds | Zorvax',
  description:
    'Calculate your free birth chart (natal chart) in seconds. Enter your birth date and time to get your Sun sign, Moon sign, rising sign and all 10 planet placements — no signup needed.',
  keywords: [
    'birth chart calculator',
    'free birth chart',
    'natal chart calculator',
    'moon sign calculator',
    'rising sign calculator',
    'birth chart',
    'natal chart',
  ],
  ...(siteUrl ? { alternates: { canonical: '/birth-chart-calculator' } } : {}),
  openGraph: {
    title: 'Free Birth Chart Calculator | Zorvax',
    description:
      'Your free natal chart in seconds: Sun, Moon and rising signs plus every planet placement. No signup needed.',
    type: 'website',
  },
};

const FAQS = [
  {
    q: 'What is a birth chart calculator?',
    a: 'A birth chart calculator works out your natal chart — a map of where the Sun, Moon and planets were in the sky at the exact moment you were born. Enter your birth date and, if you know it, your birth time, and the calculator places each planet in its zodiac sign and house.',
  },
  {
    q: 'Do I need my exact birth time?',
    a: 'Your Sun and Moon signs only need your birth date. Your rising sign (Ascendant) and your house placements do need your birth time — the Ascendant changes roughly every two hours. If you do not know your time, you still get an accurate Sun and Moon reading.',
  },
  {
    q: 'What is my Moon sign and why does it matter?',
    a: 'Your Moon sign is the zodiac sign the Moon was in when you were born. While your Sun sign describes your core identity, your Moon sign describes your emotional nature — what you need to feel safe, how you react under stress, and what comforts you.',
  },
  {
    q: 'What is a rising sign?',
    a: 'Your rising sign, or Ascendant, is the sign that was rising on the eastern horizon at your birth. It shapes your first impression, your style and how other people experience you. It is the sign people meet before they know your Sun sign.',
  },
  {
    q: 'Is this birth chart calculator really free?',
    a: 'Yes. Calculating your chart is free and needs no account. If you want to save your chart, get daily guidance from Lyra, your AI astrologer, or check compatibility with someone else, you can create a free Zorvax account.',
  },
  {
    q: 'What is the difference between a birth chart and a horoscope?',
    a: 'A horoscope is a general forecast for one Sun sign. A birth chart is personal: it uses your exact birth date and time to place all ten planets, so two people born under the same Sun sign can have very different charts.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: 'Zorvax Free Birth Chart Calculator',
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'Web browser',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description:
        'Free natal chart calculator: Sun, Moon and rising signs plus all 10 planet placements from your birth date and time.',
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQS.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ],
};

export default function BirthChartCalculatorPage() {
  return (
    <section className="container-page py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <h1 className="text-4xl font-extrabold leading-tight">
        Free <span className="gradient-text">Birth Chart Calculator</span>
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-300">
        Your natal chart is a map of the sky at the moment you were born. Enter your birth date
        and time below and get your Sun sign, Moon sign, rising sign and all ten planet placements
        in seconds — free, no signup needed.
      </p>

      <div className="mt-8">
        <PublicChartCalculator />
      </div>

      <div className="mt-14 space-y-10">
        <section>
          <h2 className="text-2xl font-bold">What is a birth chart?</h2>
          <p className="mt-3 leading-relaxed text-slate-300">
            A birth chart, also called a natal chart, shows where the Sun, Moon and planets were
            positioned when you were born. Astrologers read it in three layers: the planets (what
            part of you is acting), the zodiac signs (how it acts) and the houses (where in your
            life it acts). Your Sun sign is only the first chapter — the Moon, rising sign and the
            rest of the planets fill in the story.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold">Your Big Three: Sun, Moon and rising</h2>
          <p className="mt-3 leading-relaxed text-slate-300">
            Most people only know their Sun sign. Your Big Three gives a fuller picture. The Sun
            is your core identity and drive. The Moon is your emotional nature — what you need and
            how you feel. The rising sign is the mask you wear in the world: your style, your
            manner and the first impression you make. Read all three together and the chart starts
            to sound like you.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold">How to read your birth chart</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-slate-300">
            <li>
              <strong className="text-white">Start with the Big Three.</strong> Sun, Moon and
              rising tell you the most, the fastest.
            </li>
            <li>
              <strong className="text-white">Then look at the personal planets.</strong> Mercury
              shapes how you think and talk, Venus how you love, Mars how you act.
            </li>
            <li>
              <strong className="text-white">Check the houses.</strong> A planet in the 7th house
              colours relationships; the same planet in the 10th colours career.
            </li>
            <li>
              <strong className="text-white">Notice the aspects.</strong> Planets working together
              (trines, sextiles) come easily; planets in tension (squares, oppositions) are where
              you grow.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold">How accurate is this calculator?</h2>
          <p className="mt-3 leading-relaxed text-slate-300">
            Your Sun sign is exact — it depends only on your birth date. The other placements use
            simplified planetary math, good to about one degree, and house positions are estimated
            from your birth time. It is a real chart, honestly labelled: for a fully precise
            ephemeris reading, save your chart and ask Lyra to walk through it with you.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold">What next?</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Card>
              <CardTitle className="mb-2">Check compatibility</CardTitle>
              <p className="text-sm text-slate-400">
                Compare two birth charts and see how your Suns, Moons, Venus and Mars get along.
              </p>
              <a href="/compatibility" className="mt-3 inline-block text-sm font-semibold text-primary-400">
                Try compatibility →
              </a>
            </Card>
            <Card>
              <CardTitle className="mb-2">Ask Lyra</CardTitle>
              <p className="text-sm text-slate-400">
                Lyra is your AI astrologer. She reads your real chart — never a generic horoscope.
              </p>
              <a href="/register" className="mt-3 inline-block text-sm font-semibold text-primary-400">
                Create a free account →
              </a>
            </Card>
            <Card>
              <CardTitle className="mb-2">How Zorvax works</CardTitle>
              <p className="text-sm text-slate-400">
                Real chart math plus an AI astrologer that explains your placements in plain
                language.
              </p>
              <a href="/about" className="mt-3 inline-block text-sm font-semibold text-primary-400">
                About Zorvax →
              </a>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold">Frequently asked questions</h2>
          <div className="mt-4 space-y-4">
            {FAQS.map((f) => (
              <Card key={f.q}>
                <h3 className="font-semibold text-white">{f.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{f.a}</p>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
