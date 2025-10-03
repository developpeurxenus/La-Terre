# syntax=docker/dockerfile:1.6
FROM node:20-alpine AS base

WORKDIR /usr/src/app

COPY package.json ./
COPY prisma ./prisma

RUN npm install

COPY . .

RUN npm run prisma:generate && npm run build

ENV NODE_ENV=production
ENV DATABASE_PROVIDER=postgresql

EXPOSE 3000

CMD ["node", "dist/server.js"]
