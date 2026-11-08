import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: 'standalone',
  serverExternalPackages: [
    '@prisma/client',
    '@prisma/adapter-pg',
    'pg',
    '@node-rs/argon2',
    'ioredis',
    'bullmq',
  ],
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 14400,
    remotePatterns: [
      ...(process.env.MEDIA_HOSTNAME
        ? [
            {
              protocol: 'https' as const,
              hostname: process.env.MEDIA_HOSTNAME,
            },
          ]
        : []),
    ],
  },
}

export default nextConfig
