/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'places.googleapis.com',
        pathname: '/v1/**',
      },
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
        pathname: '/maps/api/**',
      }
    ],
  },
  output: 'random-sampo',
  typescript: {
    // ビルド時の型チェックを無効にする
    ignoreBuildErrors: true,
  },
  eslint: {
    // ビルド時のESLintチェックを無効にする
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig

