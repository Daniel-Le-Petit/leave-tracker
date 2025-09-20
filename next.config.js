/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration pour le déploiement Web Service
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig