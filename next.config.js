/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false, // Apenas temporariamente!
  },
  // Configurações para o servidor
  serverRuntimeConfig: {
    // Aumentando o limite de tamanho para uploads
    bodyParserLimit: '50mb', // Aumentando para 50MB
    responseLimit: '50mb',
  },
  // ... outras configurações
}

module.exports = nextConfig 