import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-slate-800/80 py-8">
      <div className="container-page flex flex-col items-center justify-between gap-4 text-sm text-slate-400 md:flex-row">
        <p>
          <span className="gradient-text font-semibold">✦ Zorvax</span> — astrology, decoded by
          Lyra.
        </p>
        <nav className="flex gap-5">
          <Link href="/about" className="hover:text-white">
            About
          </Link>
          <Link href="/pricing" className="hover:text-white">
            Pricing
          </Link>
          <Link href="/login" className="hover:text-white">
            Log in
          </Link>
        </nav>
        <p className="text-xs text-slate-500">For reflection &amp; entertainment.</p>
      </div>
    </footer>
  );
}
