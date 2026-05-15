import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@auth/prisma-adapter",
    "@prisma/client",
    "prisma",
  ],
};

export default nextConfig;
