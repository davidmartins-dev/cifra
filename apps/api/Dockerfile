FROM node:24-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages ./packages

RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm --filter api build

FROM base AS deployer
WORKDIR /app
COPY --from=builder /app ./

RUN pnpm --filter api deploy --prod /prod/api

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache dumb-init

COPY --from=deployer /prod/api ./

USER node

EXPOSE 3000

ENTRYPOINT ["/usr/sbin/dumb-init", "--"]
CMD ["node", "dist/main.js"]
