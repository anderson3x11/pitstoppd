# ── Build du front ─────────────────────────────────────────────────────
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Runtime : l'API Hono sert aussi le front buildé ────────────────────
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production DATA_DIR=/data PORT=3000
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server ./server
COPY scripts ./scripts
COPY data ./data
COPY --from=build /app/dist ./dist
# Base SQLite + avatars : monter un volume persistant sur /data dans Coolify
VOLUME /data
EXPOSE 3000
CMD ["npm", "start"]
