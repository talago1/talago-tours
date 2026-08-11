import { MetadataRoute } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://talago-tours.com';

const languages = ['en', 'de', 'ru', 'it', 'fr', 'pl', 'es'] as const;

function buildAlternates(path: string) {
  const languageMap: Record<string, string> = {
    'x-default': `${baseUrl}${path}`,
  };
  languages.forEach((lang) => {
    languageMap[lang] = `${baseUrl}${path}?lang=${lang}`;
  });
  return languageMap;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const publicRoutes = [
    '',
    '/tours',
    '/destinations',
    '/about',
    '/support',
    '/faq',
    '/concierge-help',
    '/flexible-protection',
    '/safety-policies',
    '/privacy',
    '/cancellation',
    '/booking-terms',
  ];

  const sitemapEntries: MetadataRoute.Sitemap = publicRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' || route === '/tours' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : route === '/tours' ? 0.9 : 0.7,
    alternates: {
      languages: buildAlternates(route),
    },
  }));

  return sitemapEntries;
}
