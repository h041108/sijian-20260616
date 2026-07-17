import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { remotePatterns: [{ protocol: "https", hostname: "jiying.cc.cd" }, { protocol: "https", hostname: "**.vercel.app" }] },
};

export default nextConfig;
