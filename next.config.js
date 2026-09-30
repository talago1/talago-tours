/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Linting is run separately via `npm run lint`; don't block production builds on warnings.
    ignoreDuringBuilds: true,
  },
  images: {
    dangerouslyAllowSVG: true,
    // Next.js defaults jump straight from 2048 to 3840, so a full-bleed image on a
    // retina display (e.g. 1248px CSS box -> 2496 device px) gets served at 3840w
    // instead of ~2560w. The intermediate widths keep retina heroes honest.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 2560, 2880, 3200, 3840],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
};

module.exports = nextConfig;
