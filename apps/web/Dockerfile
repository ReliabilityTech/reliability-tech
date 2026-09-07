# Build a partir da raiz do monorepo (BuildKit precisa estar ligado — já é o
# padrão do `docker build` recente e do docker/build-push-action no CI):
#   docker build -f apps/web/Dockerfile -t arbora-web \
#     --build-arg NEXT_PUBLIC_API_URL=https://api.exemplo.com/api/v1 \
#     --secret id=sentry_auth_token,env=SENTRY_AUTH_TOKEN .
#
# NEXT_PUBLIC_* é inlinado no bundle em build time, não lido em runtime —
# por isso entra como ARG aqui, não como variável só do container final.
# Os defaults abaixo espelham apps/web/src/lib/env.ts, mas por um motivo
# diferente do dev local: ARG sem --build-arg vira string vazia, não
# "ausente" — o `??` do env.ts só cai no default dele pra undefined/null,
# então "" quebra a validação (.url(), .min(1)) em vez de usar o fallback.
# Sem --build-arg, sobe com esse default (não serve pra produção).

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

FROM base AS pruner
WORKDIR /app
COPY . .
RUN npm install -g turbo@2.10.11
RUN turbo prune @arbora/web --docker

FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ .

ARG NEXT_PUBLIC_API_URL=http://localhost:3333/api/v1
ARG NEXT_PUBLIC_APP_NAME=Arbora
# Sem valor, o Sentry fica desligado (env.ts trata "" como ausente) — ARG
# sem default aqui é proposital, ao contrário dos dois de cima, que precisam
# de uma URL válida pra passar na validação de env.ts mesmo sem o Sentry
# configurado.
ARG NEXT_PUBLIC_SENTRY_DSN
# Org/projeto do plugin de upload de sourcemap (next.config.ts) não são
# segredo, só slug — ficam como ARG normal. SENTRY_AUTH_TOKEN é diferente:
# tem permissão de escrita no Sentry, então NÃO pode ser ARG/ENV comum (fica
# gravado na imagem/camada de cache pra sempre, `docker history` mostra).
# Entra via `--mount=type=secret`, que só existe durante este RUN — nunca
# persiste em lugar nenhum da imagem.
ARG SENTRY_ORG
ARG SENTRY_PROJECT
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_APP_NAME=${NEXT_PUBLIC_APP_NAME}
ENV NEXT_PUBLIC_SENTRY_DSN=${NEXT_PUBLIC_SENTRY_DSN}
ENV SENTRY_ORG=${SENTRY_ORG}
ENV SENTRY_PROJECT=${SENTRY_PROJECT}
RUN --mount=type=secret,id=sentry_auth_token,env=SENTRY_AUTH_TOKEN \
    pnpm turbo run build --filter=@arbora/web

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# `output: 'standalone'` (next.config.ts) já traça e copia só os módulos de
# node_modules realmente usados — não precisa de pnpm prune aqui. Estático e
# public ficam de fora do standalone por padrão, copiados à parte.
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "apps/web/server.js"]
