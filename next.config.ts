import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/audio-proxy/:path*',
        destination: 'https://everyayah.com/data/:path*',
      },
    ]
  },
};

export default nextConfig;
