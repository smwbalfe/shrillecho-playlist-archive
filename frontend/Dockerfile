FROM node:18-alpine
WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .

ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_NODE_ENV
ARG ENV

RUN yarn build

EXPOSE 3000
CMD ["yarn", "start"]