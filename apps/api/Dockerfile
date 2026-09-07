# Build a partir da raiz do monorepo — o contexto precisa enxergar
# packages/contracts e o pnpm-lock.yaml raiz:
#   docker build -f apps/api/Dockerfile -t arbora-api .
#
# 4 estágios: base (imagem comum) -> pruner (turbo prune isola só o que
# @arbora/api precisa) -> installer (instala + builda) -> runner (imagem
# final — código-fonte não entra, mas devDependencies ficam, ver nota abaixo
# sobre `pnpm prune --prod`).

FROM node:22-alpine AS base
# libc6-compat: node-gyp e alguns binários nativos (argon2, @prisma/engines)
# esperam glibc; openssl: o query engine do Prisma depende de libssl.
RUN apk add --no-cache libc6-compat openssl
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

FROM base AS pruner
WORKDIR /app
COPY . .
RUN npm install -g turbo@2.10.11
RUN turbo prune @arbora/api --docker

FROM base AS installer
WORKDIR /app
# Schema do Prisma precisa existir antes do install: o postinstall do pacote
# roda `prisma generate`, e o pruner não copia código-fonte pra out/json.
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/full/apps/api/prisma ./apps/api/prisma
RUN pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ .
RUN pnpm turbo run build --filter=@arbora/api
# `pnpm prune --prod` tentava remover as devDependencies daqui, mas quebra os
# symlinks do pnpm nesse lockfile já reduzido pelo turbo prune (o pacote fica
# no store, o link em node_modules some — "Cannot find module" em runtime).
# Sobe com devDependencies mesmo: correção > alguns MB de imagem.

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs

COPY --from=installer --chown=nestjs:nodejs /app .

USER nestjs
EXPOSE 3333
# Migração do banco é responsabilidade do pipeline de deploy (`prisma migrate
# deploy` roda como etapa separada, antes do container novo receber tráfego —
# ver roadmap 5.2), não do entrypoint do container.
CMD ["node", "apps/api/dist/main.js"]
