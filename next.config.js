/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false, // Apenas temporariamente!
  },
  // Configurações para aumentar o limite de tamanho do corpo da requisição
  serverRuntimeConfig: {
    maxBodySize: '50mb',
  },
  publicRuntimeConfig: {
    maxUploadSize: '50mb',
  }
}

module.exports = nextConfig 