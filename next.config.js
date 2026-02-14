/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disabled – React strict mode causes double-mount issues with Three.js
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.pollinations.ai',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },
  webpack: (config, { isServer }) => {
    // Three.js needs these polyfills disabled for client
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
    }
    // Handle GLSL shader files
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      use: ['raw-loader'],
    });
    return config;
  },
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
    ];
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', 'date-fns'],
  },
};

module.exports = nextConfig;
