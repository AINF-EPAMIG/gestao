/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    // Variáveis do banco principal
    DB_HOST: process.env.DB_HOST,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_DATABASE: process.env.DB_DATABASE,
    
    // Variáveis do banco de funcionários
    DB_FUNCIONARIOS_HOST: process.env.DB_FUNCIONARIOS_HOST,
    DB_FUNCIONARIOS_USER: process.env.DB_FUNCIONARIOS_USER,
    DB_FUNCIONARIOS_PASSWORD: process.env.DB_FUNCIONARIOS_PASSWORD,
    DB_FUNCIONARIOS_DATABASE: process.env.DB_FUNCIONARIOS_DATABASE,
    
    // Variáveis do banco ASTI
    DB_ASTI_HOST: process.env.DB_ASTI_HOST,
    DB_ASTI_USER: process.env.DB_ASTI_USER,
    DB_ASTI_PASSWORD: process.env.DB_ASTI_PASSWORD,
    DB_ASTI_DATABASE: process.env.DB_ASTI_DATABASE,
  },
};

export default nextConfig; 