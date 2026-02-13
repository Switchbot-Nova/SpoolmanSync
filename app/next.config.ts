import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // In addon mode, use relative asset paths so they resolve through HA ingress proxy
  assetPrefix: process.env.ADDON_BUILD === 'true' ? '.' : undefined,
};

export default nextConfig;
