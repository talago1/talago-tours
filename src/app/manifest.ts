import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TALAGO | Tours, Activities & Experiences Worldwide',
    short_name: 'TALAGO',
    description:
      'Discover and book top-rated tours, activities, and unforgettable experiences worldwide — Egypt, Red Sea, Nile Valley, and beyond.',
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
