# Build React client
FROM node:20-slim AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Production
FROM node:20-slim
WORKDIR /app

COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev

COPY server/src/ ./server/src/
COPY --from=client-build /app/client/dist ./client/dist

VOLUME /app/data

ENV NODE_ENV=production
ENV DB_PATH=/app/data/skin_walkers.db
ENV PORT=3001

EXPOSE 3001
CMD ["node", "server/src/index.js"]
