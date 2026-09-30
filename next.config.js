/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Linting is run separately via `npm run lint`; don't block production builds on warnings.
    ignoreDuringBuilds: true,
  },
  images: {
    // Next.js defaults jump straight from 2048 to 3840, so a full-bleed image on a
    // retina display (e.g. 1248px CSS box -> 2496 device px) gets served at 3840w
    // instead of ~2560w. The intermediate widths keep retina heroes honest.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 2560, 2880, 3200, 3840],
    // Explicit allowlist instead of hostname:'**'. The wildcard let the optimizer
    // fetch ANY https URL from this server (SSRF surface) and proxy whatever came
    // back onto our own origin. These three hosts were verified to be the only
    // ones actually referenced (DB scan + source scan):
    //   - Supabase Storage  : every Tour/Destination/MediaAsset image
    //   - images.unsplash.com: DestinationsClient fallback covers
    //   - localhost          : dev-time absolute URLs stored in SystemSetting
    // Adding a new image host means adding it here, otherwise next/image 400s.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fszzezltigjrohlfcinh.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
};

module.exports = nextConfig;
