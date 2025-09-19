import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
    images: {
    domains: ["images.unsplash.com"],
    remotePatterns: [], // Add any external domains you use
  },
  /* config options here */
};

export default nextConfig;
