FROM node:22-slim
WORKDIR /app
COPY backend/package.json backend/package-lock.json* ./
RUN npm install --omit=dev --no-audit --no-fund
COPY backend/src ./src
RUN chown -R node:node /app
USER node
ENV NODE_ENV=production
EXPOSE 3101
CMD ["node", "src/index.js"]
