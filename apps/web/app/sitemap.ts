import type { MetadataRoute } from 'next';

/**
 * Public sitemap. The base URL comes from NEXT_PUBLIC_APP_URL, which is set
 * at deploy time. Until then the sitemap is empty on purpose: emitting
 * placeholder domains would teach Google the wrong canonical URLs.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL;
  if (!base) return [];
  const pages = [
    { path: '/', priority: 1, changeFrequency: 'weekly' as const },
    { path: '/birth-chart-calculator', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/about', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: '/pricing', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: '/login', priority: 0.3, changeFrequency: 'monthly' as const },
    { path: '/register', priority: 0.5, changeFrequency: 'monthly' as const },
  ];
  return pages.map((p) => ({
    url: `${base}${p.path}`,
    lastModified: new Date(),
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));
}
