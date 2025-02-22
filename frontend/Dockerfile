# Build stage
FROM node:21-alpine3.18 AS builder
WORKDIR /app
COPY package*.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_GO_API
ARG NEXT_PUBLIC_WEBSOCKET_API
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_GO_API=$NEXT_PUBLIC_GO_API
ENV NEXT_PUBLIC_WEBSOCKET_API=$NEXT_PUBLIC_WEBSOCKET_API
RUN yarn run build

# Production stage
FROM node:21-alpine3.18
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/yarn.lock ./
RUN yarn install --production --frozen-lockfile
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./
ENV NODE_ENV=production
CMD ["yarn", "start"]