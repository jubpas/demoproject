import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@auth/prisma-adapter",
    "@prisma/adapter-better-sqlite3",
    "@prisma/client",
    "better-sqlite3",
    "prisma",
  ],
};

export default nextConfig;
