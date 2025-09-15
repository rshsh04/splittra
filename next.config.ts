import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
    api: {
    bodyParser: false,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
    images: {
    domains: ["images.unsplash.com"], // Add any external domains you use
  },
  /* config options here */
};

export default nextConfig;
