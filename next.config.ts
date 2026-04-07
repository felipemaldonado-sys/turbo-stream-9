import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/configure", destination: "/admin", permanent: false },
      { source: "/live", destination: "/viewer", permanent: false },
    ];
  },
};

export default nextConfig;
