/** @type {import('next').NextConfig} */
const nextConfig = {
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
}

export default nextConfig;
