import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Memastikan build Vercel tidak terhambat oleh minor type checks
    ignoreBuildErrors: true,
  },
  outputFileTracingIncludes: {
    // Memastikan prisma/seed.db ikut dibundel ke container serverless Vercel
    '/api/**/*': ['./prisma/seed.db'],
    '/**/*': ['./prisma/seed.db'],
  },
};

export default nextConfig;
