FROM node:20-alpine AS base
WORKDIR /app

# ── Dependencies ──────────────────────────────────────────────────────────────
FROM base AS deps
COPY package.json yarn.lock* ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared-types/package.json ./packages/shared-types/
RUN yarn install --frozen-lockfile

# ── Build ─────────────────────────────────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn workspace @laundry/shared-types build
RUN yarn workspace @laundry/api build

# ── Runner ────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nodeuser

COPY --from=builder --chown=nodeuser:nodejs /app/apps/api/dist ./dist
COPY --from=builder --chown=nodeuser:nodejs /app/apps/api/package.json ./
COPY --from=deps --chown=nodeuser:nodejs /app/node_modules ./node_modules

USER nodeuser
EXPOSE 4000

CMD ["node", "dist/server.js"]
