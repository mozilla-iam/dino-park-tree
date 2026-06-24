FROM node:22-bullseye-slim

WORKDIR /app

COPY package*.json ./
COPY pnpm*.yaml ./
RUN corepack enable pnpm \
 && pnpm install --prod
COPY . /app
CMD ["node", "index.js"]
