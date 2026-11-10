/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  compress: true,
  eslint: {
    // Linting is run separately via `npm run lint`; don't block production builds on warnings.
    ignoreDuringBuilds: true,
  },
  images: {
    // Serve AVIF first (best compression), fall back to WebP, then original.
    formats: ['image/avif', 'image/webp'],
    // Next.js defaults jump straight from 2048 to 3840, so a full-bleed image on a
    // retina display (e.g. 1248px CSS box -> 2496 device px) gets served at 3840w
    // instead of ~2560w. The intermediate widths keep retina heroes honest.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 2560, 2880, 3200, 3840],
    // Explicit allowlist instead of hostname:'**'. Wildcard allowed the optimizer
    // to fetch ANY https URL from this server (SSRF surface).
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fszzezltigjrohlfcinh.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        // Cache static assets efficiently
        source: '/_next/image/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
