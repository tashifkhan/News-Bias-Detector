import type { NextConfig } from "next";
import { websites } from "./hooks/hookNewsArticles";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: websites.map(website => ({
      protocol: 'https',
      hostname: new URL(website).hostname,
    })),
  },
};

export default nextConfig;
