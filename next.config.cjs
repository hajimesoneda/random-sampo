/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
	env: {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
  images: {
		domains: ["maps.googleapis.com"],
    unoptimized: true,
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
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  }
}

module.exports = nextConfig

