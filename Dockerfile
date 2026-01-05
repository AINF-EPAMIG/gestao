# syntax=docker/dockerfile:1
# ============================================
# Dockerfile Otimizado para Next.js 14+ com Coolify
# Produção + Hot Reload + Cache Busting
# ============================================

# ============================================
# ETAPA 1: Base
# ============================================
FROM node:22-alpine AS base

# Instalar dependências de sistema necessárias
RUN apk add --no-cache libc6-compat

# ============================================
# ETAPA 2: Dependências
# ============================================
FROM base AS deps
WORKDIR /app

# Copiar arquivos de dependências
COPY package.json package-lock.json* ./

# Instalar todas as dependências
RUN npm ci --legacy-peer-deps

# ============================================
# ETAPA 3: Build da Aplicação
# ============================================
FROM base AS builder
WORKDIR /app

# ⚠️ CRÍTICO: ARG deve vir ANTES de COPY para invalidar cache
ARG BUILD_TIME=unknown
ARG COMMIT_SHA=unknown
ENV NEXT_PUBLIC_BUILD_TIME=${BUILD_TIME}
ENV NEXT_PUBLIC_COMMIT_SHA=${COMMIT_SHA}

# Copiar node_modules da etapa anterior
COPY --from=deps /app/node_modules ./node_modules

# Copiar código fonte (invalida cache quando há mudanças)
COPY . .

# Variáveis de ambiente para build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Executar build do Next.js
RUN npm run build

# ============================================
# ETAPA 4: Runtime (Produção)
# ============================================
FROM base AS runner
WORKDIR /app

# Instalar curl para healthcheck
RUN apk add --no-cache curl

# Variáveis de ambiente de produção
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Criar usuário não-root para segurança
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar pasta public
COPY --from=builder /app/public ./public

# Copiar pasta .next (contém standalone e static)
COPY --from=builder /app/.next ./.next

# Copiar node_modules necessários em runtime (mysql2, etc)
COPY --from=deps /app/node_modules ./node_modules

# Copiar package.json (algumas apps precisam em runtime)
COPY package.json ./

# Labels para rastreabilidade (útil para debugging)
LABEL build.time="${BUILD_TIME}"
LABEL build.commit="${COMMIT_SHA}"

# Trocar para usuário não-root
USER nextjs

# Expor porta
EXPOSE 3000

# Health check (verifica se app está respondendo)
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# ============================================
# Comando para iniciar a aplicação
# npm start roda: "next start" conforme package.json
# ============================================
CMD ["npm", "start"]
