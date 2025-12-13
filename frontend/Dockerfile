FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Accept build arguments for baking into client bundle
ARG VITE_API_URL
ARG VITE_API_TIMEOUT
ARG VITE_APP_NAME
ARG VITE_APP_ENV

# Make args available to build command
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_API_TIMEOUT=$VITE_API_TIMEOUT
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_APP_ENV=$VITE_APP_ENV

RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
# TanStack Start (Vinxi) usually outputs to .output
COPY --from=builder /app/.output ./.output
# COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
