/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove X-Powered-By header — minor security + reduces response size
  poweredByHeader: false,

  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    // Tree-shake large icon/component libraries at build time
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons', 'recharts', '@google/generative-ai'],
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
    ],
    // Cache remote images for 24h to avoid repeated fetches
    minimumCacheTTL: 86400,
  },
};

export default nextConfig;
