/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Use the default server/standalone output so dynamic routes,
  // authenticated dashboards, and API-driven pages work correctly.
  output: 'export',
  trailingSlash: true,
  // In production, set NEXT_PUBLIC_API_URL to your API origin if it's different from the frontend;
  // otherwise leave it empty and use same-origin `/api` calls.
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      // Dev convenience: proxy /api to local Laravel if no env is set.
      if (process.env.NODE_ENV === 'development') {
        return [{ source: '/api/:path*', destination: 'http://127.0.0.1:8000/api/:path*' }];
      }
      return [];
    }
    const base = apiUrl.replace(/\/+$/, '');
    return [{ source: '/api/:path*', destination: `${base}/api/:path*` }];
  },
};

module.exports = nextConfig;
