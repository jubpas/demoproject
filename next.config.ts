import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "prisma", "@auth/prisma-adapter"],
};

export default nextConfig;
