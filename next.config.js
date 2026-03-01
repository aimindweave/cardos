/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  async rewrites() {
    return {
      afterFiles: [
        {
          source: '/:slug((?!s/|create|edit|admin|dashboard|auth|api|_next|favicon).*)',
          destination: '/s/:slug',
        },
      ],
    };
  },
};
module.exports = nextConfig;
