FROM node:22-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Accept build arguments for baking into client bundle
ARG API_URL

# Make args available to build command
ENV API_URL=$API_URL

RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
# TanStack Start (Vinxi) usually outputs to .output
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
