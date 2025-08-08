/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },

  // Image optimization
  images: {
    domains: [
      'localhost',
      'toolshare.com',
      'cdn.toolshare.com',
      // Add tool icon domains
      'cdn.jsdelivr.net',
      'raw.githubusercontent.com'
    ],
    formats: ['image/webp', 'image/avif'],
  },

  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/dashboard/overview',
        permanent: false
      },
      {
        source: '/admin',
        destination: '/admin/dashboard',
        permanent: false
      }
    ];
  },

  // Experimental features
  experimental: {
    optimizePackageImports: ['@heroicons/react']
  },

  // Build output
  output: 'standalone',

  // TypeScript config
  typescript: {
    ignoreBuildErrors: false
  },

  // ESLint config
  eslint: {
    ignoreDuringBuilds: false
  },

  // Webpack config
  webpack: (config, { dev, isServer }) => {
    // Bundle analyzer in development
    if (dev && !isServer) {
      const withBundleAnalyzer = require('@next/bundle-analyzer')({
        enabled: process.env.ANALYZE === 'true'
      });
      return withBundleAnalyzer(config);
    }

    return config;
  }
};

module.exports = nextConfig;