import Link from 'next/link';
import { Button } from './ui/Button';

const links = [
  { href: '/about', label: 'About' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/chart', label: 'My Chart' },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-ink-900/80 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight">
          <span className="gradient-text">✦ Zorvax</span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm text-slate-300 hover:text-white">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Log in
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
