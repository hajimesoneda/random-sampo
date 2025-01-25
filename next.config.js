/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "places.googleapis.com",
        pathname: "/v1/**",
      },
      {
        protocol: "https",
        hostname: "maps.googleapis.com",
        pathname: "/maps/api/**",
      },
    ],
  },
  experimental: {
    serverActions: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        punycode: false,
      }
    }
    // Add support for @ imports
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": ".",
    }
    return config
  },
}

module.exports = nextConfig

