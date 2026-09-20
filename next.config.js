/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Linting is run separately via `npm run lint`; don't block production builds on warnings.
    ignoreDuringBuilds: true,
  },
  images: {
    dangerouslyAllowSVG: true,
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
