/** @type {import('next').NextConfig} */

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig = {
  // Optimized for Vercel deployment
  experimental: {
    // Optimize server components
    serverComponentsExternalPackages: ['@anthropic-ai/sdk', 'stripe'],
  },

  // TypeScript and ESLint enforcement
  typescript: {
    ignoreBuildErrors: false, // Strict TypeScript
  },
  eslint: {
    ignoreDuringBuilds: false, // Strict linting
  },

  // Image optimization
  images: {
    domains: ['www.infinite-pages.com'],
    formats: ['image/webp', 'image/avif'],
  },

  // Environment variable validation
  env: {
    // These will be validated at build time
    CUSTOM_APP_NAME: 'Infinite Pages V3',
  },

  // Security headers - Basic set (comprehensive security in middleware)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ]
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ]
  },

  // Webpack optimizations for Vercel
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimize bundle for production
    if (!dev && !isServer) {
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        anthropic: {
          name: 'anthropic',
          test: /[\\/]node_modules[\\/]@anthropic-ai[\\/]/,
          chunks: 'all',
          priority: 30,
        },
        stripe: {
          name: 'stripe',
          test: /[\\/]node_modules[\\/]stripe[\\/]/,
          chunks: 'all',
          priority: 30,
        },
        supabase: {
          name: 'supabase',
          test: /[\\/]node_modules[\\/]@supabase[\\/]/,
          chunks: 'all',
          priority: 30,
        },
      }
    }

    return config
  },

  // Output configuration for Vercel
  output: 'standalone',
}

module.exports = withBundleAnalyzer(nextConfig)