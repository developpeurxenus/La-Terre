FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm ci || npm install
COPY . .
RUN npm run build && npm run prisma:generate
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/server.js"]
