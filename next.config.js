/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false, // Apenas temporariamente!
  },
  // Aumentando o limite de tamanho para uploads
  api: {
    bodyParser: {
      sizeLimit: '50mb', // Aumentando para 50MB
    },
    responseLimit: '50mb',
  },
  // ... outras configurações
}

module.exports = nextConfig 