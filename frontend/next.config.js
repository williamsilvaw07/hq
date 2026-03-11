/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Use the default server/standalone output so dynamic routes,
  // authenticated dashboards, and API-driven pages work correctly.
  output: 'standalone',
  trailingSlash: true,
  // API routes are served by Next.js route handlers under app/api/ (same origin).
  // Set NEXT_PUBLIC_API_URL only if the API is deployed on a different origin.
};

module.exports = nextConfig;
