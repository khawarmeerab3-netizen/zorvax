import { Card, CardTitle } from '@/components/ui/Card';

export default function AboutPage() {
  return (
    <section className="container-page py-16">
      <h1 className="mb-4 text-4xl font-extrabold">
        About <span className="gradient-text">Zorvax</span>
      </h1>
      <p className="mb-8 max-w-2xl text-slate-400">
        Zorvax was built on a simple frustration: most astrology apps give you the same generic
        horoscope as ten million other people. Your chart is yours alone — your AI astrologer
        should treat it that way.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardTitle className="mb-2">Grounded in your real chart</CardTitle>
          <p className="text-sm text-slate-400">
            Every Lyra answer is built from your actual placements — Sun, Moon, rising, planets,
            houses, aspects and numerology. She says &quot;your Saturn&quot; because she knows
            where your Saturn is.
          </p>
        </Card>
        <Card>
          <CardTitle className="mb-2">Honest about limits</CardTitle>
          <p className="text-sm text-slate-400">
            Astrology is a reflective practice, not a science. Zorvax is for insight, journaling
            and self-understanding — never a substitute for professional advice on health, money or
            relationships.
          </p>
        </Card>
      </div>
    </section>
  );
}
