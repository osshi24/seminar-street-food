/** @type {import('next').NextConfig} */
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const UMAMI_URL = process.env.UMAMI_URL || 'http://localhost:3002';

const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.amazonaws.com' },
      { protocol: 'https', hostname: '*.s3.amazonaws.com' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'http', hostname: 'localhost', port: '9000' },
    ],
  },
  async rewrites() {
    return [
      // Proxy all API calls through Next.js so remote users never hit localhost directly
      {
        source: '/api/backend/:path*',
        destination: `${BACKEND_URL}/api/:path*`,
      },
      // Proxy Socket.IO (HTTP polling; WebSocket upgrade depends on deployment)
      {
        source: '/socket.io/:path*',
        destination: `${BACKEND_URL}/socket.io/:path*`,
      },
      // Proxy Umami — thiết bị LAN dùng cùng origin, không cần biết IP host
      {
        source: '/umami/script.js',
        destination: `${UMAMI_URL}/script.js`,
      },
      {
        source: '/umami/api/send',
        destination: `${UMAMI_URL}/api/send`,
      },
    ];
  },
};

module.exports = nextConfig;
