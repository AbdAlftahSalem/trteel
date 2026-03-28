import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/audio-proxy/:path*',
        destination: 'https://cdn.islamic.network/quran/audio/128/:path*',
      },
    ]
  },
};

export default nextConfig;
