import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TALAGO | Egypt Tours & Experiences',
    short_name: 'TALAGO',
    description:
      'Book vetted tours and experiences across Egypt — Red Sea islands, desert safaris, diving and historic Nile days.',
    start_url: '/',
    display: 'standalone',
    background_color: '#070F1E',
    theme_color: '#070F1E',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/og/default.png', sizes: '1200x630', type: 'image/png' },
    ],
  };
}
