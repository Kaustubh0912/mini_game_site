/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Add this images block
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
}

module.exports = nextConfig