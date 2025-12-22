FROM node:16-bullseye-slim

WORKDIR /app

COPY package*.json ./
RUN npm install --production --legacy-peer-deps
COPY . /app
CMD ["node", "index.js"]
